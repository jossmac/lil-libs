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
 * Checks if the given `target` is an HTMLInputElement that can invoke the
 * software keyboard on touch devices.
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
 * Checks if the given value is an HTML element. Helps with type inference
 * quirks when working with DOM element APIs.
 *
 * @example
 * let el = document.querySelector(...)
 * if (el) el.tabIndex = -1 // Property 'tabIndex' does not exist on type 'Element'
 *
 * let el = document.querySelector(...)
 * if (isHtmlElement(el)) el.tabIndex = -1 // No error!
 */
export function isHtmlElement(value: unknown): value is HTMLElement {
  return typeof HTMLElement !== "undefined" && value instanceof HTMLElement;
}

/**
 * Thin wrapper around the `Element.querySelector()` method, which qualifies the
 * returned value as an HTMLElement.
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
 * Thin wrapper around the `Element.querySelectorAll()` method, which transforms the
 * NodeList of Elements into an array of HTMLElements.
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
 * Gets the computed style value for a CSS property on an element.
 * Handles both standard CSS properties and CSS custom properties (variables).
 *
 * @param element - The HTML or SVG element to get styles from
 * @param name - The CSS property name (camelCase for standard properties, --name for CSS variables)
 * @returns The computed style value as a string
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
 * Walks up the DOM tree to find the nearest computed style value for a given
 * CSS property.
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
 * Returns true if the device is capable of touch input.
 *
 * @note Some devices support both touch and mouse input, such as laptop computers
 * with a touchscreen.
 */
export function isTouchCapable() {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || window.navigator.maxTouchPoints > 0;
}

/**
 * Returns true if the primary input mechanism includes a pointing device of
 * limited accuracy, such as a finger on a touchscreen.
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
 * Returns the display mode of the current page. For PWA instances, this will
 * return 'standalone' if the page is running in a standalone app.
 *
 * @note Assumes 'browser' if the `window` object is not yet available.
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
 * Transforms an object of properties into HTML data attributes. Basically just
 * converts keys to kebab-case, with some optimisations and extra functionality.
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
 * @param pathname - The current pathname.
 * @param href - The item's href.
 * @returns 'page' if the pathname exactly matches the href, 'true' if the pathname is a child of the href, and 'false' otherwise.
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
 * Thin wrapper around `join()` that filters out “falsy” values and returns
 * `undefined` if the result is empty.
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
 * A thin wrapper around `Element.getBoundingClientRect()` that offsets the
 * current document scroll, returning an object with absolute coordinates.
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

/** Check if an element has horizontal scroll. */
export function hasScrollX(el: Element) {
  return el.scrollWidth !== el.clientWidth;
}
/** Check if an element has vertical scroll. */
export function hasScrollY(el: Element) {
  return el.scrollHeight !== el.clientHeight;
}

// NOTE: rather than equality checks, less-than/greater-than are used because
// of elastic scrolling — the “rubber band” effect on iOS.

/** Check if an element is scrolled to the top. */
export function atScrollTop(el: Element) {
  return el.scrollTop <= 0;
}
/** Check if an element is scrolled to the bottom. */
export function atScrollBottom(el: Element) {
  return el.scrollTop + el.clientHeight >= el.scrollHeight;
}
/** Check if an element is scrolled to the left. */
export function atScrollLeft(el: Element) {
  return el.scrollLeft <= 0;
}
/** Check if an element is scrolled to the right. */
export function atScrollRight(el: Element) {
  return el.scrollLeft + el.clientWidth >= el.scrollWidth;
}
