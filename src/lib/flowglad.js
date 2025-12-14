const stub = {
  async getBilling() {
    return {
      currentSubscription: { id: "dev-subscription", priceSlug: "pro-dev" },
      checkUsageBalance: () => ({ availableBalance: 1_000 }),
    };
  },
  checkUsageBalance: () => ({ availableBalance: 1_000 }),
  async createUsageEvent() {
    return { ok: true, stub: true };
  },
  async createCheckoutSession() {
    return { url: "#" };
  },
};

const isBrowser = typeof window !== "undefined";
const hasSecret =
  typeof process !== "undefined" &&
  typeof process.env !== "undefined" &&
  Boolean(process.env.FLOWGLAD_SECRET_KEY);
const forceStub =
  isBrowser ||
  process.env.NODE_ENV !== "production" ||
  process.env.FLOWGLAD_FORCE_STUB === "1" ||
  !hasSecret;

// Lightweight JS wrapper (with a dev-safe fallback) so dev-server and client can import without TS build
export const flowglad = (customerExternalId) => {
  // Always stub in dev/local and in the browser; avoids module resolution in client bundles.
  if (forceStub) {
    return stub;
  }

  // If you later supply a working server SDK, you can add a guarded dynamic import here.
  return stub;
};
