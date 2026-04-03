"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { CommandMenu } from "@/components/layout/command-menu";
import { Toaster } from "@/components/ui/sonner";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
    children: React.ReactNode;
    userEmail?: string;
}

export function DashboardShell({ children, userEmail }: DashboardShellProps) {
    const { sidebarCollapsed } = useUIStore();

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <div
                className={cn(
                    "transition-all duration-300",
                    sidebarCollapsed ? "ml-[68px]" : "ml-[240px]"
                )}
            >
                <TopBar userEmail={userEmail} />
                <main className="p-6">{children}</main>
            </div>
            <CommandMenu />
            <Toaster />
        </div>
    );
}
