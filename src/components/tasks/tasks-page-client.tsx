"use client";

import { useState } from "react";
import { Task } from "@/types";
import { TaskInbox } from "@/components/tasks/task-inbox";
import { TaskKanban } from "@/components/tasks/task-kanban";
import { EisenhowerMatrix } from "@/components/tasks/eisenhower-matrix";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, Kanban as KanbanIcon, List } from "lucide-react";

interface TasksPageProps {
    initialTasks: Task[];
}

export function TasksPageClient({ initialTasks }: TasksPageProps) {
    const [view, setView] = useState("kanban");

    // For Inbox view, we might want just a list of 'Inbox' status tasks
    const inboxTasks = initialTasks.filter(t => t.estado === "Inbox");

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold">Mis Tareas</h1>
                    <p className="text-muted-foreground text-sm">Gestiona tus pendientes (GTD).</p>
                </div>

                <Tabs value={view} onValueChange={setView} className="w-auto">
                    <TabsList>
                        <TabsTrigger value="kanban" className="gap-2">
                            <KanbanIcon className="h-4 w-4" />
                            Kanban
                        </TabsTrigger>
                        <TabsTrigger value="matrix" className="gap-2">
                            <LayoutGrid className="h-4 w-4" />
                            Matriz
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="shrink-0">
                <TaskInbox />
            </div>

            <div className="flex-1 min-h-0">
                {view === "kanban" && <TaskKanban tasks={initialTasks} />}
                {view === "matrix" && <EisenhowerMatrix tasks={initialTasks} />}
            </div>
        </div>
    );
}
