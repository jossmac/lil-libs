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
 * Returns a computed style value for regular CSS properties and CSS variables.
 *
 * @example
 * const el = document.createElement("div");
 *
 * getComputedStyle(el, "color"); // e.g. "rgb(0, 0, 0)"
 * getComputedStyle(el, "line-height"); // e.g. "normal"
 * getComputedStyle(el, "--space-10"); // custom property value
 *
 * @param element - The HTML or SVG element to get styles from.
 * @param name - CSS property name (camelCase) or `--custom-property`.
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
 * Walks up the parent chain until it finds a non-empty computed style value.
 *
 * @example
 * const parent = document.createElement("div");
 * const child = document.createElement("span");
 * parent.appendChild(child);
 *
 * nearestComputedStyle(child, "color");
 * // value from child if present, otherwise nearest parent value
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
 * Returns `true` when the device can receive touch input.
 *
 * @example
 * isTouchCapable(); // true on touch-capable devices, otherwise false
 *
 * @remarks Some devices support both touch and mouse input, such as laptop
 * computers with a touchscreen.
 */
export function isTouchCapable() {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || window.navigator.maxTouchPoints > 0;
}

/**
 * Returns `true` when the primary pointer is "coarse" (for example, touch input).
 *
 * @example
 * isTouchDevice(); // true on coarse-pointer devices, otherwise false
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
 * Returns the current display mode for browser and PWA contexts.
 *
 * Possible values: `"fullscreen"`, `"minimal-ui"`, `"picture-in-picture"`,
 * `"standalone"`, `"window-controls-overlay"`, `"browser"`.
 *
 * @example
 * getDisplayMode();
 * // e.g. "browser" in a tab, "standalone" in an installed PWA
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
 * Converts object keys to HTML `data-*` attributes.
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
 * @remarks Converts camelCase keys to kebab-case. Omits `null` and `undefined`
 * values. Omits `false` and `""` by default. Preserves `0` values. Trims
 * leading `is` from boolean-style keys by default (only when followed by an
 * uppercase letter).
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
 * Returns the aria-current value for a given pathname and href.
 *
 * @see https://www.w3.org/TR/wai-aria-1.2/#aria-current
 *
 * @example
 * ariaCurrent('/about', '/about') // 'page'
 * ariaCurrent('/about/team', '/about') // 'true'
 * ariaCurrent('/contact', '/about') // 'false'
 *
 * ariaCurrent('/about-us', '/about'); // 'false' (not a child match)
 *
 * @remarks Returns `"page"` for exact path matches. Returns `"true"` for child
 * routes. Returns `"false"` for non-matches and null pathnames. Normalizes
 * trailing slashes (except root) before matching.
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
 * Joins IDs for ARIA attributes like `aria-labelledby` and `aria-describedby`.
 *
 * @example
 * joinIds("title-id", "description-id"); // "title-id description-id"
 * joinIds("title-id", null, undefined, "", false, "description-id"); // "title-id description-id"
 * joinIds(null, undefined, "", false); // undefined
 *
 * @remarks Filters out falsy values (`null`, `undefined`, `false`, `""`). Returns
 * `undefined` when no valid IDs remain.
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
 * Returns `getBoundingClientRect()` values offset by document scroll, giving
 * absolute page coordinates.
 *
 * @example
 * const rect = getAbsoluteClientRect(document.body);
 * rect.top;
 * rect.left;
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

/** Checks whether an element has horizontal overflow. */
export function hasScrollX(el: Element) {
  return el.scrollWidth !== el.clientWidth;
}

/** Checks whether an element has vertical overflow. */
export function hasScrollY(el: Element) {
  return el.scrollHeight !== el.clientHeight;
}

// NOTE: rather than equality checks, less-than/greater-than are used because
// of elastic scrolling — the “rubber band” effect on iOS.

/**
 * Checks whether an element is at the top of its scroll range.
 *
 * @remarks Uses `<= 0` to handle elastic scrolling behavior.
 */
export function atScrollTop(el: Element) {
  return el.scrollTop <= 0;
}

/**
 * Checks whether an element is at the bottom of its scroll range.
 *
 * @remarks Uses `>=` to handle elastic scrolling behavior.
 */
export function atScrollBottom(el: Element) {
  return el.scrollTop + el.clientHeight >= el.scrollHeight;
}

/**
 * Checks whether an element is at the left edge of its scroll range.
 *
 * @remarks Uses `<= 0` to handle elastic scrolling behavior.
 */
export function atScrollLeft(el: Element) {
  return el.scrollLeft <= 0;
}

/**
 * Checks whether an element is at the right edge of its scroll range.
 *
 * @remarks Uses `>=` to handle elastic scrolling behavior.
 */
export function atScrollRight(el: Element) {
  return el.scrollLeft + el.clientWidth >= el.scrollWidth;
}
