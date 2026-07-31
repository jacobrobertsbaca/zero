import { Menu } from "lucide-react";
import { Button } from "src/components/ui/button";

const TOP_NAV_HEIGHT = 52;

export const TopNav = ({ onNavOpen }) => {
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
};
