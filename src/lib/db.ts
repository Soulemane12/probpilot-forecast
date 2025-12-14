import { supabase } from '@/lib/supabase';
import { defaultEntitlements } from '@/data/entitlements';
import type { Entitlements, ForecastRun } from '@/types';

type ForecastRow = {
  id: string;
  user_id: string;
  market_id: string;
  market_title?: string | null;
  timestamp: string;
  market_prob?: number | null;
  model_prob: number;
  delta: number;
  confidence: string;
  confidence_score?: number | null;
  signal?: number | null;
  summary: string;
  tags?: string[] | null;
};

type EntitlementsRow = {
  plan?: string | null;
  forecasts_used_today?: number | null;
  forecasts_limit?: number | null;
  evidence_runs_used_today?: number | null;
  evidence_runs_limit?: number | null;
  exports_enabled?: boolean | null;
  alerts_enabled?: boolean | null;
};

function mapForecastRow(row: ForecastRow): ForecastRun {
  return {
    id: row.id,
    marketId: row.market_id,
    marketTitle: row.market_title ?? undefined,
    timestamp: row.timestamp,
    marketProb: row.market_prob ?? undefined,
    modelProb: row.model_prob,
    delta: row.delta,
    confidence: row.confidence,
    confidenceScore: row.confidence_score ?? undefined,
    signal: row.signal ?? undefined,
    summary: row.summary,
    tags: Array.isArray(row.tags) ? row.tags : [],
  };
}

function mapEntitlementsRow(row: EntitlementsRow | null): Entitlements {
  if (!row) return defaultEntitlements;
  return {
    plan: row.plan ?? 'Free',
    forecastsUsedToday: row.forecasts_used_today ?? 0,
    forecastsLimit: row.forecasts_limit ?? defaultEntitlements.forecastsLimit,
    evidenceRunsUsedToday: row.evidence_runs_used_today ?? 0,
    evidenceRunsLimit: row.evidence_runs_limit ?? defaultEntitlements.evidenceRunsLimit,
    exportsEnabled: Boolean(row.exports_enabled),
    alertsEnabled: Boolean(row.alerts_enabled),
  };
}

export async function fetchForecastRuns(userId: string): Promise<ForecastRun[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('forecast_runs')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });

  if (error) throw error;
  const rows = (data ?? []) as ForecastRow[];
  return rows.map(mapForecastRow);
}

export async function saveForecastRun(userId: string, forecast: ForecastRun) {
  if (!supabase) return;

  const { error } = await supabase.from('forecast_runs').upsert({
    id: forecast.id,
    user_id: userId,
    market_id: forecast.marketId,
    market_title: forecast.marketTitle ?? null,
    timestamp: forecast.timestamp,
    market_prob: forecast.marketProb ?? null,
    model_prob: forecast.modelProb,
    delta: forecast.delta,
    confidence: forecast.confidence,
    confidence_score: forecast.confidenceScore ?? null,
    signal: forecast.signal ?? null,
    summary: forecast.summary ?? '',
    tags: forecast.tags ?? [],
  });

  if (error) throw error;
}

export async function fetchWatchlist(userId: string): Promise<string[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('watchlist')
    .select('market_id')
    .eq('user_id', userId);

  if (error) throw error;
  return (data ?? []).map((row) => row.market_id);
}

export async function setWatchlistItem(userId: string, marketId: string, enabled: boolean) {
  if (!supabase) return;

  if (enabled) {
    const { error } = await supabase.from('watchlist').upsert({
      user_id: userId,
      market_id: marketId,
    });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('market_id', marketId);
    if (error) throw error;
  }
}

export async function fetchEntitlements(userId: string): Promise<Entitlements> {
  if (!supabase) return defaultEntitlements;

  const { data, error } = await supabase
    .from('entitlements')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = row not found
  const row = (data as EntitlementsRow | null) ?? null;
  return mapEntitlementsRow(row);
}

export async function saveEntitlements(userId: string, entitlements: Entitlements) {
  if (!supabase) return;

  const { error } = await supabase.from('entitlements').upsert({
    user_id: userId,
    plan: entitlements.plan,
    forecasts_used_today: entitlements.forecastsUsedToday,
    forecasts_limit: entitlements.forecastsLimit,
    evidence_runs_used_today: entitlements.evidenceRunsUsedToday,
    evidence_runs_limit: entitlements.evidenceRunsLimit,
    exports_enabled: entitlements.exportsEnabled,
    alerts_enabled: entitlements.alertsEnabled,
  });

  if (error) throw error;
}
