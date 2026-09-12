export const BRAND_NAME = 'Presupuestapp';
export const GITHUB_REPO = 'gleguizamon/presupuestador';

/** Absolute origin of the deployed site, for robots.txt / sitemap.xml (and
 *  anything else that needs a full URL). Vercel sets
 *  `NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL` to the production domain
 *  automatically; the fallback is only hit in local/other environments —
 *  point it at the real domain before launch. */
export const SITE_ORIGIN = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
  : 'https://presupuestafy.vercel.app';

/** `SITE_ORIGIN` without the scheme — what we actually print as the discreet
 *  brand line at the foot of an exported PDF and label the toggle with. Tracks
 *  the real domain automatically once it's set in `SITE_ORIGIN`. */
export const SITE_HOST = SITE_ORIGIN.replace(/^https?:\/\//, '').replace(/\/$/, '');

/** Tally form id for the feedback popup (opened in-page via `lib/tally.ts`,
 *  never a navigation away from the app). While empty, the post-export nudge
 *  and the sidebar "Feedback" link both stay dormant — plumbing is ready, it
 *  just needs the id from the form's Tally share URL (tally.so/r/<id>). */
export const FEEDBACK_FORM_ID: string = 'lbxyzp';
