import type { MetadataRoute } from 'next';
import { SITE_ORIGIN } from '@/lib/constants';

/** Crawlers get the marketing pages; the editor/library routes are
 *  client-rendered shells with no indexable content (and share links carry
 *  their data in the URL hash, which never reaches a crawler anyway). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/editor']
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`
  };
}
