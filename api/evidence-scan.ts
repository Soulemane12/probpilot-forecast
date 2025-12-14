// Simple response interface for Express.js
function NextResponse(data: any) {
  return {
    json: (body: any) => body
  };
}
import Groq from "groq-sdk";

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

type Stance = "supports" | "contradicts" | "neutral";

type GroqStanceItem = {
  id: string;
  stance: Stance;
  confidence: number; // 0-100
  rationale: string;  // <= 140 chars
};

function stripJson(s: string) {
  // Remove ```json fences if the model adds them.
  return s.replace(/^\s*```json\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

export async function POST(req: Request, res?: any) {
  try {
    const body = await req.json();
    const marketId = String(body.marketId ?? "");
    const marketTitle = String(body.marketTitle ?? "");
    const query = String(body.query ?? `${marketTitle} latest update official statement report`);
    const maxResults = Math.min(Number(body.max_results ?? 6), 8);

    if (!process.env.TAVILY_API_KEY) {
      return res?.status(500).json({ error: "Missing TAVILY_API_KEY" });
    }
    if (!process.env.GROQ_API_KEY) {
      return res?.status(500).json({ error: "Missing GROQ_API_KEY" });
    }
    if (!marketId || !marketTitle) {
      return res?.status(400).json({ error: "marketId and marketTitle are required" });
    }

    // 1) Tavily search (server-enforced params; do not trust client)
    const tavilyRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        max_results: maxResults,
        search_depth: "basic",
        include_answer: false,
        include_raw_content: false,
      }),
    });

    const tavilyText = await tavilyRes.text();
    if (!tavilyRes.ok) {
      return res?.status(502).json(
        { error: "Tavily search failed", status: tavilyRes.status, body: tavilyText }
      );
    }

    const tavilyData = JSON.parse(tavilyText) as TavilySearchResponse;
    const results = Array.isArray(tavilyData.results) ? tavilyData.results : [];

    // Map → your EvidenceItem-like objects (add a stable id)
    const scanId = Date.now();
    const mapped = results.slice(0, maxResults).map((r, index) => {
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
      };
    });

    if (mapped.length === 0) {
      return res?.json({ evidence: [] });
    }

    // 2) Groq classify stances in ONE call
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const system = [
      "You are a strict classifier.",
      "Task: For each source, decide whether it SUPPORTS, CONTRADICTS, or is NEUTRAL toward the YES outcome of the market question.",
      "Market question should be interpreted as: 'YES means the event described by the title happens by the market end date.'",
      "If unclear, unrelated, opinion-only, or not evidence -> neutral.",
      "Return JSON ONLY matching the schema exactly. No markdown. No extra keys.",
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
        items: [{ id: "string", stance: "supports|contradicts|neutral", confidence: "0-100", rationale: "short string" }],
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
    let parsed: { items: GroqStanceItem[] } | null = null;

    try {
      parsed = JSON.parse(stripJson(raw));
    } catch {
      // If Groq returns non-JSON, fall back to neutral
      parsed = { items: mapped.map((m) => ({ id: m.id, stance: "neutral", confidence: 0, rationale: "" })) };
    }

    const byId = new Map<string, GroqStanceItem>();
    for (const it of parsed?.items ?? []) {
      if (!it?.id) continue;
      const stance: Stance =
        it.stance === "supports" || it.stance === "contradicts" || it.stance === "neutral"
          ? it.stance
          : "neutral";
      const confidence = Math.max(0, Math.min(100, Number(it.confidence ?? 0)));
      byId.set(it.id, {
        id: it.id,
        stance,
        confidence,
        rationale: String(it.rationale ?? "").slice(0, 140),
      });
    }

    const evidence = mapped.map((m) => {
      const cls = byId.get(m.id);
      return {
        ...m,
        stance: cls?.stance ?? "neutral",
        stanceConfidence: cls?.confidence ?? 0,
        stanceRationale: cls?.rationale ?? "",
      };
    });

    return res?.json({ evidence });
  } catch (e: any) {
    return res?.status(500).json({ error: "Server error", detail: String(e) });
  }
}
