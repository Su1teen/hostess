export type RuntimeBindingKey =
  "BOOKING_API_ORIGIN" | "EXCHANGE_API_ORIGIN" | "HOSTESS_BFF_KEY" | "HOSTESS_BUILD_SHA";

export type BindingSource =
  "fetch argument" | "Cloudflare module env" | "Nitro context" | "process.env" | "none";

type SecretStoreBindingLike = {
  get: () => Promise<unknown> | unknown;
};

type RuntimeRecord = Record<string, unknown>;

type GlobalWithCloudflareEnv = typeof globalThis & {
  __env__?: RuntimeRecord;
  __cf_workers_env__?: RuntimeRecord;
};

export interface ResolvedBinding {
  value: string | undefined;
  source: BindingSource;
}

export interface ResolvedHostessRuntime {
  bookingOrigin: string | undefined;
  exchangeOrigin: string | undefined;
  serviceKey: string | undefined;
  buildSha: string | undefined;
  sources: {
    bookingOrigin: BindingSource;
    exchangeOrigin: BindingSource;
    serviceKey: BindingSource;
    buildSha: BindingSource;
  };
  primarySource: BindingSource;
  diagnostics: {
    bookingOriginAvailable: boolean;
    exchangeOriginAvailable: boolean;
    serviceKeyAvailable: boolean;
    serviceKeySatisfiesMinLength: boolean;
    bindingSource: BindingSource;
    deployedBuildSha: string;
  };
}

export const MIN_SERVICE_KEY_LENGTH = 32;

let testCloudflareModuleEnvOverride: RuntimeRecord | null | undefined = undefined;
let cachedCloudflareModuleEnv: RuntimeRecord | null | undefined = undefined;

/**
 * Allows Node/Bun unit tests to simulate `import { env } from "cloudflare:workers"`
 * without requiring the workerd binary runtime.
 */
export function setCloudflareModuleEnvForTests(env: RuntimeRecord | null | undefined): void {
  testCloudflareModuleEnvOverride = env;
}

function isObjectRecord(value: unknown): value is RuntimeRecord {
  return typeof value === "object" && value !== null;
}

function normalizeBindingString(raw: string): string | undefined {
  let trimmed = raw.trim();
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed.length > 0 ? trimmed : undefined;
}

async function readBindingValue(
  record: RuntimeRecord | undefined,
  key: RuntimeBindingKey,
): Promise<string | undefined> {
  if (!isObjectRecord(record)) return undefined;
  let candidate: unknown;
  try {
    candidate = record[key];
  } catch {
    return undefined;
  }
  if (typeof candidate === "string") {
    return normalizeBindingString(candidate);
  }
  if (
    isObjectRecord(candidate) &&
    typeof (candidate as SecretStoreBindingLike).get === "function"
  ) {
    try {
      const resolved = await (candidate as SecretStoreBindingLike).get();
      if (typeof resolved === "string") {
        return normalizeBindingString(resolved);
      }
    } catch {
      return undefined;
    }
  }
  return undefined;
}

async function loadCloudflareModuleEnv(): Promise<RuntimeRecord | undefined> {
  if (testCloudflareModuleEnvOverride !== undefined) {
    return testCloudflareModuleEnvOverride ?? undefined;
  }
  const g = globalThis as GlobalWithCloudflareEnv;
  if (isObjectRecord(g.__cf_workers_env__)) {
    return g.__cf_workers_env__;
  }
  if (cachedCloudflareModuleEnv !== undefined) {
    return cachedCloudflareModuleEnv ?? undefined;
  }
  try {
    const specifier = "cloudflare:workers";
    const mod = (await import(/* @vite-ignore */ specifier)) as { env?: unknown };
    if (isObjectRecord(mod?.env)) {
      cachedCloudflareModuleEnv = mod.env;
      return mod.env;
    }
  } catch {
    // Running outside Cloudflare workerd (e.g. local Node/Bun unit tests).
  }
  cachedCloudflareModuleEnv = null;
  return undefined;
}

