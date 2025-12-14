import { EvidenceItem } from '@/types';

export const evidenceItems: EvidenceItem[] = [
  // Fed Rate Evidence
  {
    id: 'ev-001',
    marketId: 'fed-rate-jan25',
    sourceName: 'Federal Reserve',
    title: 'FOMC December 2024 Minutes',
    url: 'https://federalreserve.gov/fomc/minutes',
    stance: 'neutral',
    snippet: 'Committee members noted that while inflation has moderated, labor market remains resilient. Further assessment needed before policy changes.',
    timestamp: '2025-01-08T18:00:00Z',
    reliability: 95
  },
  {
    id: 'ev-002',
    marketId: 'fed-rate-jan25',
    sourceName: 'Reuters',
    title: 'Fed officials signal patience on rate cuts',
    url: 'https://reuters.com/fed-rate-cuts',
    stance: 'contradicts',
    snippet: 'Several Fed governors emphasized the need for more data before considering rate reductions, dampening hopes for a January cut.',
    timestamp: '2025-01-09T14:30:00Z',
    reliability: 88
  },
  {
    id: 'ev-003',
    marketId: 'fed-rate-jan25',
    sourceName: 'Bloomberg',
    title: 'Inflation data shows continued cooling',
    url: 'https://bloomberg.com/inflation-cooling',
    stance: 'supports',
    snippet: 'Core PCE inflation fell to 2.4% in December, closer to Fed target. Markets now pricing higher odds of early 2025 cut.',
    timestamp: '2025-01-10T08:00:00Z',
    reliability: 91
  },
  // BTC Evidence
  {
    id: 'ev-004',
    marketId: 'btc-100k-q1',
    sourceName: 'CoinDesk',
    title: 'Bitcoin ETF inflows hit record high',
    url: 'https://coindesk.com/btc-etf-inflows',
    stance: 'supports',
    snippet: 'Spot Bitcoin ETFs saw $1.2B in net inflows last week, the highest since launch. Institutional demand continues to grow.',
    timestamp: '2025-01-10T10:00:00Z',
    reliability: 82
  },
  {
    id: 'ev-005',
    marketId: 'btc-100k-q1',
    sourceName: 'Glassnode',
    title: 'On-chain metrics signal accumulation phase',
    url: 'https://glassnode.com/btc-accumulation',
    stance: 'supports',
    snippet: 'Long-term holder supply at all-time high. Exchange balances continue declining, suggesting reduced selling pressure.',
    timestamp: '2025-01-09T16:00:00Z',
    reliability: 78
  },
  {
    id: 'ev-006',
    marketId: 'btc-100k-q1',
    sourceName: 'WSJ',
    title: 'Regulatory uncertainty persists for crypto',
    url: 'https://wsj.com/crypto-regulation',
    stance: 'contradicts',
    snippet: 'SEC enforcement actions continue despite industry lobbying. Regulatory headwinds may limit upside potential.',
    timestamp: '2025-01-08T12:00:00Z',
    reliability: 85
  },
  // Taylor Swift Evidence
  {
    id: 'ev-007',
    marketId: 'taylor-superbowl',
    sourceName: 'NFL',
    title: 'Kendrick Lamar confirmed as halftime performer',
    url: 'https://nfl.com/superbowl-halftime',
    stance: 'contradicts',
    snippet: 'The NFL officially announced Kendrick Lamar as the Super Bowl LIX halftime show performer.',
    timestamp: '2024-09-08T12:00:00Z',
    reliability: 100
  },
  {
    id: 'ev-008',
    marketId: 'taylor-superbowl',
    sourceName: 'TMZ',
    title: 'Swift Eras Tour schedule conflicts with Super Bowl',
    url: 'https://tmz.com/swift-superbowl',
    stance: 'contradicts',
    snippet: 'Taylor Swift has Eras Tour dates in Australia around Super Bowl weekend, making appearance logistically difficult.',
    timestamp: '2025-01-05T14:00:00Z',
    reliability: 65
  },
  // OpenAI Evidence
  {
    id: 'ev-009',
    marketId: 'openai-gpt5',
    sourceName: 'The Information',
    title: 'OpenAI focused on reasoning improvements',
    url: 'https://theinformation.com/openai-reasoning',
    stance: 'neutral',
    snippet: 'Sources say OpenAI prioritizing o1 model improvements over GPT-5 release. Timeline for next major model unclear.',
    timestamp: '2025-01-07T11:00:00Z',
    reliability: 76
  },
  {
    id: 'ev-010',
    marketId: 'openai-gpt5',
    sourceName: 'TechCrunch',
    title: 'Sam Altman hints at 2025 releases',
    url: 'https://techcrunch.com/altman-2025',
    stance: 'supports',
    snippet: 'In a recent podcast, Altman mentioned "exciting things coming in 2025" without specifying GPT-5.',
    timestamp: '2025-01-02T09:00:00Z',
    reliability: 68
  },
  // S&P 500 Evidence
  {
    id: 'ev-011',
    marketId: 'sp500-6000',
    sourceName: 'Goldman Sachs',
    title: 'GS raises S&P 500 target to 6200',
    url: 'https://goldmansachs.com/outlook',
    stance: 'supports',
    snippet: 'Goldman analysts see continued earnings growth and AI tailwinds driving markets higher through 2025.',
    timestamp: '2025-01-06T08:00:00Z',
    reliability: 84
  },
  {
    id: 'ev-012',
    marketId: 'sp500-6000',
    sourceName: 'Morgan Stanley',
    title: 'Valuation concerns mount for US equities',
    url: 'https://morganstanley.com/valuation',
    stance: 'contradicts',
    snippet: 'P/E ratios at historical highs. MS warns of potential correction if earnings disappoint.',
    timestamp: '2025-01-08T10:00:00Z',
    reliability: 83
  },
  // Ukraine Evidence
  {
    id: 'ev-013',
    marketId: 'ukraine-ceasefire',
    sourceName: 'AP News',
    title: 'Diplomatic talks resume in Turkey',
    url: 'https://apnews.com/ukraine-talks',
    stance: 'supports',
    snippet: 'Turkish officials confirm renewed diplomatic efforts between Ukraine and Russia. Ceasefire discussions on agenda.',
    timestamp: '2025-01-09T16:00:00Z',
    reliability: 89
  },
  {
    id: 'ev-014',
    marketId: 'ukraine-ceasefire',
    sourceName: 'BBC',
    title: 'Putin rejects territorial concessions',
    url: 'https://bbc.com/putin-ukraine',
    stance: 'contradicts',
    snippet: 'Russian President maintains hardline stance on occupied territories, complicating any potential peace deal.',
    timestamp: '2025-01-08T12:00:00Z',
    reliability: 92
  },
  // LA Rain Evidence
  {
    id: 'ev-015',
    marketId: 'la-rain-jan',
    sourceName: 'NOAA',
    title: 'Atmospheric river pattern developing',
    url: 'https://noaa.gov/california-forecast',
    stance: 'supports',
    snippet: 'Strong atmospheric river expected to bring 2-4 inches of rain to LA basin over next 10 days.',
    timestamp: '2025-01-10T06:00:00Z',
    reliability: 94
  },
  {
    id: 'ev-016',
    marketId: 'la-rain-jan',
    sourceName: 'LA Times',
    title: 'January shaping up as wet month for SoCal',
    url: 'https://latimes.com/weather-january',
    stance: 'supports',
    snippet: 'Multiple storm systems tracking toward Southern California. Above-average precipitation expected.',
    timestamp: '2025-01-09T14:00:00Z',
    reliability: 80
  },
  // SpaceX Evidence
  {
    id: 'ev-017',
    marketId: 'spacex-starship',
    sourceName: 'SpaceNews',
    title: 'FAA approves Starship test flight license',
    url: 'https://spacenews.com/starship-faa',
    stance: 'supports',
    snippet: 'Regulatory clearance obtained for next Starship test. SpaceX targeting February launch window.',
    timestamp: '2025-01-08T15:00:00Z',
    reliability: 87
  },
  {
    id: 'ev-018',
    marketId: 'spacex-starship',
    sourceName: 'Ars Technica',
    title: 'Starship booster catch success analyzed',
    url: 'https://arstechnica.com/starship-catch',
    stance: 'supports',
    snippet: 'Engineering analysis shows tower catch technique is replicable. Major milestone for reusability.',
    timestamp: '2025-01-07T11:00:00Z',
    reliability: 85
  },
  // EU Recession Evidence
  {
    id: 'ev-019',
    marketId: 'eu-recession',
    sourceName: 'ECB',
    title: 'ECB maintains cautious outlook',
    url: 'https://ecb.europa.eu/outlook',
    stance: 'neutral',
    snippet: 'European Central Bank sees modest growth in 2025, but warns of geopolitical and energy risks.',
    timestamp: '2025-01-09T09:00:00Z',
    reliability: 93
  },
  {
    id: 'ev-020',
    marketId: 'eu-recession',
    sourceName: 'Eurostat',
    title: 'EU Q4 GDP shows slight expansion',
    url: 'https://eurostat.eu/gdp-q4',
    stance: 'contradicts',
    snippet: 'Preliminary Q4 2024 GDP shows 0.2% growth, avoiding technical recession. Services sector resilient.',
    timestamp: '2025-01-10T10:00:00Z',
    reliability: 96
  },
  // Additional evidence items
  {
    id: 'ev-021',
    marketId: 'china-taiwan',
    sourceName: 'CSIS',
    title: 'Taiwan Strait risk assessment',
    url: 'https://csis.org/taiwan-risk',
    stance: 'contradicts',
    snippet: 'Analysis suggests economic interdependence and military considerations make 2025 conflict unlikely.',
    timestamp: '2025-01-05T14:00:00Z',
    reliability: 88
  },
  {
    id: 'ev-022',
    marketId: 'nyc-snow-feb',
    sourceName: 'Weather Channel',
    title: 'La Niña winter outlook for Northeast',
    url: 'https://weather.com/la-nina-northeast',
    stance: 'supports',
    snippet: 'La Niña pattern typically brings colder, snowier conditions to NYC. February could see significant accumulation.',
    timestamp: '2025-01-08T07:00:00Z',
    reliability: 75
  },
  {
    id: 'ev-023',
    marketId: 'hurricane-cat5',
    sourceName: 'NOAA',
    title: '2025 Atlantic hurricane season outlook',
    url: 'https://noaa.gov/hurricane-2025',
    stance: 'neutral',
    snippet: 'Too early for specific predictions, but ocean temperatures suggest active season possible.',
    timestamp: '2025-01-03T12:00:00Z',
    reliability: 90
  },
  {
    id: 'ev-024',
    marketId: 'stranger-things',
    sourceName: 'Variety',
    title: 'Netflix production schedule update',
    url: 'https://variety.com/stranger-things-schedule',
    stance: 'contradicts',
    snippet: 'Post-production work ongoing but VFX-heavy finale may push release to late 2025.',
    timestamp: '2025-01-06T16:00:00Z',
    reliability: 79
  }
];
