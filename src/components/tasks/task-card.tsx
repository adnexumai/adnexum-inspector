"use client";

import { Draggable } from "@hello-pangea/dnd";
import { Task, PRIORIDAD_COLORS, TASK_ESTADOS } from "@/lib/constants";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, MoreHorizontal, Calendar } from "lucide-react";
import { updateTaskStatus } from "@/actions/tasks";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface TaskCardProps {
    task: Task;
    index: number;
    isDraggable?: boolean;
}

export function TaskCard({ task, index, isDraggable = true }: TaskCardProps) {
    const content = (
        <Card className="glass-card mb-3 hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing group">
            <CardContent className="p-3 flex items-start gap-3">
                <button
                    onClick={async (e) => {
                        e.stopPropagation();
                        if (task.estado !== "Hecho") {
                            await updateTaskStatus(task.id, "Hecho");
                            toast.success("Tarea completada");
                        }
                    }}
                    className={cn(
                        "mt-0.5 h-4 w-4 rounded-full border border-muted-foreground/40 hover:border-primary text-transparent hover:text-primary flex items-center justify-center transition-colors",
                        task.estado === "Hecho" && "bg-primary border-primary text-primary-foreground"
                    )}
                >
                    <CheckCircle className="h-3 w-3" />
                </button>

                <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium leading-none truncate", task.estado === "Hecho" && "line-through text-muted-foreground")}>
                        {task.titulo}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={`${PRIORIDAD_COLORS[task.prioridad]} text-[10px] px-1.5 py-0 h-4`}>
                            {task.prioridad}
                        </Badge>
                        {task.due_date && (
                            <div className="flex items-center text-[10px] text-muted-foreground">
                                <Calendar className="mr-1 h-3 w-3" />
                                {formatDate(task.due_date)}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    if (!isDraggable) return <div className="mb-3">{content}</div>;

    return (
        <Draggable draggableId={task.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={provided.draggableProps.style}
                    className={cn(snapshot.isDragging && "opacity-90 rotate-2 scale-105")}
                >
                    {content}
                </div>
            )}
        </Draggable>
    );
}
