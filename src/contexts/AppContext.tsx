import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Entitlements, ForecastRun, Market } from '@/types';
import { defaultEntitlements } from '@/data/entitlements';
import { forecastRuns as initialForecasts } from '@/data/forecasts';
import { markets } from '@/data/markets';

interface AppContextType {
  entitlements: Entitlements;
  setEntitlements: React.Dispatch<React.SetStateAction<Entitlements>>;
  forecasts: ForecastRun[];
  addForecast: (forecast: ForecastRun) => void;
  watchlist: string[];
  toggleWatchlist: (marketId: string) => void;
  isInWatchlist: (marketId: string) => boolean;
  getMarketById: (id: string) => Market | undefined;
  getForecastsByMarket: (marketId: string) => ForecastRun[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [entitlements, setEntitlements] = useState<Entitlements>(defaultEntitlements);
  const [forecasts, setForecasts] = useState<ForecastRun[]>(initialForecasts);
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('probpilot-watchlist');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('probpilot-watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const addForecast = (forecast: ForecastRun) => {
    setForecasts(prev => [forecast, ...prev]);
    setEntitlements(prev => ({
      ...prev,
      forecastsUsedToday: prev.forecastsUsedToday + 1
    }));
  };

  const toggleWatchlist = (marketId: string) => {
    setWatchlist(prev => 
      prev.includes(marketId) 
        ? prev.filter(id => id !== marketId)
        : [...prev, marketId]
    );
  };

  const isInWatchlist = (marketId: string) => watchlist.includes(marketId);

  const getMarketById = (id: string) => markets.find(m => m.id === id);

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
      getMarketById,
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
