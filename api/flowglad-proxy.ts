type FlowgladRequest =
  | { action?: "billing"; userId?: string }
  | { action: "checkout"; userId?: string; options?: any };

function respond(res: any, status: number, body: any) {
  if (res && typeof res.status === "function") {
    return res.status(status).json(body);
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getUserId(body: any, req: Request) {
  const headerId =
    (req.headers as any)?.get?.("x-user-id") ||
    (req.headers as any)?.get?.("x-userid") ||
    (req.headers as any)?.get?.("x-user");
  return String(body.userId || headerId || "").trim();
}

function loadFlowgladServer() {
  try {
    // Lazy require to avoid bundler issues
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("@flowglad/server");
    const cls = mod.FlowgladServer || mod.default;
    return { cls, error: null };
  } catch (err) {
    console.warn("Flowglad load failed", err);
    return { cls: null, error: err };
  }
}

export async function POST(req: Request, res?: any) {
  try {
    const secret = process.env.FLOWGLAD_SECRET_KEY;
    const { cls: FlowgladServer, error: loadError } = loadFlowgladServer();

    if (!secret || !FlowgladServer) {
      const reason = !secret ? "Missing FLOWGLAD_SECRET_KEY" : "Flowglad module load failed";
      const detail = loadError ? String(loadError) : undefined;
      return respond(res, 500, { error: "Flowglad unavailable", reason, detail });
    }

    const body = (await req.json()) as FlowgladRequest;
    const action = body.action || "billing";
    const userId = getUserId(body, req);

    if (!userId) {
      return respond(res, 401, { error: "User ID required" });
    }

    const client = new FlowgladServer({
      customerExternalId: userId,
      getCustomerDetails: async (externalId: string) => ({
        email: `${externalId}@example.com`,
        name: externalId,
      }),
    });

    if (action === "billing") {
      const billing = await client.getBilling();
      return respond(res, 200, billing);
    }

    if (action === "checkout") {
      const session = await client.createCheckoutSession(body.options || {});
      return respond(res, 200, session);
    }

    return respond(res, 400, { error: "Unsupported action" });
  } catch (e: any) {
    console.error("flowglad-proxy error", e);
    return respond(res, 500, { error: "Server error", detail: String(e) });
  }
}
