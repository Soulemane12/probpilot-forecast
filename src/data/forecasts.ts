import { ForecastRun } from '@/types';

export const forecastRuns: ForecastRun[] = [
  {
    id: 'fr-001',
    marketId: 'fed-rate-jan25',
    timestamp: '2025-01-10T14:30:00Z',
    modelProb: 0.412,
    confidence: 'high',
    delta: 0.07,
    summary: 'Recent economic data shows resilient labor market. Fed likely to hold rates, but January cut probability higher than market implies due to inflation cooling.',
    tags: ['fed', 'rates', 'inflation']
  },
  {
    id: 'fr-002',
    marketId: 'fed-rate-jan25',
    timestamp: '2025-01-09T10:15:00Z',
    modelProb: 0.389,
    confidence: 'med',
    delta: 0.047,
    summary: 'Mixed signals from Fed governors. Model sees slightly higher cut probability than consensus.',
    tags: ['fed', 'rates']
  },
  {
    id: 'fr-003',
    marketId: 'btc-100k-q1',
    timestamp: '2025-01-10T12:00:00Z',
    modelProb: 0.523,
    confidence: 'med',
    delta: 0.067,
    summary: 'ETF flows remain strong. Halving effects still playing out. Model slightly bullish vs market.',
    tags: ['crypto', 'btc', 'etf']
  },
  {
    id: 'fr-004',
    marketId: 'btc-100k-q1',
    timestamp: '2025-01-08T16:45:00Z',
    modelProb: 0.478,
    confidence: 'low',
    delta: 0.022,
    summary: 'Volatility increasing. Uncertain macro environment. Model close to market consensus.',
    tags: ['crypto', 'btc']
  },
  {
    id: 'fr-005',
    marketId: 'taylor-superbowl',
    timestamp: '2025-01-10T16:00:00Z',
    modelProb: 0.089,
    confidence: 'high',
    delta: -0.034,
    summary: 'No credible reports of Swift involvement. Kendrick Lamar confirmed. Model sees market overpricing this.',
    tags: ['entertainment', 'superbowl']
  },
  {
    id: 'fr-006',
    marketId: 'openai-gpt5',
    timestamp: '2025-01-10T10:00:00Z',
    modelProb: 0.178,
    confidence: 'med',
    delta: -0.056,
    summary: 'No concrete release signals from OpenAI. Competitive pressure exists but timeline seems aggressive.',
    tags: ['ai', 'openai']
  },
  {
    id: 'fr-007',
    marketId: 'sp500-6000',
    timestamp: '2025-01-10T15:30:00Z',
    modelProb: 0.756,
    confidence: 'high',
    delta: 0.044,
    summary: 'Strong earnings season expected. Model sees continued momentum through H1 2025.',
    tags: ['stocks', 'sp500']
  },
  {
    id: 'fr-008',
    marketId: 'ukraine-ceasefire',
    timestamp: '2025-01-10T11:00:00Z',
    modelProb: 0.345,
    confidence: 'low',
    delta: 0.056,
    summary: 'Diplomatic channels showing activity. Model slightly more optimistic than market but high uncertainty.',
    tags: ['geopolitics', 'ukraine']
  },
  {
    id: 'fr-009',
    marketId: 'la-rain-jan',
    timestamp: '2025-01-10T08:00:00Z',
    modelProb: 0.723,
    confidence: 'high',
    delta: 0.045,
    summary: 'Atmospheric river pattern developing. NOAA models show high precipitation probability.',
    tags: ['weather', 'california']
  },
  {
    id: 'fr-010',
    marketId: 'spacex-starship',
    timestamp: '2025-01-10T13:00:00Z',
    modelProb: 0.634,
    confidence: 'med',
    delta: 0.067,
    summary: 'Recent test flights showing progress. Regulatory approval likely. Model bullish on timeline.',
    tags: ['space', 'spacex']
  },
  {
    id: 'fr-011',
    marketId: 'eu-recession',
    timestamp: '2025-01-09T14:00:00Z',
    modelProb: 0.278,
    confidence: 'med',
    delta: -0.034,
    summary: 'PMI data improving. Energy crisis fears subsiding. Model sees lower recession risk than market.',
    tags: ['economy', 'europe']
  },
  {
    id: 'fr-012',
    marketId: 'china-taiwan',
    timestamp: '2025-01-09T09:00:00Z',
    modelProb: 0.032,
    confidence: 'high',
    delta: -0.013,
    summary: 'No escalation indicators. Economic incentives favor stability. Very low probability event.',
    tags: ['geopolitics', 'asia']
  },
  {
    id: 'fr-013',
    marketId: 'nyc-snow-feb',
    timestamp: '2025-01-10T09:00:00Z',
    modelProb: 0.489,
    confidence: 'low',
    delta: 0.044,
    summary: 'Long-range forecasts uncertain. La Niña pattern could bring more snow. Slightly bullish.',
    tags: ['weather', 'nyc']
  },
  {
    id: 'fr-014',
    marketId: 'hurricane-cat5',
    timestamp: '2025-01-08T11:00:00Z',
    modelProb: 0.198,
    confidence: 'low',
    delta: -0.036,
    summary: 'Too early for reliable hurricane forecasts. Historical base rates suggest lower probability.',
    tags: ['weather', 'hurricanes']
  },
  {
    id: 'fr-015',
    marketId: 'stranger-things',
    timestamp: '2025-01-07T15:00:00Z',
    modelProb: 0.389,
    confidence: 'med',
    delta: -0.067,
    summary: 'Production timeline tight. No official announcement yet. Model slightly bearish vs market.',
    tags: ['entertainment', 'netflix']
  }
];
