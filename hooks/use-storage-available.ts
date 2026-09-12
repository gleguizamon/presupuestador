'use client';

import * as React from 'react';
import { isStorageAvailable } from '@/lib/storage';

/** `null` while probing, then whether this browser lets the app persist
 *  documents to IndexedDB. Consumers gate autosave / the library UI on a
 *  strict `=== false` so the brief probe window doesn't flash a warning. */
export function useStorageAvailable(): boolean | null {
  const [ok, setOk] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    let alive = true;
    isStorageAvailable().then(v => {
      if (alive) setOk(v);
    });
    return () => {
      alive = false;
    };
  }, []);
  return ok;
}
