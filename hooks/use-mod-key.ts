'use client';

import * as React from 'react';

/** '⌘' on Apple platforms, 'Ctrl' elsewhere. Read once in a lazy initializer
 *  (SSR-guarded); callers only ever show it inside hover-mounted UI, so
 *  there's no hydration mismatch to worry about. */
export function useModKey() {
  const [mac] = React.useState(
    () =>
      typeof navigator !== 'undefined' &&
      /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent)
  );
  return mac ? '⌘' : 'Ctrl';
}

/** "⌘B" / "Ctrl+B" style label for a mod-key + letter shortcut. */
export function shortcutLabel(mod: string, key: string) {
  return mod === '⌘' ? `${mod}${key}` : `${mod}+${key}`;
}
