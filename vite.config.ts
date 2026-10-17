// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { execFileSync } from "node:child_process";
import type { NitroConfig } from "nitro/types";

const normalizeOriginEnv = (raw: string | undefined, fallback: string): string => {
  const trimmed = raw
    ?.trim()
    .replace(/^["']|["']$/g, "")
    .trim();
  return trimmed ? trimmed : fallback;
};

const cloudflare: NonNullable<NitroConfig["cloudflare"]> = {
  nodeCompat: true,
  wrangler: {
    name: "hostess",
    // Preserve dashboard variables and secrets across generated-config deployments.
    keep_vars: true,
    unsafe: {
      metadata: {
        keep_bindings: ["plain_text", "json", "secret_text", "secret_key", "secrets_store_secret"],
      },
    },
    vars: {
      BOOKING_API_ORIGIN: normalizeOriginEnv(
        process.env.BOOKING_API_ORIGIN,
        "https://hostess-command-center-production.up.railway.app",
      ),
      EXCHANGE_API_ORIGIN: normalizeOriginEnv(
        process.env.EXCHANGE_API_ORIGIN,
        "https://hostess-xoxo-production.up.railway.app",
      ),
      HOSTESS_BUILD_SHA: execFileSync("git", ["rev-parse", "HEAD"], {
        encoding: "utf8",
      }).trim(),
    },
  },
};

export default defineConfig({
  nitro: { cloudflare },
  vite: {
    ssr: {
      external: ["cloudflare:workers"],
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
