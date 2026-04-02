import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// POST /api/analizar — analiza UN prospecto específico o todos los pendientes
// Body: { telefono?: string } — si no viene, analiza todos con conversación nueva (últimas 24h)
export async function POST(req: NextRequest) {
    const supabase = getServiceClient();
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    let telefonosAanalizar: string[] = [];
    const body = await req.json().catch(() => ({}));

    if (body.telefono) {
        telefonosAanalizar = [body.telefono];
    } else {
        // Analizar prospectos con mensajes en las últimas 24h que no se analizaron recientemente
        const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data } = await supabase
            .from('prospectos_mensajes')
            .select('telefono')
            .gte('timestamp', hace24h);

        const telefonosUnicos = [...new Set((data || []).map(m => m.telefono))];

        // Filtrar los que ya se analizaron en las últimas 23h (para no re-analizar al minuto)
        const hace23h = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();
        const { data: yaAnalizados } = await supabase
            .from('prospectos')
            .select('telefono')
            .in('telefono', telefonosUnicos)
            .gte('ultimo_analisis', hace23h);

        const setYaAnalizados = new Set((yaAnalizados || []).map(p => p.telefono));
        telefonosAanalizar = telefonosUnicos.filter(t => !setYaAnalizados.has(t));
    }

    if (!telefonosAanalizar.length) {
        return NextResponse.json({ ok: true, analizados: 0, mensaje: 'Nada nuevo para analizar' });
    }

    const resultados = [];

    for (const telefono of telefonosAanalizar) {
        try {
            // Traer todos los mensajes del prospecto ordenados
            const { data: mensajes } = await supabase
                .from('prospectos_mensajes')
                .select('direccion, tipo, contenido, timestamp, nombre_contacto')
                .eq('telefono', telefono)
                .order('timestamp', { ascending: true });

            if (!mensajes?.length) continue;

            // Traer datos del prospecto
            const { data: prospecto } = await supabase
                .from('prospectos')
                .select('negocio, nombre_contacto, estado, primer_contacto')
                .eq('telefono', telefono)
                .maybeSingle();

            // Construir transcripción
            const transcripcion = mensajes
                .filter(m => m.contenido && !m.contenido.startsWith('[reacción'))
                .map(m => {
                    const quien = m.direccion === 'saliente' ? 'Tomás' : (m.nombre_contacto || 'Prospecto');
                    const hora = new Date(m.timestamp).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
                    return `[${hora}] ${quien}: ${m.contenido}`;
                })
                .join('\n');

            if (!transcripcion.trim()) continue;

            const negocio = prospecto?.negocio || prospecto?.nombre_contacto || telefono;

            // Llamar a Claude para análisis
            const response = await anthropic.messages.create({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 600,
                messages: [{
                    role: 'user',
                    content: `Sos el asistente de ventas de Tomás Bravo, fundador de Adnexum (agencia de IA y automatización en Comodoro Rivadavia, Argentina). Tomás vende automatizaciones con n8n, chatbots con Chatwoot, integraciones con WhatsApp Business API, y soluciones con IA generativa.

Analizá esta conversación de prospección en frío con "${negocio}" (${telefono}):

---
${transcripcion}
---

Respondé en español con este formato exacto (sin markdown extra):

OPORTUNIDAD: [del 1 al 10, donde 10 = muy probable que compre]
RESUMEN: [2-3 oraciones describiendo el estado de la conversación y el interés del prospecto]
SEÑALES: [señales positivas o negativas detectadas, 1-2 oraciones]
PRÓXIMO PASO: [acción concreta que Tomás debería tomar hoy o mañana]`
                }]
            });

            const analisis = response.content[0].type === 'text' ? response.content[0].text : '';

            // Extraer score
            const scoreMatch = analisis.match(/OPORTUNIDAD:\s*(\d+)/);
            const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;

            // Guardar en Supabase
            await supabase.from('prospectos').update({
                resumen_ia: analisis,
                oportunidad_score: score,
                ultimo_analisis: new Date().toISOString(),
            }).eq('telefono', telefono);

            // Guardar nota en Obsidian (archivo markdown en Adnexum brain)
            await guardarNotaObsidian(telefono, negocio, analisis, transcripcion, score);

            resultados.push({ telefono, negocio, score });
            console.log(`[ANÁLISIS] ${negocio} (${telefono}) → score ${score}`);

        } catch (err) {
            console.error(`[ANÁLISIS ERROR] ${telefono}:`, err);
        }
    }

    return NextResponse.json({ ok: true, analizados: resultados.length, resultados });
}

async function guardarNotaObsidian(
    telefono: string,
    negocio: string,
    analisis: string,
    transcripcion: string,
    score: number
) {
    // Guardar vía webhook a n8n si está configurado, o directamente si hay acceso al vault
    // Por ahora guardamos en una tabla de Supabase específica para notas
    // (Obsidian puede sincronizarse via iCloud/OneDrive con los archivos del vault)
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const fecha = new Date().toLocaleDateString('es-AR');
    const nombreArchivo = `Prospecto_${telefono.replace('+', '')}_${Date.now()}`;

    const contenidoNota = `---
telefono: "${telefono}"
negocio: "${negocio}"
score: ${score}
fecha_analisis: "${fecha}"
---

# ${negocio} — Análisis de prospección

**Teléfono:** ${telefono}
**Score oportunidad:** ${score}/10
**Fecha:** ${fecha}

## Análisis IA

${analisis}

## Transcripción completa

\`\`\`
${transcripcion}
\`\`\`
`;

    await supabase.from('notas_prospectos').upsert({
        telefono,
        negocio,
        score,
        nombre_archivo: nombreArchivo,
        contenido_md: contenidoNota,
        fecha_analisis: new Date().toISOString(),
    }, { onConflict: 'telefono' });
}

// GET /api/analizar?telefono=XXX — ver nota de un prospecto
export async function GET(req: NextRequest) {
    const telefono = req.nextUrl.searchParams.get('telefono');
    const supabase = getServiceClient();

    if (telefono) {
        const { data } = await supabase
            .from('prospectos')
            .select('resumen_ia, oportunidad_score, ultimo_analisis, negocio, nombre_contacto')
            .eq('telefono', telefono)
            .maybeSingle();
        return NextResponse.json(data || {});
    }

    // Sin telefono: listar todos los analizados ordenados por score
    const { data } = await supabase
        .from('prospectos')
        .select('telefono, negocio, nombre_contacto, oportunidad_score, ultimo_analisis, resumen_ia')
        .not('resumen_ia', 'eq', '')
        .order('oportunidad_score', { ascending: false });

    return NextResponse.json(data || []);
}
