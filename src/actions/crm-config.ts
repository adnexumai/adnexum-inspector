"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type CRMStage = {
    id: string;
    name: string;
    color: string;
    position: number;
    created_at: string;
};

export async function getStages() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("crm_stages")
        .select("*")
        .order("position", { ascending: true });

    if (error) {
        console.error("Error fetching stages:", error);
        return [];
    }

    return data as CRMStage[];
}

export async function createStage(name: string, color: string) {
    const supabase = await createClient();

    // Get max position
    const { data: maxPosData } = await supabase
        .from("crm_stages")
        .select("position")
        .order("position", { ascending: false })
        .limit(1)
        .single();

    const nextPos = (maxPosData?.position ?? -1) + 1;

    const { error } = await supabase.from("crm_stages").insert({
        name,
        color,
        position: nextPos,
    });

    if (error) {
        return { error: "Error creating stage" };
    }

    revalidatePath("/pipeline");
    return { success: true };
}

export async function updateStage(id: string, data: Partial<Omit<CRMStage, "id" | "created_at">>) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("crm_stages")
        .update(data)
        .eq("id", id);

    if (error) {
        return { error: "Error updating stage" };
    }

    revalidatePath("/pipeline");
    return { success: true };
}

export async function deleteStage(id: string) {
    const supabase = await createClient();

    // Check if leads exist in this stage
    // First, get the stage name
    const { data: stage } = await supabase.from("crm_stages").select("name").eq("id", id).single();
    if (!stage) return { error: "Stage not found" };

    const { count } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("estado", stage.name);

    if (count && count > 0) {
        return { error: "Cannot delete stage with active leads. Move them first." };
    }

    const { error } = await supabase.from("crm_stages").delete().eq("id", id);
    if (error) {
        return { error: "Error deleting stage" };
    }

    revalidatePath("/pipeline");
    return { success: true };
}

export async function reorderStages(stages: CRMStage[]) {
    const supabase = await createClient();

    // Naive approach: update all. Better: simple loop.
    // Given low volume of stages (~5-10), this is fine.

    // Create updates array
    const updates = stages.map((stage, index) => ({
        id: stage.id,
        name: stage.name, // required for upsert? No, update by ID. 
        // Upsert requires all non-default fields if inserting?
        // We just want to update position.
        // Supabase bulk update is tricky without upsert.
        // Let's do parallel updates for now, it's few rows.
    }));

    // Actually, let's just loop.
    for (let i = 0; i < stages.length; i++) {
        await supabase.from("crm_stages").update({ position: i }).eq("id", stages[i].id);
    }

    revalidatePath("/pipeline");
    return { success: true };
}
