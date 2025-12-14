// Simple response interface for Express.js
function NextResponse(data: any) {
  return {
    json: (body: any) => body
  };
}

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
  marketId: string;
  title: string;
  url: string;
  snippet: string;
  sourceName: string;
  stance: Stance;
  reliability: number; // 0..100
  timestamp: string;   // ISO
  stanceConfidence?: number;
  stanceRationale?: string;
  claim?: string;
  sourceType?: string;
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

const STANCE_VALUES: Record<Stance, number> = {
  supports: 1,
  weak_supports: 0.5,
  contradicts: -1,
  weak_contradicts: -0.5,
  neutral: 0,
  irrelevant: 0,
  uncertain: 0,
};

function logit(p: number) {
  return Math.log(p / (1 - p));
}

function invLogit(l: number) {
  return 1 / (1 + Math.exp(-l));
}

function sourcePrior(host: string) {
  const h = host.toLowerCase();
  if (h.includes(".gov") || h.includes(".mil")) return 0.25; // official
  if (h.includes("bloomberg") || h.includes("reuters") || h.includes("apnews") || h.includes("ft.com") || h.includes("wsj.com")) return 0.15;
  if (h.includes("sec.gov") || h.includes("federalreserve") || h.includes("noaa")) return 0.2;
  return 0;
}

function computeConfidence(opts: {
  evidence: EvidenceItem[];
  spread?: number | null; // 0..1 (optional)
}) {
  const nonNeutral = opts.evidence.filter(e => STANCE_VALUES[e.stance] !== 0);
  const n = nonNeutral.length;

  const avgRel =
    n === 0 ? 0 : nonNeutral.reduce((a, e) => a + clamp(e.reliability, 0, 100), 0) / n;

  const supports = nonNeutral.filter(e => STANCE_VALUES[e.stance] > 0.75).length;
  const contradicts = nonNeutral.filter(e => STANCE_VALUES[e.stance] < -0.75).length;
  const disagreement = n === 0 ? 1 : Math.min(supports, contradicts) / n; // 0..1

  const spreadPenalty =
    opts.spread == null ? 0 : clamp(opts.spread / 0.05, 0, 1); // 5pp spread is "bad"

  let score = 0;
  score += clamp(n * 10, 0, 30);        // evidence count
  score += clamp(avgRel * 0.4, 0, 30);  // reliability
  score += (1 - disagreement) * 20;     // consensus bonus/penalty
  score += (1 - spreadPenalty) * 20;    // tighter spread = better

  score = clamp(score, 0, 100);

  let label: "low" | "med" | "high" = "low";
  if (score >= 70) label = "high";
  else if (score >= 45) label = "med";

  // Hard downgrades
  if (n < 2 || avgRel < 50 || spreadPenalty > 0.8) {
    label = "low";
    score = Math.min(score, 40);
  }

  return { score, label, disagreement };
}

function shrinkFactor(label: "low" | "med" | "high") {
  if (label === "high") return 0.7;
  if (label === "med") return 0.5;
  return 0.3;
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

    const baselineLogit = logit(p);

    let totalDelta = 0;
    let effectiveCount = 0;
    let sumReliability = 0;
    let strongSupports = 0;
    let strongContradicts = 0;

    for (const e of evidence) {
      const v = STANCE_VALUES[e.stance];
      if (v === 0) continue;

      const reliability = clamp(Number(e.reliability ?? 0), 0, 100) / 100;
      const stanceConf = clamp(Number(e.stanceConfidence ?? 60), 0, 100) / 100;
      const age = hoursSince(e.timestamp);
      const recency = recencyWeight(age);

      let host = "";
      try {
        host = new URL(e.url).hostname.replace(/^www\./, "");
      } catch {}

      const prior = sourcePrior(host);
      const baseWeight = 0.4 * reliability + 0.3 * recency + 0.2 * stanceConf + 0.1;
      const weight = baseWeight * (1 + prior);

      totalDelta += weight * v;
      effectiveCount += weight;
      sumReliability += reliability;

      if (v >= 0.8) strongSupports += 1;
      if (v <= -0.8) strongContradicts += 1;
    }

    const avgReliability = evidence.length ? (sumReliability / evidence.length) * 100 : 0;
    const conflictPenalty = strongSupports > 0 && strongContradicts > 0 ? 0.6 : 1;

    const conf = computeConfidence({ evidence, spread });
    const shrink = shrinkFactor(conf.label);

    // Convert weighted signal in log-odds space
    const adjustedDelta = totalDelta * conflictPenalty;
    const qLogit = baselineLogit + adjustedDelta;
    const qRaw = invLogit(qLogit);

    const q = p + shrink * (qRaw - p);

    const modelProb = clamp(q, 0.01, 0.99);
    const delta = modelProb - p;
    const signal = delta;

    const summaryParts = [];
    summaryParts.push(`Market prior ${Math.round(p * 1000) / 10}%`);
    summaryParts.push(`Evidence count ${evidence.length}, avg reliability ${Math.round(avgReliability)}%`);
    if (spread != null) summaryParts.push(`Spread ${(spread * 100).toFixed(1)}pp`);
    if (conf.disagreement > 0.4) summaryParts.push("Evidence conflicts → shrink toward market");

    const summary = `Log-odds update from market prior using stance-weighted evidence. ${summaryParts.join(
      " | "
    )}`;

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
