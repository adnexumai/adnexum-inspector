import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

function getOpenAI() {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("No OPENAI_API_KEY env variable found");
    }
    return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
}

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

const SYSTEM_PROMPT = `Eres el asistente de ventas experto de Adnexum (consultora de IA).
Reglas del negocio (El PDF "El paso que están dando los negocios"):
1. Muchos negocios responden tarde o no llegan a contestar, perdiendo ventas aunque invierten en publicidad.
2. La IA de Adnexum contesta 24/7 en menos de 10 segundos para no perder ni un cliente.
3. El dolor principal es que el cliente tiene una "fuga de ventas" por mal sistema de atención.

Tu tarea:
Analizar la conversación que se te presenta, evaluar el nivel de interés del prospecto y generar 3 cosas en estricto formato JSON:
- "oportunidad_score": Un número del 1 al 10 indicando qué tan calificado está el lead (10 es pide link de pago/reunión, 8 interesado, 5 curioso, 2 no interesado).
- "resumen_ia": Un resumen de 1 a 2 oraciones de dónde quedó la charla.
- "siguiente_paso": Una sugerencia literal de mensaje que Tomás debería enviarle ahora mismo. Usa el "rompehielo natural" o el "dolor de atención lenta" mencionado en las reglas.

Debe ser un JSON válido, sin delimitadores de markdown. Ej: {"oportunidad_score": 8, "resumen_ia": "...", "siguiente_paso": "..."}`;

export async function POST(req: NextRequest) {
    try {
        const { telefono } = await req.json();
        if (!telefono) return NextResponse.json({ error: "Falta teléfono" }, { status: 400 });

        const supabase = getSupabase();
        
        // 1. Obtener los mensajes
        const { data: mensajes, error: msgError } = await supabase
            .from("prospectos_mensajes")
            .select("direccion, tipo, contenido, timestamp")
            .eq("telefono", telefono)
            .order("timestamp", { ascending: true });

        if (msgError || !mensajes || mensajes.length === 0) {
            return NextResponse.json({ error: "No hay mensajes para este prospecto" }, { status: 404 });
        }

        // 2. Formatear la conversación para GPT
        let conversationText = "";
        for (const m of mensajes) {
            const time = new Date(m.timestamp).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });
            const sender = m.direccion === "saliente" ? "Tomás (Adnexum)" : "Prospecto";
            conversationText += `[${time}] ${sender} (${m.tipo}): ${m.contenido || "<Audio transcrito o sin texto>"}\n`;
        }

        // 3. Llamar a OpenAI
        const openai = getOpenAI();
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: `Analiza esta conversación:\n\n${conversationText}` }
            ],
            response_format: { type: "json_object" }
        });

        const resultText = completion.choices[0].message.content || "{}";
        const result = JSON.parse(resultText);

        // 4. Guardar en BD
        await supabase.from("prospectos").update({
            oportunidad_score: result.oportunidad_score || 0,
            resumen_ia: result.resumen_ia || "Fallo en el análisis",
            siguiente_paso: result.siguiente_paso || "",
            ultimo_analisis: new Date().toISOString()
        }).eq("telefono", telefono);

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
