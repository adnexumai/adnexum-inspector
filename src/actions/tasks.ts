"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { TaskFormData, TaskEstado } from "@/types";

export async function createTask(formData: TaskFormData) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "No autenticado" };
    }

    const { error } = await supabase.from("tasks").insert({
        user_id: user.id,
        titulo: formData.titulo,
        notas: formData.notas,
        prioridad: formData.prioridad || "Media",
        estado: "Inbox",
        lead_id: formData.lead_id || null,
        project_id: formData.project_id || null,
        due_date: formData.due_date || null,
    });

    if (error) {
        console.error("Error creating task:", error);
        return { error: "Error al crear tarea" };
    }

    revalidatePath("/tasks");
    return { success: true };
}

export async function updateTaskStatus(taskId: string, newEstado: TaskEstado) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("tasks")
        .update({ estado: newEstado })
        .eq("id", taskId);

    if (error) {
        return { error: "Error al actualizar estado" };
    }

    revalidatePath("/tasks");
    return { success: true };
}

export async function updateTask(taskId: string, formData: Partial<TaskFormData>) {
    const supabase = await createClient();

    // Filter out undefined values
    const updates = Object.fromEntries(
        Object.entries(formData).filter(([_, v]) => v !== undefined)
    );

    const { error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", taskId);

    if (error) {
        return { error: "Error al actualizar tarea" };
    }

    revalidatePath("/tasks");
    return { success: true };
}

export async function deleteTask(taskId: string) {
    const supabase = await createClient();

    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) {
        return { error: "Error al eliminar tarea" };
    }

    revalidatePath("/tasks");
    return { success: true };
}
