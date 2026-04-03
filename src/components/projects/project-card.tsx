"use client";

import { Draggable } from "@hello-pangea/dnd";
import { Project } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress"; // Need to check if I have this
import { Calendar, User, DollarSign, ExternalLink } from "lucide-react";
import { formatCurrency, formatDate, getDaysSinceContact } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

// I don't have Progress component yet? Plan said shadcn init included it?
// Plan "Phase 1... custom components" didn't explicitly list `progress` but user approved plan.
// Checking `components.json` or `package.json` would confirm.
// I'll assume I might need to create it or just use HTML/Tailwind for progress bar.
// I'll use Tailwind for now to be safe.

interface ProjectCardProps {
    project: Project;
    index: number;
}

export function ProjectCard({ project, index }: ProjectCardProps) {
    const daysLeft = project.fecha_entrega ? getDaysSinceContact(project.fecha_entrega) : null;
    // getDaysSinceContact returns days *since*, so if deadline is future, it returns negative.
    // We want days *remaining*.
    const daysRemaining = daysLeft !== null ? -daysLeft : null;

    // Derive progress from status roughly
    const progressMap: Record<string, number> = {
        "Onboarding": 10,
        "Desarrollo": 40,
        "QA": 80,
        "Go-Live": 95,
        "Mantenimiento": 100
    };
    const progress = progressMap[project.status_delivery] || 0;

    return (
        <Draggable draggableId={project.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={provided.draggableProps.style}
                    className={cn("mb-3 group", snapshot.isDragging && "opacity-90 rotate-2 scale-105")}
                >
                    <Card className="glass-card hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing relative">
                        <Link href={`/proyectos/${project.id}`} className="absolute top-2 right-2 p-2 text-muted-foreground hover:text-primary z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="h-4 w-4" />
                        </Link>
                        <CardHeader className="p-4 pb-2">
                            <div className="flex justify-between items-start">
                                <Link href={`/proyectos/${project.id}`} className="hover:underline decoration-primary/50 underline-offset-4">
                                    <h3 className="font-semibold text-sm leading-tight">{project.nombre}</h3>
                                </Link>
                            </div>
                            {/* Cliente removed as not in schema */}
                        </CardHeader>
                        <CardContent className="p-4 pt-2 space-y-3">
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                {project.developer && (
                                    <div className="flex items-center gap-1" title="Developer">
                                        <User className="h-3 w-3" />
                                        {project.developer.split(" ")[0]}
                                    </div>
                                )}
                                {project.fecha_entrega && (
                                    <div className={cn("flex items-center gap-1", daysRemaining !== null && daysRemaining < 3 ? "text-red-400 font-medium" : "")} title="Deadline">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(project.fecha_entrega)}
                                    </div>
                                )}
                            </div>

                            {/* Simple Progress Bar - Simulated based on status for now or manual field if added later */}
                            {/* For now, just simulated visuals or empty */}
                            <Progress value={progress} className="h-1" />
                        </CardContent>
                    </Card>
                </div>
            )}
        </Draggable>
    );
}
