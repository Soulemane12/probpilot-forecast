export type KalshiMarket = {
  ticker: string;
  event_ticker?: string;
  series_ticker?: string;
  title: string;
  status: string;
  close_time?: string;
  yes_ask?: number;
  yes_bid?: number;
  volume?: number;
};

export type KalshiMarketsResp = {
  markets: KalshiMarket[];
  cursor?: string | null;
};

const KALSHI_BASE =
  import.meta.env.VITE_KALSHI_BASE ||
  (import.meta.env.DEV ? "/api/kalshi/trade-api/v2" : "https://api.elections.kalshi.com/trade-api/v2");

function buildKalshiUrl(path: string) {
  const base = KALSHI_BASE.endsWith('/') ? KALSHI_BASE.slice(0, -1) : KALSHI_BASE;
  const fullPath = `${base}${path}`;

  if (fullPath.startsWith('http://') || fullPath.startsWith('https://')) {
    return new URL(fullPath);
  }

  if (typeof window !== 'undefined') {
    return new URL(fullPath, window.location.origin);
  }

  return new URL(`http://localhost:8080${fullPath}`);
}

export async function kalshiListMarkets(params?: {
  cursor?: string;
  limit?: number;
  status?: "open" | "closed";
  series_ticker?: string;
}) {
  const url = buildKalshiUrl('/markets');
  if (params?.cursor) url.searchParams.set("cursor", params.cursor);
  if (params?.limit) url.searchParams.set("limit", String(params.limit));
  if (params?.status) url.searchParams.set("status", params.status);
  if (params?.series_ticker) url.searchParams.set("series_ticker", params.series_ticker);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Kalshi error ${res.status}`);
  const data = (await res.json()) as KalshiMarketsResp;

  return { items: data.markets, nextCursor: data.cursor ?? null };
}

export { KALSHI_BASE };
