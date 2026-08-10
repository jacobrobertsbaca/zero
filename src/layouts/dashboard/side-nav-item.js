import NextLink from "next/link";
import { cn } from "src/utils";

export const SideNavItem = ({ active = false, disabled, external, icon, path, title }) => {
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
      <NextLink className={className} href={path}>
        {content}
      </NextLink>
    </li>
  );
};
