"use client";

import { useBilling } from '@/contexts/BillingContext';

export function UpgradeButton() {
  const { loaded, errors, createCheckoutSession } = useBilling();

  if (!loaded) return null;
  if (errors) return null;

  return (
    <button
      onClick={() =>
        createCheckoutSession({
          priceSlug: "pro-monthly",
          successUrl: `${window.location.origin}/billing/success`,
          cancelUrl: window.location.href,
          autoRedirect: true,
        })
      }
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
    >
      Upgrade
    </button>
  );
}
