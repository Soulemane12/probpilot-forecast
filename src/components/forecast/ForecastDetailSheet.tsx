import { X, TrendingUp, TrendingDown, Zap, Clock, Tag } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ForecastRun } from '@/types';
import { formatPercent, formatDelta, formatDateTime, getDeltaBgColor, cn } from '@/lib/utils';
import { evidenceItems } from '@/data/evidence';

interface ForecastDetailSheetProps {
  forecast: ForecastRun | null;
  onClose: () => void;
}

export function ForecastDetailSheet({ forecast, onClose }: ForecastDetailSheetProps) {
  if (!forecast) return null;

  const relatedEvidence = evidenceItems
    .filter(e => e.marketId === forecast.marketId)
    .slice(0, 3);

  return (
    <Sheet open={!!forecast} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Forecast Details
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {formatDateTime(forecast.timestamp)}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Probability Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-secondary rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Market at time</p>
              <p className="text-2xl font-bold font-mono">
                {formatPercent(forecast.modelProb - forecast.delta)}
              </p>
            </div>
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg text-center">
              <p className="text-xs text-primary mb-1">Model Prediction</p>
              <p className="text-2xl font-bold font-mono text-primary">
                {formatPercent(forecast.modelProb)}
              </p>
            </div>
          </div>

          {/* Delta */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">Delta:</span>
            <Badge className={cn("text-sm font-mono", getDeltaBgColor(forecast.delta))}>
              {forecast.delta > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : 
               forecast.delta < 0 ? <TrendingDown className="w-3 h-3 mr-1" /> : null}
              {formatDelta(forecast.delta)}
            </Badge>
          </div>

          <Separator />

          {/* Summary */}
          <div>
            <h4 className="text-sm font-medium mb-2">Analysis Summary</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {forecast.summary}
            </p>
          </div>

          {/* Tags */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {forecast.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Confidence */}
          <div>
            <h4 className="text-sm font-medium mb-2">Confidence Level</h4>
            <Badge 
              variant="outline" 
              className={cn(
                "capitalize",
                forecast.confidence === 'high' && "border-positive text-positive",
                forecast.confidence === 'low' && "border-warning text-warning"
              )}
            >
              {forecast.confidence} confidence
            </Badge>
          </div>

          <Separator />

          {/* Evidence Snapshot */}
          <div>
            <h4 className="text-sm font-medium mb-3">Evidence Snapshot</h4>
            {relatedEvidence.length > 0 ? (
              <div className="space-y-2">
                {relatedEvidence.map((item) => (
                  <div 
                    key={item.id}
                    className="p-3 bg-muted/50 rounded-lg"
                  >
                    <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.sourceName}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No evidence collected at this time</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
