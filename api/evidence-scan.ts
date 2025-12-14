import Groq from "groq-sdk";

function respond(res: any, status: number, body: any) {
  if (res && typeof res.status === "function") {
    return res.status(status).json(body);
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

type TavilySearchResult = {
  title: string;
  url: string;
  content?: string;
  raw_content?: string;
  score?: number;
};

type TavilySearchResponse = {
  results?: TavilySearchResult[];
  answer?: string;
};

type Stance =
  | "supports"
  | "weak_supports"
  | "contradicts"
  | "weak_contradicts"
  | "neutral"
  | "irrelevant"
  | "uncertain";

type GroqStanceItem = {
  id: string;
  stance: Stance;
  confidence: number; // 0-100
  rationale: string;  // <= 140 chars
  claim?: string;
};

function stripJson(s: string) {
  // Remove ```json fences if the model adds them.
  return s.replace(/^\s*```json\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

function inferSourceType(host: string) {
  const h = host.toLowerCase();
  if (h.includes(".gov") || h.includes(".mil")) return "official";
  if (h.includes("bloomberg") || h.includes("reuters") || h.includes("apnews") || h.includes("ft.com") || h.includes("wsj.com")) return "tier1";
  if (h.includes("substack") || h.includes("medium")) return "blog";
  if (h.includes("youtube") || h.includes("tiktok")) return "video";
  return "news";
}

export async function POST(req: Request, res?: any) {
  try {
    const body = await req.json();
    const marketId = String(body.marketId ?? "");
    const marketTitle = String(body.marketTitle ?? "");
    const query = String(body.query ?? `${marketTitle} latest update official statement report`);
    const maxResults = Math.min(Number(body.max_results ?? 10), 12);

    if (!marketId || !marketTitle) {
      return respond(res, 400, { error: "marketId and marketTitle are required" });
    }

    const stubResults: TavilySearchResult[] = [
      {
        title: `${marketTitle} update`,
        url: "https://example.com/evidence-1",
        content: `${marketTitle} mentioned as trending topic.`,
        score: 0.65,
      },
      {
        title: `${marketTitle} counterpoint`,
        url: "https://example.com/evidence-2",
        content: `Skeptical view on ${marketTitle} outcome.`,
        score: 0.55,
      },
    ];

    // 1) Tavily search (server-enforced params; do not trust client)
    let results: TavilySearchResult[] = [];
    if (process.env.TAVILY_API_KEY) {
      try {
        const tavilyRes = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            api_key: process.env.TAVILY_API_KEY,
            query,
            max_results: maxResults,
            search_depth: "advanced",
            include_answer: false,
            include_raw_content: false,
          }),
        });

        const tavilyText = await tavilyRes.text();
        if (tavilyRes.ok) {
          const tavilyData = JSON.parse(tavilyText) as TavilySearchResponse;
          results = Array.isArray(tavilyData.results) ? tavilyData.results : [];
        } else {
          console.warn("Tavily search failed", tavilyRes.status, tavilyText);
        }
      } catch (err) {
        console.warn("Tavily search error", err);
      }
    }

    if (!results.length) {
      results = stubResults;
    }

    // Map → your EvidenceItem-like objects (add a stable id, dedupe by URL)
    const scanId = Date.now();
    const seen = new Set<string>();
    const mapped = results
      .filter((r) => {
        if (!r?.url) return false;
        const key = r.url.split("#")[0];
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, maxResults)
      .map((r, index) => {
        let sourceName = "Web";
        try {
          sourceName = new URL(r.url).hostname.replace(/^www\./, "");
        } catch {}

        const reliability =
          typeof r.score === "number" ? Math.round(Math.max(0, Math.min(1, r.score)) * 100) : 70;

        const id = `tavily-${marketId}-${scanId}-${index}`;

        return {
          id,
          marketId,
          sourceName,
          title: r.title || r.url,
          url: r.url,
          snippet: (r.content || "").slice(0, 500),
          timestamp: new Date().toISOString(),
          reliability,
          stance: "neutral" as Stance, // will fill from Groq
          stanceConfidence: 0,
          stanceRationale: "",
          claim: "",
          sourceType: inferSourceType(sourceName),
        };
      });

    if (mapped.length === 0) {
      return respond(res, 200, { evidence: [] });
    }

    // 2) Groq classify stances in ONE call (optional; fallback to neutral if missing)
    let parsed: { items: GroqStanceItem[] } | null = null;
    if (process.env.GROQ_API_KEY) {
      try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const system = [
          "You are a strict evidence classifier for prediction markets.",
          "Interpret YES as: the market title happens by the market end date.",
          "Allowed stances: supports, weak_supports, contradicts, weak_contradicts, neutral, irrelevant, uncertain.",
          "If unclear, unrelated, or opinion-only -> irrelevant.",
          "weak_* = tentative or indirect support/contradiction with caveats.",
          "Extract a single, short factual claim from each source.",
          "Return ONLY JSON: {\"items\":[{\"id\":\"source_id\",\"claim\":\"short claim\",\"stance\":\"...\",\"confidence\":0-100,\"rationale\":\"short reason\"}]}. No markdown.",
        ].join(" ");

        const user = JSON.stringify({
          marketTitle,
          sources: mapped.map((m) => ({
            id: m.id,
            title: m.title,
            snippet: m.snippet,
            url: m.url,
            sourceName: m.sourceName,
          })),
          schema: {
            items: [{
              id: "string",
              claim: "short claim",
              stance: "supports|weak_supports|contradicts|weak_contradicts|neutral|irrelevant|uncertain",
              confidence: "0-100",
              rationale: "short string"
            }],
          },
        });

        const completion = await groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
          temperature: 0,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        });

        const raw = completion.choices?.[0]?.message?.content ?? "";
        parsed = JSON.parse(stripJson(raw));
      } catch (err) {
        console.warn("Groq stance classification failed, using neutral stances", err);
      }
    }

    if (!parsed) {
      parsed = {
        items: mapped.map((m) => ({
          id: m.id,
          stance: "neutral",
          confidence: 0,
          rationale: "",
          claim: "",
        })),
      };
    }

    const byId = new Map<string, GroqStanceItem>();
    for (const it of parsed?.items ?? []) {
      if (!it?.id) continue;
      const stance: Stance =
        it.stance === "supports" ||
        it.stance === "weak_supports" ||
        it.stance === "contradicts" ||
        it.stance === "weak_contradicts" ||
        it.stance === "neutral" ||
        it.stance === "irrelevant" ||
        it.stance === "uncertain"
          ? it.stance
          : "neutral";
      const confidence = Math.max(0, Math.min(100, Number(it.confidence ?? 0)));
      byId.set(it.id, {
        id: it.id,
        stance,
        confidence,
        rationale: String(it.rationale ?? "").slice(0, 140),
        claim: String((it as any).claim ?? "").slice(0, 240),
      });
    }

    const evidence = mapped.map((m) => {
      const cls = byId.get(m.id);
      return {
        ...m,
        stance: cls?.stance ?? "neutral",
        stanceConfidence: cls?.confidence ?? 0,
        stanceRationale: cls?.rationale ?? "",
        claim: cls?.claim ?? "",
      };
    });

    return respond(res, 200, { evidence });
  } catch (e: any) {
    return respond(res, 500, { error: "Server error", detail: String(e) });
  }
}
