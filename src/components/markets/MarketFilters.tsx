import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MarketCategory, MarketExchange, MarketStatus } from '@/types';

interface MarketFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: MarketCategory | 'all';
  onCategoryChange: (value: MarketCategory | 'all') => void;
  exchange: MarketExchange | 'all';
  onExchangeChange: (value: MarketExchange | 'all') => void;
  status: MarketStatus | 'all';
  onStatusChange: (value: MarketStatus | 'all') => void;
  sort: 'volume' | 'endDate' | 'bestMatch';
  onSortChange: (value: 'volume' | 'endDate' | 'bestMatch') => void;
  showClosedOnly: boolean;
  onShowClosedOnlyChange: (value: boolean) => void;
}

export function MarketFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  exchange,
  onExchangeChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
  showClosedOnly,
  onShowClosedOnlyChange,
}: MarketFiltersProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search markets..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Category */}
        <Select value={category} onValueChange={(v) => onCategoryChange(v as MarketCategory | 'all')}>
          <SelectTrigger className="w-36 bg-background">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="economy">Economy</SelectItem>
            <SelectItem value="politics">Politics</SelectItem>
            <SelectItem value="weather">Weather</SelectItem>
            <SelectItem value="popculture">Pop Culture</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        {/* Exchange */}
        <Select value={exchange} onValueChange={(v) => onExchangeChange(v as MarketExchange | 'all')}>
          <SelectTrigger className="w-36 bg-background">
            <SelectValue placeholder="Exchange" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="all">All Exchanges</SelectItem>
            <SelectItem value="Kalshi">Kalshi</SelectItem>
            <SelectItem value="Metaculus">Metaculus</SelectItem>
            <SelectItem value="Polymarket">Polymarket</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>

        {/* Status */}
        <Select value={status} onValueChange={(v) => onStatusChange(v as MarketStatus | 'all')}>
          <SelectTrigger className="w-32 bg-background">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sort} onValueChange={(v) => onSortChange(v as 'volume' | 'endDate' | 'bestMatch')}>
          <SelectTrigger className="w-36 bg-background">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="bestMatch">Best Match</SelectItem>
            <SelectItem value="volume">Volume (24h)</SelectItem>
            <SelectItem value="endDate">End Date</SelectItem>
          </SelectContent>
        </Select>

        {/* Show closed only toggle */}
        <div className="flex items-center gap-2 ml-auto">
          <Switch
            id="show-closed"
            checked={showClosedOnly}
            onCheckedChange={onShowClosedOnlyChange}
          />
          <Label htmlFor="show-closed" className="text-sm text-muted-foreground cursor-pointer">
            Closed only
          </Label>
        </div>
      </div>
    </div>
  );
}
