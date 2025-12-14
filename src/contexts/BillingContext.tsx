import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface BillingContextType {
  loaded: boolean;
  errors: any[];
  billing: any;
  evidenceScansRemaining: number;
  forecastsRemaining: number;
  isPro: boolean;
  refreshBilling: () => Promise<void>;
  checkUsageBalance: (meterSlug: string) => any;
  createCheckoutSession: (options: any) => Promise<any>;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export function BillingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [errors, setErrors] = useState<any[]>([]);
  const [billing, setBilling] = useState<any>(null);

  const evidenceScansRemaining = billing?.checkUsageBalance('evidence_scans')?.availableBalance ?? 0;
  const forecastsRemaining = billing?.checkUsageBalance('forecast_runs')?.availableBalance ?? 0;
  const isPro = billing?.currentSubscription?.priceSlug?.includes('pro') || false;

  const refreshBilling = async () => {
    if (!user) return;
    
    try {
      setLoaded(false);
      setErrors([]);
      const res = await fetch('/api/flowglad-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ action: 'billing' }),
      });
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`Billing fetch failed: ${res.status} ${detail}`);
      }
      const billingData = await res.json();
      setBilling(billingData);
      setLoaded(true);
    } catch (error) {
      console.error('Failed to load billing data:', error);
      setErrors([error]);
      setLoaded(true);
    }
  };

  const checkUsageBalance = (meterSlug: string) => {
    return billing?.checkUsageBalance(meterSlug);
  };

  const createCheckoutSession = async (options: any) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const res = await fetch('/api/flowglad-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ action: 'checkout', options }),
      });
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`Checkout failed: ${res.status} ${detail}`);
      }
      return await res.json();
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      refreshBilling();
    } else {
      setBilling(null);
      setLoaded(true);
    }
  }, [user]);

  return (
    <BillingContext.Provider
      value={{
        loaded,
        errors,
        billing,
        evidenceScansRemaining,
        forecastsRemaining,
        isPro,
        refreshBilling,
        checkUsageBalance,
        createCheckoutSession,
      }}
    >
      {children}
    </BillingContext.Provider>
  );
}

export function useBilling() {
  const context = useContext(BillingContext);
  if (context === undefined) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
}
