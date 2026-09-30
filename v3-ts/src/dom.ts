/* ==========================================================================
   dom.ts — DOM lookups that strict mode accepts (module 3, day 2)
   --------------------------------------------------------------------------
   With strictNullChecks, querySelector() returns `Element | null`, and
   event.target is `EventTarget | null`. The quick fix everybody reaches for
   is `as HTMLInputElement` or a `!` — both are promises the compiler cannot
   check. These helpers check with instanceof instead, so a renamed id or a
   wrong tag fails loudly at the line that caused it.
   ========================================================================== */

/** Any DOM constructor: HTMLInputElement, HTMLUListElement, ... */
type ElementType<T extends Element> = { new (): T; prototype: T };

/** A required element: throws if it is missing or of the wrong kind. */
export function $<T extends Element>(
  selector: string,
  type: ElementType<T>,
  parent: ParentNode = document
): T {
  const found = parent.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`Expected ${type.name} for "${selector}", got ${found ? found.tagName : 'nothing'}`);
  }
  return found;
}

/** An optional element: null when missing, never the wrong kind. */
export function $maybe<T extends Element>(
  selector: string,
  type: ElementType<T>,
  parent: ParentNode = document
): T | null {
  const found = parent.querySelector(selector);
  return found instanceof type ? found : null;
}

/**
 * Event delegation, typed: the element matching `selector` that the event
 * came from, or null. event.target can be a text node or even window, so it
 * has to be narrowed to Element before closest() is available.
 */
export function closestTo<T extends Element>(
  event: Event,
  selector: string,
  type: ElementType<T>
): T | null {
  const { target } = event;
  if (!(target instanceof Element)) return null;
  const found = target.closest(selector);
  return found instanceof type ? found : null;
}

/** Reads data-id from the nearest [data-id] ancestor. DOM data is always a string. */
export function idFrom(element: Element): number | null {
  const holder = element.closest('[data-id]');
  if (!(holder instanceof HTMLElement)) return null;
  const id = Number(holder.dataset.id); // undefined -> NaN, caught below
  return Number.isInteger(id) ? id : null;
}
