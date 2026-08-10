"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartBar, CreditCard, Menu, Settings } from "lucide-react";
import { LogoLink } from "src/components/logo";
import { Scrollbar } from "src/components/scrollbar";
import { Button } from "src/components/ui/button";
import { Separator } from "src/components/ui/separator";
import { Sheet, SheetContent, SheetTitle } from "src/components/ui/sheet";
import { cn } from "src/lib/utils";

const SIDE_NAV_WIDTH = 240;
const TOP_NAV_HEIGHT = 52;

const items = [
  {
    title: "Budgets",
    path: "/budgets",
    icon: <ChartBar className="size-4" />,
  },
  {
    title: "Transactions",
    path: "/transactions",
    icon: <CreditCard className="size-4" />,
  },
  {
    title: "Settings",
    path: "/settings",
    icon: <Settings className="size-4" />,
  },
];

function SideNavItem({
  active = false,
  disabled,
  external,
  icon,
  path,
  title,
}: {
  active?: boolean;
  disabled?: boolean;
  external?: boolean;
  icon?: React.ReactNode;
  path?: string;
  title: string;
}) {
  const className = cn(
    "flex w-full items-center rounded-md px-3 py-1.5 text-left text-sm font-medium transition-colors",
    active
      ? "bg-white/[0.06] text-sidebar-active"
      : "text-sidebar-foreground hover:bg-white/[0.04] hover:text-sidebar-active",
    disabled && "pointer-events-none opacity-40"
  );

  const content = (
    <>
      {icon && (
        <span className={cn("mr-3 inline-flex", active ? "text-primary" : "text-sidebar-foreground")}>{icon}</span>
      )}
      <span className="flex-1 whitespace-nowrap">{title}</span>
    </>
  );

  if (!path) {
    return <li>{content}</li>;
  }

  if (external) {
    return (
      <li>
        <a className={className} href={path} target="_blank" rel="noreferrer">
          {content}
        </a>
      </li>
    );
  }

  return (
    <li>
      <Link className={className} href={path}>
        {content}
      </Link>
    </li>
  );
}

function NavContent({ pathname }: { pathname: string | null }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-4 [&_span]:text-sidebar-active">
        <LogoLink />
      </div>
      <Separator className="bg-sidebar-border" />
      <nav className="flex-1 px-3 py-4">
        <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
          {items.map((item) => {
            const active = item.path ? pathname === item.path || pathname?.startsWith(`${item.path}/`) : false;
            return (
              <SideNavItem
                active={active}
                icon={item.icon}
                key={item.title}
                path={item.path}
                title={item.title}
              />
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function TopNav({ onNavOpen }: { onNavOpen: () => void }) {
  return (
    <header
      className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md lg:pointer-events-none lg:invisible lg:border-transparent lg:bg-transparent lg:backdrop-blur-none"
      style={{ minHeight: TOP_NAV_HEIGHT }}
    >
      <div className="flex items-center px-3 lg:hidden" style={{ minHeight: TOP_NAV_HEIGHT }}>
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={onNavOpen}>
          <Menu className="size-4" />
          <span className="sr-only">Open navigation</span>
        </Button>
      </div>
    </header>
  );
}

function SideNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const [lgUp, setLgUp] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setLgUp(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (lgUp) {
    return (
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 bg-sidebar text-sidebar-foreground lg:block">
        <Scrollbar className="h-full">
          <NavContent pathname={pathname} />
        </Scrollbar>
      </aside>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="left"
        className="w-60 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
      >
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <Scrollbar className="h-full">
          <NavContent pathname={pathname} />
        </Scrollbar>
      </SheetContent>
    </Sheet>
  );
}

export function Navigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [openNav, setOpenNav] = useState(false);

  const handlePathnameChange = useCallback(() => {
    if (openNav) setOpenNav(false);
  }, [openNav]);

  useEffect(() => {
    handlePathnameChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      <TopNav onNavOpen={() => setOpenNav(true)} />
      <SideNav onClose={() => setOpenNav(false)} open={openNav} />
      <div
        className="flex max-w-full flex-1 lg:pl-[240px]"
        style={{ ["--side-nav-width" as string]: `${SIDE_NAV_WIDTH}px` }}
      >
        <div className="flex w-full flex-1 flex-col">
          <main className="flex-1 py-6 md:py-8">
            <div key={pathname} className="page-enter mx-auto w-full max-w-6xl px-4 sm:px-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
