import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Link2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { parseMarketUrl, findMarketByEvent } from '@/lib/urlParser';
import { useToast } from '@/hooks/use-toast';

export function MarketSearch() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    try {
      const parsed = parseMarketUrl(url);
      
      if (!parsed) {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid Polymarket or Kalshi market URL",
          variant: "destructive",
        });
        return;
      }

      if (parsed.exchange === 'polymarket' && parsed.eventId) {
        // For Polymarket events, search for the market
        toast({
          title: "Searching Polymarket event",
          description: "Finding market in this event...",
        });
        
        const marketId = await findMarketByEvent(parsed.eventId, 'polymarket');
        
        if (marketId) {
          navigate(`/market/${marketId}`);
        } else {
          // If no market found by event, try direct ID navigation
          if (/^\d+$/.test(parsed.eventId)) {
            navigate(`/market/${parsed.eventId}`);
          } else {
            toast({
              title: "Market not found",
              description: "Could not find a market in this event. Try searching directly.",
              variant: "destructive",
            });
          }
        }
      } else if (parsed.exchange === 'kalshi') {
        // For Kalshi markets, check if it's available in our data
        toast({
          title: "Searching Kalshi market",
          description: "Finding market...",
        });
        
        // Use eventId for broader search if available, otherwise use marketId
        const searchId = parsed.eventId || parsed.marketId;
        const marketId = await findMarketByEvent(searchId, 'kalshi');
        
        if (marketId) {
          navigate(`/market/${marketId}`);
        } else {
          toast({
            title: "Market not found",
            description: "This specific market isn't available, but there are other sports markets in the dataset. Try browsing the markets page.",
            variant: "destructive",
          });
        }
      } else if (parsed.marketId) {
        // Direct market navigation
        toast({
          title: "Market URL detected",
          description: "Navigating to market...",
        });
        
        navigate(`/market/${parsed.marketId}`);
      } else if (parsed.eventId && /^\d+$/.test(parsed.eventId)) {
        // Handle case where eventId is actually a market ID
        navigate(`/market/${parsed.eventId}`);
      }
    } catch (error) {
      console.error('Error searching market:', error);
      toast({
        title: "Search failed",
        description: "Could not find the market. Please check the URL.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link2 className="w-4 h-4" />
            <span>Search by Polymarket or Kalshi URL</span>
          </div>
          
          <div className="flex gap-2">
            <Input
              placeholder="https://polymarket.com/event/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={isLoading || !url.trim()}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Search
                </>
              )}
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Examples:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>https://polymarket.com/event/cs2-vit-faze-2025-12-14</li>
              <li>https://kalshi.com/markets/kxsuperliggame/turkish-super-lig-game/kxsuperliggame-25dec14trabes</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
