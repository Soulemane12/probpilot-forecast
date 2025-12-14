import { Entitlements } from '@/types';

export const defaultEntitlements: Entitlements = {
  plan: 'Free',
  forecastsUsedToday: 3,
  forecastsLimit: 5,
  evidenceRunsUsedToday: 2,
  evidenceRunsLimit: 3,
  exportsEnabled: false,
  alertsEnabled: false
};

export const proEntitlements: Entitlements = {
  plan: 'Pro',
  forecastsUsedToday: 12,
  forecastsLimit: 50,
  evidenceRunsUsedToday: 8,
  evidenceRunsLimit: 25,
  exportsEnabled: true,
  alertsEnabled: true
};

export const teamEntitlements: Entitlements = {
  plan: 'Team',
  forecastsUsedToday: 45,
  forecastsLimit: 999,
  evidenceRunsUsedToday: 23,
  evidenceRunsLimit: 999,
  exportsEnabled: true,
  alertsEnabled: true
};
