'use client';

import * as React from 'react';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Kbd } from '@/components/ui/kbd';
import { useModKey, shortcutLabel } from '@/hooks/use-mod-key';
import { cn } from '@/lib/utils';

/** Sticky bar at the top of the dashboard content area (inside `SidebarInset`),
 *  adapted from shadcn's dashboard-01 `SiteHeader`: the sidebar toggle, a
 *  divider, a breadcrumb/title slot (`children`), and an optional right-aligned
 *  `actions` slot. Reused across every `/editor` view. */
export function SiteHeader({
  children,
  actions,
  className
}: {
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  const mod = useModKey();
  return (
    <header
      className={cn(
        'bg-background sticky top-0 z-10 flex h-12 shrink-0 items-center border-b',
        className
      )}
    >
      <div className="flex w-full items-center gap-1.5 px-4 lg:gap-2 lg:px-6">
        <Tooltip>
          <TooltipTrigger render={<SidebarTrigger className="-ml-1" />} />
          {/* Hidden on mobile: no hover, and the Cmd/Ctrl+B hint is desktop-only. */}
          <TooltipContent className="hidden items-center gap-1.5 sm:flex">
            Barra lateral
            <Kbd>{shortcutLabel(mod, 'B')}</Kbd>
          </TooltipContent>
        </Tooltip>
        <Separator
          orientation="vertical"
          className="mr-1 data-vertical:h-4 data-vertical:self-center"
        />
        <div className="flex min-w-0 flex-1 items-center">{children}</div>
        {/* Wider spacing on mobile so the icon buttons are easy to tap; desktop
            keeps the tight cluster (its wrapper holds one composed child). */}
        {actions ? (
          <div className="flex shrink-0 items-center gap-2 lg:gap-1">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
