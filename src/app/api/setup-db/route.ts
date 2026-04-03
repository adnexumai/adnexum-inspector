import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// One-time setup endpoint — visitar una sola vez después del deploy
// GET /api/setup-db
export async function GET() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const steps: string[] = [];

    // Crear tabla prospectos
    const { error: e1 } = await supabase.rpc("exec_ddl", {
        sql: `CREATE TABLE IF NOT EXISTS prospectos (
            id               BIGSERIAL PRIMARY KEY,
            telefono         TEXT UNIQUE NOT NULL,
            negocio          TEXT DEFAULT '',
            primer_contacto  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            ultimo_contacto  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            estado           TEXT DEFAULT 'enviado',
            mensajes_enviados INTEGER DEFAULT 1,
            respondio        BOOLEAN DEFAULT FALSE,
            notas            TEXT DEFAULT ''
        )`,
    });

    // exec_ddl no existe — usar inserción directa para verificar si la tabla ya existe
    // Si no existe, el error lo indicará. Así chequeamos el estado.
    const { error: check1 } = await supabase
        .from("prospectos")
        .select("id", { count: "exact", head: true });

    if (!check1) {
        steps.push("✅ tabla prospectos: existe");
    } else {
        steps.push(`❌ tabla prospectos: ${check1.message} — correr SQL manualmente`);
    }

    const { error: check2 } = await supabase
        .from("prospectos_mensajes")
        .select("id", { count: "exact", head: true });

    if (!check2) {
        steps.push("✅ tabla prospectos_mensajes: existe");
    } else {
        steps.push(`❌ tabla prospectos_mensajes: ${check2.message} — correr SQL manualmente`);
    }

    void e1; // unused

    return NextResponse.json({ steps, sql_file: "supabase/migrations/004_prospecting_tracker.sql" });
}
