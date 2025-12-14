import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, TrendingUp, Star, StarOff, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { ForecastPanel } from '@/components/forecast/ForecastPanel';
import { EvidencePanel } from '@/components/evidence/EvidencePanel';
import { HistoryTable } from '@/components/forecast/HistoryTable';
import { SkeletonCard, SkeletonTable } from '@/components/ui/skeleton-card';
import { ErrorState } from '@/components/ui/error-state';
import { useApp } from '@/contexts/AppContext';
import { evidenceItems } from '@/data/evidence';
import { formatDate, formatVolume, cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useLiveMarkets } from '@/hooks/useLiveMarkets';

const categoryColors: Record<string, string> = {
  economy: 'bg-blue-100 text-blue-700',
  politics: 'bg-purple-100 text-purple-700',
  weather: 'bg-cyan-100 text-cyan-700',
  popculture: 'bg-pink-100 text-pink-700',
  other: 'bg-gray-100 text-gray-700',
};

export default function MarketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getForecastsByMarket, isInWatchlist, toggleWatchlist } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const { markets: liveMarkets, isLoading: marketsLoading, isError, refetch } = useLiveMarkets();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [id]);

  const market = useMemo(() => liveMarkets.find(m => m.id === id), [liveMarkets, id]);
  const marketForecasts = id ? getForecastsByMarket(id) : [];
  const latestForecast = marketForecasts[0];
  const marketEvidence = id ? evidenceItems.filter(e => e.marketId === id) : [];
  const inWatchlist = id ? isInWatchlist(id) : false;

  const handleWatchlistToggle = () => {
    if (!id) return;
    toggleWatchlist(id);
    toast({
      title: inWatchlist ? "Removed from watchlist" : "Added to watchlist",
      description: market?.title,
    });
  };

  if (!isLoading && !marketsLoading && !market) {
    return (
      <AppLayout>
        <ErrorState
          title="Market not found"
          description={isError ? "Live markets failed to load." : "The market you're looking for doesn't exist or has been removed."}
          onRetry={() => (isError ? refetch() : navigate('/markets'))}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-10">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/markets')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Markets
        </Button>

        {isLoading || marketsLoading ? (
          <div className="space-y-10">
            <div className="h-24 bg-muted rounded-lg animate-shimmer" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-10">
                <SkeletonCard />
                <SkeletonTable rows={3} />
              </div>
              <SkeletonCard />
            </div>
          </div>
        ) : market && (
          <>
            {/* Header */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold tracking-tight mb-2">
                    {market.title}
                  </h1>
                  {market.description && (
                    <p className="text-muted-foreground">{market.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {market.externalUrl && (
                    <Button
                      variant="outline"
                      asChild
                      className="gap-2 shrink-0"
                    >
                      <a href={market.externalUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="w-4 h-4" />
                        Open on exchange
                      </a>
                    </Button>
                  )}
                  <Button
                    variant={inWatchlist ? "default" : "outline"}
                    onClick={handleWatchlistToggle}
                    className="gap-2 shrink-0"
                  >
                    {inWatchlist ? (
                      <>
                        <Star className="w-4 h-4 fill-current" />
                        Watching
                      </>
                    ) : (
                      <>
                        <StarOff className="w-4 h-4" />
                        Watch
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Badge className={cn("text-xs font-medium", categoryColors[market.category] ?? "bg-muted text-foreground")}>
                  {market.category}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {market.exchange}
                </Badge>
                {market.status === 'closed' && (
                  <Badge variant="secondary" className="text-xs">
                    Closed
                  </Badge>
                )}
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Ends {formatDate(market.endDate)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4" />
                  <span>${formatVolume(market.volume24h)} 24h volume</span>
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Forecast + History */}
              <div className="lg:col-span-2 space-y-10">
                <ForecastPanel market={market} latestForecast={latestForecast} />

                <div>
                  <h3 className="text-lg font-semibold mb-6">Forecast History</h3>
                  <HistoryTable forecasts={marketForecasts} />
                </div>
              </div>

              {/* Right: Evidence */}
              <div>
                <EvidencePanel evidence={marketEvidence} marketId={market.id} />
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
