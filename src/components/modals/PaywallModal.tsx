import { Sparkles, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: 'forecasts' | 'evidence' | 'exports' | 'alerts';
}

const featureMessages = {
  forecasts: {
    title: "You've reached your forecast limit",
    description: "Upgrade to Pro for more daily forecasts and unlock advanced features.",
  },
  evidence: {
    title: "You've reached your evidence scan limit",
    description: "Upgrade to Pro for more daily evidence scans and comprehensive source analysis.",
  },
  exports: {
    title: "Export is a Pro feature",
    description: "Upgrade to Pro to export your forecasts and analysis data.",
  },
  alerts: {
    title: "Alerts are a Pro feature",
    description: "Upgrade to Pro to receive real-time alerts when markets move.",
  },
};

const proFeatures = [
  "50 forecasts per day",
  "25 evidence scans per day",
  "Export to CSV/JSON",
  "Real-time alerts",
  "Priority support",
];

export function PaywallModal({ open, onOpenChange, feature }: PaywallModalProps) {
  const navigate = useNavigate();
  const message = featureMessages[feature];

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/settings');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center">{message.title}</DialogTitle>
          <DialogDescription className="text-center">
            {message.description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          {proFeatures.map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-positive/10 flex items-center justify-center">
                <Check className="w-3 h-3 text-positive" />
              </div>
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Maybe later
          </Button>
          <Button className="flex-1 gradient-primary text-primary-foreground" onClick={handleUpgrade}>
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade to Pro
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
