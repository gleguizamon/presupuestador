import { BRAND_NAME } from '@/lib/constants';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="flex w-full shrink-0 items-center justify-between gap-4 border-t px-6 py-4">
      <p className="text-muted-foreground truncate font-mono text-xs">
        &copy; {new Date().getFullYear()} {BRAND_NAME}
      </p>
      <div className="flex shrink-0 items-center gap-4">
        <Link
          href="/privacidad"
          className="text-muted-foreground hover:text-foreground font-mono text-xs underline decoration-dotted underline-offset-2"
        >
          Privacidad
        </Link>
        <Link
          href="/changelog"
          className="text-muted-foreground hover:text-foreground font-mono text-xs underline decoration-dotted underline-offset-2"
        >
          Changelog
        </Link>
      </div>
    </footer>
  );
}
