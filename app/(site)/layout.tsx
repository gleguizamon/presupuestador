import Header from '@/components/header';
import Footer from '@/components/footer';

/** Chrome for the marketing pages (home, privacy, changelog, faqs) — the
 *  header/footer that used to live in the root layout. `/editor/**` sits
 *  outside this group deliberately: it gets the dashboard sidebar shell
 *  instead (see app/editor/layout.tsx), not this nav. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col">{children}</main>
      <Footer />
    </>
  );
}
