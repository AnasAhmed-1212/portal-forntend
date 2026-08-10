import React from "react";
import { ChevronDown, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/authContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "NA";

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center border-b bg-background/92 px-4 shadow-sm backdrop-blur-xl lg:px-6">
      <SidebarTrigger className="-ml-1 mr-2" />
      <Separator orientation="vertical" className="mr-3 hidden h-4 sm:block" />

      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Welcome back</p>
        <p className="truncate text-sm font-semibold text-foreground">{user?.name || "User"}</p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-xs sm:flex">
          <ShieldCheck className="size-3.5 text-emerald-600" />
          <span className="capitalize">{user?.role || "User"} access</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 gap-2 px-1.5 sm:px-2" aria-label="Open account menu">
              <Avatar size="sm">
                <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden max-w-36 truncate text-sm font-medium sm:block">{user?.name || "User"}</span>
              <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="space-y-1 px-2 py-2">
              <p className="text-sm font-medium text-foreground">{user?.name || "User"}</p>
              <p className="truncate text-xs font-normal text-muted-foreground">{user?.email || "No email available"}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={logout} className="py-2">
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Navbar;
