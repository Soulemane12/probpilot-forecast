import Groq from "groq-sdk";

type Stance =
  | "supports"
  | "weak_supports"
  | "contradicts"
  | "weak_contradicts"
  | "neutral"
  | "irrelevant"
  | "uncertain";

type EvidenceItem = {
  id: string;
  title: string;
  url: string;
  snippet: string;
  sourceName: string;
  stance: Stance;
  reliability: number; // 0..100
  timestamp: string;   // ISO
};

type Impact = {
  id?: string;
  stance?: string;
  weight?: number;
  reason: string;
};

type CompactEvidenceItem = {
  id: string;
  source?: string;
  title?: string;
  stance?: string;
  reliability?: number;
  age_hours?: number;
  snippet?: string;
};

function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x));
}

function hoursSince(iso: string) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 999;
  return (Date.now() - t) / (1000 * 60 * 60);
}

function safeJsonParse(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function computeMaxShift(evidence: { stance: string; reliability: number }[]) {
  const nonNeutral = evidence.filter((e) => e.stance !== "neutral");
  const n = nonNeutral.length;
  const avgRel = n
    ? nonNeutral.reduce((a, e) => a + Math.max(0, Math.min(100, e.reliability)), 0) / n
    : 0;

  if (n < 2 || avgRel < 55) return 0.03;
  if (n < 4 || avgRel < 70) return 0.08;
  return 0.15;
}

function buildFallbackDrivers(evidence: CompactEvidenceItem[]): Impact[] {
  const ranked = evidence
    .filter((e) => e?.id)
    .filter((e) => e.stance !== "irrelevant" && e.stance !== "uncertain")
    .sort((a, b) => (b.reliability ?? 0) - (a.reliability ?? 0));

  const pool = ranked.length ? ranked : evidence;

  return pool.slice(0, 4).map((e) => {
    const source = (e.source || "source").trim();
    const title = (e.title || "evidence").trim();
    const hasReliability = typeof e.reliability === "number" && Number.isFinite(e.reliability);
    return {
      id: String(e.id),
      stance: e.stance ? String(e.stance) : "neutral",
      weight: hasReliability ? Math.round(e.reliability) / 100 : undefined,
      reason: `${source}: ${title}`.slice(0, 160),
    };
  });
}

function buildRationale(drivers: Impact[], modelProb: number, marketProb: number) {
  const leaning =
    modelProb > marketProb
      ? "Evidence tilts above the market"
      : modelProb < marketProb
        ? "Evidence leans below the market"
        : "Evidence keeps the view aligned with the market";

  if (!drivers.length) {
    return `${leaning}. Used available sources to anchor the forecast.`;
  }

  const highlights = drivers
    .slice(0, 3)
    .map((d) => {
      const reason = (d.reason || d.id || "evidence").trim();
      return `${d.stance || "neutral"}: ${reason}`;
    })
    .join("; ");

  return `${leaning}. Key signals: ${highlights}`;
}

export async function POST(req: Request, res?: any) {
  try {
    if (!process.env.GROQ_API_KEY) {
      const err = { error: "Missing GROQ_API_KEY" };
      return res ? res.status(500).json(err) : new Response(JSON.stringify(err), { status: 500 });
    }

    const body = await req.json();
    const marketId = String(body.marketId ?? "");
    const marketTitle = String(body.marketTitle ?? "");
    const marketProb = Number(body.marketProb); // 0..1
    const evidence: EvidenceItem[] = Array.isArray(body.evidence) ? body.evidence : [];
    const delta24h = Number(body.delta24h ?? 0); // optional market move

    if (!marketId || !marketTitle || !Number.isFinite(marketProb)) {
      const err = { error: "marketId, marketTitle, marketProb required" };
      return res ? res.status(400).json(err) : new Response(JSON.stringify(err), { status: 400 });
    }

    const p = clamp(marketProb, 0.01, 0.99);

    const compactEvidence = evidence.slice(0, 12).map((e) => ({
      id: e.id,
      source: e.sourceName,
      title: e.title,
      stance: e.stance,
      reliability: clamp(e.reliability, 0, 100),
      age_hours: Math.round(hoursSince(e.timestamp)),
      snippet: (e.snippet || "").slice(0, 400),
    }));
    const stanceCounts = compactEvidence.reduce(
      (acc, e) => {
        acc[e.stance] = (acc[e.stance] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const maxShift = computeMaxShift(compactEvidence);

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const system = [
  "You are ProbPilot's forecasting analyst. Return ONLY valid JSON. No markdown. No extra keys.",
  "Inputs: market_prior_yes (0..1), market_title, max_shift (0..1), delta_market_24h, evidence[] with {id, stance, reliability, age_hours, snippet}.",
      "",
      "Hard rules:",
      "1) Always output model_prob_0_1 in [0.01, 0.99]. Never refuse. Never ask questions.",
      "2) Never say anything about missing/limited/insufficient evidence. Use whatever evidence is provided.",
      "3) Base the update on evidence direction, recency, and reliability; do NOT mention priors in the rationale.",
      "4) Enforce: abs(model_prob_0_1 - market_prior_yes) <= max_shift.",
      "",
      "Output rules:",
      "- top_drivers: 2–4 items, each must reference an evidence id exactly.",
  "- rationale must summarize evidence direction/recency/reliability without mentioning evidence quantity, availability, or priors.",
      "",
      "Schema (exact keys):",
  '{\"model_prob_0_1\": number, \"overall_confidence\": number, \"top_drivers\":[{\"id\":string,\"stance\":\"supports\"|\"contradicts\"|\"neutral\",\"weight\":number,\"reason\":string}], \"notes\": string}',
].join("\n");

    const user = JSON.stringify({
      market_title: marketTitle,
      market_prior_yes: p,
      max_shift: maxShift,
      delta_market_24h: delta24h,
      evidence: compactEvidence,
      evidence_counts: stanceCounts,
    });

    const banned = /(lack of evidence|insufficient evidence|not enough evidence|limited evidence|cannot determine|no data)/i;

    async function callGroq(extraSystem?: string) {
      return groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: extraSystem ? `${system}\n\n${extraSystem}` : system },
          { role: "user", content: user },
        ],
      });
    }

    const first = await callGroq();
    let content = first.choices?.[0]?.message?.content ?? "{}";

    if (banned.test(content)) {
      const second = await callGroq(
        "Your previous output included banned phrases. Rewrite WITHOUT those substrings. Keep meaning. Obey schema. Do not mention evidence quantity or priors."
      );
      content = second.choices?.[0]?.message?.content ?? content;
    }

    const parsed = safeJsonParse(content);

const modelProbRaw = clamp(Number(parsed?.model_prob_0_1 ?? p), 0.01, 0.99);
const overallConf = clamp(Number(parsed?.overall_confidence ?? 0), 0, 100);
const notes = String(parsed?.notes ?? "").slice(0, 240);
const topDrivers: Impact[] = Array.isArray(parsed?.top_drivers)
  ? parsed.top_drivers.slice(0, 5).map((d: any) => ({
          id: d.id ? String(d.id) : undefined,
          reason: (String(d.reason ?? "").trim() || (d.id ? `Evidence ${d.id}` : "Evidence")).slice(0, 160),
          stance: d.stance ? String(d.stance) : undefined,
        weight: typeof d.weight === "number" ? d.weight : undefined,
      }))
  : [];
if (topDrivers.length === 0 && compactEvidence.length > 0) {
  topDrivers.push(...buildFallbackDrivers(compactEvidence));
}
const modelProb = clamp(modelProbRaw, Math.max(0.01, p - maxShift), Math.min(0.99, p + maxShift));
const delta = modelProb - p;
const rationale = buildRationale(topDrivers, modelProb, p);

const payload = {
  marketId,
  marketTitle,
  timestamp: new Date().toISOString(),
      marketProb: p,
      modelProb,
      delta,
      overallConfidence: overallConf,
      notes,
      topDrivers,
      rationale,
    };

    return res ? res.json(payload) : new Response(JSON.stringify(payload), { status: 200 });
  } catch (e: any) {
    const err = { error: "Server error", detail: String(e) };
    return res ? res.status(500).json(err) : new Response(JSON.stringify(err), { status: 500 });
  }
}
