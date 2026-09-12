import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/editor/app-sidebar';

/** The dashboard shell for every /editor/** route — persists across
 *  navigations between documents (unlike DocEditor itself, which
 *  intentionally remounts per doc, see its `key` props), so switching
 *  documents from the sidebar never re-fetches or flickers the sidebar. */
export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider
      style={{ '--header-height': 'calc(var(--spacing) * 12)' } as React.CSSProperties}
      // `lg:h-svh lg:overflow-hidden` caps the shell at the viewport on
      // desktop so the page itself never scrolls — only the editor panes do
      // (each has its own `overflow-y-auto`). Mobile keeps the default
      // `min-h-svh` and scrolls normally.
      className="lg:h-svh lg:overflow-hidden"
    >
      <AppSidebar variant="inset" collapsible="icon" />
      {/* `overflow-hidden` clips the SiteHeader (and the panes) to the inset
          card's rounded corners; `border` adds the "contorno" since the inset
          variant's own shadow is near-invisible on this near-white palette. */}
      <SidebarInset className="min-h-0 md:peer-data-[variant=inset]:overflow-hidden md:peer-data-[variant=inset]:border">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
