import { afterEach, describe, expect, it } from "vitest";

import { getEnvVariable } from "./env";

type RuntimeWithEnv = typeof globalThis & {
  __env__?: Record<string, unknown>;
};

const runtime = globalThis as RuntimeWithEnv;

describe("lil-libs/env", () => {
  const originalNodeEnv = process.env["NODE_ENV"];
  const originalCustom = runtime.__env__;

  afterEach(() => {
    if (originalNodeEnv == null) {
      delete process.env["NODE_ENV"];
    } else {
      process.env["NODE_ENV"] = originalNodeEnv;
    }

    if (originalCustom == null) {
      delete runtime.__env__;
    } else {
      runtime.__env__ = originalCustom;
    }
  });

  it("returns process env values when present", () => {
    process.env["TEST_ENV_VALUE"] = "from-process";

    expect(getEnvVariable("TEST_ENV_VALUE")).toBe("from-process");
  });

  it("falls back to global __env__ when process env is missing", () => {
    delete process.env["TEST_ENV_VALUE"];
    runtime.__env__ = { TEST_ENV_VALUE: "from-global" };

    expect(getEnvVariable("TEST_ENV_VALUE")).toBe("from-global");
  });

  it("prefers process env over global __env__", () => {
    process.env["TEST_ENV_VALUE"] = "from-process";
    runtime.__env__ = { TEST_ENV_VALUE: "from-global" };

    expect(getEnvVariable("TEST_ENV_VALUE")).toBe("from-process");
  });

  it("returns undefined for missing keys", () => {
    delete process.env["TEST_ENV_VALUE"];
    delete runtime.__env__;

    expect(getEnvVariable("TEST_ENV_VALUE")).toBeUndefined();
  });
});
