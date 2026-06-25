/**
 * Console helpers that deduplicate repeated log messages.
 *
 * @module
 */

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
  const seen = new Set<string>();

  return (message: string) => {
    if (seen.has(message)) return;
    seen.add(message);
    logFn(message);
  };
}

/**
 * Logs each unique error message only once per runtime instance.
 *
 * @example
 * errorOnce("API request failed");
 * errorOnce("API request failed"); // ignored
 *
 * @param message - The error message to log
 */
export const errorOnce = createOnceLogger(console.error.bind(console));

/**
 * Logs each unique warning message only once per runtime instance.
 *
 * @example
 * warnOnce("Using fallback value");
 * warnOnce("Using fallback value"); // ignored
 *
 * @param message - The warning message to log
 */
export const warnOnce = createOnceLogger(console.warn.bind(console));
