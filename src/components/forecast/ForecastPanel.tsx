import { useState } from 'react';
import { Zap, TrendingUp, TrendingDown, Minus, AlertCircle, Loader2, ThumbsUp, ThumbsDown, CircleDot } from 'lucide-react';
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
}

const confidenceConfig = {
  low: { label: 'Low Confidence', icon: AlertCircle, color: 'text-warning' },
  med: { label: 'Medium Confidence', icon: Minus, color: 'text-muted-foreground' },
  high: { label: 'High Confidence', icon: Zap, color: 'text-positive' },
};

function getRecommendation(delta: number, confidence: 'low' | 'med' | 'high') {
  const absDelta = Math.abs(delta);
  
  // Threshold for actionable signal
  if (absDelta < 0.02) {
    return {
      action: 'HOLD',
      description: 'Market is fairly priced',
      color: 'bg-muted text-muted-foreground',
      icon: CircleDot,
    };
  }
  
  const strength = confidence === 'high' ? 'Strong' : confidence === 'med' ? 'Moderate' : 'Weak';
  
  if (delta > 0) {
    return {
      action: 'BUY YES',
      description: `${strength} signal: Model sees higher probability`,
      color: 'bg-positive/10 text-positive border border-positive/20',
      icon: ThumbsUp,
    };
  } else {
    return {
      action: 'BUY NO',
      description: `${strength} signal: Model sees lower probability`,
      color: 'bg-negative/10 text-negative border border-negative/20',
      icon: ThumbsDown,
    };
  }
}

export function ForecastPanel({ market, latestForecast }: ForecastPanelProps) {
  const { entitlements, addForecast } = useApp();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const handleRunForecast = async () => {
    if (entitlements.forecastsUsedToday >= entitlements.forecastsLimit) {
      setShowPaywall(true);
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const modelProb = simulateModelProb(market.marketProb);
    const newForecast: ForecastRun = {
      id: generateForecastId(),
      marketId: market.id,
      timestamp: new Date().toISOString(),
      modelProb,
      confidence: getConfidenceLevel(),
      delta: modelProb - market.marketProb,
      summary: `Updated forecast based on latest data analysis. Model sees ${modelProb > market.marketProb ? 'higher' : 'lower'} probability than current market consensus.`,
      tags: getRandomTags(),
    };

    addForecast(newForecast);
    setIsLoading(false);
    
    toast({
      title: "Forecast complete",
      description: `New probability: ${formatPercent(modelProb)}`,
    });
  };

  const conf = latestForecast ? confidenceConfig[latestForecast.confidence] : null;
  const ConfIcon = conf?.icon;
  const recommendation = latestForecast 
    ? getRecommendation(latestForecast.delta, latestForecast.confidence) 
    : null;
  const RecIcon = recommendation?.icon;

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Forecast
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Probability comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Market</p>
              <p className="text-3xl font-bold font-mono">{formatPercent(market.marketProb)}</p>
            </div>
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs text-primary uppercase tracking-wide mb-1">ProbPilot</p>
              <p className="text-3xl font-bold font-mono text-primary">
                {latestForecast ? formatPercent(latestForecast.modelProb) : '—'}
              </p>
            </div>
          </div>

          {/* Delta & Confidence */}
          {latestForecast && (
            <div className="flex items-center gap-3">
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
            <div className={cn("p-4 rounded-lg", recommendation.color)}>
              <div className="flex items-center gap-3">
                <RecIcon className="w-6 h-6" />
                <div>
                  <p className="text-lg font-bold">{recommendation.action}</p>
                  <p className="text-sm opacity-80">{recommendation.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Run button */}
          <Button 
            className="w-full gradient-primary text-primary-foreground"
            onClick={handleRunForecast}
            disabled={isLoading || market.status === 'closed'}
          >
            {isLoading ? (
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
