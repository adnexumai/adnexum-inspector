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
    } catch {
        return false;
    }
}

async function upsertProspecto(supabase: ReturnType<typeof getServiceClient>, telefono: string) {
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
        });
    } else {
        await supabase.rpc('incrementar_mensajes', { p_telefono: telefono });
    }
}

async function registrarMensaje(
    supabase: ReturnType<typeof getServiceClient>,
    telefono: string,
    direccion: 'saliente' | 'entrante',
    tipo: string,
    timestamp: string,
    wamid?: string
) {
    if (wamid) {
        await supabase.from('prospectos_mensajes').upsert(
            { telefono, direccion, tipo: tipo || 'text', timestamp, wamid },
            { onConflict: 'wamid', ignoreDuplicates: true }
        );
    } else {
        await supabase.from('prospectos_mensajes').insert(
            { telefono, direccion, tipo: tipo || 'text', timestamp }
        );
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
            const msg = evento.whatsappMessage as Record<string, string> | undefined;
            if (msg?.to) {
                await upsertProspecto(supabase, msg.to);
                await registrarMensaje(supabase, msg.to, 'saliente', msg.type, msg.sendTime || new Date().toISOString(), msg.wamid);
            }
            break;
        }

        // Enviado via API
        case 'whatsapp.message.updated': {
            const msg = evento.whatsappMessage as Record<string, string> | undefined;
            if (msg?.to && msg.status === 'sent') {
                await upsertProspecto(supabase, msg.to);
                await registrarMensaje(supabase, msg.to, 'saliente', msg.type, msg.sendTime || new Date().toISOString(), msg.wamid);
            }
            break;
        }

        // Prospecto responde
        case 'whatsapp.inbound_message.received': {
            const msg = evento.whatsappInboundMessage as Record<string, string> | undefined;
            if (msg?.from) {
                await supabase.from('prospectos')
                    .update({ respondio: true, estado: 'respondio', ultimo_contacto: new Date().toISOString() })
                    .eq('telefono', msg.from);
                await registrarMensaje(supabase, msg.from, 'entrante', msg.type, msg.sendTime || new Date().toISOString(), msg.wamid);
            }
            break;
        }
    }

    return NextResponse.json({ ok: true });
}
