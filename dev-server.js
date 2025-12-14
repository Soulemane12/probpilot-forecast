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

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Evidence scan server running on http://localhost:${PORT}`);
});
