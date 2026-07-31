import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { withAuthGuard } from "src/components/with-auth-guard";
import { SideNav } from "./side-nav";
import { TopNav } from "./top-nav";

const SIDE_NAV_WIDTH = 240;

type LayoutProps = {
  children: React.ReactNode;
};

export const Layout = withAuthGuard(true, ({ children }: LayoutProps) => {
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
      <div className="flex max-w-full flex-1 lg:pl-[240px]" style={{ ["--side-nav-width" as string]: `${SIDE_NAV_WIDTH}px` }}>
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
});
