"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Usamos service role para operaciones del tracker (no requiere auth del usuario)
function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export interface Prospecto {
    id: number;
    telefono: string;
    negocio: string;
    primer_contacto: string;
    ultimo_contacto: string;
    estado: "enviado" | "respondio" | "seguimiento" | "cerrado_positivo" | "cerrado_negativo";
    mensajes_enviados: number;
    respondio: boolean;
    notas: string;
    oportunidad_score?: number;
    resumen_ia?: string;
    siguiente_paso?: string;
}

export interface KPIs {
    hoy: { contactos: number; respuestas: number; tasa: number };
    porDia: { dia: string; contactos: number; respuestas: number }[];
    porEstado: { estado: string; total: number }[];
    totalHistorico: number;
}

export async function getProspectos(limit = 100): Promise<Prospecto[]> {
    const supabase = getServiceClient();
    const { data } = await supabase
        .from("prospectos")
        .select("*")
        .order("ultimo_contacto", { ascending: false })
        .limit(limit);
    return (data as Prospecto[]) || [];
}

export async function getKPIs(): Promise<KPIs> {
    const supabase = getServiceClient();
    const hoy = new Date().toISOString().split("T")[0];

    const [totalHoy, respondieronHoy, porDia, todos] = await Promise.all([
        supabase
            .from("prospectos")
            .select("id", { count: "exact", head: true })
            .gte("primer_contacto", `${hoy}T00:00:00`)
            .lte("primer_contacto", `${hoy}T23:59:59`),
        supabase
            .from("prospectos")
            .select("id", { count: "exact", head: true })
            .gte("primer_contacto", `${hoy}T00:00:00`)
            .lte("primer_contacto", `${hoy}T23:59:59`)
            .eq("respondio", true),
        supabase.rpc("kpis_por_dia"),
        supabase.from("prospectos").select("estado"),
    ]);

    const contactosHoy = totalHoy.count ?? 0;
    const respuestasHoy = respondieronHoy.count ?? 0;

    // Agrupar por estado manualmente
    const estadoMap: Record<string, number> = {};
    (todos.data || []).forEach((r: { estado: string }) => {
        estadoMap[r.estado] = (estadoMap[r.estado] || 0) + 1;
    });

    return {
        hoy: {
            contactos: contactosHoy,
            respuestas: respuestasHoy,
            tasa: contactosHoy > 0 ? Math.round((respuestasHoy / contactosHoy) * 100) : 0,
        },
        porDia: (porDia.data as { dia: string; contactos: number; respuestas: number }[]) || [],
        porEstado: Object.entries(estadoMap).map(([estado, total]) => ({ estado, total })),
        totalHistorico: todos.data?.length ?? 0,
    };
}

export async function updateProspecto(
    telefono: string,
    data: { negocio?: string; estado?: string; notas?: string }
) {
    const supabase = getServiceClient();
    const { error } = await supabase.from("prospectos").update(data).eq("telefono", telefono);
    if (error) return { error: error.message };
    revalidatePath("/prospeccion");
    return { success: true };
}
