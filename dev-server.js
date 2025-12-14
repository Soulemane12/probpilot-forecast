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
    const stanceValue = (s) => {
      if (s === "supports") return 1;
      if (s === "contradicts") return -1;
      return 0;
    };

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

    // Confidence calculation
    const nonNeutral = evidence.filter(e => e.stance !== "neutral");
    const n = nonNeutral.length;
    const avgRel = n === 0 ? 0 : nonNeutral.reduce((a, e) => a + clamp(e.reliability, 0, 100), 0) / n;
    const supports = nonNeutral.filter(e => e.stance === "supports").length;
    const contradicts = nonNeutral.filter(e => e.stance === "contradicts").length;
    const disagreement = n === 0 ? 1 : Math.min(supports, contradicts) / n;
    const spreadPenalty = spread == null ? 0 : clamp(spread / 0.05, 0, 1);

    let score = 0;
    score += clamp(n * 12, 0, 40);
    score += clamp(avgRel * 0.4, 0, 40);
    score += (1 - disagreement) * 10;
    score += (1 - spreadPenalty) * 10;
    score = clamp(score, 0, 100);

    let confLabel = "low";
    if (score >= 70) confLabel = "high";
    else if (score >= 45) confLabel = "med";

    const shrinkFactor = (label) => {
      if (label === "high") return 1.0;
      if (label === "med") return 0.7;
      return 0.4;
    };

    const q = p + shrinkFactor(confLabel) * (qRaw - p);
    const modelProb = clamp(q, 0.01, 0.99);
    const delta = modelProb - p;

    const summary =
      confLabel === "low"
        ? "Low confidence: limited/contested evidence; forecast shrunk toward market."
        : confLabel === "med"
        ? "Medium confidence: some consistent evidence; moderate adjustment from market."
        : "High confidence: multiple consistent sources; strong adjustment from market.";

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

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Evidence scan server running on http://localhost:${PORT}`);
});
