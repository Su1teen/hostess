import {
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const serverEntryPath = join(rootDir, ".output", "server", "index.mjs");
const wranglerConfigPath = join(rootDir, ".output", "server", "wrangler.json");
const publicDirPath = join(rootDir, ".output", "public");
const secretsFilePath = join(rootDir, ".wrangler", "deploy", "secrets.json");
const binDir = join(rootDir, "node_modules", ".bin");

function normalizeSecret(raw) {
  if (typeof raw !== "string") return undefined;
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

function patchWorkerEntrypoint() {
  if (!existsSync(serverEntryPath)) {
    throw new Error(`Missing generated Worker entrypoint at ${serverEntryPath}`);
  }
  let source = readFileSync(serverEntryPath, "utf8");

  const cfImportBanner =
    'import { env as __cf_workers_env__ } from "cloudflare:workers";\nglobalThis.__cf_workers_env__ = __cf_workers_env__;\n';
  if (!source.includes('from "cloudflare:workers"')) {
    source = cfImportBanner + source;
  }

  const originalLazyService = `function lazyService(loader) {
\tlet promise, mod;
\treturn { fetch(req) {
\t\tif (mod) return mod.fetch(req);
\t\tif (!promise) promise = loader().then((_mod) => mod = _mod.default || _mod);
\t\treturn promise.then((mod) => mod.fetch(req));
\t} };
}`;

  const patchedLazyService = `function lazyService(loader) {
\tlet promise, mod;
\treturn { fetch(req) {
\t\tconst env = req?.runtime?.cloudflare?.env ?? globalThis.__env__ ?? globalThis.__cf_workers_env__;
\t\tconst ctx = req?.runtime?.cloudflare?.context;
\t\tif (mod) return mod.fetch(req, env, ctx);
\t\tif (!promise) promise = loader().then((_mod) => mod = _mod.default || _mod);
\t\treturn promise.then((mod) => mod.fetch(req, env, ctx));
\t} };
}`;

  if (source.includes(originalLazyService)) {
    source = source.replace(originalLazyService, patchedLazyService);
  }

  source = source.replace(
    "globalThis.__env__ = env;",
    "globalThis.__env__ = env;\n\t\t\tglobalThis.__cf_workers_env__ = __cf_workers_env__ ?? env;",
  );

  writeFileSync(serverEntryPath, source, "utf8");
}

function ensureWranglerConfigBindingsPreserved() {
  if (!existsSync(wranglerConfigPath)) {
    throw new Error(`Missing generated Wrangler config at ${wranglerConfigPath}`);
  }
  const config = JSON.parse(readFileSync(wranglerConfigPath, "utf8"));
  config.keep_vars = true;
  config.unsafe = config.unsafe || {};
  config.unsafe.metadata = config.unsafe.metadata || {};
  config.unsafe.metadata.keep_bindings = [
    "plain_text",
    "json",
    "secret_text",
    "secret_key",
    "secrets_store_secret",
  ];
  writeFileSync(wranglerConfigPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

function assertNoSecretInPublicAssets(secretValue) {
  if (!secretValue || !existsSync(publicDirPath)) return;
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry);
      const st = statSync(fullPath);
      if (st.isDirectory()) {
        walk(fullPath);
      } else if (/\.(?:js|mjs|css|html|json|txt|map)$/i.test(entry)) {
        const content = readFileSync(fullPath, "utf8");
        if (content.includes(secretValue)) {
          throw new Error(`Refusing build: HOSTESS_BFF_KEY leaked into public asset ${fullPath}`);
        }
      }
    }
  };
  walk(publicDirPath);
}

function prepareBuildTimeSecretsFile() {
  const bffKey = normalizeSecret(process.env.HOSTESS_BFF_KEY);
  assertNoSecretInPublicAssets(bffKey);
  if (bffKey && bffKey.length >= 32) {
    mkdirSync(dirname(secretsFilePath), { recursive: true });
    writeFileSync(secretsFilePath, JSON.stringify({ HOSTESS_BFF_KEY: bffKey }), {
      encoding: "utf8",
      mode: 0o600,
    });
    console.info(
      "[hostess-build] Prepared encrypted secret upload file for Wrangler deploy (value hidden).",
    );
  } else {
    rmSync(secretsFilePath, { force: true });
    console.info(
      "[hostess-build] No build-time HOSTESS_BFF_KEY provided; Wrangler will preserve existing Worker runtime secrets via keep_vars/keep_bindings.",
    );
  }
}

function installWranglerDeployShim() {
  mkdirSync(binDir, { recursive: true });
  const shimMjsPath = join(binDir, "wrangler-shim.mjs");
  const posixBinPath = join(binDir, "wrangler");
  const cmdBinPath = join(binDir, "wrangler.cmd");

  const shimSource = `#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const binDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(binDir, "..", "..");
const secretsFilePath = join(rootDir, ".wrangler", "deploy", "secrets.json");

function normalizeSecret(raw) {
  if (typeof raw !== "string") return undefined;
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

const rawArgs = process.argv.slice(2);
const isDeploy = rawArgs[0] === "deploy";
const isVersionsUpload = rawArgs[0] === "versions" && rawArgs[1] === "upload";

// Remove local .bin/wrangler wrappers immediately so npx (libnpmexec) never re-enters this shim.
rmSync(join(binDir, "wrangler"), { force: true });
rmSync(join(binDir, "wrangler.cmd"), { force: true });

const envBffKey = normalizeSecret(process.env.HOSTESS_BFF_KEY);
if (!existsSync(secretsFilePath) && envBffKey && envBffKey.length >= 32) {
  mkdirSync(dirname(secretsFilePath), { recursive: true });
  writeFileSync(secretsFilePath, JSON.stringify({ HOSTESS_BFF_KEY: envBffKey }), {
    encoding: "utf8",
    mode: 0o600,
  });
}

const extraArgs = [];
if (isDeploy && !rawArgs.includes("--keep-vars")) {
  extraArgs.push("--keep-vars");
}
if ((isDeploy || isVersionsUpload) && existsSync(secretsFilePath) && !rawArgs.includes("--secrets-file")) {
  extraArgs.push("--secrets-file", secretsFilePath);
}

const filteredPath = (process.env.PATH || "")
  .split(delimiter)
  .filter((entry) => resolve(entry) !== resolve(binDir))
  .join(delimiter);

const childEnv = {
  ...process.env,
  PATH: filteredPath,
};

let exitCode = 1;
try {
  const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
  const nodeMajor = Number.parseInt(process.versions.node.split(".")[0] || "22", 10);
  const wranglerPkg = nodeMajor >= 22 ? "wrangler@4" : "wrangler@4.86.0";
  const result = spawnSync(
    npxCmd,
    ["--yes", wranglerPkg, ...rawArgs, ...extraArgs],
    {
      stdio: "inherit",
      env: childEnv,
      shell: process.platform === "win32",
    },
  );
  exitCode = result.status ?? 1;
} finally {
  if (isDeploy || isVersionsUpload) {
    rmSync(secretsFilePath, { force: true });
  }
}
process.exit(exitCode);
`;

  writeFileSync(shimMjsPath, shimSource, { encoding: "utf8", mode: 0o755 });
  writeFileSync(posixBinPath, shimSource, { encoding: "utf8", mode: 0o755 });
  try {
    chmodSync(shimMjsPath, 0o755);
    chmodSync(posixBinPath, 0o755);
  } catch {
    // chmod may be a no-op on Windows filesystems
  }

  const cmdSource = `@ECHO off\r\nnode "%~dp0\\wrangler-shim.mjs" %*\r\n`;
  writeFileSync(cmdBinPath, cmdSource, "utf8");
}

patchWorkerEntrypoint();
ensureWranglerConfigBindingsPreserved();
prepareBuildTimeSecretsFile();
installWranglerDeployShim();
