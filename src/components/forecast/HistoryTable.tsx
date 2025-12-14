import { useState } from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ForecastRun } from '@/types';
import { formatPercent, formatDelta, formatDateTime, getDeltaBgColor, cn } from '@/lib/utils';
import { ForecastDetailSheet } from './ForecastDetailSheet';

interface HistoryTableProps {
  forecasts: ForecastRun[];
}

const confidenceBadges = {
  low: 'bg-warning/10 text-warning',
  med: 'bg-muted text-muted-foreground',
  high: 'bg-positive/10 text-positive',
};

export function HistoryTable({ forecasts }: HistoryTableProps) {
  const [selectedForecast, setSelectedForecast] = useState<ForecastRun | null>(null);

  if (forecasts.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground border border-dashed border-border rounded-lg">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No forecast history yet</p>
        <p className="text-xs">Run a forecast to see it here</p>
      </div>
    );
  }

  return (
    <>
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs">Timestamp</TableHead>
              <TableHead className="text-xs text-right">Market</TableHead>
              <TableHead className="text-xs text-right">Model</TableHead>
              <TableHead className="text-xs text-right">Delta</TableHead>
              <TableHead className="text-xs">Confidence</TableHead>
              <TableHead className="text-xs">Tags</TableHead>
              <TableHead className="w-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {forecasts.map((forecast) => (
              <TableRow 
                key={forecast.id}
                className="cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setSelectedForecast(forecast)}
              >
                <TableCell className="text-xs text-muted-foreground">
                  {formatDateTime(forecast.timestamp)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatPercent(forecast.modelProb - forecast.delta)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm font-medium">
                  {formatPercent(forecast.modelProb)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge className={cn("font-mono text-xs", getDeltaBgColor(forecast.delta))}>
                    {formatDelta(forecast.delta)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={cn("text-xs capitalize", confidenceBadges[forecast.confidence])}>
                    {forecast.confidence}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {forecast.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {forecast.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{forecast.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ForecastDetailSheet 
        forecast={selectedForecast}
        onClose={() => setSelectedForecast(null)}
      />
    </>
  );
}
