import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Zap, FileSearch, ArrowRight, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { MarketCard } from '@/components/markets/MarketCard';
import { SkeletonCard, SkeletonKPI } from '@/components/ui/skeleton-card';
import { useApp } from '@/contexts/AppContext';
import { markets } from '@/data/markets';
import { formatPercent, formatDelta, formatDateTime, getDeltaBgColor, cn } from '@/lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const { entitlements, forecasts } = useApp();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const trendingMarkets = markets
    .filter(m => m.status === 'open')
    .sort((a, b) => b.volume24h - a.volume24h)
    .slice(0, 3);

  const recentForecasts = forecasts.slice(0, 5);

  const forecastUsagePercent = (entitlements.forecastsUsedToday / entitlements.forecastsLimit) * 100;
  const evidenceUsagePercent = (entitlements.evidenceRunsUsedToday / entitlements.evidenceRunsLimit) * 100;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Your forecasting overview</p>
          </div>
          <Badge variant="outline" className="text-sm">
            {entitlements.plan} Plan
          </Badge>
        </div>

        {/* Entitlements */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonKPI key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Forecasts Today</p>
                    <p className="text-xl font-bold font-mono">
                      {entitlements.forecastsUsedToday}/{entitlements.forecastsLimit}
                    </p>
                  </div>
                </div>
                <Progress value={forecastUsagePercent} className="h-1.5" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileSearch className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Evidence Scans</p>
                    <p className="text-xl font-bold font-mono">
                      {entitlements.evidenceRunsUsedToday}/{entitlements.evidenceRunsLimit}
                    </p>
                  </div>
                </div>
                <Progress value={evidenceUsagePercent} className="h-1.5" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-positive/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-positive" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Forecasts</p>
                    <p className="text-xl font-bold font-mono">{forecasts.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Open Markets</p>
                    <p className="text-xl font-bold font-mono">
                      {markets.filter(m => m.status === 'open').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trending Markets */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Flame className="w-5 h-5 text-warning" />
                Trending Markets
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/markets')}>
                View all
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trendingMarkets.map((market) => (
                  <MarketCard key={market.id} market={market} />
                ))}
              </div>
            )}
          </div>

          {/* Recent Forecasts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Recent Forecasts
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/performance')}>
                View all
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-12 bg-muted rounded animate-shimmer" />
                    ))}
                  </div>
                ) : recentForecasts.length > 0 ? (
                  <div className="divide-y divide-border">
                    {recentForecasts.map((forecast) => {
                      const market = markets.find(m => m.id === forecast.marketId);
                      return (
                        <div 
                          key={forecast.id}
                          className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => navigate(`/markets/${forecast.marketId}`)}
                        >
                          <p className="text-sm font-medium line-clamp-1 mb-1">
                            {market?.title || 'Unknown Market'}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(forecast.timestamp)}
                            </span>
                            <Badge className={cn("text-xs font-mono", getDeltaBgColor(forecast.delta))}>
                              {formatDelta(forecast.delta)}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No forecasts yet</p>
                    <p className="text-xs">Run your first forecast from a market</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
