// Simple response interface for Express.js
function NextResponse(data: any) {
  return {
    json: (body: any) => body
  };
}

type Stance = "supports" | "contradicts" | "neutral";

type EvidenceItem = {
  id: string;
  marketId: string;
  title: string;
  url: string;
  snippet: string;
  sourceName: string;
  stance: Stance;
  reliability: number; // 0..100
  timestamp: string;   // ISO
};

function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x));
}

function hoursSince(iso: string) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 999;
  return (Date.now() - t) / (1000 * 60 * 60);
}

// half-life style decay: 0h => 1.0, 24h => ~0.5, 72h => ~0.2
function recencyWeight(ageHours: number) {
  const halfLife = 24;
  return Math.pow(0.5, ageHours / halfLife);
}

function stanceValue(s: Stance) {
  if (s === "supports") return 1;
  if (s === "contradicts") return -1;
  return 0;
}

function computeConfidence(opts: {
  evidence: EvidenceItem[];
  spread?: number | null; // 0..1 (optional)
}) {
  const nonNeutral = opts.evidence.filter(e => e.stance !== "neutral");
  const n = nonNeutral.length;

  const avgRel =
    n === 0 ? 0 : nonNeutral.reduce((a, e) => a + clamp(e.reliability, 0, 100), 0) / n;

  const supports = nonNeutral.filter(e => e.stance === "supports").length;
  const contradicts = nonNeutral.filter(e => e.stance === "contradicts").length;
  const disagreement = n === 0 ? 1 : Math.min(supports, contradicts) / n; // 0..0.5

  const spreadPenalty =
    opts.spread == null ? 0 : clamp(opts.spread / 0.05, 0, 1); // 5pp spread is "bad"

  // score 0..100
  let score = 0;
  score += clamp(n * 12, 0, 40);        // evidence count
  score += clamp(avgRel * 0.4, 0, 40);  // reliability
  score += (1 - disagreement) * 10;     // consensus bonus
  score += (1 - spreadPenalty) * 10;    // tighter spread = better

  score = clamp(score, 0, 100);

  let label: "low" | "med" | "high" = "low";
  if (score >= 70) label = "high";
  else if (score >= 45) label = "med";

  return { score, label };
}

function shrinkFactor(label: "low" | "med" | "high") {
  if (label === "high") return 1.0;
  if (label === "med") return 0.7;
  return 0.4;
}

export async function POST(req: Request, res?: any) {
  try {
    const body = await req.json();

    const marketId = String(body.marketId ?? "");
    const marketTitle = String(body.marketTitle ?? "");
    const marketProb = Number(body.marketProb); // 0..1
    const spread = body.spread == null ? null : Number(body.spread); // optional 0..1
    const evidence: EvidenceItem[] = Array.isArray(body.evidence) ? body.evidence : [];

    if (!marketId || !marketTitle || !Number.isFinite(marketProb)) {
      return res?.status(400).json({ error: "marketId, marketTitle, marketProb required" });
    }

    const p = clamp(marketProb, 0.01, 0.99);

    // Weighted evidence signal
    let num = 0;
    let den = 0;

    for (const e of evidence) {
      const v = stanceValue(e.stance);
      if (v === 0) continue;

      const r = clamp(Number(e.reliability ?? 0), 0, 100) / 100;
      const age = hoursSince(e.timestamp);
      const w = r * recencyWeight(age);

      num += w * v;
      den += w;
    }

    const signal = den > 0 ? num / den : 0; // ~[-1,+1]

    // Evidence adjustment (max ~12pp)
    const alpha = 0.12;
    const qRaw = clamp(p + alpha * signal, 0.01, 0.99);

    // Confidence + shrink-to-market
    const conf = computeConfidence({ evidence, spread });
    const q = p + shrinkFactor(conf.label) * (qRaw - p);

    const modelProb = clamp(q, 0.01, 0.99);
    const delta = modelProb - p;

    const summary =
      conf.label === "low"
        ? "Low confidence: limited/contested evidence; forecast shrunk toward market."
        : conf.label === "med"
        ? "Medium confidence: some consistent evidence; moderate adjustment from market."
        : "High confidence: multiple consistent sources; strong adjustment from market.";

    return res?.json({
      marketId,
      marketTitle,
      timestamp: new Date().toISOString(),
      marketProb: p,
      modelProb,
      delta,
      confidence: conf.label,
      confidenceScore: conf.score,
      signal,
      summary,
    });
  } catch (e: any) {
    return res?.status(500).json({ error: "Server error", detail: String(e) });
  }
}
