import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Entitlements, ForecastRun } from '@/types';
import { defaultEntitlements } from '@/data/entitlements';
import { forecastRuns as initialForecasts } from '@/data/forecasts';
import { useAuth } from './AuthContext';
import { fetchEntitlements, fetchForecastRuns, fetchWatchlist, saveEntitlements, saveForecastRun, setWatchlistItem } from '@/lib/db';

interface AppContextType {
  entitlements: Entitlements;
  setEntitlements: React.Dispatch<React.SetStateAction<Entitlements>>;
  forecasts: ForecastRun[];
  addForecast: (forecast: ForecastRun) => void;
  watchlist: string[];
  toggleWatchlist: (marketId: string) => void;
  isInWatchlist: (marketId: string) => boolean;
  getForecastsByMarket: (marketId: string) => ForecastRun[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [entitlements, setEntitlements] = useState<Entitlements>(defaultEntitlements);
  const [forecasts, setForecasts] = useState<ForecastRun[]>(initialForecasts);
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('probpilot-watchlist') : null;
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('probpilot-watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    let cancelled = false;

    const loadRemoteState = async () => {
      if (!user) {
        // Reset to defaults when logged out
        const saved = typeof window !== 'undefined' ? localStorage.getItem('probpilot-watchlist') : null;
        const localWatchlist = saved ? JSON.parse(saved) : [];
        if (!cancelled) {
          setEntitlements(defaultEntitlements);
          setForecasts(initialForecasts);
          setWatchlist(localWatchlist);
        }
        return;
      }

      try {
        const [remoteWatchlist, remoteForecasts, remoteEntitlements] = await Promise.all([
          fetchWatchlist(user.id),
          fetchForecastRuns(user.id),
          fetchEntitlements(user.id),
        ]);

        if (!cancelled) {
          setWatchlist(remoteWatchlist ?? []);
          setForecasts(remoteForecasts ?? []);
          setEntitlements(remoteEntitlements ?? defaultEntitlements);
        }
      } catch (err) {
        console.error('Failed to sync Supabase data', err);
      }
    };

    loadRemoteState();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const addForecast = (forecast: ForecastRun) => {
    const nextEntitlements = {
      ...entitlements,
      forecastsUsedToday: entitlements.forecastsUsedToday + 1
    };

    setForecasts(prev => [forecast, ...prev]);
    setEntitlements(nextEntitlements);

    if (user) {
      saveForecastRun(user.id, forecast).catch((err) =>
        console.error('Failed to save forecast to Supabase', err)
      );
      saveEntitlements(user.id, nextEntitlements).catch((err) =>
        console.error('Failed to update entitlements in Supabase', err)
      );
    }
  };

  const toggleWatchlist = (marketId: string) => {
    setWatchlist(prev => {
      const isActive = prev.includes(marketId);
      const next = isActive ? prev.filter(id => id !== marketId) : [...prev, marketId];

      if (user) {
        setWatchlistItem(user.id, marketId, !isActive).catch((err) =>
          console.error('Failed to sync watchlist to Supabase', err)
        );
      }

      return next;
    });
  };

  const isInWatchlist = (marketId: string) => watchlist.includes(marketId);

  const getForecastsByMarket = (marketId: string) => 
    forecasts.filter(f => f.marketId === marketId).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

  return (
    <AppContext.Provider value={{
      entitlements,
      setEntitlements,
      forecasts,
      addForecast,
      watchlist,
      toggleWatchlist,
      isInWatchlist,
      getForecastsByMarket
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
