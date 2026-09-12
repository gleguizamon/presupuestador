declare global {
  interface Window {
    Tally?: { openPopup: (formId: string) => void };
  }
}

const EMBED_SRC = 'https://tally.so/widgets/embed.js';
let scriptPromise: Promise<void> | null = null;

/** Loads Tally's embed script once (cached across calls) so `window.Tally`
 *  becomes available. Reuses an existing `<script>` tag if one is already on
 *  the page instead of injecting a duplicate. */
function loadEmbedScript(): Promise<void> {
  if (window.Tally) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${EMBED_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('No se pudo cargar Tally')));
      return;
    }
    const script = document.createElement('script');
    script.src = EMBED_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar Tally'));
    document.body.appendChild(script);
  });
  return scriptPromise;
}

/** Opens the feedback form as a popup overlay — the visitor never leaves the
 *  page. Lazily loads Tally's embed script on first use; a no-op while
 *  `formId` is unset (see `FEEDBACK_FORM_ID` in `lib/constants.ts`), and
 *  silent on load failure since this is a nudge, not a critical action. */
export async function openFeedbackPopup(formId: string) {
  if (!formId) return;
  try {
    await loadEmbedScript();
    window.Tally?.openPopup(formId);
  } catch {
    // Ignore — offline or blocked script, nothing to surface to the user.
  }
}
