import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatVolume(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toLocaleString();
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function getDeltaColor(delta: number): string {
  if (delta > 0.02) return 'text-positive';
  if (delta < -0.02) return 'text-negative';
  return 'text-muted-foreground';
}

export function getDeltaBgColor(delta: number): string {
  if (delta > 0.02) return 'bg-positive/10 text-positive';
  if (delta < -0.02) return 'bg-negative/10 text-negative';
  return 'bg-muted text-muted-foreground';
}

export function formatDelta(delta: number): string {
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${(delta * 100).toFixed(1)}%`;
}

export function generateForecastId(): string {
  return `fr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function simulateModelProb(marketProb: number): number {
  const variance = 0.15;
  const randomDelta = (Math.random() - 0.5) * variance * 2;
  const result = Math.max(0.01, Math.min(0.99, marketProb + randomDelta));
  return Math.round(result * 1000) / 1000;
}

export function getConfidenceLevel(): 'low' | 'med' | 'high' {
  const rand = Math.random();
  if (rand < 0.3) return 'low';
  if (rand < 0.7) return 'med';
  return 'high';
}

export function getRandomTags(): string[] {
  const allTags = ['forecast', 'updated', 'high-conf', 'trending', 'new-data', 'volatility'];
  const numTags = Math.floor(Math.random() * 3) + 1;
  const shuffled = allTags.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numTags);
}
