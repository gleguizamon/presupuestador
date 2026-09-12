import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/** The hero CTA look — shadcn `Button` as the base, dressed up here (not in
 *  `components/ui/button.tsx`) so the primitive stays generic. Clean solid
 *  black pill, no borders or bevels — just a `rounded-full` shape a hair
 *  bigger than `size="lg"` and a layered drop shadow (tight contact + wide
 *  diffuse) so it floats off the cream page. Hover lifts it and deepens the
 *  shadow; press settles it back. Tuned against ink `#111110` on `#F6F5F2`. */
const CTA_CLASS = cn(
  'border-0 h-12 gap-2 px-7 text-[15px] font-semibold',
  'hover:bg-primary', // stay solid black on hover, don't lighten
  'shadow-[0_2px_6px_-1px_rgba(17,17,16,0.2),0_10px_20px_-6px_rgba(17,17,16,0.34),0_28px_44px_-16px_rgba(17,17,16,0.45)]',
  'hover:-translate-y-0.5 hover:shadow-[0_4px_10px_-2px_rgba(17,17,16,0.22),0_16px_30px_-8px_rgba(17,17,16,0.38),0_38px_60px_-16px_rgba(17,17,16,0.5)]',
  'active:translate-y-0 active:shadow-[0_1px_3px_rgba(17,17,16,0.2),0_4px_10px_-3px_rgba(17,17,16,0.32)]',
  'transition-all duration-200 ease-out'
);

/** The home page's single CTA, RenderCV's "Get Started" pattern. Just links to
 *  the bare `/editor` route — that route already decides what to open (the
 *  most-recently-created doc, or a fresh one if there isn't one), so a
 *  returning visitor lands back on their work instead of a forced new doc.
 *  Creating another one from there is the sidebar's "Nuevo documento". */
export function GetStartedButton() {
  return (
    <Button size="lg" nativeButton={false} render={<Link href="/editor" />} className={CTA_CLASS}>
      Crear un presupuesto
      <ArrowRight className="size-4" />
    </Button>
  );
}
