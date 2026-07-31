import { usePathname } from "next/navigation";
import { LogoLink } from "src/components/logo";
import { Scrollbar } from "src/components/scrollbar";
import { Separator } from "src/components/ui/separator";
import { Sheet, SheetContent, SheetTitle } from "src/components/ui/sheet";
import { items } from "./config";
import { SideNavItem } from "./side-nav-item";
import { useEffect, useState } from "react";

const NavContent = ({ pathname }) => (
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
              disabled={item.disabled}
              external={item.external}
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

export const SideNav = ({ open, onClose }) => {
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
      <SheetContent side="left" className="w-60 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <Scrollbar className="h-full">
          <NavContent pathname={pathname} />
        </Scrollbar>
      </SheetContent>
    </Sheet>
  );
};
