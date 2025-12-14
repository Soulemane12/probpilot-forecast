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
import { EvidenceItem, ForecastRun } from '@/types';
import { createId } from '@/lib/utils';

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
  const { getForecastsByMarket, isInWatchlist, toggleWatchlist, addForecast } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [isForecasting, setIsForecasting] = useState(false);
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

  const handleRunForecast = async () => {
    if (!market || !id) return;

    setIsForecasting(true);
    try {
      // First, run evidence scan if no evidence exists
      if (evidenceItems.length === 0) {
        toast({
          title: "Scanning evidence first",
          description: "Gathering and analyzing sources...",
        });

        const evidenceRes = await fetch("/api/evidence-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            marketId: id,
            marketTitle: market.title,
          }),
        });

        if (!evidenceRes.ok) throw new Error(`Evidence scan failed: ${evidenceRes.status}`);

        const evidenceData = await evidenceRes.json();
        setEvidenceItems(evidenceData.evidence);
      }

      // Now run forecast
      toast({
        title: "Generating forecast",
        description: "Analyzing evidence and market data...",
      });

      const res = await fetch("/api/forecast-groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId: id,
          marketTitle: market.title,
          marketProb: market.yesMid || 0.5,
          spread: market.spread || undefined,
          evidence: evidenceItems,
          delta24h: market.delta24h || 0,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const forecast: ForecastRun = await res.json();
      
      // Add forecast to app context
      addForecast({
        id: createId(),
        marketId: id,
        marketTitle: forecast.marketTitle,
        timestamp: forecast.timestamp,
        marketProb: forecast.marketProb,
        modelProb: forecast.modelProb,
        delta: forecast.delta,
        confidence: (forecast.confidence as any) || 'low',
        confidenceScore: forecast.confidenceScore,
        signal: forecast.signal,
        summary: forecast.summary,
        tags: [], // Empty tags for now
        overallConfidence: (forecast as any).overallConfidence,
        notes: (forecast as any).notes,
        rationale: (forecast as any).rationale,
        topDrivers: (forecast as any).topDrivers,
      });

      toast({
        title: "Forecast complete",
        description: `Model probability: ${(forecast.modelProb * 100).toFixed(1)}%`,
      });
    } catch (err) {
      console.error('Forecast error', err);
      toast({
        title: "Forecast failed",
        description: "There was a problem generating the forecast.",
        variant: "destructive",
      });
    } finally {
      setIsForecasting(false);
    }
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
                <ForecastPanel 
                  market={market} 
                  latestForecast={latestForecast} 
                  onRunForecast={handleRunForecast}
                  isForecasting={isForecasting}
                />

                <div>
                  <h3 className="text-lg font-semibold mb-6">Forecast History</h3>
                  <HistoryTable forecasts={marketForecasts} />
                </div>
              </div>

              {/* Right: Evidence */}
              <div>
                <EvidencePanel 
                  evidence={marketEvidence} 
                  marketId={market.id} 
                  marketTitle={market.title}
                  onEvidenceChange={setEvidenceItems}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
