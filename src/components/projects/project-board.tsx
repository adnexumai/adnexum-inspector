"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { Project, ProjectStatus } from "@/types";
import { PROJECT_STATUSES } from "@/lib/constants";
import { ProjectCard } from "./project-card";
import { updateProjectStatus } from "@/actions/projects";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProjectForm } from "./project-form";

interface ProjectBoardProps {
    initialProjects: Project[];
}

export function ProjectBoard({ initialProjects }: ProjectBoardProps) {
    const [projects, setProjects] = useState(initialProjects);
    const [isMounted, setIsMounted] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        setProjects(initialProjects);
    }, [initialProjects]);

    if (!isMounted) {
        return null; // Prevent hydration mismatch
    }

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) return;

        const newStatus = destination.droppableId as ProjectStatus;

        // Optimistic
        setProjects(prev => prev.map(p => p.id === draggableId ? { ...p, status_delivery: newStatus } : p));

        const res = await updateProjectStatus(draggableId, newStatus);
        if (res.error) {
            toast.error("Error al mover proyecto");
            setProjects(initialProjects);
        }
    };

    const projectsByStatus = PROJECT_STATUSES.reduce((acc, status) => {
        acc[status] = projects.filter(p => p.status_delivery === status);
        return acc;
    }, {} as Record<ProjectStatus, Project[]>);

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Proyectos</h1>
                    <p className="text-muted-foreground text-sm">Organiza las entregas y desarrollos.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Proyecto
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
                        </DialogHeader>
                        <ProjectForm onSuccess={() => setIsCreateOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex h-[calc(100vh-180px)] gap-4 overflow-x-auto pb-4">
                    {PROJECT_STATUSES.map((status) => (
                        <div key={status} className="flex flex-col h-full min-w-[300px] w-[300px] bg-secondary/10 rounded-xl border border-border/50">
                            <div className="p-3 border-b border-border/50 font-medium text-sm flex justify-between items-center">
                                {status}
                                <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
                                    {projectsByStatus[status].length}
                                </span>
                            </div>
                            <Droppable droppableId={status}>
                                {(provided, snapshot) => (
                                    <ScrollArea className="flex-1 p-2">
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className={cn("min-h-[100px] rounded-lg transition-colors", snapshot.isDraggingOver ? "bg-primary/5" : "")}
                                        >
                                            {projectsByStatus[status].map((project, index) => (
                                                <ProjectCard key={project.id} project={project} index={index} />
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
        </>
    );
}
