import { BRAND_NAME } from '@/lib/constants';
import Link from 'next/link';

const LINK_CLASS =
  'text-muted-foreground hover:text-foreground shrink-0 font-mono text-xs underline decoration-dotted underline-offset-2';

export default function Footer() {
  return (
    <footer className="w-full px-4 pb-4">
      <div className="mx-auto flex w-full max-w-5xl flex-col-reverse items-center gap-3 px-3 pt-4 text-center sm:flex-row sm:flex-wrap sm:justify-between sm:gap-x-4 sm:gap-y-2 sm:text-left">
        <p className="text-muted-foreground truncate font-mono text-xs">
          &copy; {new Date().getFullYear()} {BRAND_NAME}
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link href="/changelog" className={LINK_CLASS}>
            Changelog
          </Link>
          <Link href="/faqs" className={LINK_CLASS}>
            Preguntas frecuentes
          </Link>
          <Link href="/privacy" className={LINK_CLASS}>
            Privacidad
          </Link>
        </nav>
      </div>
    </footer>
  );
}
