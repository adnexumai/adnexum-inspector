"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { ProjectFormData, ProjectStatus } from "@/types";

export async function createProject(formData: ProjectFormData) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "No autenticado" };
    }

    const { error } = await supabase.from("projects").insert({
        user_id: user.id,
        nombre: formData.nombre,
        // cliente: formData.cliente, // Not in schema
        lead_id: formData.lead_id || null, // Optional link to origin lead
        status_delivery: formData.status || "Onboarding",
        developer: formData.developer,
        fecha_entrega: formData.fecha_entrega || null,
        // precio: formData.precio, // Not in schema
        links_clave: formData.links_clave || [],
        // notas: formData.notas, // Not in schema
        // Wait, SQL schema projects table:
        // nombre, lead_id, status_delivery, developer, fecha_entrega, links_clave
        // It DOES NOT have 'cliente', 'precio', 'notas'.
        // SQL schema:
        // lead_id uuid REFERENCES leads(id)
        // nombre text
        // status_delivery project_status
        // developer project_developer
        // fecha_entrega date
        // links_clave jsonb

        // MISSING: cliente, precio, notas in SQL schema!
        // But ProjectFormData has them?
        // Let's check actions/projects.ts content again.
        // It used formData.cliente, formData.precio, formData.notas.
    });

    if (error) {
        console.error("Error creating project:", error);
        return { error: "Error al crear proyecto" };
    }

    revalidatePath("/proyectos");
    return { success: true };
}

export async function updateProjectStatus(projectId: string, newStatus: ProjectStatus) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("projects")
        .update({ status_delivery: newStatus })
        .eq("id", projectId);

    if (error) {
        return { error: "Error al actualizar estado" };
    }

    revalidatePath("/proyectos");
    return { success: true };
}

export async function updateProject(projectId: string, formData: Partial<ProjectFormData>) {
    const supabase = await createClient();

    // Filter undefined
    const updates = Object.fromEntries(
        Object.entries(formData).filter(([_, v]) => v !== undefined)
    );

    const { error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", projectId);

    if (error) {
        return { error: "Error al actualizar proyecto" };
    }

    revalidatePath("/proyectos");
    return { success: true };
}

export async function deleteProject(projectId: string) {
    const supabase = await createClient();

    const { error } = await supabase.from("projects").delete().eq("id", projectId);

    if (error) {
        return { error: "Error al eliminar proyecto" };
    }

    revalidatePath("/proyectos");
    return { success: true };
}
