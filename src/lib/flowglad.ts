// Stub implementation for development - Flowglad SDK has missing files
type StubBilling = {
  currentSubscription: { id: string; priceSlug?: string };
  checkUsageBalance: (slug: string) => { availableBalance: number };
};

const stub = {
  async getBilling(): Promise<StubBilling> {
    return {
      currentSubscription: { id: "dev-subscription", priceSlug: "pro-dev" },
      checkUsageBalance: () => ({ availableBalance: 1_000 }),
    };
  },
  checkUsageBalance: (_slug: string) => ({ availableBalance: 1_000 }),
  async createUsageEvent(_options: any) {
    return { ok: true, stub: true };
  },
  async createCheckoutSession(_options: any) {
    return { url: "#" };
  },
};

// customerExternalId = YOUR userId or orgId, not Flowglad's internal customer id
export const flowglad = (customerExternalId: string) => {
  // Always use stub for now until Flowglad SDK is fixed
  return stub;
};
