/**
 * DOM utilities: element guards, queries, styles, scroll, and ARIA helpers.
 *
 * @module
 */

import type { Maybe } from "./types";

const KEYBOARD_INPUTS = new Set([
  "date",
  "datetime-local",
  "email",
  "number",
  "password",
  "search",
  "tel",
  "text",
  "time",
  "url",
]);

/**
 * Checks whether an event target is an element that can trigger the software
 * keyboard on mobile devices.
 *
 * @example
 * const textInput = document.createElement("input");
 * textInput.type = "text";
 *
 * const checkbox = document.createElement("input");
 * checkbox.type = "checkbox";
 *
 * isKeyboardInput(textInput); // true
 * isKeyboardInput(checkbox); // false
 * isKeyboardInput(document.createElement("textarea")); // true
 * isKeyboardInput(document.createElement("div")); // false
 *
 * @param target - Event target to test, typically from a DOM event's `target` property.
 * @returns `true` for text-like `<input>` types and `<textarea>` elements that open the software keyboard on mobile; `false` otherwise.
 */
export function isKeyboardInput(
  target: EventTarget | null | undefined,
): target is HTMLInputElement {
  if (isInputElement(target)) {
    return KEYBOARD_INPUTS.has(target.type);
  }

  return isHtmlElement(target) && target.tagName === "TEXTAREA";
}
function isInputElement(target: unknown): target is HTMLInputElement {
  return isHtmlElement(target) && target.tagName === "INPUT";
}

/**
 * Type guard for narrowing unknown values to `HTMLElement`.
 *
 * @example
 * const el = document.querySelector("#app");
 * if (isHtmlElement(el)) {
 *   el.tabIndex = -1;
 * }
 *
 * @param value - Unknown value to narrow (e.g. from `querySelector`).
 * @returns `true` when `value` is an `HTMLElement` instance; `false` in non-DOM environments or for other node types.
 */
export function isHtmlElement(value: unknown): value is HTMLElement {
  return typeof HTMLElement !== "undefined" && value instanceof HTMLElement;
}

/**
 * Thin wrapper around `Element.querySelector()` that qualifies the returned
 * value as an `HTMLElement`.
 *
 * @example
 * const container = document.createElement("div");
 * container.innerHTML = "<button>Save</button><svg><circle /></svg>";
 *
 * querySelector(container, "button"); // HTMLButtonElement
 * querySelector(container, "circle"); // null (non-HTMLElement)
 * querySelector(null, "button"); // null
 *
 * @param el - Root element to search within. Returns `null` when `el` is nullish.
 * @param selector - CSS selector passed to `Element.querySelector`.
 * @returns The first matching `HTMLElement`, or `null` if none is found or the match is not an `HTMLElement` (e.g. SVG elements).
 */
export function querySelector(
  el: Maybe<HTMLElement>,
  selector: string,
): HTMLElement | null {
  if (!el) return null;
  const value = el.querySelector(selector);
  return isHtmlElement(value) ? value : null;
}

/**
 * Thin wrapper around `Element.querySelectorAll()` that returns `HTMLElement[]`
 * instead of `NodeListOf<Element>`.
 *
 * @example
 * const container = document.createElement("div");
 * container.innerHTML = "<span>One</span><span>Two</span><svg><circle /></svg>";
 *
 * querySelectorAll(container, "span"); // [HTMLSpanElement, HTMLSpanElement]
 * querySelectorAll(container, "span, circle"); // spans only
 * querySelectorAll(undefined, "span"); // []
 *
 * @param el - Root element to search within. Returns `[]` when `el` is nullish.
 * @param selector - CSS selector passed to `Element.querySelectorAll`.
 * @returns All matching `HTMLElement` nodes; non-HTML matches (e.g. SVG) are filtered out.
 */
export function querySelectorAll(
  el: Maybe<HTMLElement>,
  selector: string,
): HTMLElement[] {
  if (!el) return [];

  const nodeList = el.querySelectorAll(selector);
  if (nodeList.length === 0) return [];

  return Array.from(nodeList).filter(isHtmlElement);
}

/**
 * Reads a computed style value from an element, including CSS custom properties.
 *
 * @example
 * const el = document.createElement("div");
 *
 * getComputedStyle(el, "color"); // e.g. "rgb(0, 0, 0)"
 * getComputedStyle(el, "lineHeight"); // e.g. "normal"
 * getComputedStyle(el, "--space-10"); // "" until the custom property is set
 *
 * @param element - HTML or SVG element whose computed styles to read.
 * @param name - CSS property in camelCase (e.g. `"lineHeight"`) or a custom property (e.g. `"--space-10"`).
 * @returns The computed value as a string; custom properties use `getPropertyValue`, standard properties prefer direct `CSSStyleDeclaration` access.
 */