function getNitroContextEnvs(request?: Request): RuntimeRecord[] {
  const records: RuntimeRecord[] = [];
  const reqRuntimeEnv = (
    request as (Request & { runtime?: { cloudflare?: { env?: unknown } } }) | undefined
  )?.runtime?.cloudflare?.env;
  if (isObjectRecord(reqRuntimeEnv)) {
    records.push(reqRuntimeEnv);
  }
  const globalNitroEnv = (globalThis as GlobalWithCloudflareEnv).__env__;
  if (isObjectRecord(globalNitroEnv) && globalNitroEnv !== reqRuntimeEnv) {
    records.push(globalNitroEnv);
  }
  return records;
}

function getProcessEnvRecord(): RuntimeRecord | undefined {
  if (typeof process !== "undefined" && isObjectRecord(process.env)) {
    return process.env as RuntimeRecord;
  }
  return undefined;
}

async function resolveSingleBinding(
  key: RuntimeBindingKey,
  fetchRuntime: RuntimeRecord | undefined,
  cfModuleEnv: RuntimeRecord | undefined,
  nitroEnvs: RuntimeRecord[],
  procEnv: RuntimeRecord | undefined,
): Promise<ResolvedBinding> {
  const fromFetchArg = await readBindingValue(fetchRuntime, key);
  if (fromFetchArg !== undefined) {
    return { value: fromFetchArg, source: "fetch argument" };
  }

  const fromCfModule = await readBindingValue(cfModuleEnv, key);
  if (fromCfModule !== undefined) {
    return { value: fromCfModule, source: "Cloudflare module env" };
  }

  for (const nitroEnv of nitroEnvs) {
    const fromNitro = await readBindingValue(nitroEnv, key);
    if (fromNitro !== undefined) {
      return { value: fromNitro, source: "Nitro context" };
    }
  }

  const fromProcess = await readBindingValue(procEnv, key);
  if (fromProcess !== undefined) {
    return { value: fromProcess, source: "process.env" };
  }

  return { value: undefined, source: "none" };
}

export async function resolveHostessRuntimeEnv(
  request?: Request,
  runtime?: unknown,
): Promise<ResolvedHostessRuntime> {
  const fetchRuntime = isObjectRecord(runtime) ? runtime : undefined;
  const cfModuleEnv = await loadCloudflareModuleEnv();
  const nitroEnvs = getNitroContextEnvs(request);
  const procEnv = getProcessEnvRecord();

  const [bookingOrigin, exchangeOrigin, serviceKey, buildSha] = await Promise.all([
    resolveSingleBinding("BOOKING_API_ORIGIN", fetchRuntime, cfModuleEnv, nitroEnvs, procEnv),
    resolveSingleBinding("EXCHANGE_API_ORIGIN", fetchRuntime, cfModuleEnv, nitroEnvs, procEnv),
    resolveSingleBinding("HOSTESS_BFF_KEY", fetchRuntime, cfModuleEnv, nitroEnvs, procEnv),
    resolveSingleBinding("HOSTESS_BUILD_SHA", fetchRuntime, cfModuleEnv, nitroEnvs, procEnv),
  ]);

  const primarySource: BindingSource =
    serviceKey.source !== "none"
      ? serviceKey.source
      : bookingOrigin.source !== "none"
        ? bookingOrigin.source
        : exchangeOrigin.source !== "none"
          ? exchangeOrigin.source
          : buildSha.source !== "none"
            ? buildSha.source
            : "none";

  const validBuildSha =
    typeof buildSha.value === "string" && /^[a-f0-9]{40}$/i.test(buildSha.value)
      ? buildSha.value
      : undefined;

  return {
    bookingOrigin: bookingOrigin.value,
    exchangeOrigin: exchangeOrigin.value,
    serviceKey: serviceKey.value,
    buildSha: validBuildSha,
    sources: {
      bookingOrigin: bookingOrigin.source,
      exchangeOrigin: exchangeOrigin.source,
      serviceKey: serviceKey.source,
      buildSha: buildSha.source,
    },
    primarySource,
    diagnostics: {
      bookingOriginAvailable: Boolean(bookingOrigin.value),
      exchangeOriginAvailable: Boolean(exchangeOrigin.value),
      serviceKeyAvailable: Boolean(serviceKey.value),
      serviceKeySatisfiesMinLength:
        typeof serviceKey.value === "string" && serviceKey.value.length >= MIN_SERVICE_KEY_LENGTH,
      bindingSource: primarySource,
      deployedBuildSha: validBuildSha ?? "unknown",
    },
  };
}
