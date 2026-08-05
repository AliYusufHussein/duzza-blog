import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BfButton, Card, Spinner } from "@/components/bf-ui";

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};

function oauthApi(): OAuthApi {
  return (supabase.auth as unknown as { oauth: OAuthApi }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/login", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
    if (error) throw error;
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  pendingComponent: () => (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner label="Loading authorization request..." />
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="max-w-sm text-center">
        <div className="font-display text-lg mb-2">Authorization unavailable</div>
        <div className="text-sm text-muted-foreground">
          {String((error as Error)?.message ?? error)}
        </div>
      </Card>
    </div>
  ),
});

function Consent() {
  const details = Route.useLoaderData() as any;
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "an app";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const api = oauthApi();
    const { data, error: err } = approve
      ? await api.approveAuthorization(authorization_id)
      : await api.denyAuthorization(authorization_id);
    if (err) {
      setBusy(false);
      setError(err.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center font-display text-2xl font-bold text-accent">
          ✦ Blogger Finalizer
        </div>
        <Card>
          <h1 className="font-display text-lg mb-2">Connect {clientName}</h1>
          <p className="text-sm text-muted-foreground mb-5">
            This lets {clientName} read and manage your articles in Blogger Finalizer as you.
          </p>
          {error && <div className="mb-3 text-xs text-destructive" role="alert">⚠ {error}</div>}
          {busy ? (
            <Spinner label="Working..." />
          ) : (
            <div className="flex gap-2">
              <BfButton className="flex-1" onClick={() => decide(true)}>
                Approve
              </BfButton>
              <BfButton variant="ghost" className="flex-1" onClick={() => decide(false)}>
                Deny
              </BfButton>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
