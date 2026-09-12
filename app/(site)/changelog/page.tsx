import type { Metadata } from 'next';
import { BRAND_NAME } from '@/lib/constants';
import { CHANGELOG, TAG_LABELS, formatChangelogDate, type ChangeTag } from '@/lib/changelog';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: `Changelog — ${BRAND_NAME}`,
  description: `Novedades, mejoras y arreglos de ${BRAND_NAME}.`
};

const TAG_STYLES: Record<ChangeTag, string> = {
  nuevo: 'bg-foreground text-background',
  mejora: 'border-border text-foreground border',
  arreglo: 'bg-muted text-muted-foreground'
};

export default function ChangelogPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-14 sm:py-20">
      <header>
        <p className="text-muted-foreground font-mono text-xs tracking-[0.15em] uppercase">
          {BRAND_NAME}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Changelog</h1>
        <p className="text-muted-foreground mt-3 text-sm">
          Todo lo que fue cambiando, de lo más nuevo a lo más viejo.
        </p>
      </header>

      <div className="mt-12 flex flex-col">
        {CHANGELOG.map((entry, i) => (
          <article
            key={entry.version ?? `unreleased-${i}`}
            className="border-border grid gap-x-8 gap-y-4 border-t py-10 first:border-t-0 first:pt-0 sm:grid-cols-[10rem_1fr]"
          >
            <div className="sm:pt-1">
              <div className="flex items-center gap-2 sm:flex-col sm:items-start sm:gap-1.5">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-xs font-medium',
                    entry.version ? 'bg-muted text-foreground' : 'bg-foreground text-background'
                  )}
                >
                  {entry.version ? `v${entry.version}` : 'Sin publicar'}
                </span>
                <time className="text-muted-foreground font-mono text-xs">
                  {entry.date ? formatChangelogDate(entry.date) : 'En desarrollo'}
                </time>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold tracking-tight">{entry.title}</h2>
              <ul className="mt-4 flex flex-col gap-3">
                {entry.changes.map((change, j) => (
                  <li key={j} className="flex gap-3 text-sm">
                    <span
                      className={cn(
                        'mt-0.5 inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[11px] font-medium',
                        TAG_STYLES[change.tag]
                      )}
                    >
                      {TAG_LABELS[change.tag]}
                    </span>
                    <span className="leading-relaxed">{change.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
