/**
 * Console helpers that log each distinct message only once per runtime instance.
 *
 * @module
 */

/**
 * Factory function to create a once-only console logging function.
 * Messages are tracked and only logged the first time they are seen.
 *
 * @param logFn - Console method invoked when a message is logged for the first time (e.g. `console.error`, `console.warn`).
 * @returns A function that accepts a string message, calls `logFn` once per distinct message, then silently ignores repeats for the lifetime of the closure.
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
 * errorOnce("API request failed"); // logged once
 * errorOnce("API request failed"); // ignored
 * errorOnce("Different error"); // logged once (distinct message)
 *
 * @param message - Error text to log via `console.error`.
 * @returns Nothing; subsequent calls with the same message are ignored.
 */
export const errorOnce = createOnceLogger(console.error.bind(console));

/**
 * Logs each unique warning message only once per runtime instance.
 *
 * @example
 * warnOnce("Using fallback value"); // logged once
 * warnOnce("Using fallback value"); // ignored
 * warnOnce("Other warning"); // logged once (distinct message)
 *
 * @param message - Warning text to log via `console.warn`.
 * @returns Nothing; subsequent calls with the same message are ignored.
 */
export const warnOnce = createOnceLogger(console.warn.bind(console));
