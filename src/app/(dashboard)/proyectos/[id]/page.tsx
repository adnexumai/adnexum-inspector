import { createClient } from "@/lib/supabase/server";
import { ProjectDetailView } from "@/components/projects/project-detail-view";
import { notFound } from "next/navigation";
import { Project, ProjectFile, Task } from "@/types";

export default async function ProjectPage({ params }: { params: { id: string } }) {
    const supabase = await createClient();
    const { id } = await params;

    // Fetch Project
    const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

    if (projectError || !project) {
        notFound();
    }

    // Fetch Files
    const { data: files } = await supabase
        .from("project_files")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: false });

    // Fetch Tasks
    const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", id)
        .order("due_date", { ascending: true });

    return (
        <ProjectDetailView
            project={project as Project}
            files={(files || []) as ProjectFile[]}
            tasks={(tasks || []) as Task[]}
        />
    );
}
