"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type LucideIcon, ChartBar, CreditCard, Settings } from "lucide-react";
import { LogoLink } from "src/components/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "src/components/ui/sidebar";

const navItems: { title: string; href: string; icon: LucideIcon }[] = [
  { title: "Budgets", href: "/budgets", icon: ChartBar },
  { title: "Transactions", href: "/transactions", icon: CreditCard },
  { title: "Settings", href: "/settings", icon: Settings },
];

function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="[&_span]:text-sidebar-active">
        <LogoLink />
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = !!pathname && (pathname === item.href || pathname.startsWith(`${item.href}/`));
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export function Navigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "15rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-12 items-center border-b border-border/60 bg-background/80 px-3 backdrop-blur-md md:hidden">
          <SidebarTrigger />
        </header>
        <div key={pathname} className="page-enter mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 md:pt-20 md:pb-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
