import { useState, useEffect } from 'react';
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
import { markets } from '@/data/markets';
import { evidenceItems } from '@/data/evidence';
import { formatDate, formatVolume, cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [id]);

  const market = markets.find(m => m.id === id);
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

  if (!isLoading && !market) {
    return (
      <AppLayout>
        <ErrorState
          title="Market not found"
          description="The market you're looking for doesn't exist or has been removed."
          onRetry={() => navigate('/markets')}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
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

        {isLoading ? (
          <div className="space-y-6">
            <div className="h-24 bg-muted rounded-lg animate-shimmer" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
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
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold tracking-tight mb-2">
                    {market.title}
                  </h1>
                  {market.description && (
                    <p className="text-muted-foreground">{market.description}</p>
                  )}
                </div>
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

              <div className="flex flex-wrap items-center gap-3">
                <Badge className={cn("text-xs font-medium", categoryColors[market.category])}>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Forecast + History */}
              <div className="lg:col-span-2 space-y-6">
                <ForecastPanel market={market} latestForecast={latestForecast} />
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Forecast History</h3>
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
