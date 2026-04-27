import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // Send everyone to dashboard; dashboard guards auth itself.
    throw redirect({ to: "/dashboard" });
  },
});
