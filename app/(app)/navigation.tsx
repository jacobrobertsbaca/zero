"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { type LucideIcon, ChartBar, CreditCard, PanelLeft, Settings } from "lucide-react";
import { Separator } from "src/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "src/components/ui/sheet";
import { cn } from "src/utils";

const NAV_ITEMS: { title: string; href: string; icon: LucideIcon }[] = [
  { title: "Budgets", href: "/budgets", icon: ChartBar },
  { title: "Transactions", href: "/transactions", icon: CreditCard },
  { title: "Settings", href: "/settings", icon: Settings },
];

const ITEM_INSET = "p-2";
const ITEM_GAP = "gap-1";

function SidebarTriggerButton({
  open,
  onClick,
  className,
}: {
  open?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label="Navigation"
      aria-expanded={open}
      onClick={onClick}
      className={cn(
        "flex size-7 items-center justify-center rounded-md text-foreground transition-colors cursor-default hover:bg-foreground/5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        className
      )}
    >
      <PanelLeft className="size-3.5" strokeWidth={1.75} aria-hidden />
    </button>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col", ITEM_GAP)}>
      {NAV_ITEMS.map(({ title, href, icon: Icon }) => {
        const active = !!pathname && (pathname === href || pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex h-8 items-center gap-2 rounded-md px-2 text-sm transition-colors",
              active
                ? "bg-sidebar-accent font-medium text-sidebar-active"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-active"
            )}
          >
            <Icon className="size-3.5 shrink-0" />
            {title}
          </Link>
        );
      })}
    </nav>
  );
}

function DesktopHoverSidebar() {
  const [open, setOpen] = useState(false);
  const show = () => setOpen(true);
  const hide = () => setOpen(false);

  return (
    <div
      className={cn("fixed inset-y-0 left-0 z-40 hidden md:block w-56", !open && "pointer-events-none")}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusCapture={show}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) hide();
      }}
    >
      {!open && (
        <div aria-hidden className="pointer-events-auto absolute inset-y-0 left-0 w-4 lg:w-8" onMouseEnter={show} />
      )}

      {/* Background + links share one opacity/transform so nothing lingers after the panel closes. */}
      <div
        inert={!open ? true : undefined}
        className={cn(
          "absolute inset-0 flex flex-col border-r border-sidebar-border bg-sidebar shadow-[4px_0_24px_-4px_rgba(0,0,0,0.08)] transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-opacity",
          open
            ? "translate-x-0 opacity-100"
            : "pointer-events-none -translate-x-1.5 opacity-0 motion-reduce:translate-x-0"
        )}
      >
        <div className={cn("flex items-center", ITEM_INSET)}>
          <div className="size-7 shrink-0" aria-hidden />
        </div>
        <Separator className="bg-sidebar-border" />
        <div className={cn(ITEM_INSET, "flex flex-col", ITEM_GAP)}>
          <NavLinks />
        </div>
      </div>

      <div className={cn("absolute top-0 left-0", ITEM_INSET, !open && "pointer-events-auto")} onMouseEnter={show}>
        <SidebarTriggerButton open={open} />
      </div>
    </div>
  );
}

function MobileSidebar({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-56 border-r-0 bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <div className="flex items-center py-2 pl-4 pr-2">
          <Link
            href="/"
            className="inline-flex items-center text-lg font-semibold tracking-tight text-sidebar-active no-underline"
          >
            zero
          </Link>
        </div>
        <Separator className="bg-sidebar-border" />
        <div className={cn(ITEM_INSET)}>
          <NavLinks onNavigate={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function Navigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <div className="flex min-h-svh w-full">
      <DesktopHoverSidebar />
      <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />

      <main className="relative flex w-full flex-1 flex-col bg-background">
        <header
          className={cn(
            "sticky top-0 z-20 flex items-center border-b border-border/60 bg-background/80 backdrop-blur-md md:hidden",
            ITEM_INSET
          )}
        >
          <SidebarTriggerButton onClick={() => setMobileOpen(true)} />
        </header>
        <div key={pathname} className="page-enter mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 md:pt-20 md:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
