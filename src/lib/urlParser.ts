/**
 * Parse market URLs to extract market IDs
 */

export interface ParsedMarketUrl {
  exchange: 'polymarket' | 'kalshi';
  marketId: string;
  eventId?: string;
}

export function parseMarketUrl(url: string): ParsedMarketUrl | null {
  try {
    const normalizedUrl = url.toLowerCase().trim();
    
    // Polymarket URLs
    if (normalizedUrl.includes('polymarket.com')) {
      // Event URL: https://polymarket.com/event/cs2-vit-faze-2025-12-14
      const eventMatch = normalizedUrl.match(/polymarket\.com\/event\/([^\/\?]+)/);
      if (eventMatch) {
        return {
          exchange: 'polymarket',
          eventId: eventMatch[1],
          marketId: '', // Will need to fetch markets to find the right one
        };
      }
      
      // Market URL: https://polymarket.com/market/123456789
      const marketMatch = normalizedUrl.match(/polymarket\.com\/market\/([^\/\?]+)/);
      if (marketMatch) {
        return {
          exchange: 'polymarket',
          marketId: marketMatch[1],
        };
      }
    }
    
    // Kalshi URLs
    if (normalizedUrl.includes('kalshi.com')) {
      // Market URL: https://kalshi.com/markets/kxsuperliggame/turkish-super-lig-game/kxsuperliggame-25dec14trabes
      // or: https://kalshi.com/markets/kxmjschedule/mj-schedule/kxmjschedule
      // or: https://kalshi.com/markets/kxbundesligagame/bundesliga-game?utm_source=kalshiweb_eventpage
      // or: https://kalshi.com/markets/kxnbagame/professional-basketball-game?utm_source=kalshiweb_eventpage
      
      // Extract the series ticker (first path after /markets/)
      const seriesMatch = normalizedUrl.match(/kalshi\.com\/markets\/([^\/]+)/);
      // Also extract the market slug (last path before query)
      const marketMatch = normalizedUrl.match(/kalshi\.com\/markets\/.+\/([^\/\?]+)(?:\?|$)/);
      
      if (seriesMatch && marketMatch) {
        return {
          exchange: 'kalshi',
          marketId: marketMatch[1],
          eventId: seriesMatch[1], // Use series ticker for broader search
        };
      } else if (marketMatch) {
        return {
          exchange: 'kalshi',
          marketId: marketMatch[1],
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing market URL:', error);
    return null;
  }
}

export function getPolymarketEventUrl(eventId: string): string {
  return `https://polymarket.com/event/${eventId}`;
}

export function getKalshiMarketUrl(marketTicker: string): string {
  return `https://kalshi.com/markets/${marketTicker}`;
}

/**
 * Find a market by event slug or ticker using existing market data
 */
export async function findMarketByEvent(eventId: string, exchange: 'polymarket' | 'kalshi'): Promise<string | null> {
  try {
    if (exchange === 'polymarket') {
      // Import and use the existing market fetch function
      const { fetchPolymarketMarkets } = await import('./marketSources');
      const markets = await fetchPolymarketMarkets({ maxMarkets: 200 });
      
      const market = markets.find((m: any) => 
        m.id === eventId || // Direct ID match
        m.question?.toLowerCase().includes(eventId.replace(/-/g, ' ')) ||
        m.question?.toLowerCase().includes(eventId) ||
        m.slug?.toLowerCase().includes(eventId.replace(/-/g, ' ')) ||
        m.slug?.toLowerCase().includes(eventId) ||
        eventId.includes(m.id) // Event ID contains market ID
      );
      
      return market?.id || null;
    }
    
    if (exchange === 'kalshi') {
      const { fetchKalshiMarkets } = await import('./marketSources');
      const markets = await fetchKalshiMarkets({ maxMarkets: 200 });
      
      // Try multiple search strategies for Kalshi markets
      const market = markets.find((m: any) => {
        const ticker = (m.ticker || '').toLowerCase();
        const title = (m.title || '').toLowerCase();
        const eventTicker = (m.event_ticker || '').toLowerCase();
        const seriesTicker = (m.series_ticker || '').toLowerCase();
        
        const searchId = eventId.toLowerCase();
        const searchIdSpaces = searchId.replace(/-/g, ' ');
        
        return (
          m.id === searchId || // Direct ticker match
          ticker === searchId || // Ticker match
          ticker.includes(searchId) || // Ticker contains search
          searchId.includes(ticker) || // Search contains ticker
          title.includes(searchIdSpaces) || // Title contains search term
          title.includes(searchId) || // Title contains search
          eventTicker.includes(searchId) || // Event ticker contains search
          seriesTicker.includes(searchId) // Series ticker contains search
        );
      });
      
      return market?.id || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error finding market by event:', error);
    return null;
  }
}
