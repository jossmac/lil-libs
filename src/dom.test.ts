// @vitest-environment jsdom

import {
  afterEach,
  describe,
  expect,
  expectTypeOf,
  it,
  test,
  vi,
} from "vitest";

import {
  ariaCurrent,
  atScrollBottom,
  atScrollLeft,
  atScrollRight,
  atScrollTop,
  getAbsoluteClientRect,
  getComputedStyle as getDomComputedStyle,
  getDisplayMode,
  hasScrollX,
  hasScrollY,
  isHtmlElement,
  isKeyboardInput,
  isTouchCapable,
  isTouchDevice,
  joinIds,
  nearestComputedStyle,
  querySelector,
  querySelectorAll,
  toDataAttributes,
} from "./dom";

function createMockElement(props: {
  scrollWidth?: number;
  clientWidth?: number;
  scrollHeight?: number;
  clientHeight?: number;
  scrollTop?: number;
  scrollLeft?: number;
}): Element {
  return {
    scrollWidth: props.scrollWidth ?? 0,
    clientWidth: props.clientWidth ?? 0,
    scrollHeight: props.scrollHeight ?? 0,
    clientHeight: props.clientHeight ?? 0,
    scrollTop: props.scrollTop ?? 0,
    scrollLeft: props.scrollLeft ?? 0,
  } as Element;
}

