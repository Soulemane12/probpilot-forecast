import { kalshiListMarkets, KalshiMarket, KALSHI_BASE } from './kalshi';
import { Market, MarketCategory } from '@/types';

type PolymarketGammaMarket = {
  id: string;
  slug?: string;
  title?: string;
  question?: string;
  description?: string;
  outcomes?: string | string[];
  outcomePrices?: string | number[];
  clobTokenIds?: string | string[];
  endDate?: string;
  end_date?: string;
  closeDate?: string;
  createdAt?: string;
  created_at?: string;
  active?: boolean;
  closed?: boolean | string;
  volume?: number;
  liquidity?: number;
  url?: string;
};

const POLY_GAMMA_BASE =
  import.meta.env.VITE_POLY_BASE ||
  (import.meta.env.DEV ? "/api/polymarket" : "https://gamma-api.polymarket.com");

function normalizePrice(value?: number | string | null): number {
  if (value == null) return 0.5;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  const normalized = num > 1 ? num / 100 : num;
  return Math.max(0, Math.min(1, normalized));
}

function inferCategory(seriesOrSlug?: string | null, title?: string): MarketCategory {
  const source = `${seriesOrSlug ?? ''} ${title ?? ''}`.toLowerCase();
  if (source.includes('election') || source.includes('president') || source.includes('senate')) return 'politics';
  if (source.includes('inflation') || source.includes('gdp') || source.includes('jobs') || source.includes('rate')) return 'economy';
  if (source.includes('rain') || source.includes('snow') || source.includes('temperature') || source.includes('weather')) return 'weather';
  if (source.includes('movie') || source.includes('oscars') || source.includes('music')) return 'popculture';
  return 'other';
}

function safeParseArray<T>(value?: string | string[] | number[] | null): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as unknown as T[];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeKalshiMarket(raw: KalshiMarket): Market {
  const price = normalizePrice(raw.yes_ask ?? raw.yes_bid);
  const endDate = raw.close_time ? new Date(raw.close_time).toISOString() : new Date().toISOString();
  const baseTicker = raw.series_ticker ?? raw.event_ticker ?? raw.ticker;
  const externalUrl = baseTicker ? `https://kalshi.com/events/${baseTicker}` : undefined;
  return {
    id: raw.ticker,
    title: raw.title,
    category: inferCategory(raw.series_ticker ?? raw.event_ticker, raw.title),
    endDate,
    status: raw.status === 'open' ? 'open' : 'closed',
    exchange: 'Kalshi',
    marketProb: price,
    volume24h: raw.volume ?? 0,
    lastUpdated: new Date().toISOString(),
    externalUrl,
  };
}

function normalizePolymarketMarket(raw: PolymarketGammaMarket): Market {
  const outcomes = safeParseArray<string>(raw.outcomes);
  const pricesRaw = safeParseArray<string | number>(raw.outcomePrices);
  const prices = pricesRaw.map(normalizePrice);
  // Pick the first outcome price as the displayed probability; default to 0.5 when absent.
  const probability = prices[0] ?? 0.5;
  const isClosed = raw.closed === true || raw.closed === 'true';

  const endDate =
    raw.endDate ||
    raw.end_date ||
    raw.closeDate ||
    raw.createdAt ||
    raw.created_at ||
    new Date().toISOString();

  const externalUrl = raw.slug
    ? `https://polymarket.com/event/${raw.slug}`
    : raw.url
      ? raw.url
      : raw.id
        ? `https://polymarket.com/market/${raw.id}`
        : undefined;

  const volume =
    typeof raw.volume === 'number'
      ? raw.volume
      : typeof raw.volume === 'string'
        ? parseFloat(raw.volume) || 0
        : 0;

  const title = raw.title || raw.question || raw.slug || 'Polymarket market';

  return {
    id: String(raw.id),
    title,
    category: inferCategory(raw.slug, title),
    endDate: new Date(endDate).toISOString(),
    status: isClosed ? 'closed' : 'open',
    exchange: 'Polymarket',
    marketProb: probability,
    volume24h: volume,
    lastUpdated: new Date().toISOString(),
    externalUrl,
    description: raw.description,
  };
}

export async function fetchKalshiMarkets(options?: {
  status?: 'open' | 'closed';
  limit?: number;
  maxMarkets?: number;
  series_ticker?: string;
}): Promise<Market[]> {
  const status = options?.status;
  const limit = options?.limit ?? 50;
  const maxMarkets = options?.maxMarkets ?? 120;
  const series_ticker = options?.series_ticker;

  const results: KalshiMarket[] = [];
  let cursor: string | undefined;

  while (results.length < maxMarkets) {
    let items: KalshiMarket[] = [];
    let nextCursor: string | null = null;
    try {
      const response = await kalshiListMarkets({
        cursor,
        limit,
        status,
        series_ticker,
      });
      items = response.items;
      nextCursor = response.nextCursor;
    } catch (err) {
      // Only attempt a direct host fallback in non-browser contexts to avoid CORS in the browser.
      if (typeof window === 'undefined' && KALSHI_BASE.startsWith('/api/kalshi')) {
        const url = new URL(`https://api.elections.kalshi.com/trade-api/v2/markets`);
        if (cursor) url.searchParams.set('cursor', cursor);
        url.searchParams.set('limit', String(limit));
        if (status) url.searchParams.set('status', status);
        if (series_ticker) url.searchParams.set('series_ticker', series_ticker);
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`Kalshi error ${res.status}`);
        const data = (await res.json()) as { markets: KalshiMarket[]; cursor?: string | null };
        items = data.markets;
        nextCursor = data.cursor ?? null;
      } else {
        throw err;
      }
    }

    results.push(...items);
    if (!nextCursor) break;
    cursor = nextCursor;
  }

  return results
    .slice(0, maxMarkets)
    .map(normalizeKalshiMarket);
}

export async function fetchPolymarketMarkets(options?: {
  closed?: boolean;
  limit?: number;
  offset?: number;
  maxMarkets?: number;
}): Promise<Market[]> {
  const closed = options?.closed ?? false;
  const limit = options?.limit ?? 200;
  const offset = options?.offset ?? 0;
  const maxMarkets = options?.maxMarkets ?? 200;

  const buildUrl = (base: string) => {
    const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const path = `${normalizedBase}/markets`;
    let url: URL;

    if (path.startsWith('http://') || path.startsWith('https://')) {
      url = new URL(path);
    } else if (typeof window !== 'undefined') {
      url = new URL(path, window.location.origin);
    } else {
      url = new URL(`http://localhost:8080${path}`);
    }

    url.searchParams.set('limit', String(limit));
    url.searchParams.set('offset', String(offset));
    url.searchParams.set('closed', String(closed));
    url.searchParams.set('archived', 'false');
    return url;
  };

  let data: unknown;
  try {
    const url = buildUrl(POLY_GAMMA_BASE);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Polymarket error ${res.status}`);
    data = await res.json();
  } catch (err) {
    // Only attempt direct host fallback outside the browser to avoid CORS issues.
    if (typeof window === 'undefined' && POLY_GAMMA_BASE.startsWith('/api/polymarket')) {
      const url = buildUrl('https://gamma-api.polymarket.com');
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Polymarket error ${res.status}`);
      data = await res.json();
    } else {
      throw err;
    }
  }

  const items: PolymarketGammaMarket[] = Array.isArray(data) ? data : (data as any)?.markets ?? (data as any)?.data ?? [];

  return items
    .slice(0, maxMarkets)
    .map(normalizePolymarketMarket);
}

export { POLY_GAMMA_BASE };
