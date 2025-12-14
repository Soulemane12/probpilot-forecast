import { useState } from 'react';
import { Zap, TrendingUp, TrendingDown, Minus, AlertCircle, Loader2, ThumbsUp, ThumbsDown, CircleDot, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Market, ForecastRun } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { 
  formatPercent, 
  formatDelta, 
  getDeltaBgColor,
  generateForecastId,
  simulateModelProb,
  getConfidenceLevel,
  getRandomTags,
  cn
} from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { PaywallModal } from '@/components/modals/PaywallModal';

interface ForecastPanelProps {
  market: Market;
  latestForecast?: ForecastRun;
  onRunForecast?: () => void;
  isForecasting?: boolean;
}

const confidenceConfig = {
  low: { label: 'Low Confidence', icon: AlertCircle, color: 'text-warning' },
  med: { label: 'Medium Confidence', icon: Minus, color: 'text-muted-foreground' },
  high: { label: 'High Confidence', icon: Zap, color: 'text-positive' },
};

function getRecommendation(modelProb: number, marketProb: number, confidence: 'low' | 'med' | 'high') {
  // Confidence-dependent thresholds and shrinkage weights
  const thresholds = { high: 0.03, med: 0.06, low: 0.10 };
  const weights = { high: 1.0, med: 0.7, low: 0.4 };
  
  const threshold = thresholds[confidence];
  const w = weights[confidence];
  
  // Shrink model toward market based on confidence
  const qAdj = marketProb + w * (modelProb - marketProb);
  const edge = qAdj - marketProb; // in probability points
  const rawEdge = modelProb - marketProb;
  
  // Relative edge for display
  const relativeEdge = marketProb > 0 ? rawEdge / marketProb : 0;
  const edgePP = (rawEdge * 100).toFixed(1); // percentage points
  const edgeMultiple = relativeEdge.toFixed(2);
  
  const detail = `${rawEdge >= 0 ? '+' : ''}${edgePP}pp (${edgeMultiple}×)`;
  
  if (edge >= threshold) {
    return {
      action: 'BUY YES',
      description: `Model sees ${(modelProb * 100).toFixed(0)}% vs market ${(marketProb * 100).toFixed(0)}%`,
      detail,
      color: 'bg-positive/10 text-positive border border-positive/20',
      icon: ThumbsUp,
    };
  } else if (edge <= -threshold) {
    return {
      action: 'BUY NO',
      description: `Model sees ${(modelProb * 100).toFixed(0)}% vs market ${(marketProb * 100).toFixed(0)}%`,
      detail,
      color: 'bg-negative/10 text-negative border border-negative/20',
      icon: ThumbsDown,
    };
  } else {
    return {
      action: 'HOLD',
      description: `Edge too small for ${confidence} confidence`,
      detail,
      color: 'bg-muted text-muted-foreground',
      icon: CircleDot,
    };
  }
}

export function ForecastPanel({ market, latestForecast, onRunForecast, isForecasting }: ForecastPanelProps) {
  const { entitlements } = useApp();
  const { toast } = useToast();
  const [showPaywall, setShowPaywall] = useState(false);

  const conf = latestForecast ? confidenceConfig[latestForecast.confidence] : null;
  const ConfIcon = conf?.icon;
  const recommendation = latestForecast 
    ? getRecommendation(latestForecast.modelProb, latestForecast.marketProb, latestForecast.confidence) 
    : null;
  const RecIcon = recommendation?.icon;

  return (
    <>
      <Card>
        <CardHeader className="pb-6">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Forecast
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Probability comparison */}
          <div className="grid grid-cols-2 gap-6">
            <div className="p-5 bg-secondary rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Market</p>
              <p className="text-3xl font-bold font-mono">{formatPercent(market.yesMid || market.yesBid)}</p>
            </div>
            <div className="p-5 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs text-primary uppercase tracking-wide mb-2">ProbPilot</p>
              <p className="text-3xl font-bold font-mono text-primary">
                {latestForecast ? formatPercent(latestForecast.modelProb) : '—'}
              </p>
            </div>
          </div>

          {/* Delta & Confidence */}
          {latestForecast && (
            <div className="flex items-center gap-4">
              <Badge className={cn("text-sm font-mono", getDeltaBgColor(latestForecast.delta))}>
                {latestForecast.delta > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : 
                 latestForecast.delta < 0 ? <TrendingDown className="w-3 h-3 mr-1" /> : null}
                {formatDelta(latestForecast.delta)}
              </Badge>
              
              {conf && ConfIcon && (
                <div className={cn("flex items-center gap-1.5 text-sm", conf.color)}>
                  <ConfIcon className="w-4 h-4" />
                  <span>{conf.label}</span>
                </div>
              )}
            </div>
          )}

          {/* Trading Recommendation */}
          {recommendation && RecIcon && (
            <div className={cn("p-5 rounded-lg", recommendation.color)}>
              <div className="flex items-center gap-4">
                <RecIcon className="w-6 h-6" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold">{recommendation.action}</p>
                    <span className="text-xs font-mono opacity-70">{recommendation.detail}</span>
                  </div>
                  <p className="text-sm opacity-80">{recommendation.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Run button */}
          <Button 
            className="w-full gradient-primary text-primary-foreground"
            onClick={onRunForecast}
            disabled={isForecasting || market.status === 'closed'}
          >
            {isForecasting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Forecast...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Run Forecast
              </>
            )}
          </Button>

          {/* Usage indicator */}
          <div className="text-xs text-muted-foreground text-center">
            {entitlements.forecastsUsedToday} / {entitlements.forecastsLimit} forecasts used today
          </div>

          {latestForecast?.rationale && (
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="text-xs uppercase text-muted-foreground mb-1">Rationale</div>
              <p className="text-sm text-foreground">{latestForecast.rationale}</p>
            </div>
          )}

          {/* Drivers & notes */}
          {latestForecast?.topDrivers && latestForecast.topDrivers.length > 0 && (
            <div className="p-4 rounded-lg bg-secondary/70 border border-border space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="w-4 h-4 text-primary" />
                Top drivers
              </div>
              <div className="space-y-2">
                {latestForecast.topDrivers.map((d) => (
                  <div key={d.id} className="flex items-start justify-between gap-2 text-xs">
                    <div className="flex-1">
                      <p className="font-medium">{d.reason || 'Driver'}</p>
                      <p className="text-muted-foreground">
                        {d.stance ? `${d.stance} · ` : ''}
                        {d.weight != null ? `weight ${d.weight}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {latestForecast.notes && (
                <p className="text-xs text-muted-foreground">Notes: {latestForecast.notes}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <PaywallModal 
        open={showPaywall} 
        onOpenChange={setShowPaywall}
        feature="forecasts"
      />
    </>
  );
}
