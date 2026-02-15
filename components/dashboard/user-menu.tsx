"use client";

import { ChevronUp, LogOut, RefreshCw } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut, switchGitHubAccount } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  collapsed: boolean;
  userLabel: string;
  role: string;
  avatarUrl: string | null;
  email: string | null;
};

export function UserMenu({
  collapsed,
  userLabel,
  role,
  avatarUrl,
  email,
}: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-2 rounded-lg border border-border bg-background px-2 py-2 text-left hover:bg-muted",
            collapsed && "justify-center md:px-1",
          )}
          aria-label="Benutzer-Menue"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={`${userLabel} Avatar`}
              className="size-8 shrink-0 rounded-full border border-border object-cover"
            />
          ) : (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-semibold">
              {userLabel.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className={cn("min-w-0 flex-1", collapsed && "md:hidden")}>
            <p className="truncate text-xs font-medium">{userLabel}</p>
            <p className="truncate text-[11px] text-muted-foreground">Rolle: {role}</p>
          </div>

          <ChevronUp className={cn("size-4 text-muted-foreground", collapsed && "md:hidden")} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{userLabel}</p>
            <p className="truncate text-xs text-muted-foreground">{email ?? "Kein E-Mail-Wert"}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <form action={switchGitHubAccount}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted"
          >
            <RefreshCw className="size-4" />
            GitHub-Konto wechseln
          </button>
        </form>

        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-destructive hover:bg-destructive/10"
          >
            <LogOut className="size-4" />
            Logout
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
