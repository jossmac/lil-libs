const IS_PRODUCTION =
  (import.meta as { env?: { MODE?: string } }).env?.MODE === "production" ||
  (typeof globalThis !== "undefined" &&
    typeof globalThis.process !== "undefined" &&
    globalThis.process.env?.["NODE_ENV"] === "production");

/**
 * Factory function to create a once-only console logging function.
 * Messages are tracked and only logged the first time they are seen.
 *
 * @param logFn - The console method to use (e.g., console.error, console.warn)
 * @returns A function that logs each unique message only once
 */
function createOnceLogger(
  logFn: (message: string) => void,
): (message: string) => void {
  if (IS_PRODUCTION) return () => {};

  const seen = new Set<string>();

  return (message: string) => {
    if (seen.has(message)) return;
    seen.add(message);
    logFn(message);
  };
}

/**
 * Log an error message to the console, but only once per unique message.
 * No-op in production.
 *
 * @param message - The error message to log
 */
export const errorOnce = createOnceLogger(console.error);

/**
 * Log a warning message to the console, but only once per unique message.
 * No-op in production.
 *
 * @param message - The warning message to log
 */
export const warnOnce = createOnceLogger(console.warn);
