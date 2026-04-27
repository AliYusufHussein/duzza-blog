import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "success" | "outline";

export function BfButton({
  variant = "primary",
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const variants: Record<Variant, string> = {
    primary:
      "bg-gradient-primary text-primary-foreground shadow-[0_8px_24px_-12px_oklch(0.55_0.25_295/0.6)] hover:opacity-90",
    ghost: "bg-transparent border border-border text-muted-foreground hover:text-foreground hover:border-accent/60",
    success: "bg-success text-background hover:opacity-90",
    outline: "bg-surface border border-border text-accent hover:border-accent",
  };
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Spinner({ label = "AI working..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="bf-spin" />
      <span className="text-xs text-accent">{label}</span>
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5", className)}>
      {children}
    </div>
  );
}

export function Field({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      {label && (
        <label className="mb-1.5 block text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </label>
      )}
      {children}
    </div>
  );
}

export const inputClass =
  "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent transition-colors";
