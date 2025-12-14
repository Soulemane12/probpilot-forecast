import { useState } from 'react';
import { Settings as SettingsIcon, CreditCard, Bell, Download, Check, Sparkles, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { AppLayout } from '@/components/layout/AppLayout';
import { useApp } from '@/contexts/AppContext';
import { proEntitlements, teamEntitlements } from '@/data/entitlements';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const plans = [
  {
    id: 'Free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      '5 forecasts per day',
      '3 evidence scans per day',
      'Basic market data',
      'Community support',
    ],
    notIncluded: ['Export to CSV/JSON', 'Real-time alerts', 'Priority support'],
  },
  {
    id: 'Pro',
    name: 'Pro',
    price: '$29',
    period: '/month',
    popular: true,
    features: [
      '50 forecasts per day',
      '25 evidence scans per day',
      'Full market data access',
      'Export to CSV/JSON',
      'Real-time alerts',
      'Priority email support',
    ],
    notIncluded: [],
  },
  {
    id: 'Team',
    name: 'Team',
    price: '$99',
    period: '/month',
    features: [
      'Unlimited forecasts',
      'Unlimited evidence scans',
      'Full market data access',
      'Export to CSV/JSON',
      'Real-time alerts',
      'Team collaboration',
      'API access',
      'Dedicated support',
    ],
    notIncluded: [],
  },
];

export default function Settings() {
  const { entitlements, setEntitlements } = useApp();
  const { toast } = useToast();
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const forecastUsagePercent = (entitlements.forecastsUsedToday / entitlements.forecastsLimit) * 100;
  const evidenceUsagePercent = (entitlements.evidenceRunsUsedToday / entitlements.evidenceRunsLimit) * 100;

  const handleUpgrade = (planId: string) => {
    setSelectedPlan(planId);
    setShowCheckout(true);
  };

  const handleCheckoutComplete = () => {
    if (selectedPlan === 'Pro') {
      setEntitlements(proEntitlements);
    } else if (selectedPlan === 'Team') {
      setEntitlements(teamEntitlements);
    }
    setShowCheckout(false);
    toast({
      title: "Upgrade successful!",
      description: `You're now on the ${selectedPlan} plan.`,
    });
  };

  const handleToggleAlerts = (enabled: boolean) => {
    if (!entitlements.alertsEnabled && enabled) {
      toast({
        title: "Alerts require Pro",
        description: "Upgrade to Pro to enable real-time alerts.",
        variant: "destructive",
      });
      return;
    }
  };

  const handleToggleExports = () => {
    if (!entitlements.exportsEnabled) {
      toast({
        title: "Exports require Pro",
        description: "Upgrade to Pro to export your data.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-6 h-6" />
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account and billing
          </p>
        </div>

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                DU
              </div>
              <div>
                <p className="font-medium">Demo User</p>
                <p className="text-sm text-muted-foreground">demo@probpilot.ai</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Usage</CardTitle>
            <CardDescription>Your current usage for today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Forecasts</span>
                <span className="font-mono">
                  {entitlements.forecastsUsedToday} / {entitlements.forecastsLimit}
                </span>
              </div>
              <Progress value={forecastUsagePercent} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Evidence Scans</span>
                <span className="font-mono">
                  {entitlements.evidenceRunsUsedToday} / {entitlements.evidenceRunsLimit}
                </span>
              </div>
              <Progress value={evidenceUsagePercent} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Features Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Features</CardTitle>
            <CardDescription>Toggle optional features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Real-time Alerts
                </Label>
                <p className="text-xs text-muted-foreground">
                  Get notified when markets move significantly
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!entitlements.alertsEnabled && (
                  <Badge variant="outline" className="text-xs">Pro</Badge>
                )}
                <Switch 
                  checked={entitlements.alertsEnabled}
                  onCheckedChange={handleToggleAlerts}
                  disabled={!entitlements.alertsEnabled}
                />
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Data Export
                </Label>
                <p className="text-xs text-muted-foreground">
                  Export forecasts and analysis to CSV/JSON
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!entitlements.exportsEnabled && (
                  <Badge variant="outline" className="text-xs">Pro</Badge>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleToggleExports}
                  disabled={!entitlements.exportsEnabled}
                >
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Billing
            </CardTitle>
            <CardDescription>
              Manage your subscription and billing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg mb-6">
              <div>
                <p className="font-medium">Current Plan</p>
                <p className="text-2xl font-bold">{entitlements.plan}</p>
              </div>
              {entitlements.plan !== 'Team' && (
                <Button 
                  className="gradient-primary text-primary-foreground gap-2"
                  onClick={() => handleUpgrade(entitlements.plan === 'Free' ? 'Pro' : 'Team')}
                >
                  <Sparkles className="w-4 h-4" />
                  Upgrade
                </Button>
              )}
            </div>

            {/* Plan cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    "relative p-5 rounded-lg border transition-all",
                    plan.id === entitlements.plan 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50",
                    plan.popular && "ring-2 ring-primary"
                  )}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 gradient-primary text-primary-foreground">
                      Popular
                    </Badge>
                  )}

                  <div className="text-center mb-4">
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-positive shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.id === entitlements.plan ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button 
                      className={cn(
                        "w-full",
                        plan.popular && "gradient-primary text-primary-foreground"
                      )}
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => handleUpgrade(plan.id)}
                    >
                      {plan.id === 'Free' ? 'Downgrade' : 'Upgrade'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Checkout Modal */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Upgrade to {selectedPlan}
            </DialogTitle>
            <DialogDescription>
              Complete your upgrade with Flowglad
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">You're upgrading to</p>
              <p className="text-2xl font-bold">{selectedPlan} Plan</p>
              <p className="text-lg font-mono">
                {plans.find(p => p.id === selectedPlan)?.price}
                {plans.find(p => p.id === selectedPlan)?.period}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Card Number</Label>
                <Input placeholder="4242 4242 4242 4242" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Expiry</Label>
                  <Input placeholder="MM/YY" />
                </div>
                <div>
                  <Label>CVC</Label>
                  <Input placeholder="123" />
                </div>
              </div>
            </div>

            <div className="text-center text-xs text-muted-foreground">
              Powered by <span className="font-semibold">Flowglad</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowCheckout(false)}>
              Cancel
            </Button>
            <Button className="flex-1 gradient-primary text-primary-foreground" onClick={handleCheckoutComplete}>
              Complete Upgrade
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
