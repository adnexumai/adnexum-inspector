"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
    LayoutDashboard,
    Kanban,
    Phone,
    CheckSquare,
    FolderKanban,
    Plus,
} from "lucide-react";
import { useUIStore } from "@/stores/ui-store";

const commands = [
    { label: "Ir a Dashboard", icon: LayoutDashboard, href: "/" },
    { label: "Ir a Pipeline", icon: Kanban, href: "/pipeline" },
    { label: "Ir a Seguimiento", icon: Phone, href: "/seguimiento" },
    { label: "Ir a Tareas", icon: CheckSquare, href: "/tasks" },
    { label: "Ir a Proyectos", icon: FolderKanban, href: "/proyectos" },
];

export function CommandMenu() {
    const router = useRouter();
    const { commandOpen, setCommandOpen } = useUIStore();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setCommandOpen(!commandOpen);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [commandOpen, setCommandOpen]);

    if (!commandOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={() => setCommandOpen(false)}
            />

            {/* Command palette */}
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
                <div className="w-full max-w-lg glass-card rounded-xl border border-border/50 overflow-hidden animate-slide-up shadow-2xl">
                    <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]]:px-2 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-group]]:py-2">
                        <Command.Input
                            placeholder="¿Qué querés hacer?"
                            className="flex h-12 w-full rounded-md bg-transparent py-3 px-4 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-b border-border"
                            autoFocus
                        />
                        <Command.List className="max-h-[300px] overflow-y-auto p-2">
                            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                                No se encontraron resultados.
                            </Command.Empty>

                            <Command.Group heading="Navegación">
                                {commands.map((cmd) => (
                                    <Command.Item
                                        key={cmd.href}
                                        value={cmd.label}
                                        onSelect={() => {
                                            router.push(cmd.href);
                                            setCommandOpen(false);
                                        }}
                                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer transition-colors hover:bg-accent aria-selected:bg-accent"
                                    >
                                        <cmd.icon className="h-4 w-4 text-muted-foreground" />
                                        {cmd.label}
                                    </Command.Item>
                                ))}
                            </Command.Group>

                            <Command.Group heading="Acciones rápidas">
                                <Command.Item
                                    value="Nuevo Lead"
                                    onSelect={() => {
                                        router.push("/pipeline?new=true");
                                        setCommandOpen(false);
                                    }}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer transition-colors hover:bg-accent aria-selected:bg-accent"
                                >
                                    <Plus className="h-4 w-4 text-muted-foreground" />
                                    Nuevo Lead
                                </Command.Item>
                                <Command.Item
                                    value="Nueva Tarea"
                                    onSelect={() => {
                                        router.push("/tasks?new=true");
                                        setCommandOpen(false);
                                    }}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer transition-colors hover:bg-accent aria-selected:bg-accent"
                                >
                                    <Plus className="h-4 w-4 text-muted-foreground" />
                                    Nueva Tarea
                                </Command.Item>
                            </Command.Group>
                        </Command.List>
                    </Command>
                </div>
            </div>
        </>
    );
}
