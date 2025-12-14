import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { MarketCard } from '@/components/markets/MarketCard';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { EmptyState } from '@/components/ui/empty-state';
import { useApp } from '@/contexts/AppContext';
import { useLiveMarkets } from '@/hooks/useLiveMarkets';
import { MarketExchange } from '@/types';

const ALLOWED_EXCHANGES: MarketExchange[] = ['Kalshi', 'Polymarket'];

export default function Watchlist() {
  const navigate = useNavigate();
  const { watchlist } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const {
    markets: liveMarkets,
    isLoading: marketsLoading,
  } = useLiveMarkets();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const sourceMarkets = useMemo(() => {
    return liveMarkets.filter(m => ALLOWED_EXCHANGES.includes(m.exchange));
  }, [liveMarkets]);

  const watchedMarkets = sourceMarkets.filter(m => watchlist.includes(m.id));

  return (
    <AppLayout>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Star className="w-6 h-6" />
            Watchlist
          </h1>
          <p className="text-muted-foreground">
            Markets you're tracking
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {watchedMarkets.length} market{watchedMarkets.length !== 1 ? 's' : ''} watched
          </div>
          <div className="text-sm text-muted-foreground">
            • {watchedMarkets.filter(m => m.status === 'open').length} open
          </div>
        </div>

        {/* Grid */}
        {isLoading || (marketsLoading && sourceMarkets.length === 0) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : watchedMarkets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {watchedMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Star}
            title="No markets in watchlist"
            description="Star markets you want to track and they'll appear here for quick access."
            action={{
              label: "Browse markets",
              onClick: () => navigate('/markets')
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}
