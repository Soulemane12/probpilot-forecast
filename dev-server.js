import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

// Load and execute the tavily-search function
const tavilySearchPath = join(__dirname, 'api', 'tavily-search.ts');
const tavilySearchCode = readFileSync(tavilySearchPath, 'utf8');

// Extract the handler function (simplified approach)
async function handleTavilySearch(req, res) {
  try {
    const { query, max_results, search_depth, include_answer, include_raw_content } = req.body;
    
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'TAVILY_API_KEY not configured' });
    }

    const tavilyRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: max_results || 6,
        search_depth: search_depth || 'basic',
        include_answer: include_answer || false,
        include_raw_content: include_raw_content || false,
      }),
    });

    if (!tavilyRes.ok) {
      throw new Error(`Tavily API error: ${tavilyRes.status}`);
    }

    const data = await tavilyRes.json();
    res.json(data);
  } catch (error) {
    console.error('Tavily search error:', error);
    res.status(500).json({ error: error.message });
  }
}

app.post('/api/tavily-search', handleTavilySearch);

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Tavily search server running on http://localhost:${PORT}`);
});
