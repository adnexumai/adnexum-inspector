import { createClient } from "@/lib/supabase/server";
import { TasksPageClient } from "@/components/tasks/tasks-page-client";
import { Task } from "@/types";

export default async function TasksPage() {
    const supabase = await createClient();

    const { data: tasks, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching tasks:", error);
    }

    return (
        <div className="h-[calc(100vh-100px)]">
            <TasksPageClient initialTasks={(tasks as Task[]) || []} />
        </div>
    );
}
