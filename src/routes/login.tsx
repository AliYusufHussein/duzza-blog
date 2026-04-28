import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { BfButton, Card, Field, Spinner, inputClass } from "@/components/bf-ui";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Sign in — Blogger Finalizer" }] }),
});

function LoginPage() {
  const { user, signIn, signUp, loading } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) nav({ to: "/dashboard" });
  }, [user, loading, nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) return setError("Please enter your email.");
    if (mode === "forgot") {
      setBusy(true);
      try {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (err) setError(err.message);
        else toast.success("Check your email for a reset link.");
      } finally {
        setBusy(false);
      }
      return;
    }
    if (!password) return setError("Please fill in all fields.");
    if (mode === "register") {
      if (password.length < 6) return setError("Password must be at least 6 characters.");
      if (password !== confirm) return setError("Passwords do not match.");
    }
    setBusy(true);
    try {
      const res = mode === "login" ? await signIn(email.trim(), password) : await signUp(email.trim(), password);
      if (res.error) {
        setError(res.error);
      } else {
        toast.success(mode === "login" ? "Welcome back!" : "Account created!");
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
          <div className="mt-1 text-xs text-muted-foreground tracking-wide">Draft · Polish · SEO · Publish</div>
        </Link>
        <Card>
          <div className="mb-5 flex overflow-hidden rounded-lg border border-border">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2 text-sm transition-colors ${
                  mode === m ? "bg-secondary text-accent" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>
          <form onSubmit={submit}>
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className={inputClass}
                autoComplete="email"
              />
            </Field>
            {mode !== "forgot" && (
              <Field label="Password">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </Field>
            )}
            {mode === "register" && (
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
            )}
            {mode === "login" && (
              <div className="mb-3 text-right">
                <button
                  type="button"
                  onClick={() => { setMode("forgot"); setError(""); }}
                  className="text-xs text-accent hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}
            {error && <div className="mb-3 text-xs text-destructive">⚠ {error}</div>}
            {busy ? (
              <Spinner label={mode === "forgot" ? "Sending reset link..." : mode === "login" ? "Signing in..." : "Creating account..."} />
            ) : (
              <BfButton type="submit" className="w-full">
                {mode === "forgot" ? "Send Reset Link →" : mode === "login" ? "Sign In →" : "Create Account →"}
              </BfButton>
            )}
            {mode === "forgot" && (
              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={() => { setMode("login"); setError(""); }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  ← Back to sign in
                </button>
              </div>
            )}
          </form>
        </Card>
        <div className="mt-4 text-center text-[11px] text-muted-foreground/70">
          Your articles are saved privately to your account
        </div>
      </div>
    </div>
  );
}
