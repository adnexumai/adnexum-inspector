"use client";

import { useState } from "react";
import { Project, ProjectFile, Task, ProjectStatus, ProjectDeveloper } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, User, CheckCircle2, ListTodo, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDate, cn } from "@/lib/utils";
import { DocumentManager } from "./document-manager";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { TaskCard } from "@/components/tasks/task-card";

interface ProjectDetailViewProps {
    project: Project;
    files: ProjectFile[];
    tasks: Task[];
}

export function ProjectDetailView({ project, files, tasks }: ProjectDetailViewProps) {
    const router = useRouter();
    const [description, setDescription] = useState(project.description || "");
    const [isSaving, setIsSaving] = useState(false);

    async function handleSaveDescription() {
        setIsSaving(true);
        const supabase = createClient();
        const { error } = await supabase
            .from("projects")
            .update({ description })
            .eq("id", project.id);

        if (error) {
            toast.error("Error al guardar resumen");
        } else {
            toast.success("Resumen actualizado");
        }
        setIsSaving(false);
    }

    const completedTasks = tasks.filter(t => t.estado === "Hecho").length;
    const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{project.nombre}</h1>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <User className="h-3 w-3" /> {project.developer || "Sin asignar"}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">
                                {project.status_delivery}
                            </span>
                            {project.fecha_entrega && (
                                <span className={cn("flex items-center gap-1",
                                    new Date(project.fecha_entrega) < new Date() ? "text-red-400" : "")}>
                                    <Calendar className="h-3 w-3" /> {formatDate(project.fecha_entrega)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end mr-2">
                        <span className="text-xs font-medium text-muted-foreground">Progreso</span>
                        <span className="text-sm font-bold">{progress}%</span>
                    </div>
                    {/* Add more actions here if needed */}
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Resumen</TabsTrigger>
                    <TabsTrigger value="files">Archivos ({files.length})</TabsTrigger>
                    <TabsTrigger value="tasks">Tareas ({tasks.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <Card className="glass-card min-h-[500px]">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-lg">Documentación del Proyecto</CardTitle>
                            <Button
                                size="sm"
                                onClick={handleSaveDescription}
                                disabled={isSaving}
                                variant="outline"
                            >
                                {isSaving ? "Guardando..." : "Guardar cambios"}
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Escribe aquí el resumen del proyecto, objetivos, notas técnicas... (Soporta Markdown básico)"
                                className="min-h-[400px] font-mono text-sm bg-secondary/20 resize-none focus-visible:ring-1"
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                Tip: Usa este espacio para documentar requerimientos, credenciales (con cuidado), y notas de progreso.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="files">
                    <DocumentManager projectId={project.id} files={files} />
                </TabsContent>

                <TabsContent value="tasks">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tasks.map((task, i) => (
                            <TaskCard key={task.id} task={task} index={i} isDraggable={false} />
                        ))}
                        {tasks.length === 0 && (
                            <div className="col-span-full text-center py-10 text-muted-foreground">
                                <ListTodo className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                <p>No hay tareas vinculadas a este proyecto.</p>
                                <Button variant="link" onClick={() => router.push("/tasks")}>Ir a Tareas</Button>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
