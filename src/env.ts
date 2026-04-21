type ImportMetaWithEnv = {
  env?: Record<string, unknown>;
};

type RuntimeWithEnv = {
  process?: {
    env?: Record<string, unknown>;
  };
  __env__?: Record<string, unknown>;
};

/**
 * Resolve a runtime environment variable from commonly available sources.
 *
 * Lookup order (first string value wins):
 * 1) `import.meta.env[name]` (Astro/Vite etc. bundler env)
 * 2) `process.env[name]` (Node and many server runtimes)
 * 3) `globalThis.__env__[name]` (custom browser/global injection pattern)
 *
 * Non-string values are ignored and treated as missing.
 *
 * @note Helper-based env resolution is runtime-dynamic. Some bundlers can
 * statically optimize direct patterns like `process.env.NODE_ENV` or
 * `import.meta.env.MODE` more aggressively for dead-code elimination.
 * Prefer direct checks in app-level hot paths where maximum tree-shaking
 * matters.
 *
 * @param name - Environment variable name to resolve.
 * @returns The resolved string value, or `undefined` when not available.
 */
export function getEnvVariable(name: string): string | undefined {
  const importMetaEnv = (import.meta as ImportMetaWithEnv).env;
  const importMetaValue = optionalString(importMetaEnv?.[name]);
  if (importMetaValue != null) {
    return importMetaValue;
  }

  const runtime = globalThis as RuntimeWithEnv;
  const processValue = optionalString(runtime.process?.env?.[name]);
  if (processValue != null) {
    return processValue;
  }

  return optionalString(runtime.__env__?.[name]);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/**
 * A convenience wrapper around {@link getEnvVariable} for the most common case.
 *
 * @returns `true` if the runtime environment is production, `false` otherwise.
 */
export function isProductionEnv(): boolean {
  const mode = getEnvVariable("MODE");
  const nodeEnv = getEnvVariable("NODE_ENV");
  return mode === "production" || nodeEnv === "production";
}
