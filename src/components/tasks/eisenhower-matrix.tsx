"use client";

import { Task, PRIORIDAD_COLORS, TaskPrioridad } from "@/types";
import { TaskCard } from "./task-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface EisenhowerMatrixProps {
    tasks: Task[];
}

export function EisenhowerMatrix({ tasks }: EisenhowerMatrixProps) {
    // Quadrants logic
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const getQuadrant = (task: Task) => {
        const isUrgent = task.due_date ? new Date(task.due_date) < startOfToday : false; // Urgent if due date passed or today (simplified)
        // Actually, let's use: Urgent = Due Date is Set. Not Urgent = No Due Date.
        // Better: Urgent = Due <= Today. Not Urgent = Due > Today or Null.
        const hasDueDate = !!task.due_date;
        const isDueSoon = hasDueDate && new Date(task.due_date!).getTime() <= now.getTime() + 24 * 60 * 60 * 1000; // Due within 24h

        // Matrix:
        // Q1 (Do):  High Priority (Important) + Due Soon/Overdue (Urgent)
        // Q2 (Plan): High/Medium Priority (Important) + Not Due Soon (Not Urgent)
        // Q3 (Delegate): Low Priority (Not Important) + Due Soon (Urgent)
        // Q4 (Delete): Low Priority (Not Important) + Not Due Soon (Not Urgent)

        const priority = task.prioridad;
        const isImportant = priority === "Alta" || priority === "Media";

        // Adjusted Logic for simplicity and usability:
        // Q1: Alta
        // Q2: Media
        // Q3: Baja
        // Q4: Inbox/No Priority (if any) or maybe 'Hecho'?

        // Let's stick to the Classic Matrix based on plan
        if (priority === "Alta") return "q1"; // Urgent & Important
        if (priority === "Media") return "q2"; // Not Urgent & Important
        if (priority === "Baja") return "q3"; // Urgent & Not Important (Delegate)
        return "q4"; // Not Urgent & Not Important (Eliminate)

        // Wait, strictly speaking:
        // Q1: Important & Urgent
        // Q2: Important & Not Urgent
        // Q3: Not Important & Urgent
        // Q4: Not Important & Not Urgent

        // I'll map priorities to these for now to simplify UI as requested in plan, 
        // since we don't have separate "Urgency" field other than date.
    };

    const quadrants = {
        q1: { title: "Do (Hazlo)", color: "bg-red-500/10 border-red-500/20", tasks: [] as Task[] },
        q2: { title: "Plan (Planifica)", color: "bg-blue-500/10 border-blue-500/20", tasks: [] as Task[] },
        q3: { title: "Delegate (Delega)", color: "bg-orange-500/10 border-orange-500/20", tasks: [] as Task[] },
        q4: { title: "Delete (Elimina?)", color: "bg-gray-500/10 border-gray-500/20", tasks: [] as Task[] },
    };

    tasks.forEach((task) => {
        if (task.estado === "Hecho") return; // Don't show completed in matrix

        // Map strictly by priority for this implementation
        if (task.prioridad === "Alta") quadrants.q1.tasks.push(task);
        else if (task.prioridad === "Media") quadrants.q2.tasks.push(task);
        else if (task.prioridad === "Baja") quadrants.q3.tasks.push(task);
        else quadrants.q4.tasks.push(task); // Should not happen with current types but good fallback
    });

    return (
        <div className="grid grid-cols-2 gap-4 h-[calc(100vh-240px)]">
            {Object.entries(quadrants).map(([key, { title, color, tasks }]) => (
                <div key={key} className={cn("rounded-xl border p-4 flex flex-col", color)}>
                    <h3 className="font-semibold mb-3 flex justify-between">
                        {title}
                        <span className="text-xs font-normal text-muted-foreground bg-background/50 px-2 py-0.5 rounded-full">
                            {tasks.length}
                        </span>
                    </h3>
                    <ScrollArea className="flex-1">
                        {tasks.map((task, index) => (
                            <TaskCard key={task.id} task={task} index={index} isDraggable={false} />
                        ))}
                    </ScrollArea>
                </div>
            ))}
        </div>
    );
}
