"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { Task, TaskEstado } from "@/types";
import { TASK_ESTADOS } from "@/lib/constants";
import { TaskCard } from "./task-card";
import { updateTaskStatus } from "@/actions/tasks";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface TaskKanbanProps {
    tasks: Task[];
}

export function TaskKanban({ tasks: initialTasks }: TaskKanbanProps) {
    const [tasks, setTasks] = useState(initialTasks);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    if (!isMounted) return null;

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const newStatus = destination.droppableId as TaskEstado;

        // Optimistic
        setTasks(prev => prev.map(t => t.id === draggableId ? { ...t, estado: newStatus } : t));

        const res = await updateTaskStatus(draggableId, newStatus);
        if (res.error) {
            toast.error("Error al mover tarea");
            setTasks(initialTasks); // Revert
        }
    };

    const tasksByStatus = TASK_ESTADOS.reduce((acc, status) => {
        acc[status] = tasks.filter(t => t.estado === status);
        return acc;
    }, {} as Record<TaskEstado, Task[]>);

    // Filter out 'Hecho'? Plan says: "Kanban con columnas: Inbox → Próximo → En Progreso → Hecho".
    // Note: Maybe hide 'Hecho' column to keep it clean or keep it as archive. I'll keep it.

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex h-[calc(100vh-240px)] gap-4 overflow-x-auto pb-4">
                {TASK_ESTADOS.map((status) => (
                    <div key={status} className="flex flex-col h-full min-w-[280px] w-[280px] bg-secondary/10 rounded-xl border border-border/50">
                        <div className="p-3 border-b border-border/50 font-medium text-sm text-center">
                            {status} ({tasksByStatus[status].length})
                        </div>
                        <Droppable droppableId={status}>
                            {(provided, snapshot) => (
                                <ScrollArea className="flex-1 p-2">
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={cn("min-h-[100px] rounded-lg transition-colors", snapshot.isDraggingOver ? "bg-primary/5" : "")}
                                    >
                                        {tasksByStatus[status].map((task, index) => (
                                            <TaskCard key={task.id} task={task} index={index} />
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                </ScrollArea>
                            )}
                        </Droppable>
                    </div>
                ))}
            </div>
        </DragDropContext>
    );
}
