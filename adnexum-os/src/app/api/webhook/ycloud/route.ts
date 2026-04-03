import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

function verificarFirma(rawBody: string, sig: string | null): boolean {
    const secret = process.env.YCLOUD_WEBHOOK_SECRET;
    if (!secret) return true;
    if (!sig) return false;
    const partes = Object.fromEntries(sig.split(',').map(p => p.split('=')));
    const payload = `${partes.t}.${rawBody}`;
    const esperada = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(partes.s), Buffer.from(esperada));
    } catch { return false; }
}

// Extrae el texto/contenido legible de cualquier tipo de mensaje WA
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extraerContenido(msg: Record<string, any>): string {
    if (msg.text?.body) return msg.text.body;
    if (msg.image?.caption) return `[imagen] ${msg.image.caption}`;
    if (msg.image) return '[imagen]';
    if (msg.video?.caption) return `[video] ${msg.video.caption}`;
    if (msg.video) return '[video]';
    if (msg.audio) return '[audio]';
    if (msg.voice) return '[audio de voz]';
    if (msg.document?.filename) return `[documento: ${msg.document.filename}]`;
    if (msg.document) return '[documento]';
    if (msg.sticker) return '[sticker]';
    if (msg.location) return `[ubicación: ${msg.location.name || `${msg.location.latitude},${msg.location.longitude}`}]`;
    if (msg.reaction?.emoji) return `[reacción: ${msg.reaction.emoji}]`;
    if (msg.contacts) return `[contacto compartido]`;
    if (msg.template?.name) return `[template: ${msg.template.name}]`;
    return `[${msg.type || 'mensaje'}]`;
}

async function upsertProspecto(
    supabase: ReturnType<typeof getServiceClient>,
    telefono: string,
    nombreContacto?: string
) {
    const now = new Date().toISOString();
    const { data } = await supabase
        .from('prospectos')
        .select('id')
        .eq('telefono', telefono)
        .maybeSingle();

    if (!data) {
        await supabase.from('prospectos').insert({
            telefono,
            primer_contacto: now,
            ultimo_contacto: now,
            mensajes_enviados: 1,
            nombre_contacto: nombreContacto || '',
        });
    } else {
        await supabase.rpc('incrementar_mensajes', { p_telefono: telefono });
        if (nombreContacto) {
            await supabase.from('prospectos')
                .update({ nombre_contacto: nombreContacto })
                .eq('telefono', telefono)
                .eq('nombre_contacto', ''); // solo si no tiene nombre aún
        }
    }
}

async function registrarMensaje(
    supabase: ReturnType<typeof getServiceClient>,
    telefono: string,
    direccion: 'saliente' | 'entrante',
    tipo: string,
    timestamp: string,
    contenido: string,
    nombreContacto: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payloadRaw: Record<string, any>,
    wamid?: string
) {
    const row = {
        telefono,
        direccion,
        tipo: tipo || 'text',
        timestamp,
        contenido,
        nombre_contacto: nombreContacto,
        payload_raw: payloadRaw,
        wamid: wamid || null,
    };

    if (wamid) {
        await supabase.from('prospectos_mensajes').upsert(row, { onConflict: 'wamid', ignoreDuplicates: true });
    } else {
        await supabase.from('prospectos_mensajes').insert(row);
    }
}

export async function POST(req: NextRequest) {
    const rawBody = await req.text();
    const sig = req.headers.get('ycloud-signature');

    if (process.env.YCLOUD_WEBHOOK_SECRET && !verificarFirma(rawBody, sig)) {
        console.warn('[YCLOUD] Firma inválida');
        return NextResponse.json({ ok: false }, { status: 200 });
    }

    let evento: Record<string, unknown>;
    try {
        evento = JSON.parse(rawBody);
    } catch {
        return NextResponse.json({ ok: false }, { status: 200 });
    }

    if (!evento?.type) return NextResponse.json({ ok: true });

    console.log(`[YCLOUD] ${evento.type}`);
    const supabase = getServiceClient();

    switch (evento.type) {

        // Tomás envía desde WA Business App (modo coexistencia)
        case 'whatsapp.smb.message.echoes': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const msg = evento.whatsappMessage as Record<string, any> | undefined;
            if (msg?.to) {
                const contenido = extraerContenido(msg);
                await upsertProspecto(supabase, msg.to);
                await registrarMensaje(
                    supabase, msg.to, 'saliente', msg.type,
                    msg.sendTime || new Date().toISOString(),
                    contenido, 'Tomás', msg, msg.wamid
                );
                console.log(`[SALIENTE → ${msg.to}] ${contenido}`);
            }
            break;
        }

        // Enviado via API directa
        case 'whatsapp.message.updated': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const msg = evento.whatsappMessage as Record<string, any> | undefined;
            if (msg?.to && msg.status === 'sent') {
                const contenido = extraerContenido(msg);
                await upsertProspecto(supabase, msg.to);
                await registrarMensaje(
                    supabase, msg.to, 'saliente', msg.type,
                    msg.sendTime || new Date().toISOString(),
                    contenido, 'Tomás', msg, msg.wamid
                );
            }
            break;
        }

        // Prospecto responde
        case 'whatsapp.inbound_message.received': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const msg = evento.whatsappInboundMessage as Record<string, any> | undefined;
            if (msg?.from) {
                const contenido = extraerContenido(msg);
                const nombreContacto = msg.customerProfile?.name || '';
                await supabase.from('prospectos')
                    .update({
                        respondio: true,
                        estado: 'respondio',
                        ultimo_contacto: new Date().toISOString(),
                        ...(nombreContacto ? { nombre_contacto: nombreContacto } : {}),
                    })
                    .eq('telefono', msg.from);
                await registrarMensaje(
                    supabase, msg.from, 'entrante', msg.type,
                    msg.sendTime || new Date().toISOString(),
                    contenido, nombreContacto, msg, msg.wamid
                );
                console.log(`[ENTRANTE ← ${msg.from}] ${nombreContacto}: ${contenido}`);
            }
            break;
        }

        // Historia de mensajes WA Business App
        case 'whatsapp.smb.history': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const inbound = evento.whatsappInboundMessage as Record<string, any> | undefined;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const outbound = evento.whatsappMessage as Record<string, any> | undefined;

            if (inbound?.from) {
                const contenido = extraerContenido(inbound);
                const nombreContacto = inbound.customerProfile?.name || '';
                await upsertProspecto(supabase, inbound.from, nombreContacto);
                await registrarMensaje(
                    supabase, inbound.from, 'entrante', inbound.type,
                    inbound.sendTime || new Date().toISOString(),
                    contenido, nombreContacto, inbound, inbound.wamid
                );
            }
            if (outbound?.to) {
                const contenido = extraerContenido(outbound);
                await upsertProspecto(supabase, outbound.to);
                await registrarMensaje(
                    supabase, outbound.to, 'saliente', outbound.type,
                    outbound.sendTime || new Date().toISOString(),
                    contenido, 'Tomás', outbound, outbound.wamid
                );
            }
            break;
        }
    }

    return NextResponse.json({ ok: true });
}
