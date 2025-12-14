import { useNavigate } from 'react-router-dom';
import { Calendar, TrendingUp, Star, StarOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Market } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { cn, formatPercent, formatVolume, formatDate } from '@/lib/utils';

interface MarketCardProps {
  market: Market;
  disableNavigation?: boolean;
}

const categoryColors: Record<string, string> = {
  economy: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  politics: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  weather: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  popculture: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

const exchangeColors: Record<string, string> = {
  Kalshi: 'border-orange-300 text-orange-600 dark:border-orange-700 dark:text-orange-400',
  Metaculus: 'border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400',
  Polymarket: 'border-violet-300 text-violet-600 dark:border-violet-700 dark:text-violet-400',
  Other: 'border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400',
};

export function MarketCard({ market, disableNavigation = false }: MarketCardProps) {
  const navigate = useNavigate();
  const { isInWatchlist, toggleWatchlist } = useApp();
  const inWatchlist = isInWatchlist(market.id);

  const goToMarket = () => {
    if (disableNavigation) return;
    navigate(`/markets/${market.id}`);
  };

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWatchlist(market.id);
  };

  return (
    <Card
      className={cn(
        "p-6 cursor-pointer transition-all duration-200 hover:shadow-card-hover hover:border-primary/20",
        market.status === 'closed' && "opacity-75"
      )}
      onClick={goToMarket}
    >
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-card-foreground line-clamp-2 leading-snug">
            {market.title}
          </h3>
        </div>
        <button
          onClick={handleWatchlistClick}
          className={cn(
            "p-1.5 rounded-md transition-colors shrink-0",
            inWatchlist 
              ? "text-warning hover:text-warning/80" 
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-label={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
        >
          {inWatchlist ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Badge variant="secondary" className={cn("text-xs font-medium", categoryColors[market.category])}>
          {market.category}
        </Badge>
        <Badge variant="outline" className={cn("text-xs", exchangeColors[market.exchange])}>
          {market.exchange}
        </Badge>
        {market.status === 'closed' && (
          <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
            Closed
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formatDate(market.endDate)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>${formatVolume(market.volume24h)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-5 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Market Prob</p>
          <p className="text-2xl font-semibold font-mono tracking-tight">
            {formatPercent(market.marketProb)}
          </p>
        </div>
        <Button 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            goToMarket();
          }}
        >
          Open
        </Button>
      </div>

      {/* Mini sparkline placeholder */}
      <div className="mt-5 h-6 bg-muted/50 rounded flex items-end px-1 gap-px">
        {Array.from({ length: 20 }).map((_, i) => (
          <div 
            key={i} 
            className="flex-1 bg-primary/30 rounded-t"
            style={{ height: `${20 + Math.random() * 80}%` }}
          />
        ))}
      </div>
    </Card>
  );
}
