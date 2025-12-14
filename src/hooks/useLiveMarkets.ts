import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { fetchKalshiMarkets, fetchPolymarketMarkets } from '@/lib/marketSources';
import { Market } from '@/types';

export function useLiveMarkets() {
  const [kalshiQuery, polyQuery] = useQueries({
    queries: [
      {
        queryKey: ['markets', 'kalshi'],
        queryFn: () => fetchKalshiMarkets({ status: 'open', maxMarkets: 200 }),
        staleTime: 60_000,
        refetchInterval: 120_000,
        retry: 1,
      },
      {
        queryKey: ['markets', 'polymarket'],
        queryFn: () => fetchPolymarketMarkets({ closed: false, maxMarkets: 200 }),
        staleTime: 60_000,
        refetchInterval: 120_000,
        retry: 1,
      },
    ],
  });

  const isLoading = kalshiQuery.isLoading || polyQuery.isLoading;
  const isError = kalshiQuery.isError && polyQuery.isError;
  const isFetching = kalshiQuery.isFetching || polyQuery.isFetching;

  const markets = useMemo<Market[]>(() => {
    const kalshiData = (kalshiQuery.data as Market[] | undefined) ?? [];
    const polyData = (polyQuery.data as Market[] | undefined) ?? [];
    return [...kalshiData, ...polyData];
  }, [kalshiQuery.data, polyQuery.data]);

  const refetch = () => {
    kalshiQuery.refetch();
    polyQuery.refetch();
  };

  return {
    markets,
    isLoading,
    isError,
    isFetching,
    refetch,
  };
}
