"use client";

import { Home, Menu, PanelLeftClose, PanelLeftOpen, Shield, Wrench } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DashboardShellProps = {
  children: React.ReactNode;
  role: string;
  userLabel: string;
  avatarUrl: string | null;
  email: string | null;
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAdmin?: boolean;
};

const navItems: NavItem[] = [
  { href: "/dashboard/incidents", label: "Incidents", icon: Wrench },
  { href: "/dashboard/admin", label: "Admin", icon: Shield, requiresAdmin: true },
];

const ThemeToggle = dynamic(
  () => import("@/components/dashboard/theme-toggle").then((mod) => mod.ThemeToggle),
  { ssr: false },
);

const UserMenu = dynamic(
  () => import("@/components/dashboard/user-menu").then((mod) => mod.UserMenu),
  { ssr: false },
);

export function DashboardShell({
  children,
  role,
  userLabel,
  avatarUrl,
  email,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="md:hidden border-b border-border px-4 py-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen((open) => !open)}
          type="button"
          aria-label="Sidebar umschalten"
        >
          <Menu className="size-4" />
        </Button>
      </div>

      <div className="flex min-h-[calc(100vh-57px)] md:min-h-screen">
        <aside
          className={cn(
            "border-r border-border bg-card transition-all duration-200 md:sticky md:top-0 md:h-screen",
            isCollapsed ? "md:w-20" : "md:w-72",
            isMobileOpen
              ? "fixed inset-y-0 left-0 z-50 w-72 shadow-xl"
              : "hidden md:flex",
          )}
        >
          <div className="flex h-full w-full flex-col">
            <div className="flex items-center justify-between border-b border-border px-3 py-3">
              <div className={cn("min-w-0", isCollapsed && "md:hidden")}>
                <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">
                  Infralumina
                </p>
                <p className="truncate text-sm font-semibold">Dashboard</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed((collapsed) => !collapsed)}
                type="button"
                className="hidden md:inline-flex"
                aria-label="Sidebar ein-/ausklappen"
              >
                {isCollapsed ? (
                  <PanelLeftOpen className="size-4" />
                ) : (
                  <PanelLeftClose className="size-4" />
                )}
              </Button>
            </div>

            <nav className="flex-1 space-y-6 px-3 py-4">
              <section className="space-y-2">
                <p className={cn("px-2 text-xs uppercase tracking-wide text-muted-foreground", isCollapsed && "md:hidden")}>
                  ITSM
                </p>
                <div className="space-y-1">
                  {navItems.map((item) => {
                    if (item.requiresAdmin && role !== "admin") {
                      return null;
                    }

                    const isActive =
                      pathname === item.href || pathname.startsWith(`${item.href}/`);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-muted",
                        )}
                        onClick={() => setIsMobileOpen(false)}
                      >
                        <item.icon className="size-4 shrink-0" />
                        <span className={cn("truncate", isCollapsed && "md:hidden")}>
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>

              <section className="space-y-2">
                <p className={cn("px-2 text-xs uppercase tracking-wide text-muted-foreground", isCollapsed && "md:hidden")}>
                  Knowledge
                </p>
                <div className="rounded-lg border border-dashed border-border px-2 py-2 text-xs text-muted-foreground">
                  <span className={cn(isCollapsed && "md:hidden")}>Documentation folgt in Phase 1</span>
                  <Home className={cn("size-4", !isCollapsed && "md:hidden")} />
                </div>
              </section>
            </nav>

            <footer className="space-y-2 border-t border-border px-3 py-3">
              <ThemeToggle collapsed={isCollapsed} />
              <UserMenu
                collapsed={isCollapsed}
                userLabel={userLabel}
                role={role}
                avatarUrl={avatarUrl}
                email={email}
              />
            </footer>
          </div>
        </aside>

        {isMobileOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Sidebar schliessen"
          />
        ) : null}

        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[1700px] px-3 py-4 md:px-4 md:py-5">{children}</div>
        </main>
      </div>
    </div>
  );
}
