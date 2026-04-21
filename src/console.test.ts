import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("lil-libs/console", () => {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  let consoleErrorMock: ReturnType<typeof vi.fn>;
  let consoleWarnMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    consoleErrorMock = vi.fn();
    consoleWarnMock = vi.fn();
    console.error = consoleErrorMock as typeof console.error;
    console.warn = consoleWarnMock as typeof console.warn;

    // Clear module cache to get fresh instances
    vi.resetModules();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    vi.resetModules();
  });

  describe("errorOnce", () => {
    it("should log the same error message only once", async () => {
      const { errorOnce } = await import("./console");

      errorOnce("test error");
      errorOnce("test error");
      errorOnce("test error");

      expect(consoleErrorMock).toHaveBeenCalledWith("test error");
      expect(consoleErrorMock).toHaveBeenCalledOnce();
    });

    it("should log different error messages separately", async () => {
      const { errorOnce } = await import("./console");

      errorOnce("error 1");
      errorOnce("error 2");
      errorOnce("error 1");
      errorOnce("error 2");

      expect(consoleErrorMock).toHaveBeenCalledWith("error 1");
      expect(consoleErrorMock).toHaveBeenCalledWith("error 2");
      expect(consoleErrorMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("warnOnce", () => {
    it("should log the same warning message only once", async () => {
      const { warnOnce } = await import("./console");

      warnOnce("test warning");
      warnOnce("test warning");
      warnOnce("test warning");

      expect(consoleWarnMock).toHaveBeenCalledWith("test warning");
      expect(consoleWarnMock).toHaveBeenCalledOnce();
    });

    it("should log different warning messages separately", async () => {
      const { warnOnce } = await import("./console");

      warnOnce("warning 1");
      warnOnce("warning 2");
      warnOnce("warning 1");
      warnOnce("warning 3");
      warnOnce("warning 2");

      expect(consoleWarnMock).toHaveBeenCalledWith("warning 1");
      expect(consoleWarnMock).toHaveBeenCalledWith("warning 2");
      expect(consoleWarnMock).toHaveBeenCalledWith("warning 3");
      expect(consoleWarnMock).toHaveBeenCalledTimes(3);
    });
  });

  describe("errorOnce and warnOnce independence", () => {
    it("should track error and warning messages independently", async () => {
      const { errorOnce, warnOnce } = await import("./console");

      errorOnce("same message");
      warnOnce("same message");
      errorOnce("same message");
      warnOnce("same message");

      expect(consoleErrorMock).toHaveBeenCalledWith("same message");
      expect(consoleErrorMock).toHaveBeenCalledOnce();
      expect(consoleWarnMock).toHaveBeenCalledWith("same message");
      expect(consoleWarnMock).toHaveBeenCalledOnce();
    });
  });
});
