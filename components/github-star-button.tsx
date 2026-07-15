import { Star } from 'lucide-react';
import { BRAND_NAME, GITHUB_REPO } from '@/lib/constants';

async function getStars() {
  // Revalida los datos cada 3600 segundos (1 hora) para no saturar la API
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
    next: { revalidate: 3600 }
  });

  if (!res.ok) return 0;
  const data = await res.json();
  return data.stargazers_count;
}

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      focusable="false"
      role="img"
    >
      <title>GitHub</title>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

const formatCompact = (number: number) => {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(number);
};

/**
 * Compact star count for the header. Links to the repo and shows the live
 * count when known. The star icon nudges the click that grows the number.
 */
export default async function GithubStarButton() {
  const stars = await getStars();
  return (
    <a
      href={`https://github.com/${GITHUB_REPO}`}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={`Star ${BRAND_NAME} on GitHub`}
      className="bg-card/60 text-muted-foreground hover:text-foreground hidden items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors sm:inline-flex"
    >
      <GitHubMark className="size-4" />
      <Star className="size-3.5 text-amber-500" aria-hidden />
      <span className="tabular-nums">{stars != null ? formatCompact(stars) : 'Star'}</span>
    </a>
  );
}
