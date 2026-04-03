import { createClient } from "@/lib/supabase/server";
import { FocusList } from "@/components/crm/focus-list";
import { Lead } from "@/types";

export default async function SeguimientoPage() {
    const supabase = await createClient();

    // Logic: Hot leads OR (Last contact > 2 days ago) OR never contacted
    const today = new Date();
    const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();

    const { data: leads, error } = await supabase
        .from("leads")
        .select("*")
        .or(`temperatura.eq.🔥 Caliente,ultimo_contacto.lt.${twoDaysAgo},ultimo_contacto.is.null`)
        .not("estado", "in", "(Perdido,Ganado)") // Exclude closed deals
        .order("ultimo_contacto", { ascending: true }); // Oldest contact first

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Seguimiento Diario</h1>
                <p className="text-muted-foreground">
                    Leads que requieren tu atención hoy.
                </p>
            </div>

            <FocusList leads={(leads as Lead[]) || []} />
        </div>
    );
}
