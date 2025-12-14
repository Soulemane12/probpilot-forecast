import { useState, useEffect, useMemo } from 'react';
import { BarChart3, Target, TrendingUp, TrendingDown, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AppLayout } from '@/components/layout/AppLayout';
import { SkeletonKPI, SkeletonTable } from '@/components/ui/skeleton-card';
import { useApp } from '@/contexts/AppContext';
import { markets } from '@/data/markets';
import { formatPercent, formatDelta, getDeltaBgColor, cn } from '@/lib/utils';

export default function Performance() {
  const { forecasts } = useApp();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Mock performance metrics
  const metrics = useMemo(() => {
    const brierScore = 0.178;
    const calibrationGrade = 'B+';
    const totalForecasts = forecasts.length;
    const hitRate = 0.723;

    return { brierScore, calibrationGrade, totalForecasts, hitRate };
  }, [forecasts]);

  // Most improved (biggest positive delta)
  const mostImproved = useMemo(() => {
    return [...forecasts]
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .filter(f => f.delta > 0)
      .slice(0, 5)
      .map(f => ({
        ...f,
        market: markets.find(m => m.id === f.marketId)
      }));
  }, [forecasts]);

  // Worst misses (biggest negative delta)
  const worstMisses = useMemo(() => {
    return [...forecasts]
      .sort((a, b) => a.delta - b.delta)
      .filter(f => f.delta < 0)
      .slice(0, 5)
      .map(f => ({
        ...f,
        market: markets.find(m => m.id === f.marketId)
      }));
  }, [forecasts]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Performance
          </h1>
          <p className="text-muted-foreground">
            Track your forecasting accuracy and calibration
          </p>
        </div>

        {/* KPI Cards */}
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
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Brier Score</p>
                    <p className="text-2xl font-bold font-mono">{metrics.brierScore.toFixed(3)}</p>
                    <p className="text-xs text-positive">Lower is better</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-positive/10 flex items-center justify-center">
                    <Award className="w-5 h-5 text-positive" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Calibration Grade</p>
                    <p className="text-2xl font-bold">{metrics.calibrationGrade}</p>
                    <p className="text-xs text-muted-foreground">Well calibrated</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Forecasts</p>
                    <p className="text-2xl font-bold font-mono">{metrics.totalForecasts}</p>
                    <p className="text-xs text-muted-foreground">All time</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-positive/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-positive" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Hit Rate</p>
                    <p className="text-2xl font-bold font-mono">{formatPercent(metrics.hitRate)}</p>
                    <p className="text-xs text-muted-foreground">Correct direction</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Calibration Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Calibration Chart</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 bg-muted rounded animate-shimmer" />
            ) : (
              <div className="h-64 bg-muted/30 rounded-lg border border-dashed border-border flex items-center justify-center relative">
                {/* Axes labels */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground">
                  Actual Frequency
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
                  Predicted Probability
                </div>
                
                {/* Mock calibration line */}
                <svg className="w-48 h-48" viewBox="0 0 100 100">
                  {/* Perfect calibration line */}
                  <line x1="0" y1="100" x2="100" y2="0" stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeDasharray="4" />
                  
                  {/* Model calibration curve */}
                  <path 
                    d="M 0,95 Q 25,72 50,48 T 100,8" 
                    fill="none" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth="2"
                  />
                  
                  {/* Points */}
                  {[[10, 88], [25, 70], [40, 55], [55, 42], [70, 28], [85, 15], [95, 8]].map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="3" fill="hsl(var(--primary))" />
                  ))}
                </svg>
                
                <div className="absolute top-4 right-4 flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 bg-muted-foreground" style={{ borderStyle: 'dashed' }} />
                    <span className="text-muted-foreground">Perfect</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 bg-primary" />
                    <span>Your model</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most Improved */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-positive" />
                Most Improved
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <SkeletonTable rows={5} />
              ) : mostImproved.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Market</TableHead>
                      <TableHead className="text-xs text-right">Model</TableHead>
                      <TableHead className="text-xs text-right">Delta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mostImproved.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm font-medium truncate max-w-[200px]">
                          {item.market?.title || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatPercent(item.modelProb)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className={cn("text-xs font-mono", getDeltaBgColor(item.delta))}>
                            {formatDelta(item.delta)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No data yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Worst Misses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-negative" />
                Worst Misses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <SkeletonTable rows={5} />
              ) : worstMisses.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Market</TableHead>
                      <TableHead className="text-xs text-right">Model</TableHead>
                      <TableHead className="text-xs text-right">Delta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {worstMisses.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm font-medium truncate max-w-[200px]">
                          {item.market?.title || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatPercent(item.modelProb)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className={cn("text-xs font-mono", getDeltaBgColor(item.delta))}>
                            {formatDelta(item.delta)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No data yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