export function getComputedStyle(
  element: HTMLElement | SVGElement,
  name: string,
): string {
  const computedStyle = window.getComputedStyle(element);

  // CSS variables must use getPropertyValue()
  if (isCssVarName(name)) {
    return computedStyle.getPropertyValue(name);
  }

  // Direct access for standard CSS properties (slightly faster than getPropertyValue)
  if (name in computedStyle) {
    return computedStyle[name as keyof CSSStyleDeclaration] as string;
  }

  // Fallback for any property not directly accessible
  return computedStyle.getPropertyValue(name);
}

function isCssVarName(name: string) {
  return name.startsWith("--") && name.length > 2;
}

/**
 * Walks up the DOM tree until a non-empty computed style value is found.
 *
 * @example
 * const parent = document.createElement("div");
 * parent.style.color = "rgb(255, 0, 0)";
 * const child = document.createElement("span");
 * parent.appendChild(child);
 *
 * nearestComputedStyle(child, "color"); // "rgb(255, 0, 0)" (inherited from parent)
 * nearestComputedStyle(null, "color"); // undefined
 *
 * @param element - Starting element, or `null` to return `undefined`.
 * @param name - CSS property or custom property name (same format as {@link getComputedStyle}).
 * @returns The first non-empty computed value on `element` or an ancestor; `undefined` when `element` is null or no ancestor has a value.
 *
 * @see {@link getComputedStyle}
 */
export function nearestComputedStyle(
  element: HTMLElement | SVGElement | null,
  name: string,
): string | undefined {
  if (!element) return undefined;
  const value = getComputedStyle(element, name);
  if (value !== "") return value;
  return nearestComputedStyle(element.parentElement, name);
}

/**
 * Returns whether the environment reports touch input support.
 *
 * Some devices support both touch and mouse input, such as laptops with a
 * touchscreen.
 *
 * @example
 * isTouchCapable(); // true on touch-capable devices, otherwise false
 *
 * @returns `true` when the environment reports touch support via `ontouchstart` or `navigator.maxTouchPoints`; `false` outside the browser.
 */
export function isTouchCapable() {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || window.navigator.maxTouchPoints > 0;
}

/**
 * Returns whether the primary pointer is coarse (typically touch input).
 *
 * @example
 * if (isTouchDevice()) {
 *   // use touch-optimised interactions
 * }
 *
 * @returns `true` when `(pointer: coarse)` matches, or when {@link isTouchCapable} succeeds as a fallback; `false` outside the browser.
 */
export function isTouchDevice() {
  if (typeof window === "undefined") return false;
  // absent in (very) old browsers and some test environments
  if ("matchMedia" in window && window.matchMedia) {
    return window.matchMedia("(pointer: coarse)").matches;
  }
  // fallback to touch capability check
  return isTouchCapable();
}

/**
 * Detects the current PWA or browser display mode via `display-mode` media queries.
 *
 * Possible values: `"fullscreen"`, `"minimal-ui"`, `"picture-in-picture"`,
 * `"standalone"`, `"window-controls-overlay"`, and `"browser"`.
 *
 * @example
 * getDisplayMode();
 * // e.g. "browser" in a tab, "standalone" in an installed PWA
 *
 * @returns The current `display-mode` (`"fullscreen"`, `"standalone"`, etc.), or `"browser"` when no media query matches or outside the browser.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/display-mode
 */
export function getDisplayMode() {
  if (typeof window === "undefined") return "browser";

  const { matchMedia } = window;
  if (matchMedia("(display-mode: fullscreen)").matches) return "fullscreen";
  if (matchMedia("(display-mode: minimal-ui)").matches) return "minimal-ui";
  if (matchMedia("(display-mode: picture-in-picture)").matches)
    return "picture-in-picture";
  if (matchMedia("(display-mode: standalone)").matches) return "standalone";
  if (matchMedia("(display-mode: window-controls-overlay)").matches)
    return "window-controls-overlay";

  return "browser";
}

