import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { MarketCard } from '@/components/markets/MarketCard';
import { MarketFilters } from '@/components/markets/MarketFilters';
import { MarketSearch } from '@/components/markets/MarketSearch';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { useLiveMarkets } from '@/hooks/useLiveMarkets';
import { MarketCategory, MarketExchange, MarketStatus } from '@/types';

const ITEMS_PER_PAGE = 9;
const ALLOWED_EXCHANGES: MarketExchange[] = ['Kalshi', 'Polymarket'];

export default function Markets() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<MarketCategory | 'all'>('all');
  const [exchange, setExchange] = useState<MarketExchange | 'all'>('all');
  const [status, setStatus] = useState<MarketStatus | 'all'>('all');
  const [sort, setSort] = useState<'volume' | 'endDate' | 'bestMatch'>('bestMatch');
  const [showClosedOnly, setShowClosedOnly] = useState(false);
  const [page, setPage] = useState(1);

  const {
    markets,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useLiveMarkets();

  const baseMarkets = useMemo(
    () => markets.filter(m => ALLOWED_EXCHANGES.includes(m.exchange)),
    [markets]
  );

  const filteredMarkets = useMemo(() => {
    let result = [...baseMarkets];

    // Search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(m => 
        m.title.toLowerCase().includes(searchLower) ||
        m.category.toLowerCase().includes(searchLower)
      );
    }

    // Category
    if (category !== 'all') {
      result = result.filter(m => m.category === category);
    }

    // Exchange
    if (exchange !== 'all') {
      result = result.filter(m => m.exchange === exchange);
    }

    // Status
    if (status !== 'all') {
      result = result.filter(m => m.status === status);
    }

    // Show closed only
    if (showClosedOnly) {
      result = result.filter(m => m.status === 'closed');
    }

    // Sort
    switch (sort) {
      case 'volume':
        result.sort((a, b) => b.volume24h - a.volume24h);
        break;
      case 'endDate':
        result.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
        break;
      case 'bestMatch':
      default:
        // Open markets first, then by volume
        result.sort((a, b) => {
          if (a.status !== b.status) return a.status === 'open' ? -1 : 1;
          return b.volume24h - a.volume24h;
        });
    }

    return result;
  }, [baseMarkets, search, category, exchange, status, sort, showClosedOnly]);

  const totalPages = Math.ceil(filteredMarkets.length / ITEMS_PER_PAGE);
  const paginatedMarkets = filteredMarkets.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, category, exchange, status, sort, showClosedOnly, baseMarkets]);

  return (
    <AppLayout>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Markets
          </h1>
          <p className="text-muted-foreground">
            Browse and forecast on prediction markets
          </p>
        </div>

        {/* URL Search */}
        <MarketSearch />

        {/* Filters */}
        <MarketFilters
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
          exchange={exchange}
          onExchangeChange={setExchange}
          status={status}
          onStatusChange={setStatus}
          sort={sort}
          onSortChange={setSort}
          showClosedOnly={showClosedOnly}
          onShowClosedOnlyChange={setShowClosedOnly}
        />

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredMarkets.length} market{filteredMarkets.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Grid */}
        {isError && filteredMarkets.length === 0 ? (
          <ErrorState
            title="Couldn't load markets"
            description="Live markets failed to load. Please try again."
            onRetry={() => refetch()}
          />
        ) : (isLoading || isFetching) && filteredMarkets.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : paginatedMarkets.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedMarkets.map((market) => (
                <MarketCard key={market.id} market={market} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <Button
                      key={i}
                      variant={page === i + 1 ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setPage(i + 1)}
                      className="w-8 h-8 p-0"
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={TrendingUp}
            title="No markets found"
            description="Try adjusting your filters or search query to find what you're looking for."
            action={{
              label: "Clear filters",
              onClick: () => {
                setSearch('');
                setCategory('all');
                setExchange('all');
                setStatus('all');
                setShowClosedOnly(false);
              }
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}
