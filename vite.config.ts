// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { execFileSync } from "node:child_process";
import type { NitroConfig } from "nitro/types";

const cloudflare: NonNullable<NitroConfig["cloudflare"]> = {
  nodeCompat: true,
  wrangler: {
    // Preserve dashboard settings across generated-config deployments.
    keep_vars: true,
    vars: {
      BOOKING_API_ORIGIN: "https://hostess-command-center-production.up.railway.app",
      EXCHANGE_API_ORIGIN: "https://hostess-xoxo-production.up.railway.app",
      HOSTESS_BUILD_SHA: execFileSync("git", ["rev-parse", "HEAD"], {
        encoding: "utf8",
      }).trim(),
    },
  },
};

export default defineConfig({
  nitro: { cloudflare },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
