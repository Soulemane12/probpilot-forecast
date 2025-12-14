import { useState } from 'react';
import { FileSearch, ExternalLink, Loader2, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EvidenceItem } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { formatDateTime, cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { PaywallModal } from '@/components/modals/PaywallModal';

interface EvidencePanelProps {
  evidence: EvidenceItem[];
  marketId: string;
}

const stanceConfig = {
  supports: { label: 'Supports', icon: ThumbsUp, color: 'bg-positive/10 text-positive border-positive/20' },
  contradicts: { label: 'Contradicts', icon: ThumbsDown, color: 'bg-negative/10 text-negative border-negative/20' },
  neutral: { label: 'Neutral', icon: Minus, color: 'bg-muted text-muted-foreground' },
};

export function EvidencePanel({ evidence, marketId }: EvidencePanelProps) {
  const { entitlements, setEntitlements } = useApp();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const handleRunEvidence = async () => {
    if (entitlements.evidenceRunsUsedToday >= entitlements.evidenceRunsLimit) {
      setShowPaywall(true);
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setEntitlements(prev => ({
      ...prev,
      evidenceRunsUsedToday: prev.evidenceRunsUsedToday + 1
    }));
    
    setIsLoading(false);
    toast({
      title: "Evidence scan complete",
      description: `Found ${evidence.length} relevant sources`,
    });
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
              VERS Evidence Agent
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
            {entitlements.evidenceRunsUsedToday} / {entitlements.evidenceRunsLimit} scans used today
          </div>

          {/* Evidence list */}
          {evidence.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {evidence.map((item) => {
                const stance = stanceConfig[item.stance];
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
          {evidence.length > 0 && (
            <div className="pt-6 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground mb-3">Citations</p>
              <div className="flex flex-wrap gap-2">
                {evidence.slice(0, 6).map((item, i) => (
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
