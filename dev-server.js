import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { config } from 'dotenv';
import { Groq } from 'groq-sdk';

// Load environment variables from .env file
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

// Load and execute the evidence-scan function
const evidenceScanPath = join(__dirname, 'api', 'evidence-scan.ts');
const evidenceScanCode = readFileSync(evidenceScanPath, 'utf8');

// Extract the handler function (simplified approach)
async function handleEvidenceScan(req, res) {
  try {
    const { marketId, marketTitle, query, max_results } = req.body;
    
    const tavilyApiKey = process.env.TAVILY_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;
    
    if (!tavilyApiKey) {
      return res.status(500).json({ error: 'TAVILY_API_KEY not configured' });
    }
    if (!groqApiKey) {
      return res.status(500).json({ error: 'GROQ_API_KEY not configured' });
    }
    if (!marketId || !marketTitle) {
      return res.status(400).json({ error: 'marketId and marketTitle are required' });
    }

    // 1) Tavily search
    const tavilyRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query: query || `${marketTitle} latest update official statement report`,
        max_results: Math.min(Number(max_results || 6), 8),
        search_depth: 'basic',
        include_answer: false,
        include_raw_content: false,
      }),
    });

    if (!tavilyRes.ok) {
      const errorText = await tavilyRes.text();
      return res.status(502).json({ 
        error: 'Tavily search failed', 
        status: tavilyRes.status, 
        body: errorText 
      });
    }

    const tavilyData = await tavilyRes.json();
    const results = Array.isArray(tavilyData.results) ? tavilyData.results : [];

    // Map to evidence items
    const scanId = Date.now();
    const mapped = results.slice(0, max_results || 6).map((r, index) => {
      let sourceName = 'Web';
      try {
        sourceName = new URL(r.url).hostname.replace(/^www\./, '');
      } catch {}

      const reliability = typeof r.score === 'number' 
        ? Math.round(Math.max(0, Math.min(1, r.score)) * 100) 
        : 70;

      const id = `tavily-${marketId}-${scanId}-${index}`;

      return {
        id,
        marketId,
        sourceName,
        title: r.title || r.url,
        url: r.url,
        snippet: (r.content || '').slice(0, 500),
        timestamp: new Date().toISOString(),
        reliability,
        stance: 'neutral',
        stanceConfidence: 0,
        stanceRationale: '',
      };
    });

    if (mapped.length === 0) {
      return res.json({ evidence: [] });
    }

    // 2) Groq classify stances
    const groq = new Groq({ apiKey: groqApiKey });

    const system = [
      'You are a strict classifier.',
      'Task: For each source, decide whether it SUPPORTS, CONTRADICTS, or is NEUTRAL toward the YES outcome of the market question.',
      'Market question should be interpreted as: "YES means the event described by the title happens by the market end date."',
      'If unclear, unrelated, opinion-only, or not evidence -> neutral.',
      'CRITICAL: Return ONLY this JSON structure: {"items": [{"id": "source_id", "stance": "supports|contradicts|neutral", "confidence": 0-100, "rationale": "short string"}]}',
      'Do NOT include any other fields. Do NOT wrap in markdown. Do NOT include the original sources in your response.',
    ].join(' ');

    const user = JSON.stringify({
      marketTitle,
      sources: mapped.map((m) => ({
        id: m.id,
        title: m.title,
        snippet: m.snippet,
      })),
    }) + '\n\nClassify each source and return ONLY: {"items": [{"id": "source_id", "stance": "supports|contradicts|neutral", "confidence": 0-100, "rationale": "short string"}]}';

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      temperature: 0,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || '';
    let parsed = null;

    try {
      // Strip JSON fences if present
      const cleanJson = raw.replace(/^\s*```json\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      // If Groq returns non-JSON, fall back to neutral
      parsed = { items: mapped.map((m) => ({ id: m.id, stance: 'neutral', confidence: 0, rationale: '' })) };
    }

    const byId = new Map();
    for (const it of parsed.items || []) {
      if (!it?.id) continue;
      const stance = (it.stance === 'supports' || it.stance === 'contradicts' || it.stance === 'neutral') 
        ? it.stance 
        : 'neutral';
      const confidence = Math.max(0, Math.min(100, Number(it.confidence || 0)));
      byId.set(it.id, {
        id: it.id,
        stance,
        confidence,
        rationale: String(it.rationale || '').slice(0, 140),
      });
    }

    const evidence = mapped.map((m) => {
      const cls = byId.get(m.id);
      return {
        ...m,
        stance: cls?.stance || 'neutral',
        stanceConfidence: cls?.confidence || 0,
        stanceRationale: cls?.rationale || '',
      };
    });

    res.json({ evidence });
  } catch (error) {
    console.error('Evidence scan error:', error);
    res.status(500).json({ error: error.message });
  }
}

app.post('/api/evidence-scan', handleEvidenceScan);

// Forecast endpoint
async function handleForecast(req, res) {
  try {
    const body = req.body;
    const marketId = String(body.marketId ?? "");
    const marketTitle = String(body.marketTitle ?? "");
    const marketProb = Number(body.marketProb);
    const spread = body.spread == null ? null : Number(body.spread);
    const evidence = Array.isArray(body.evidence) ? body.evidence : [];

    if (!marketId || !marketTitle || !Number.isFinite(marketProb)) {
      return res.status(400).json({ error: "marketId, marketTitle, marketProb required" });
    }

    const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
    const hoursSince = (iso) => {
      const t = Date.parse(iso);
      if (Number.isNaN(t)) return 999;
      return (Date.now() - t) / (1000 * 60 * 60);
    };
    const recencyWeight = (ageHours) => {
      const halfLife = 24;
      return Math.pow(0.5, ageHours / halfLife);
    };
    const stanceValues = {
      supports: 1,
      weak_supports: 0.5,
      contradicts: -1,
      weak_contradicts: -0.5,
      neutral: 0,
      irrelevant: 0,
      uncertain: 0,
    };
    const logit = (p) => Math.log(p / (1 - p));
    const invLogit = (l) => 1 / (1 + Math.exp(-l));
    const sourcePrior = (host) => {
      const h = (host || "").toLowerCase();
      if (h.includes(".gov") || h.includes(".mil")) return 0.25;
      if (h.includes("bloomberg") || h.includes("reuters") || h.includes("apnews") || h.includes("ft.com") || h.includes("wsj.com")) return 0.15;
      if (h.includes("sec.gov") || h.includes("federalreserve") || h.includes("noaa")) return 0.2;
      return 0;
    };
    const shrinkFactor = (label) => {
      if (label === "high") return 0.7;
      if (label === "med") return 0.5;
      return 0.3;
    };

    const p = clamp(marketProb, 0.01, 0.99);
    const baselineLogit = logit(p);

    let totalDelta = 0;
    let effectiveCount = 0;
    let sumReliability = 0;
    let strongSupports = 0;
    let strongContradicts = 0;

    for (const e of evidence) {
      const v = stanceValues[e.stance] ?? 0;
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

    const nonNeutral = evidence.filter((e) => (stanceValues[e.stance] ?? 0) !== 0);
    const n = nonNeutral.length;
    const supports = nonNeutral.filter((e) => (stanceValues[e.stance] ?? 0) > 0.75).length;
    const contradicts = nonNeutral.filter((e) => (stanceValues[e.stance] ?? 0) < -0.75).length;
    const disagreement = n === 0 ? 1 : Math.min(supports, contradicts) / n;
    const spreadPenalty = spread == null ? 0 : clamp(spread / 0.05, 0, 1);

    let score = 0;
    score += clamp(n * 10, 0, 30);
    score += clamp(avgReliability * 0.4, 0, 30);
    score += (1 - disagreement) * 20;
    score += (1 - spreadPenalty) * 20;
    score = clamp(score, 0, 100);
    let confLabel = "low";
    if (score >= 70) confLabel = "high";
    else if (score >= 45) confLabel = "med";
    if (n < 2 || avgReliability < 50 || spreadPenalty > 0.8) {
      confLabel = "low";
      score = Math.min(score, 40);
    }

    const adjustedDelta = totalDelta * conflictPenalty;
    const qLogit = baselineLogit + adjustedDelta;
    const qRaw = invLogit(qLogit);
    const q = p + shrinkFactor(confLabel) * (qRaw - p);
    const modelProb = clamp(q, 0.01, 0.99);
    const delta = modelProb - p;
    const signal = delta;

    const summaryParts = [];
    summaryParts.push(`Market prior ${Math.round(p * 1000) / 10}%`);
    summaryParts.push(`Evidence count ${evidence.length}, avg reliability ${Math.round(avgReliability)}%`);
    if (spread != null) summaryParts.push(`Spread ${(spread * 100).toFixed(1)}pp`);
    if (disagreement > 0.4) summaryParts.push("Evidence conflicts → shrink toward market");

    const summary = `Log-odds update from market prior using stance-weighted evidence. ${summaryParts.join(" | ")}`;

    res.json({
      marketId,
      marketTitle,
      timestamp: new Date().toISOString(),
      marketProb: p,
      modelProb,
      delta,
      confidence: confLabel,
      confidenceScore: score,
      signal,
      summary,
    });
  } catch (error) {
    console.error('Forecast error:', error);
    res.status(500).json({ error: error.message });
  }
}

app.post('/api/forecast', handleForecast);

// Forecast with Groq impacts endpoint
async function handleForecastGroq(req, res) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'Missing GROQ_API_KEY' });
    }

    const body = req.body;
    const marketId = String(body.marketId ?? "");
    const marketTitle = String(body.marketTitle ?? "");
    const marketProb = Number(body.marketProb);
    const evidence = Array.isArray(body.evidence) ? body.evidence : [];
    const delta24h = Number(body.delta24h ?? 0);

    if (!marketId || !marketTitle || !Number.isFinite(marketProb)) {
      return res.status(400).json({ error: "marketId, marketTitle, marketProb required" });
    }

    const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
    const hoursSince = (iso) => {
      const t = Date.parse(iso);
      if (Number.isNaN(t)) return 999;
      return (Date.now() - t) / (1000 * 60 * 60);
    };
    const computeMaxShift = (items) => {
      const nonNeutral = items.filter((e) => e.stance !== "neutral");
      const n = nonNeutral.length;
      const avgRel = n
        ? nonNeutral.reduce((a, e) => a + Math.max(0, Math.min(100, e.reliability)), 0) / n
        : 0;
      const strongSupports = items.filter((e) => e.stance === "supports" && e.reliability >= 80).length;
      const strongContradicts = items.filter((e) => e.stance === "contradicts" && e.reliability >= 80).length;
      
      // Allow bigger shifts with strong, consistent evidence
      if (strongSupports >= 3 && avgRel >= 80) return 0.25;
      if (strongContradicts >= 3 && avgRel >= 80) return 0.25;
      if (n < 2 || avgRel < 55) return 0.03;
      if (n < 4 || avgRel < 70) return 0.08;
      return 0.15;
    };
    const safeJson = (raw) => {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    };

    const p = clamp(marketProb, 0.01, 0.99);

    const compactEvidence = evidence.slice(0, 12).map((e) => ({
      id: e.id,
      source: e.sourceName,
      title: e.title,
      stance: e.stance,
      reliability: clamp(e.reliability ?? 0, 0, 100),
      age_hours: Math.round(hoursSince(e.timestamp)),
      snippet: (e.snippet || "").slice(0, 400),
    }));
    const stanceCounts = compactEvidence.reduce((acc, e) => {
      acc[e.stance] = (acc[e.stance] || 0) + 1;
      return acc;
    }, {});

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const system = [
      "You are ProbPilot's forecasting analyst. Return ONLY valid JSON. No markdown. No extra keys.",
      "Inputs: market_prior_yes (0..1), market_title, max_shift (0..1), delta_market_24h, evidence[] with {id, stance, reliability, age_hours, snippet}.",
      "",
      "Hard rules:",
      "1) Always output model_prob_0_1 in [0.01, 0.99]. Never refuse. Never ask questions.",
      "2) NEVER mention evidence quantity or quality. Always work with what you have.",
      "3) Make a decisive forecast based on EVIDENCE DIRECTION. Use evidence to move away from prior when evidence supports it.",
      "4) Enforce: abs(model_prob_0_1 - market_prior_yes) <= max_shift.",
      "",
      "Output rules:",
      "- top_drivers: 2–4 items, each must reference an evidence id exactly.",
      "- rationale must mention prior explicitly as: 'prior=<number>'.",
      "- Focus on evidence direction and strength, not prior.",
      "",
      "Schema (exact keys):",
      '{\"model_prob_0_1\": number, \"overall_confidence\": number, \"top_drivers\":[{\"id\":string,\"stance\":\"supports\"|\"contradicts\"|\"neutral\",\"weight\":number,\"reason\":string}], \"notes\": string, \"rationale\": string}',
    ].join("\\n");

    const maxShift = computeMaxShift(compactEvidence);

    const user = JSON.stringify({
      market_title: marketTitle,
      market_prior_yes: p,
      max_shift: maxShift,
      delta_market_24h: delta24h,
      evidence: compactEvidence,
      evidence_counts: stanceCounts,
    });

    const banned = /(lack of evidence|insufficient evidence|not enough evidence|limited evidence|cannot determine|no data)/i;

    async function callGroq(extraSystem) {
      return groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: extraSystem ? `${system}\\n\\n${extraSystem}` : system },
          { role: "user", content: user },
        ],
      });
    }

    const first = await callGroq();
    let content = first.choices?.[0]?.message?.content ?? "{}";

    if (banned.test(content)) {
      const second = await callGroq(
        "Your previous output included evidence quantity references. Rewrite WITHOUT mentioning evidence amount. Be decisive with available evidence. Keep meaning. Obey schema."
      );
      content = second.choices?.[0]?.message?.content ?? content;
    }

    const parsed = safeJson(content);

    const modelProbRaw = clamp(Number(parsed?.model_prob_0_1 ?? p), 0.01, 0.99);
    const overallConf = clamp(Number(parsed?.overall_confidence ?? 0), 0, 100);
    const notes = String(parsed?.notes ?? "").slice(0, 240);

    const topDrivers = Array.isArray(parsed?.top_drivers)
      ? parsed.top_drivers.slice(0, 5).map((d) => ({
          id: d.id ? String(d.id) : undefined,
          reason: String(d.reason ?? "").slice(0, 160),
          stance: d.stance ? String(d.stance) : undefined,
          weight: typeof d.weight === "number" ? d.weight : undefined,
        }))
      : [];
    const modelProb = clamp(modelProbRaw, Math.max(0.01, p - maxShift), Math.min(0.99, p + maxShift));
    const delta = modelProb - p;
    const rationale =
      topDrivers.length > 0
        ? `prior=${p.toFixed(2)} | ` +
          topDrivers
            .map((d) => `${d.stance || "neutral"} on ${d.id || "evidence"} (${d.reason})`)
            .join("; ")
        : `prior=${p.toFixed(2)} | small update near prior based on available evidence`;

    res.json({
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
    });
  } catch (error) {
    console.error('Forecast-Groq error:', error);
    res.status(500).json({ error: error.message });
  }
}

app.post('/api/forecast-groq', handleForecastGroq);

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Evidence scan server running on http://localhost:${PORT}`);
});
