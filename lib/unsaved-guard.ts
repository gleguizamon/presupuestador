'use client';

/** Cross-component signal for "leaving now loses in-memory work" — set by the
 *  editor while it's in degraded storage mode with an edited document.
 *
 *  `beforeunload` covers refresh / tab close / address-bar / external links,
 *  but NOT client-side App Router navigations (`next/link`, `router.push`).
 *  Those need an explicit check: link clicks go through the capturing
 *  interceptor the editor installs; a programmatic nav (the sidebar's "Nuevo
 *  documento" button) calls `confirmLeave()` itself. */

export const DISCARD_MESSAGE =
  'Este navegador no puede guardar. Si salís de esta página, perdés el presupuesto que armaste.';

let atRisk = false;

export function setUnsavedAtRisk(value: boolean) {
  atRisk = value;
}

export function unsavedAtRisk() {
  return atRisk;
}

/** Synchronous gate for a programmatic navigation. Returns true to proceed. */
export function confirmLeave() {
  return !atRisk || window.confirm(DISCARD_MESSAGE);
}
