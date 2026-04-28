import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BfButton, Card, Field, Spinner, inputClass } from "@/components/bf-ui";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({ meta: [{ title: "Reset password — Blogger Finalizer" }] }),
});

function ResetPasswordPage() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Supabase auto-handles the recovery token in the URL hash and emits
    // a PASSWORD_RECOVERY event. We just wait until a session exists.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setBusy(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) {
        setError(err.message);
      } else {
        toast.success("Password updated!");
        nav({ to: "/dashboard" });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="block text-center mb-8">
          <div className="font-display text-3xl font-bold text-accent">✦ Blogger Finalizer</div>
          <div className="mt-1 text-xs text-muted-foreground tracking-wide">Reset your password</div>
        </Link>
        <Card>
          {!ready ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Validating reset link...
            </div>
          ) : (
            <form onSubmit={submit}>
              <Field label="New Password">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                  autoComplete="new-password"
                />
              </Field>
              <Field label="Confirm Password">
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                  autoComplete="new-password"
                />
              </Field>
              {error && <div className="mb-3 text-xs text-destructive">⚠ {error}</div>}
              {busy ? (
                <Spinner label="Updating password..." />
              ) : (
                <BfButton type="submit" className="w-full">
                  Update Password →
                </BfButton>
              )}
            </form>
          )}
        </Card>
        <div className="mt-4 text-center">
          <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground">
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