/**
 * Maps object properties to `data-*` attributes for DOM elements.
 *
 * CamelCase keys become kebab-case. Omits `null` and `undefined` values, and omits
 * `false` and `""` by default. Preserves `0`. Trims a leading `is` from
 * boolean-style keys by default (only when followed by an uppercase letter).
 *
 * @example
 * toDataAttributes({
 *   isSelected: true,
 *   panelIndex: 2,
 *   count: 0,
 *   empty: "",
 * });
 * // {
 * //   "data-selected": true,
 * //   "data-panel-index": 2,
 * //   "data-count": 0,
 * // }
 *
 * toDataAttributes({ isHidden: false, label: "Save" }, { omitFalsyValues: false });
 * // { "data-hidden": false, "data-label": "Save" }
 *
 * @param props - Object whose keys become `data-*` attribute names (camelCase → kebab-case).
 * @param options - Controls omission of falsy values and trimming of `is*` prefixes from boolean-style keys.
 * @returns A record of `data-*` keys to values ready for spreading onto a DOM element.
 */
export function toDataAttributes<T extends object>(
  props: T,
  options: {
    /**
     * Omit props with values of `false` and `""`. Nullish values are always
     * omitted, and values of `0` are valid in this situation.
     * @default true
     */
    omitFalsyValues?: boolean;
    /**
     * Removes the `is*` prefix from keys, if present.
     * @default true
     */
    trimBooleanKeys?: boolean;
  } = {},
) {
  const { omitFalsyValues = true, trimBooleanKeys = true } = options;

  const dataAttributes: Record<string, T[keyof T] | undefined> = {};

  for (const key in props) {
    let prop: string = key;
    const value = props[key];

    // Always bail if the value is nullish; it'll never make it to the DOM node
    // so there's no point doing any more work.
    // A value of `0` isn't really falsy in this case so it's not included in
    // the optional check.
    if (
      value == null ||
      (omitFalsyValues && (value === false || value === ""))
    ) {
      continue;
    }

    // Lowercase the first letter of the remaining key so it isn't affected by
    // the kebab-case conversion later.
    if (
      trimBooleanKeys &&
      key.startsWith("is") &&
      key[2] === key[2]?.toUpperCase()
    ) {
      prop = prop.charAt(2).toLowerCase() + prop.slice(3);
    }

    prop = prop.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);

    dataAttributes[`data-${prop}`] = value;
  }

  return dataAttributes;
}

/**
 * Determines the appropriate `aria-current` value for a link href against the
 * current pathname.
 *
 * Returns `"page"` for exact matches, `"true"` for child routes (for example
 * `/about/team` under `/about`), and `"false"` otherwise. Trailing slashes are
 * normalized (except for root `/`).
 *
 * @see https://www.w3.org/TR/wai-aria-1.2/#aria-current
 *
 * @example
 * ariaCurrent("/about", "/about"); // "page"
 * ariaCurrent("/about/team", "/about"); // "true"
 * ariaCurrent("/about-us", "/about"); // "false" (prefix match, not a child route)
 * ariaCurrent("/contact", "/about"); // "false"
 * ariaCurrent(null, "/about"); // "false"
 *
 * @param pathname - Current route pathname to test, or `null` for `"false"`.
 * @param href - Link href to compare against; trailing slashes are normalized (except root `/`).
 * @returns `"page"` for an exact match, `"true"` when `pathname` is a child route of `href`, otherwise `"false"`.
 */
export function ariaCurrent(pathname: string | null, href: string) {
  if (!pathname) return "false";

  const normalizedPathname = normalizePath(pathname);
  const normalizedHref = normalizePath(href);

  // only exact matches receive "page"
  // https://www.w3.org/TR/wai-aria-1.2/#aria-current
  if (normalizedPathname === normalizedHref) return "page";

  // pathname is a child of href
  if (href !== "/" && normalizedPathname.startsWith(normalizedHref)) {
    // avoid substring matches
    const nextChar = normalizedPathname.charAt(normalizedHref.length);
    if (nextChar === "/" || nextChar === "") {
      return "true";
    }
  }

  return "false";
}

/** Remove trailing slashes, except for root. */
function normalizePath(path: string) {
  return path === "/" ? path : path.replace(/\/$/, "");
}

/**
 * Joins element IDs into a space-separated string for ARIA reference attributes.
 *
 * Filters out falsy values (`null`, `undefined`, `false`, `""`).
 *
 * @example
 * joinIds("title-id", "description-id"); // "title-id description-id"
 * joinIds("title-id", null, undefined, "", false, "description-id"); // "title-id description-id"
 * joinIds(null, undefined, "", false); // undefined
 *
 * @param ids - Element IDs to join; `null`, `undefined`, `false`, and `""` are filtered out.
 * @returns A space-separated ID string for `aria-labelledby` / `aria-describedby`, or `undefined` when no valid IDs remain.
 */
