import { useState, useEffect } from 'react';
import { FileSearch, ExternalLink, Loader2, ThumbsUp, ThumbsDown, Minus, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EvidenceItem } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBilling } from '@/contexts/BillingContext';
import { formatDateTime, cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { PaywallModal } from '@/components/modals/PaywallModal';
import { UpgradeButton } from '@/components/billing/UpgradeButton';

interface EvidencePanelProps {
  evidence?: EvidenceItem[];
  marketId: string;
  marketTitle: string;
  onEvidenceChange?: (items: EvidenceItem[]) => void;
}

type TavilySearchResult = {
  title: string;
  url: string;
  content?: string;
  raw_content?: string;
  score?: number;
};

type TavilySearchResponse = {
  answer?: string;
  results?: TavilySearchResult[];
};

const stanceConfig = {
  supports: { label: 'Supports', icon: ThumbsUp, color: 'bg-positive/10 text-positive border-positive/20' },
  weak_supports: { label: 'Weak Supports', icon: ThumbsUp, color: 'bg-positive/5 text-positive border-positive/10' },
  contradicts: { label: 'Contradicts', icon: ThumbsDown, color: 'bg-negative/10 text-negative border-negative/20' },
  weak_contradicts: { label: 'Weak Contradicts', icon: ThumbsDown, color: 'bg-negative/5 text-negative border-negative/10' },
  neutral: { label: 'Neutral', icon: Minus, color: 'bg-muted text-muted-foreground' },
  irrelevant: { label: 'Irrelevant', icon: Minus, color: 'bg-muted text-muted-foreground/80' },
  uncertain: { label: 'Uncertain', icon: HelpCircle, color: 'bg-muted text-muted-foreground/80' },
} as const;

export function EvidencePanel({ evidence, marketId, marketTitle, onEvidenceChange }: EvidencePanelProps) {
  const { entitlements, setEntitlements } = useApp();
  const { evidenceScansRemaining, loaded: billingLoaded } = useBilling();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [items, setItems] = useState<EvidenceItem[]>(evidence || []);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    // Only reset items from evidence prop if we're not in the middle of scanning
    // and the evidence prop has content
    if (!isScanning && evidence && evidence.length > 0) {
      setItems(evidence);
    }
    setError(null);
  }, [evidence, marketId, isScanning]);

  const handleRunEvidence = async () => {
    if (entitlements.evidenceRunsUsedToday >= entitlements.evidenceRunsLimit) {
      setShowPaywall(true);
      return;
    }

    setIsLoading(true);
    setIsScanning(true);
    setError(null);

    try {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to scan evidence.",
          variant: "destructive",
        });
        return;
      }

      const res = await fetch("/api/evidence-scan", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": user.id
        },
        body: JSON.stringify({
          marketId,
          marketTitle,
          query: `${marketTitle} latest update official statement report`,
          max_results: 6,
        }),
      });

      if (res.status === 402) {
        setShowPaywall(true);
        return;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const tavilyItems: EvidenceItem[] = Array.isArray(data.evidence) ? data.evidence : [];

      if (tavilyItems.length === 0) {
        toast({
          title: "No new sources found",
          description: "Try a different search query or check back later.",
        });
        return; // Keep existing items
      }

      console.log('Evidence scan results:', tavilyItems);

      setItems(tavilyItems);
      onEvidenceChange?.(tavilyItems);
      setEntitlements(prev => ({
        ...prev,
        evidenceRunsUsedToday: prev.evidenceRunsUsedToday + 1,
      }));

      toast({
        title: "Evidence scan complete",
        description: `Found ${tavilyItems.length} relevant sources`,
      });
    } catch (err) {
      console.error('Evidence scan error', err);
      setError('Evidence scan failed. Please try again.');
      toast({
        title: "Evidence scan failed",
        description: "There was a problem contacting the evidence search service.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsScanning(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileSearch className="w-5 h-5 text-primary" />
              Evidence
            </CardTitle>
            <Badge variant="outline" className="text-xs font-normal">
              Tavily Evidence Search
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Run button */}
          <Button 
            variant="outline"
            className="w-full"
            onClick={handleRunEvidence}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scanning sources...
              </>
            ) : (
              <>
                <FileSearch className="w-4 h-4 mr-2" />
                Run Evidence Scan
              </>
            )}
          </Button>

          {/* Usage indicator */}
          <div className="text-xs text-muted-foreground text-center">
            {billingLoaded ? (
              evidenceScansRemaining > 0 ? (
                `${evidenceScansRemaining} scans remaining`
              ) : (
                "No scans remaining"
              )
            ) : (
              "Loading..."
            )}
          </div>

          {error && (
            <div className="text-xs text-destructive text-center">
              {error}
            </div>
          )}

          {/* Evidence list */}
          {items.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {items.map((item) => {
                const stance = stanceConfig[item.stance] ?? stanceConfig.neutral;
                const StanceIcon = stance.icon;
                
                return (
                  <div
                    key={item.id}
                    className="p-4 bg-secondary/50 rounded-lg border border-border space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.sourceName}</p>
                      </div>
                      <Badge variant="outline" className={cn("text-xs shrink-0", stance.color)}>
                        <StanceIcon className="w-3 h-3 mr-1" />
                        {stance.label}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.snippet}
                    </p>
                    
                    {item.stanceRationale && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        ({item.stanceConfidence || 0}%) {item.stanceRationale}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Reliability:</span>
                        <Progress value={item.reliability} className="w-16 h-1.5" />
                        <span className="text-xs font-mono">{item.reliability}%</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(item.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <FileSearch className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No evidence scanned yet</p>
              <p className="text-xs mt-1">Run an evidence scan to find sources</p>
            </div>
          )}

          {/* Citations */}
          {items.length > 0 && (
            <div className="pt-6 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground mb-3">Citations</p>
              <div className="flex flex-wrap gap-2">
                {items.slice(0, 6).map((item, i) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    [{i + 1}] {item.sourceName}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <PaywallModal 
        open={showPaywall} 
        onOpenChange={setShowPaywall}
        feature="evidence"
      />
    </>
  );
}
