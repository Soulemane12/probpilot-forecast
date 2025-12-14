export type MarketCategory = 'economy' | 'politics' | 'weather' | 'popculture' | 'other';
export type MarketStatus = 'open' | 'closed';
export type MarketExchange = 'Kalshi' | 'Metaculus' | 'Polymarket' | 'Other';
export type ConfidenceLevel = 'low' | 'med' | 'high';
export type EvidenceStance = 'supports' | 'contradicts' | 'neutral';
export type PlanType = 'Free' | 'Pro' | 'Team';

export interface Market {
  id: string;
  title: string;
  category: MarketCategory;
  endDate: string;
  status: MarketStatus;
  exchange: MarketExchange;
  marketProb: number;
  volume24h: number;
  lastUpdated: string;
  description?: string;
}

export interface ForecastRun {
  id: string;
  marketId: string;
  timestamp: string;
  modelProb: number;
  confidence: ConfidenceLevel;
  delta: number;
  summary: string;
  tags: string[];
}

export interface EvidenceItem {
  id: string;
  marketId: string;
  sourceName: string;
  title: string;
  url: string;
  stance: EvidenceStance;
  snippet: string;
  timestamp: string;
  reliability: number;
}

export interface Entitlements {
  plan: PlanType;
  forecastsUsedToday: number;
  forecastsLimit: number;
  evidenceRunsUsedToday: number;
  evidenceRunsLimit: number;
  exportsEnabled: boolean;
  alertsEnabled: boolean;
}
