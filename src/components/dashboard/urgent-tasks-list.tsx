import { Task } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export function UrgentTasksList({ tasks }: { tasks: Task[] }) {
    if (tasks.length === 0) {
        return (
            <Card className="glass-card h-full">
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Tareas Urgentes</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-xs">¡Todo al día!</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass-card h-full">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium">Tareas Urgentes</CardTitle>
                    <Badge variant="outline" className="text-xs">{tasks.length}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {tasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-start gap-2 pb-2 border-b border-border/50 last:border-0 last:pb-0">
                        <div className={`mt-1 h-2 w-2 rounded-full ${task.prioridad === 'Alta' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-orange-500'}`} />
                        <div className="flex-1 min-w-0 space-y-1">
                            <p className="text-sm font-medium truncate">{task.titulo}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{task.due_date ? formatDate(task.due_date) : "Sin fecha"}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
