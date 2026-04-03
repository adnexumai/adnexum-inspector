"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { LeadFormData, LeadEstado } from "@/types";

export async function createLead(formData: LeadFormData) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "No autenticado" };
    }

    const { error } = await supabase.from("leads").insert({
        user_id: user.id,
        prospecto: formData.prospecto,
        contacto: formData.contacto,
        whatsapp: formData.whatsapp,
        email: formData.email,
        temperatura: formData.temperatura || "🧊 Frío",
        ticket_estimado: formData.ticket_estimado || 0,
        servicio_interes: formData.servicio_interes,
        estado: "Inbox",
        proximo_paso: formData.proximo_paso,
        ultimo_contacto: new Date().toISOString(),
    });

    if (error) {
        console.error("Error creating lead:", error);
        return { error: "Error al crear el lead" };
    }

    revalidatePath("/pipeline");
    return { success: true };
}

export async function updateLeadStatus(leadId: string, newEstado: LeadEstado) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("leads")
        .update({ estado: newEstado })
        .eq("id", leadId);

    if (error) {
        console.error("Error updating lead status:", error);
        return { error: "Error al actualizar estado" };
    }

    revalidatePath("/pipeline");
    return { success: true };
}

export async function updateLeadInfo(leadId: string, formData: LeadFormData) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("leads")
        .update({
            prospecto: formData.prospecto,
            contacto: formData.contacto,
            whatsapp: formData.whatsapp,
            email: formData.email,
            temperatura: formData.temperatura,
            ticket_estimado: formData.ticket_estimado,
            servicio_interes: formData.servicio_interes,
            proximo_paso: formData.proximo_paso,
        })
        .eq("id", leadId);

    if (error) {
        console.error("Error updating lead info:", error);
        return { error: "Error al actualizar información" };
    }

    revalidatePath("/pipeline");
    return { success: true };
}

export async function deleteLead(leadId: string) {
    const supabase = await createClient();

    const { error } = await supabase.from("leads").delete().eq("id", leadId);

    if (error) {
        console.error("Error deleting lead:", error);
        return { error: "Error al eliminar lead" };
    }

    revalidatePath("/pipeline");
    return { success: true };
}

export async function logContact(leadId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("leads")
        .update({ ultimo_contacto: new Date().toISOString() })
        .eq("id", leadId);

    if (error) {
        return { error: "Error al registrar contacto" };
    }

    revalidatePath("/pipeline");
    revalidatePath("/seguimiento");
    return { success: true };
}
