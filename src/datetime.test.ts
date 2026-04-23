import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { relativeTime } from "./datetime";

describe("lil-libs/datetime", () => {
  describe("utils/relativeTime", () => {
    const now = new Date("2026-01-07T12:00:00Z").getTime();
    const dates = [
      { value: 1000, expected: "1 second ago" },
      { value: 1000 * 60, expected: "1 minute ago" },
      { value: 1000 * 60 * 60, expected: "1 hour ago" },
      { value: 1000 * 60 * 60 * 3.5, expected: "3 hours ago" },
      // after 24h we switch to traditional date format
      { value: 1000 * 60 * 60 * 24, expected: "1/6/2026" },
    ].map((item) => ({
      value: new Date(now - item.value),
      expected: item.expected,
    }));

    beforeAll(() => {
      vi.useFakeTimers();
      vi.setSystemTime(now);
    });

    afterAll(() => {
      vi.useRealTimers();
    });

    it("supports value as Date", () => {
      dates.forEach((item) => {
        expect(relativeTime(item.value)).toBe(item.expected);
      });
    });
    it("supports value as ISO string", () => {
      dates.forEach((item) => {
        expect(relativeTime(item.value.toISOString())).toBe(item.expected);
      });
    });
    it("throws an error if the value is not a Date object or ISO string", () => {
      expect(() => relativeTime("invalid")).toThrow(/Invalid date value/);
    });

    describe("relative time formatting", () => {
      it("supports the `numeric` option", () => {
        expect(
          relativeTime(new Date(Date.now() - 1000), { numeric: "auto" }),
        ).toBe("Just now");
        expect(
          relativeTime(new Date(Date.now() - 1000 * 60), { numeric: "auto" }),
        ).toBe("1 minute ago");
      });
      it("supports the `style` option", () => {
        expect(
          relativeTime(new Date(Date.now() - 1000 * 60), { style: "long" }),
        ).toBe("1 minute ago");
        expect(
          relativeTime(new Date(Date.now() - 1000 * 60), { style: "short" }),
        ).toBe("1 min. ago");
        expect(
          relativeTime(new Date(Date.now() - 1000 * 60), { style: "narrow" }),
        ).toBe("1m ago");
      });
    });

    describe("date formatting", () => {
      it("supports date formatting options", () => {
        const args = [new Date(Date.now() - 1000 * 60 * 60 * 24), {}] as const;

        expect(relativeTime(...args, { dateStyle: "medium" })).toBe(
          "Jan 6, 2026",
        );
        expect(
          relativeTime(...args, {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
          }),
        ).toBe("Tuesday, January 6, 2026");
      });
      it("behaves according to the locale", () => {
        const args = [
          new Date(Date.now() - 1000 * 60 * 60 * 24),
          {},
          {},
        ] as const;

        expect(relativeTime(...args, "en-AU")).toBe("06/01/2026");
        expect(relativeTime(...args, "ja-JP")).toBe("2026/1/6");
        expect(relativeTime(...args, "ko-KR")).toBe("2026. 1. 6.");
      });
    });
  });
});