describe("utils/dom", () => {
  describe("isHtmlElement", () => {
    it("returns true for HTML elements", () => {
      expect(isHtmlElement(document.createElement("div"))).toBe(true);
      expect(isHtmlElement(document.createElement("span"))).toBe(true);
      expect(isHtmlElement(document.createElement("input"))).toBe(true);
    });
    it("returns false for non-HTML values", () => {
      expect(isHtmlElement(null)).toBe(false);
      expect(isHtmlElement(undefined)).toBe(false);
      expect(isHtmlElement("string")).toBe(false);
      expect(isHtmlElement(42)).toBe(false);
      expect(isHtmlElement({})).toBe(false);
    });
    it("narrows the type to HTMLElement", () => {
      const value: unknown = document.createElement("div");
      if (isHtmlElement(value)) {
        expectTypeOf(value).toEqualTypeOf<HTMLElement>();
      }
    });
  });

  describe("querySelector", () => {
    it("should match `Element.querySelector` runtime behavior", () => {
      const el = document.createElement("div");
      expect(querySelector(el, "span")).toBeNull();
      el.innerHTML = "<span>Hello World</span>";
      expect(querySelector(el, "span")).toEqual(el.querySelector("span"));
    });
    it("should return null for nullish elements", () => {
      expect(querySelector(null, "span")).toBeNull();
      expect(querySelector(undefined, "span")).toBeNull();
    });
    it("should return null for non-HTMLElement matches", () => {
      const el = document.createElement("div");
      el.innerHTML = "<svg><circle /></svg>";
      expect(querySelector(el, "circle")).toBeNull();
    });
    it("should qualify the return value as an HTMLElement", () => {
      const el = document.createElement("div");
      el.innerHTML = "<span>Hello World</span>";
      expectTypeOf(
        querySelector(el, "span"),
      ).toEqualTypeOf<HTMLElement | null>();
    });
  });

  describe("querySelectorAll", () => {
    it("should match `Element.querySelectorAll` runtime behavior", () => {
      const el = document.createElement("div");
      el.innerHTML = "<span>Hello</span><span>World</span>";
      expect(querySelectorAll(el, "span")).toEqual(
        Array.from(el.querySelectorAll("span")),
      );
    });
    it("should return an empty array for nullish elements", () => {
      expect(querySelectorAll(null, "span")).toEqual([]);
      expect(querySelectorAll(undefined, "span")).toEqual([]);
    });
    it("should return an empty array when no matches exist", () => {
      const el = document.createElement("div");
      expect(querySelectorAll(el, "span")).toEqual([]);
    });
    it("should exclude non-HTMLElement matches", () => {
      const el = document.createElement("div");
      el.innerHTML = "<span>text</span><svg><circle /></svg>";
      const results = querySelectorAll(el, "span, circle");
      expect(results).toHaveLength(1);
      expect(results[0]?.tagName).toBe("SPAN");
    });
    it("should convert the return value to an array of HTMLElements", () => {
      const el = document.createElement("div");
      el.innerHTML = "<span>Hello</span><span>World</span>";
      expectTypeOf(querySelectorAll(el, "span")).toEqualTypeOf<HTMLElement[]>();
    });
  });

  describe("toDataAttributes", () => {
    test("converts simple object to data attributes", () => {
      const input = { foo: "bar", hello: "world" };
      expect(toDataAttributes(input)).toEqual({
        "data-foo": "bar",
        "data-hello": "world",
      });
    });

    test("omits null and undefined values", () => {
      const input = { n: null, u: undefined, valid: true };
      expect(toDataAttributes(input)).toEqual({ "data-valid": true });
    });

    test("converts camelCase keys to kebab-case", () => {
      const input = {
        camelCase: "value",
        thisIsALongKey: "test",
        anotherCamelCase: "example",
      };
      expect(toDataAttributes(input)).toEqual({
        "data-camel-case": "value",
        "data-this-is-a-long-key": "test",
        "data-another-camel-case": "example",
      });
    });

    test('omits "falsy" values, by default', () => {
      const input = { foo: false, bar: 0, baz: null, qux: "" };
      expect(toDataAttributes(input)).toEqual({ "data-bar": 0 });
    });
    test('includes "falsy" values, when requested', () => {
      const input = { foo: false, bar: 0, baz: null, qux: "" };
      expect(toDataAttributes(input, { omitFalsyValues: false })).toEqual({
        "data-foo": false,
        "data-bar": 0,
        "data-qux": "",
      });
    });

    test("trims boolean keys, by default", () => {
      const input = { isEnabled: true, isSelected: true, isolated: true };
      expect(toDataAttributes(input)).toEqual({
        "data-enabled": true,
        "data-selected": true,
        "data-isolated": true,
      });
    });
    test("leaves boolean keys untouched, when requested", () => {
      const input = { isEnabled: true, isSelected: true, isolated: true };
      expect(toDataAttributes(input, { trimBooleanKeys: false })).toEqual({
        "data-is-enabled": true,
        "data-is-selected": true,
        "data-isolated": true,
      });
    });
  });

  describe("ariaCurrent", () => {
    it('returns "page" when pathname matches href exactly', () => {
      expect(ariaCurrent("/about", "/about")).toBe("page");
      expect(ariaCurrent("/products", "/products")).toBe("page");
    });

    it('returns "true" when pathname is a child of href', () => {
      expect(ariaCurrent("/about/team", "/about")).toBe("true");
      expect(ariaCurrent("/products/featured/123", "/products")).toBe("true");
      expect(ariaCurrent("/docs/api/getting-started", "/docs")).toBe("true");
    });

    it('returns "false" when pathname does not match href', () => {
      expect(ariaCurrent("/about", "/contact")).toBe("false");
      expect(ariaCurrent("/products", "/services")).toBe("false");
      expect(ariaCurrent(null, "/about")).toBe("false");
    });

    it("handles substrings correctly", () => {
      expect(ariaCurrent("/about-us", "/about")).toBe("false");
      expect(ariaCurrent("/dashboard", "/dash")).toBe("false");
    });
    it("handles root path correctly", () => {
      expect(ariaCurrent("/about", "/")).toBe("false");
      expect(ariaCurrent("/", "/")).toBe("page");
    });
    it("handles trailing slashes consistently", () => {
      expect(ariaCurrent("/about/", "/about")).toBe("page");
      expect(ariaCurrent("/about", "/about/")).toBe("page");
      expect(ariaCurrent("/about/foo", "/about/")).toBe("true");
      expect(ariaCurrent("/about/", "/about/foo")).toBe("false");
    });
  });

  describe("joinIds", () => {
    it("joins multiple valid IDs with spaces", () => {
      expect(joinIds("foo", "bar", "baz")).toBe("foo bar baz");
    });
    it("handles single ID correctly", () => {
      expect(joinIds("singleId")).toBe("singleId");
    });
    it("filters out falsy values", () => {
      expect(joinIds("foo", null, "bar", undefined, "", "baz", false)).toBe(
        "foo bar baz",
      );
    });

    it("returns undefined when no IDs are provided", () => {
      expect(joinIds()).toBeUndefined();
    });
    it("returns undefined when args is empty", () => {
      expect(joinIds(...[])).toBeUndefined();
    });
    it("returns undefined when all values are falsy", () => {
      expect(joinIds(null, undefined, "", false)).toBeUndefined();
    });
  });

  describe("isKeyboardInput", () => {
    it("returns true for keyboard-capable input types", () => {
      const keyboardTypes = [
        "text",
        "email",
        "password",
        "number",
        "search",
        "tel",
        "url",
        "date",
        "datetime-local",
        "time",
      ];
      for (const type of keyboardTypes) {
        const input = document.createElement("input");
        input.type = type;
        expect(isKeyboardInput(input)).toBe(true);
      }
    });

    it("returns false for non-keyboard input types", () => {
      const nonKeyboardTypes = [
        "button",
        "checkbox",
        "radio",
        "range",
        "file",
        "submit",
      ];
      for (const type of nonKeyboardTypes) {
        const input = document.createElement("input");
        input.type = type;
        expect(isKeyboardInput(input)).toBe(false);
      }
    });

    it("returns true for textarea elements", () => {
      expect(isKeyboardInput(document.createElement("textarea"))).toBe(true);
    });

    it("returns false for null and undefined", () => {
      expect(isKeyboardInput(null)).toBe(false);
      expect(isKeyboardInput(undefined)).toBe(false);
    });

    it("returns false for non-input elements", () => {
      expect(isKeyboardInput(document.createElement("div"))).toBe(false);
      expect(isKeyboardInput(document.createElement("span"))).toBe(false);
    });
  });

  describe("getComputedStyle", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("reads CSS variable via getPropertyValue", () => {
      const el = document.createElement("div");
      const getPropertyValue = vi.fn().mockReturnValue("40px");

      vi.spyOn(window, "getComputedStyle").mockReturnValue({
        getPropertyValue,
      } as unknown as CSSStyleDeclaration);

      expect(getDomComputedStyle(el, "--space-10")).toBe("40px");
      expect(getPropertyValue).toHaveBeenCalledWith("--space-10");
    });

    it("reads standard property via direct access", () => {
      const el = document.createElement("div");

      vi.spyOn(window, "getComputedStyle").mockReturnValue({
        color: "rgb(255, 0, 0)",
        getPropertyValue: vi.fn(),
      } as unknown as CSSStyleDeclaration);

      expect(getDomComputedStyle(el, "color")).toBe("rgb(255, 0, 0)");
    });

    it("falls back to getPropertyValue for inaccessible properties", () => {
      const el = document.createElement("div");
      const getPropertyValue = vi.fn().mockReturnValue("16px");

      vi.spyOn(window, "getComputedStyle").mockReturnValue({
        getPropertyValue,
      } as unknown as CSSStyleDeclaration);

      expect(getDomComputedStyle(el, "line-height")).toBe("16px");
      expect(getPropertyValue).toHaveBeenCalledWith("line-height");
    });
  });

  describe("nearestComputedStyle", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("walks parent chain to find nearest value", () => {
      const parent = document.createElement("div");
      const child = document.createElement("span");
      parent.append(child);

      vi.spyOn(window, "getComputedStyle").mockImplementation(
        (el) =>
          ({
            color: el === child ? "" : "rgb(0, 0, 255)",
            getPropertyValue: vi.fn(),
          }) as unknown as CSSStyleDeclaration,
      );

      expect(nearestComputedStyle(child, "color")).toBe("rgb(0, 0, 255)");
    });

    it("returns value from element itself when present", () => {
      const el = document.createElement("div");

      vi.spyOn(window, "getComputedStyle").mockReturnValue({
        color: "rgb(255, 0, 0)",
        getPropertyValue: vi.fn(),
      } as unknown as CSSStyleDeclaration);

      expect(nearestComputedStyle(el, "color")).toBe("rgb(255, 0, 0)");
    });

    it("returns undefined for null element", () => {
      expect(nearestComputedStyle(null, "color")).toBeUndefined();
    });
  });

  describe("isTouchCapable", () => {
    afterEach(() => {
      Reflect.deleteProperty(window, "ontouchstart");
      Object.defineProperty(window.navigator, "maxTouchPoints", {
        value: 0,
        configurable: true,
      });
    });

    it("returns true when ontouchstart is present", () => {
      Object.defineProperty(window, "ontouchstart", {
        value: null,
        configurable: true,
      });
      expect(isTouchCapable()).toBe(true);
    });

    it("returns true when maxTouchPoints is greater than 0", () => {
      Object.defineProperty(window.navigator, "maxTouchPoints", {
        value: 2,
        configurable: true,
      });
      expect(isTouchCapable()).toBe(true);
    });

    it("returns false when no touch support is available", () => {
      Object.defineProperty(window.navigator, "maxTouchPoints", {
        value: 0,
        configurable: true,
      });
      expect(isTouchCapable()).toBe(false);
    });
  });

  describe("isTouchDevice", () => {
    const originalMatchMedia = window.matchMedia;

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
    });

    it("returns true when coarse pointer media query matches", () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: true });
      expect(isTouchDevice()).toBe(true);
    });

    it("returns false when coarse pointer media query does not match", () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: false });
      expect(isTouchDevice()).toBe(false);
    });

    it("falls back to isTouchCapable when matchMedia is unavailable", () => {
      window.matchMedia = undefined as unknown as typeof window.matchMedia;
      expect(isTouchDevice()).toBe(isTouchCapable());
    });
  });

  describe("getDisplayMode", () => {
    const originalMatchMedia = window.matchMedia;

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
    });

    it.each([
      ["fullscreen", "(display-mode: fullscreen)"],
      ["minimal-ui", "(display-mode: minimal-ui)"],
      ["picture-in-picture", "(display-mode: picture-in-picture)"],
      ["standalone", "(display-mode: standalone)"],
      ["window-controls-overlay", "(display-mode: window-controls-overlay)"],
    ] as const)('returns "%s" when matching media query', (expected, query) => {
      window.matchMedia = vi.fn().mockImplementation((q: string) => ({
        matches: q === query,
      }));
      expect(getDisplayMode()).toBe(expected);
    });

    it('returns "browser" when no display mode matches', () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: false });
      expect(getDisplayMode()).toBe("browser");
    });

    it("respects priority order (first match wins)", () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches:
          query === "(display-mode: fullscreen)" ||
          query === "(display-mode: standalone)",
      }));
      expect(getDisplayMode()).toBe("fullscreen");
    });
  });

  describe("getAbsoluteClientRect", () => {
    const originalScrollX = window.scrollX;
    const originalScrollY = window.scrollY;

    afterEach(() => {
      vi.restoreAllMocks();
      Object.defineProperty(window, "scrollX", {
        value: originalScrollX,
        configurable: true,
      });
      Object.defineProperty(window, "scrollY", {
        value: originalScrollY,
        configurable: true,
      });
    });

    it("returns absolute client rect with scroll offsets", () => {
      const el = document.createElement("div");
      vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
        x: 5,
        y: 6,
        top: 10,
        right: 20,
        bottom: 30,
        left: 4,
        width: 16,
        height: 24,
        toJSON: () => ({}),
      });

      Object.defineProperty(window, "scrollX", {
        value: 100,
        configurable: true,
      });
      Object.defineProperty(window, "scrollY", {
        value: 200,
        configurable: true,
      });

      expect(getAbsoluteClientRect(el)).toEqual({
        height: 24,
        width: 16,
        top: 210,
        right: 120,
        bottom: 230,
        left: 104,
        x: 105,
        y: 206,
      });
    });
  });

  // Scroll helpers

  describe("hasScrollX", () => {
    it("returns true when element has horizontal scroll", () => {
      const el = createMockElement({
        scrollWidth: 200,
        clientWidth: 100,
      });
      expect(hasScrollX(el)).toBe(true);
    });

    it("returns false when element has no horizontal scroll", () => {
      const el = createMockElement({
        scrollWidth: 100,
        clientWidth: 100,
      });
      expect(hasScrollX(el)).toBe(false);
    });

    it("handles zero dimensions", () => {
      const el = createMockElement({
        scrollWidth: 0,
        clientWidth: 0,
      });
      expect(hasScrollX(el)).toBe(false);
    });
  });

  describe("hasScrollY", () => {
    it("returns true when element has vertical scroll", () => {
      const el = createMockElement({
        scrollHeight: 300,
        clientHeight: 150,
      });
      expect(hasScrollY(el)).toBe(true);
    });

    it("returns false when element has no vertical scroll", () => {
      const el = createMockElement({
        scrollHeight: 150,
        clientHeight: 150,
      });
      expect(hasScrollY(el)).toBe(false);
    });

    it("handles zero dimensions", () => {
      const el = createMockElement({
        scrollHeight: 0,
        clientHeight: 0,
      });
      expect(hasScrollY(el)).toBe(false);
    });
  });

  describe("atScrollTop", () => {
    it("returns true when scrollTop is 0", () => {
      const el = createMockElement({ scrollTop: 0 });
      expect(atScrollTop(el)).toBe(true);
    });

    it("returns true when scrollTop is negative (elastic scrolling)", () => {
      const el = createMockElement({ scrollTop: -10 });
      expect(atScrollTop(el)).toBe(true);
    });

    it("returns false when scrollTop is positive", () => {
      const el = createMockElement({ scrollTop: 50 });
      expect(atScrollTop(el)).toBe(false);
    });

    it("handles small positive values", () => {
      const el = createMockElement({ scrollTop: 1 });
      expect(atScrollTop(el)).toBe(false);
    });
  });

  describe("atScrollBottom", () => {
    it("returns true when scrolled to bottom exactly", () => {
      const el = createMockElement({
        scrollTop: 100,
        clientHeight: 150,
        scrollHeight: 250,
      });
      expect(atScrollBottom(el)).toBe(true);
    });

    it("returns true when scrolled past bottom (elastic scrolling)", () => {
      const el = createMockElement({
        scrollTop: 110,
        clientHeight: 150,
        scrollHeight: 250,
      });
      expect(atScrollBottom(el)).toBe(true);
    });

    it("returns false when not at bottom", () => {
      const el = createMockElement({
        scrollTop: 50,
        clientHeight: 150,
        scrollHeight: 250,
      });
      expect(atScrollBottom(el)).toBe(false);
    });

    it("returns true when content fits exactly in container", () => {
      const el = createMockElement({
        scrollTop: 0,
        clientHeight: 200,
        scrollHeight: 200,
      });
      expect(atScrollBottom(el)).toBe(true);
    });
  });

  describe("atScrollLeft", () => {
    it("returns true when scrollLeft is 0", () => {
      const el = createMockElement({ scrollLeft: 0 });
      expect(atScrollLeft(el)).toBe(true);
    });

    it("returns true when scrollLeft is negative (elastic scrolling)", () => {
      const el = createMockElement({ scrollLeft: -15 });
      expect(atScrollLeft(el)).toBe(true);
    });

    it("returns false when scrollLeft is positive", () => {
      const el = createMockElement({ scrollLeft: 25 });
      expect(atScrollLeft(el)).toBe(false);
    });

    it("handles small positive values", () => {
      const el = createMockElement({ scrollLeft: 1 });
      expect(atScrollLeft(el)).toBe(false);
    });
  });

  describe("atScrollRight", () => {
    it("returns true when scrolled to right exactly", () => {
      const el = createMockElement({
        scrollLeft: 100,
        clientWidth: 150,
        scrollWidth: 250,
      });
      expect(atScrollRight(el)).toBe(true);
    });

    it("returns true when scrolled past right (elastic scrolling)", () => {
      const el = createMockElement({
        scrollLeft: 120,
        clientWidth: 150,
        scrollWidth: 250,
      });
      expect(atScrollRight(el)).toBe(true);
    });

    it("returns false when not at right", () => {
      const el = createMockElement({
        scrollLeft: 50,
        clientWidth: 150,
        scrollWidth: 250,
      });
      expect(atScrollRight(el)).toBe(false);
    });

    it("returns true when content fits exactly in container", () => {
      const el = createMockElement({
        scrollLeft: 0,
        clientWidth: 200,
        scrollWidth: 200,
      });
      expect(atScrollRight(el)).toBe(true);
    });
  });
});
