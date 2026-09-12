import type { MetadataRoute } from 'next';
import { SITE_ORIGIN } from '@/lib/constants';

/** The public, indexable pages. `/editor` is left out on
 *  purpose (see robots.ts). */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${SITE_ORIGIN}/`, lastModified, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_ORIGIN}/changelog`, lastModified, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_ORIGIN}/faqs`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_ORIGIN}/privacy`, lastModified, changeFrequency: 'yearly', priority: 0.3 }
  ];
}
