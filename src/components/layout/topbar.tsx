"use client";

import { Search, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { signOut } from "@/actions/auth";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TopBarProps {
    userEmail?: string;
}

export function TopBar({ userEmail }: TopBarProps) {
    const { setCommandOpen, sidebarCollapsed } = useUIStore();

    const initials = userEmail
        ? userEmail
            .split("@")[0]
            .split(".")
            .map((p) => p[0]?.toUpperCase())
            .join("")
            .slice(0, 2)
        : "AO";

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 backdrop-blur-lg px-4 gap-4">
            {/* Search / Command trigger */}
            <button
                onClick={() => setCommandOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground w-full max-w-sm"
            >
                <Search className="h-4 w-4" />
                <span className="flex-1 text-left">Buscar o ejecutar comando...</span>
                <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>

            {/* User Menu */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">Mi cuenta</p>
                            {userEmail && (
                                <p className="text-xs leading-none text-muted-foreground">
                                    {userEmail}
                                </p>
                            )}
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-muted-foreground">
                        <User className="mr-2 h-4 w-4" />
                        Perfil
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="text-red-400 focus:text-red-400"
                        onClick={() => signOut()}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Cerrar sesión
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}