export function joinIds(...ids: (string | undefined | null | false)[]) {
  // cheap length check before filtering
  if (!ids || ids.length === 0) {
    return undefined;
  }

  const filteredIds = ids.filter(Boolean);
  if (filteredIds.length === 0) {
    return undefined;
  }

  return filteredIds.join(" ");
}

// Scroll ----------------------------------------------------------------------

/**
 * Returns `getBoundingClientRect()` coordinates adjusted for page scroll position.
 *
 * @example
 * const el = document.createElement("div");
 * document.body.appendChild(el);
 * window.scrollTo(0, 100);
 *
 * const rect = getAbsoluteClientRect(el);
 * rect.top; // viewport top + window.scrollY
 * rect.left; // viewport left + window.scrollX
 *
 * @param el - Element to measure.
 * @returns A `DOMRect`-like object with `top`, `left`, etc. offset by `window.scrollX` / `window.scrollY` for page coordinates.
 */
export function getAbsoluteClientRect(el: Element) {
  const rect = el.getBoundingClientRect();
  return {
    height: rect.height,
    width: rect.width,
    top: rect.top + window.scrollY,
    right: rect.right + window.scrollX,
    bottom: rect.bottom + window.scrollY,
    left: rect.left + window.scrollX,
    x: rect.x + window.scrollX,
    y: rect.y + window.scrollY,
  };
}

/**
 * Checks whether an element has horizontal overflow.
 *
 * @example
 * hasScrollX(el); // true when el.scrollWidth > el.clientWidth
 *
 * @param el - Element to inspect.
 * @returns `true` when `scrollWidth` exceeds `clientWidth`.
 */
export function hasScrollX(el: Element) {
  return el.scrollWidth !== el.clientWidth;
}

/**
 * Checks whether an element has vertical overflow.
 *
 * @example
 * hasScrollY(el); // true when el.scrollHeight > el.clientHeight
 *
 * @param el - Element to inspect.
 * @returns `true` when `scrollHeight` exceeds `clientHeight`.
 */
export function hasScrollY(el: Element) {
  return el.scrollHeight !== el.clientHeight;
}

// NOTE: rather than equality checks, less-than/greater-than are used because
// of elastic scrolling — the “rubber band” effect on iOS.

/**
 * Checks whether an element is at the top of its scroll range.
 *
 * Uses `<= 0` rather than strict equality to account for elastic overscroll on iOS.
 *
 * @example
 * atScrollTop(scrollable); // true when scrollTop <= 0
 *
 * @param el - Scrollable element to inspect.
 * @returns `true` when the element is at the top of its scroll range.
 */
export function atScrollTop(el: Element) {
  return el.scrollTop <= 0;
}

/**
 * Checks whether an element is at the bottom of its scroll range.
 *
 * Uses `>=` rather than strict equality to account for elastic overscroll on iOS.
 *
 * @example
 * atScrollBottom(scrollable); // true when scrolled to the bottom edge
 *
 * @param el - Scrollable element to inspect.
 * @returns `true` when the element is at the bottom of its scroll range.
 */
export function atScrollBottom(el: Element) {
  return el.scrollTop + el.clientHeight >= el.scrollHeight;
}

/**
 * Checks whether an element is at the left edge of its scroll range.
 *
 * Uses `<= 0` rather than strict equality to account for elastic overscroll on iOS.
 *
 * @example
 * atScrollLeft(scrollable); // true when scrollLeft <= 0
 *
 * @param el - Scrollable element to inspect.
 * @returns `true` when the element is at the left edge of its scroll range.
 */
export function atScrollLeft(el: Element) {
  return el.scrollLeft <= 0;
}

/**
 * Checks whether an element is at the right edge of its scroll range.
 *
 * Uses `>=` rather than strict equality to account for elastic overscroll on iOS.
 *
 * @example
 * atScrollRight(scrollable); // true when scrolled to the right edge
 *
 * @param el - Scrollable element to inspect.
 * @returns `true` when the element is at the right edge of its scroll range.
 */
export function atScrollRight(el: Element) {
  return el.scrollLeft + el.clientWidth >= el.scrollWidth;
}
