import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Usamos service role key para escribir sin RLS
function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

function verificarFirma(rawBody: string, sig: string | null): boolean {
    const secret = process.env.YCLOUD_WEBHOOK_SECRET;
    if (!secret) return true;
    if (!sig) return false;
    const partes = Object.fromEntries(sig.split(",").map((p) => p.split("=")));
    const payload = `${partes.t}.${rawBody}`;
    const esperada = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    try {
        return crypto.timingSafeEqual(Buffer.from(partes.s), Buffer.from(esperada));
    } catch {
        return false;
    }
}

async function transcribirAudio(mediaId: string): Promise<string> {
    const ycloudKey = process.env.YCLOUD_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    
    if (!ycloudKey || !openaiKey) return "<No configurado para transcripción>";

    try {
        // 1. Obtener datos del medio (URL)
        const mediaUrlRes = await fetch(`https://api.ycloud.com/v2/whatsapp/media/${mediaId}`, {
            headers: { "X-API-Key": ycloudKey }
        });
        
        if (!mediaUrlRes.ok) return "<Error consultando media a YCloud>";
        const mediaInfo = await mediaUrlRes.json();
        
        if (!mediaInfo.url) return "<No se encontró URL del audio en YCloud>";

        // 2. Descargar el audio en binario
        const mediaRes = await fetch(mediaInfo.url, {
            headers: { 
                "X-API-Key": ycloudKey,
                "Authorization": `Bearer ${ycloudKey}` // Backup por si es Graph Meta URL directo
            }
        });
        
        if (!mediaRes.ok) return "<Error descargando el audio binario>";
        const buffer = await mediaRes.arrayBuffer();
        
        // 3. Transcribir con OpenAI Whisper
        const formData = new FormData();
        // Whisper requiere que el nombre termine en .ogg o audio válido
        formData.append("file", new Blob([buffer], { type: "audio/ogg" }), "audio.ogg");
        formData.append("model", "whisper-1");

        const openAiRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${openaiKey}` },
            body: formData
        });

        if (!openAiRes.ok) {
            const error = await openAiRes.text();
            console.error("OpenAI Whisper Error:", error);
            return "<Error en la trasncripción IA>";
        }

        const result = await openAiRes.json();
        return result.text ? `[Audio transcrito]: ${result.text}` : "<Audio irreconocible>";
    } catch (e: any) {
        console.error("Error transcribiendo audio:", e.message || e);
        return "<Fallo interno en la transcripción>";
    }
}

async function upsertProspecto(supabase: ReturnType<typeof getSupabase>, telefono: string) {
    const now = new Date().toISOString();
    const { data } = await supabase
        .from("prospectos")
        .select("id")
        .eq("telefono", telefono)
        .maybeSingle();

    if (!data) {
        await supabase.from("prospectos").insert({
            telefono,
            primer_contacto: now,
            ultimo_contacto: now,
            mensajes_enviados: 1,
        });
    } else {
        await supabase.rpc("incrementar_mensajes", { p_telefono: telefono });
    }
}

async function registrarMensaje(
    supabase: ReturnType<typeof getSupabase>,
    telefono: string,
    direccion: "saliente" | "entrante",
    tipo: string,
    timestamp: string,
    wamid?: string,
    contenido?: string
) {
    await supabase.from("prospectos_mensajes").upsert(
        { telefono, direccion, tipo: tipo || "text", contenido: contenido || null, timestamp, wamid: wamid || null },
        { onConflict: "wamid", ignoreDuplicates: true }
    );
}

export async function POST(req: NextRequest) {
    // Responder 200 de inmediato (YCloud requiere respuesta rápida)
    const rawBody = await req.text();
    const sig = req.headers.get("ycloud-signature");

    if (process.env.YCLOUD_WEBHOOK_SECRET && !verificarFirma(rawBody, sig)) {
        console.warn("[WEBHOOK] Firma inválida");
        return NextResponse.json({ ok: false }, { status: 200 }); // 200 igual para no reintentos
    }

    let evento: Record<string, unknown>;
    try {
        evento = JSON.parse(rawBody);
    } catch {
        return NextResponse.json({ ok: false }, { status: 200 });
    }

    if (!evento?.type) return NextResponse.json({ ok: true });

    console.log(`[YCLOUD WEBHOOK] ${evento.type}`);
    const supabase = getSupabase();

    switch (evento.type) {
        case "whatsapp.smb.message.echoes": {
            // Tomás envía desde WhatsApp Business App (modo coexistencia)
            const msg = evento.whatsappMessage as Record<string, string> | undefined;
            if (msg?.to) {
                await upsertProspecto(supabase, msg.to);
                await registrarMensaje(supabase, msg.to, "saliente", msg.type, msg.sendTime || new Date().toISOString(), msg.wamid);
            }
            break;
        }

        case "whatsapp.message.updated": {
            // Enviado via API directa
            const msg = evento.whatsappMessage as Record<string, string> | undefined;
            if (msg?.to && msg.status === "sent") {
                await upsertProspecto(supabase, msg.to);
                await registrarMensaje(supabase, msg.to, "saliente", msg.type, msg.sendTime || new Date().toISOString(), msg.wamid);
            }
            break;
        }

        case "whatsapp.inbound_message.received": {
            // Prospecto responde
            const msg = evento.whatsappInboundMessage as Record<string, any> | undefined;
            if (msg?.from) {
                await supabase
                    .from("prospectos")
                    .update({ respondio: true, estado: "respondio", ultimo_contacto: new Date().toISOString() })
                    .eq("telefono", msg.from);
                
                let contenido = msg.text?.body;
                
                // Si es un audio, tratamos de transcribirlo
                if (msg.type === "audio" && msg.audio?.id) {
                    contenido = await transcribirAudio(msg.audio.id);
                }

                await registrarMensaje(supabase, msg.from, "entrante", msg.type, msg.sendTime || new Date().toISOString(), msg.wamid, contenido);
            }
            break;
        }
    }

    return NextResponse.json({ ok: true });
}
