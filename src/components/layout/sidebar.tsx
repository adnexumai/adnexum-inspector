"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Kanban,
    Phone,
    CheckSquare,
    FolderKanban,
    ChevronLeft,
    ChevronRight,
    Zap,
    Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

const navItems = [
    {
        label: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
    },
    {
        label: "Pipeline",
        href: "/pipeline",
        icon: Kanban,
    },
    {
        label: "Seguimiento",
        href: "/seguimiento",
        icon: Phone,
    },
    {
        label: "Tareas",
        href: "/tasks",
        icon: CheckSquare,
    },
    {
        label: "Proyectos",
        href: "/proyectos",
        icon: FolderKanban,
    },
    {
        label: "Prospección",
        href: "/prospeccion",
        icon: Target,
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { sidebarCollapsed, toggleSidebar } = useUIStore();

    return (
        <TooltipProvider delayDuration={0}>
            <aside
                className={cn(
                    "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
                    sidebarCollapsed ? "w-[68px]" : "w-[240px]"
                )}
            >
                {/* Logo */}
                <div className="flex h-14 items-center px-4 gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                        <Zap className="h-4 w-4 text-primary" />
                    </div>
                    {!sidebarCollapsed && (
                        <span className="text-sm font-semibold animate-fade-in">
                            <span className="text-gradient">Adnexum</span>{" "}
                            <span className="text-muted-foreground font-light">OS</span>
                        </span>
                    )}
                </div>

                <Separator className="bg-sidebar-border" />

                {/* Navigation */}
                <nav className="flex-1 space-y-1 p-2 mt-2">
                    {navItems.map((item) => {
                        const isActive =
                            item.href === "/"
                                ? pathname === "/"
                                : pathname.startsWith(item.href);

                        const linkContent = (
                            <Link
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-sidebar-accent text-sidebar-primary"
                                        : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        "h-4 w-4 shrink-0",
                                        isActive ? "text-sidebar-primary" : "text-muted-foreground"
                                    )}
                                />
                                {!sidebarCollapsed && (
                                    <span className="animate-fade-in">{item.label}</span>
                                )}
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-sidebar-primary" />
                                )}
                            </Link>
                        );

                        return (
                            <div key={item.href} className="relative">
                                {sidebarCollapsed ? (
                                    <Tooltip>
                                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                                        <TooltipContent side="right" className="font-medium">
                                            {item.label}
                                        </TooltipContent>
                                    </Tooltip>
                                ) : (
                                    linkContent
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Collapse toggle */}
                <div className="p-2 border-t border-sidebar-border">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleSidebar}
                        className="w-full justify-center text-muted-foreground hover:text-foreground"
                    >
                        {sidebarCollapsed ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <>
                                <ChevronLeft className="h-4 w-4" />
                                <span className="ml-2 text-xs">Colapsar</span>
                            </>
                        )}
                    </Button>
                </div>
            </aside>
        </TooltipProvider>
    );
}
