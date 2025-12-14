// Serverless proxy to Tavily Search API.
// Expects JSON body: { query: string, max_results?: number, search_depth?: 'basic' | 'advanced', include_answer?: boolean, include_raw_content?: boolean }
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'TAVILY_API_KEY is not set on the server' });
  }

  try {
    const { query, max_results, search_depth, include_answer, include_raw_content } = req.body ?? {};

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'query is required and must be a string' });
    }

    const tavilyRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        max_results: max_results ?? 6,
        search_depth: search_depth ?? 'basic',
        include_answer: include_answer ?? false,
        include_raw_content: include_raw_content ?? false,
      }),
    });

    if (!tavilyRes.ok) {
      const text = await tavilyRes.text();
      return res.status(502).json({
        error: 'Tavily search failed',
        status: tavilyRes.status,
        body: text,
      });
    }

    const data = await tavilyRes.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('Tavily search error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
