'use client';

import { useState } from 'react';
import {
  Instagram,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Calendar,
  Lightbulb,
  Target,
  Megaphone,
  Clock,
  TrendingDown,
  Database,
  BarChart3,
  DollarSign,
  RefreshCw,
  Play,
  FileText,
  User,
  Eye,
} from 'lucide-react';

// ─── DATA ────────────────────────────────────────────────────────────

const PILARES = [
  { id: 1, nombre: 'Carga operativa', emoji: '🔧', icon: Clock, color: '#8b5cf6', descripcion: 'El negocio los consume porque hacen todo a mano', keyword: 'TIEMPO' },
  { id: 2, nombre: 'Ventas perdidas', emoji: '💸', icon: TrendingDown, color: '#ef4444', descripcion: 'El lead se fue porque tardaron en responder', keyword: 'VENTAS' },
  { id: 3, nombre: 'Base de datos', emoji: '🗄️', icon: Database, color: '#3b82f6', descripcion: 'No saben que pasa con sus leads', keyword: 'DATOS' },
  { id: 4, nombre: 'Metricas', emoji: '📊', icon: BarChart3, color: '#f59e0b', descripcion: 'Toman decisiones sin datos', keyword: 'NUMEROS' },
  { id: 5, nombre: 'Marketing', emoji: '📢', icon: DollarSign, color: '#10b981', descripcion: 'Gastan en publicidad a ciegas', keyword: 'CAMPANAS' },
  { id: 6, nombre: 'Seguimiento', emoji: '🔄', icon: RefreshCw, color: '#f97316', descripcion: 'No recuperan lo que ya pagaron', keyword: 'RECOVERY' },
];

interface ContentItem {
  fecha: string;
  diaSemana: string;
  pilarId: number;
  idea: string;
  formato: string;
  hook: string;
  guion: { tiempo: string; texto: string }[];
  caption: string;
  notas: string[];
}

const CALENDARIO: ContentItem[] = [
  {
    fecha: '14 May',
    diaSemana: 'Miercoles',
    pilarId: 2,
    idea: 'Los 5 minutos que definen todo',
    formato: 'Reel a camara',
    hook: 'Un lead que no respondiste en los primeros 5 minutos tiene 80% menos chances de comprarte. Ahora pensa cuantos te entraron anoche mientras dormias.',
    guion: [
      { tiempo: '0-3s HOOK', texto: 'Un lead que no respondiste en los primeros 5 minutos tiene 80% menos chances de comprarte. Ahora pensa cuantos te entraron anoche mientras dormias.' },
      { tiempo: '3-15s AGITAR', texto: 'No es que el cliente sea impaciente. Es que tiene 5 opciones mas en la pantalla. Le escribio a 3 negocios a la vez. El primero que responde se lleva la venta. Asi funciona hoy. Si tardas 2 horas, ya le compraron a otro.' },
      { tiempo: '15-45s MOSTRAR', texto: 'Lo que hago es armar un sistema donde el lead escribe y en menos de 30 segundos recibe una respuesta. No un "te contactamos pronto". Una respuesta real, con informacion, que lo mantiene enganchado hasta que alguien de tu equipo lo atiende.' },
      { tiempo: '45-60s LLAMADO', texto: 'Esta noche te van a entrar consultas. Si no tenes esto armado, manana vas a despertar con leads que ya le compraron a otro. Escribime VENTAS por DM y te cuento como se arma.' },
    ],
    caption: `5 minutos. Eso es lo que tenes para responder antes de que el lead le compre a tu competencia.

No es exageracion. El cliente tiene 5 opciones abiertas en el celular. El primero que contesta, gana.

Si vos respondes a las 3 horas... ya le compraron a otro.

Cada noche que tu negocio cierra sin un sistema automatico de respuesta, estas regalando ventas.

Escribime VENTAS por DM y te cuento como se arma.

#negocioslocales #automatizacion #whatsapp #ventas #leads #emprendedores #ia #marketing`,
    notas: ['Hablar directo a camara, tono serio pero no agresivo', 'Si podes, mostrar pantalla del celular con WhatsApp y mensajes sin responder', 'Subtitulos obligatorios', 'Duracion ideal: 60 segundos'],
  },
  {
    fecha: '16 May',
    diaSemana: 'Viernes',
    pilarId: 1,
    idea: 'El dueno que no puede irse de vacaciones',
    formato: 'Reel a camara',
    hook: 'Si no podes irte 10 dias de tu negocio sin que se caiga todo, no tenes un negocio. Tenes un trabajo donde vos sos el empleado.',
    guion: [
      { tiempo: '0-3s HOOK', texto: 'Si no podes irte 10 dias de tu negocio sin que se caiga todo, no tenes un negocio. Tenes un trabajo donde vos sos el empleado.' },
      { tiempo: '3-15s AGITAR', texto: 'Pensalo. Si manana te internaran, quien responde los WhatsApps? Quien manda los presupuestos? Quien le contesta al lead de las 11 de la noche? Nadie. Y cada mensaje sin responder es una venta que se fue.' },
      { tiempo: '15-45s MOSTRAR', texto: 'Lo que yo armo son sistemas que hacen eso por vos. El cliente escribe, recibe respuesta en segundos, queda registrado, y vos te enteras cuando es relevante. No cuando suena el telefono a las 2 de la manana.' },
      { tiempo: '45-60s LLAMADO', texto: 'Cada semana que seguis siendo el cuello de botella de tu negocio es una semana donde no creces. Escribime TIEMPO por DM y te muestro como se ve tu negocio funcionando sin vos adentro.' },
    ],
    caption: `Si tu negocio depende 100% de que vos estes presente para funcionar, no tenes un negocio. Tenes un puesto de trabajo que creaste vos mismo.

Y el problema no es que trabajes mucho. El problema es que nada funciona sin vos.

Cada dia que seguis asi:
→ Perdes oportunidades que no ves
→ No podes crecer porque no das abasto
→ Te quemas haciendo todo manual

Automatizar no es reemplazarte. Es liberarte para hacer lo que realmente mueve la aguja.

Escribime TIEMPO por DM y te cuento como aplicaria esto en tu negocio.

#negocioslocales #automatizacion #emprendedores #whatsappbusiness #ventas #crecimiento #ia`,
    notas: ['Tono reflexivo, como si le hablaras a un amigo que sabes que esta quemado', 'Podes arrancar sentado y despues pararte para la parte del "mostrar"', 'Subtitulos obligatorios'],
  },
  {
    fecha: '19 May',
    diaSemana: 'Lunes',
    pilarId: 3,
    idea: 'Los cientos de contactos que tenes y no sabes',
    formato: 'Reel a camara',
    hook: 'En el ultimo ano te escribieron cientos de personas por WhatsApp. No sabes sus nombres, no sabes que preguntaron, no sabes si compraron.',
    guion: [
      { tiempo: '0-3s HOOK', texto: 'En el ultimo ano te escribieron cientos de personas por WhatsApp. No sabes sus nombres, no sabes que preguntaron, no sabes si compraron. Esa es tu base de datos perdida.' },
      { tiempo: '3-15s AGITAR', texto: 'Todo ese trafico que generaste con publicidad, con recomendaciones, con posteos... llego a tu WhatsApp y se perdio en un mar de mensajes. No tenes un Excel, no tenes un CRM, no tenes nada. Si hoy quisieras mandarle un mensaje a todos los que preguntaron por un producto, no podrias.' },
      { tiempo: '15-45s MOSTRAR', texto: 'Lo que hago es que desde el momento que un lead escribe, queda registrado automaticamente. Nombre, telefono, que pregunto, cuando, si le respondieron, si compro. Todo. Sin que nadie anote nada.' },
      { tiempo: '45-60s LLAMADO', texto: 'Cada contacto que no registras es un cliente potencial que se pierde para siempre. Escribime DATOS por DM y te cuento como funciona.' },
    ],
    caption: `En el ultimo ano te escribieron cientos de personas.

No sabes cuantas. No sabes sus nombres. No sabes que querian. No sabes si compraron.

Todo ese trafico se perdio en tu bandeja de WhatsApp.

Imaginate tener un listado completo de cada persona que te contacto, que pregunto, y si le respondieron.

Eso es lo que construyo. Y se llena solo.

Escribime DATOS por DM si queres saber como funciona.

#basededatos #leads #crm #negocioslocales #whatsapp #automatizacion #emprendedores`,
    notas: ['Mostrar pantalla del celular con WhatsApp lleno de chats sin leer', 'Despues mostrar el Prospecting Tracker organizado', 'El contraste visual entre caos y orden es muy potente', 'Subtitulos obligatorios'],
  },
  {
    fecha: '21 May',
    diaSemana: 'Miercoles',
    pilarId: 6,
    idea: 'El 80% esta despues del quinto contacto',
    formato: 'Reel a camara',
    hook: 'El 80% de las ventas se cierran despues del quinto contacto. Cuantos seguimientos haces vos? La mayoria responde: ninguno.',
    guion: [
      { tiempo: '0-3s HOOK', texto: 'El 80% de las ventas se cierran despues del quinto contacto. Cuantos seguimientos haces vos despues de que alguien te dice "lo pienso"? La mayoria responde: ninguno.' },
      { tiempo: '3-15s AGITAR', texto: 'El lead te dijo "lo pienso" y vos nunca mas le escribiste. No porque no quisieras. Porque te olvidaste, porque entraron 20 leads mas, porque se te paso.' },
      { tiempo: '15-45s MOSTRAR', texto: 'Lo que armo es un flujo automatico: si un lead no responde en 48 horas, le llega un mensaje. Si en una semana no cerro, le llega otro. No spam. Mensajes pensados, en el momento justo.' },
      { tiempo: '45-60s LLAMADO', texto: 'Cuantos "lo pienso" tuviste este mes que nunca mas seguiste? Esa plata sigue ahi. Solo hay que ir a buscarla. Escribime RECOVERY por DM.' },
    ],
    caption: `"Lo pienso y te aviso."

Cuantas veces te dijeron eso y nunca mas supiste de ellos?

No es que no querian comprarte. Es que nadie les volvio a escribir.

El 80% de las ventas pasa despues del quinto contacto. Si solo haces uno, estas dejando el 80% de tu dinero sobre la mesa.

Escribime RECOVERY por DM y te cuento como recuperar esas ventas.

#seguimiento #ventas #followup #negocioslocales #automatizacion #emprendedores #whatsapp`,
    notas: ['Tono revelador, como contando un secreto', 'Podes usar los dedos para contar los contactos', 'Subtitulos obligatorios'],
  },
  {
    fecha: '23 May',
    diaSemana: 'Viernes',
    pilarId: 4,
    idea: 'Las 3 metricas del lunes',
    formato: 'Carrusel 5 slides',
    hook: 'Hay 3 numeros que todo dueno de negocio deberia ver cada lunes. Apuesto que hoy no miras ninguno.',
    guion: [
      { tiempo: 'Slide 1', texto: '3 numeros que todo dueno de negocio deberia ver cada lunes. Apuesto que hoy no miras ninguno.' },
      { tiempo: 'Slide 2', texto: '1. LEADS NUEVOS — Cuantas personas te contactaron. Si baja, tu marketing no esta funcionando.' },
      { tiempo: 'Slide 3', texto: '2. TASA DE RESPUESTA — De esos leads, a cuantos les respondiste en menos de 1 hora. Si es menos del 80%, estas perdiendo ventas por lento.' },
      { tiempo: 'Slide 4', texto: '3. TASA DE CIERRE — De los que respondiste, cuantos compraron. Si baja, el problema esta en tu oferta o tu seguimiento.' },
      { tiempo: 'Slide 5', texto: 'Si hoy no tenes forma de ver estos 3 numeros, estas manejando tu negocio con el estomago. Y el estomago se equivoca. Escribime NUMEROS por DM.' },
    ],
    caption: `Cada lunes deberias sentarte 5 minutos y mirar 3 numeros:

1. Cuantos leads nuevos entraron la semana pasada
2. A cuantos les respondiste rapido
3. Cuantos cerraron

Si el 1 baja: tu marketing falla.
Si el 2 baja: estas lento.
Si el 3 baja: tu oferta o tu seguimiento fallan.

3 numeros. 5 minutos. Cada lunes.

Si hoy no podes verlos, escribime NUMEROS por DM y te cuento como armarlo.

#metricas #gestion #negocioslocales #kpi #datos #emprendedores #automatizacion`,
    notas: ['Armar en Canva: fondo oscuro, tipografia grande sans-serif', 'Texto blanco principal, dato clave en amarillo o verde', 'Tamano 1080x1350', 'Maximo 30 palabras por slide'],
  },
  {
    fecha: '26 May',
    diaSemana: 'Lunes',
    pilarId: 5,
    idea: 'Clicks no son ventas',
    formato: 'Reel a camara',
    hook: 'Tu agencia te dice que tuviste 500 clicks. Cuantos de esos 500 te compraron? Clicks no pagan sueldos.',
    guion: [
      { tiempo: '0-3s HOOK', texto: 'Tu agencia de marketing te dice que tuviste 500 clicks. Yo te pregunto: cuantos de esos 500 te escribieron, cuantos te compraron, y cuanto te dejo cada uno? Porque clicks no pagan sueldos.' },
      { tiempo: '3-15s AGITAR', texto: 'El reporte dice: 500 clicks, CPM de X, alcance de Y. Todo muy lindo. Pero la pregunta es una sola: de esos 500, cuantos se convirtieron en plata? Si nadie puede contestarte eso, estas pagando por numeros que no importan.' },
      { tiempo: '15-45s MOSTRAR', texto: 'Lo que armo conecta el anuncio con el WhatsApp con la base de datos. Cuando un lead llega, se sabe de que campana vino. Si compra, se sabe que anuncio genero esa venta.' },
      { tiempo: '45-60s LLAMADO', texto: 'Cada mes que pagas publicidad sin trackear conversiones reales es un mes donde no aprendes nada. Escribime CAMPANAS por DM.' },
    ],
    caption: `500 clicks. 10.000 de alcance. CPM bajisimo.

Todo muy lindo en el reporte.

Ahora la unica pregunta que importa: cuantos de esos 500 te compraron?

Si no podes responder, esos numeros no sirven para nada.

Lo que necesitas es saber: este anuncio me trajo X leads, cerraron Y, y me dejaron Z pesos.

Eso es trackear de verdad.

Escribime CAMPANAS por DM y te cuento como conectar tu publicidad con tus ventas reales.

#metaads #publicidad #roi #negocioslocales #marketing #emprendedores #automatizacion`,
    notas: ['Tono confrontativo pero no agresivo', 'Si podes mostrar un reporte de Meta Ads generico en pantalla, suma mucho', 'Subtitulos obligatorios'],
  },
  {
    fecha: '28 May',
    diaSemana: 'Miercoles',
    pilarId: 1,
    idea: 'Las 14 horas semanales invisibles',
    formato: 'Carrusel 5 slides',
    hook: '14 horas por semana. Eso pierde un negocio promedio en tareas que se pueden automatizar.',
    guion: [
      { tiempo: 'Slide 1', texto: '14 horas por semana. Eso pierde un negocio promedio en tareas que se pueden automatizar.' },
      { tiempo: 'Slide 2', texto: '4 hs respondiendo consultas. 3 hs armando presupuestos. 3 hs haciendo seguimiento manual.' },
      { tiempo: 'Slide 3', texto: '2 hs registrando datos. 2 hs buscando conversaciones viejas. = 672 HORAS POR ANO. Casi 4 meses de trabajo completo.' },
      { tiempo: 'Slide 4', texto: 'Un sistema que responde automaticamente, registra cada lead, y le avisa al dueno solo cuando tiene que intervenir. De 14 horas paso a 3.' },
      { tiempo: 'Slide 5', texto: 'Esas horas no vuelven. Pero las de la semana que viene si las podes recuperar. Escribime TIEMPO por DM.' },
    ],
    caption: `Hice las cuentas con un dueno de negocio.

14 horas por semana. Ese era el tiempo que perdia en tareas repetitivas que nunca deberian haber sido manuales.

672 horas al ano. Casi 4 meses de trabajo completo tirados en tareas que una maquina hace en segundos.

La pregunta no es si podes automatizar. Es cuanto te esta costando no hacerlo.

Escribime TIEMPO por DM.

#productividad #automatizacion #negocioslocales #emprendedores #gestion #whatsapp #ia`,
    notas: ['Canva: fondo oscuro, numeros grandes en amarillo/verde', 'El slide 3 con el calculo acumulado es el mas impactante', '1080x1350'],
  },
  {
    fecha: '30 May',
    diaSemana: 'Viernes',
    pilarId: 2,
    idea: 'La consulta del domingo a las 10pm',
    formato: 'Reel narrativo',
    hook: 'El domingo a las 10 de la noche alguien te escribio preguntando precio. Vos lo viste el lunes a las 9. Ya le habia comprado a otro.',
    guion: [
      { tiempo: '0-3s HOOK', texto: 'El domingo a las 10 de la noche alguien te escribio preguntando precio. Vos lo viste el lunes a las 9. Ya le habia comprado a otro.' },
      { tiempo: '3-15s AGITAR', texto: 'Esto pasa todos los fines de semana. El cliente busca en Instagram, le escribe a 3, y el primero que responde cierra. No importa si tu producto es mejor. Importa quien contesta primero.' },
      { tiempo: '15-45s MOSTRAR', texto: 'Con un sistema automatico, ese mensaje del domingo a las 10pm se responde solo. El lead recibe informacion, queda registrado, y el lunes a las 9 vos ya tenes todo listo para cerrar.' },
      { tiempo: '45-60s LLAMADO', texto: 'Cuantos domingos a la noche ya pasaron asi? Escribime VENTAS por DM y te cuento como armarlo.' },
    ],
    caption: `Domingo. 10pm. Alguien te escribio por WhatsApp preguntando precios.

Lunes. 9am. Abriste el mensaje. Ya le habia comprado a otro.

No perdiste esa venta porque tu producto es malo. La perdiste porque tardaste 11 horas en responder.

Y no es tu culpa. Es que no tenes un sistema que trabaje cuando vos no estas.

Escribime VENTAS por DM si queres dejar de perder ventas mientras dormis.

#ventasperdidas #whatsapp #negocioslocales #automatizacion #leads #emprendedores #ia`,
    notas: ['Tono de historia, como contando algo que le paso a un conocido', 'Transicion: reloj 10pm → corte → reloj 9am', 'Musica de fondo suave, tension leve', 'Subtitulos obligatorios'],
  },
  {
    fecha: '2 Jun',
    diaSemana: 'Lunes',
    pilarId: 4,
    idea: 'El dashboard que le cambio el negocio',
    formato: 'Reel con pantalla',
    hook: 'Le arme un panel simple a un cliente. Me dijo: por primera vez se cuanto estoy vendiendo de verdad. Llevaba 6 anos.',
    guion: [
      { tiempo: '0-3s HOOK', texto: 'Le arme un panel simple a un cliente. Una pantalla. 4 numeros. Me dijo: "por primera vez se cuanto estoy vendiendo de verdad." Llevaba 6 anos con el negocio.' },
      { tiempo: '3-15s AGITAR', texto: '6 anos. Facturando, pagando sueldos, invirtiendo en publicidad. Y nunca habia visto cuantos leads le entraban, cuantos cerraba, y cuanto le costaba cada uno.' },
      { tiempo: '15-45s MOSTRAR', texto: 'No es complicado. Son 4 numeros en una pantalla: leads nuevos, tasa de respuesta, tasa de cierre, y costo por cliente. Eso es todo lo que necesitas.' },
      { tiempo: '45-60s LLAMADO', texto: '6 anos sin datos. Imaginate cuantas decisiones malas se podrian haber evitado. Escribime NUMEROS por DM.' },
    ],
    caption: `"Por primera vez se cuanto estoy vendiendo de verdad."

Eso me dijo un cliente despues de ver su primer dashboard.

Llevaba 6 anos con el negocio. Nunca habia visto sus numeros reales en una pantalla.

No necesitas 40 graficos. Necesitas 4 numeros clave:
→ Leads nuevos
→ Tasa de respuesta
→ Tasa de cierre
→ Costo por cliente

Escribime NUMEROS por DM si queres ver los tuyos.

#dashboard #metricas #negocioslocales #datos #gestion #emprendedores #automatizacion`,
    notas: ['REEL MAS FUERTE — mostrar Prospecting Tracker real', 'Arranca a camara, transicion a pantalla con dashboard', 'Mostrar datos reales le da 10x credibilidad', 'Subtitulos obligatorios'],
  },
];

// ─── COMPONENTS ──────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 16px',
        borderRadius: '8px',
        border: 'none',
        background: copied ? 'var(--color-green)' : 'var(--color-accent)',
        color: 'white',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? 'Copiado' : 'Copiar caption'}
    </button>
  );
}

function PilarBadge({ pilarId }: { pilarId: number }) {
  const pilar = PILARES.find(p => p.id === pilarId);
  if (!pilar) return null;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        borderRadius: '20px',
        background: `${pilar.color}20`,
        color: pilar.color,
        fontSize: '12px',
        fontWeight: 600,
      }}
    >
      {pilar.emoji} {pilar.nombre}
    </span>
  );
}

function FormatBadge({ formato }: { formato: string }) {
  const isCarrusel = formato.toLowerCase().includes('carrusel');
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 10px',
        borderRadius: '20px',
        background: 'var(--color-bg-hover)',
        color: 'var(--color-text-secondary)',
        fontSize: '11px',
        fontWeight: 500,
      }}
    >
      {isCarrusel ? <FileText size={12} /> : <Play size={12} />}
      {formato}
    </span>
  );
}

function ContentCard({ item, isToday }: { item: ContentItem; isToday: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        background: 'var(--color-bg-card)',
        border: isToday ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
        borderRadius: '16px',
        overflow: 'hidden',
        transition: 'all 0.2s',
      }}
    >
      {/* Header clickeable */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '20px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '13px',
                fontWeight: 700,
                color: isToday ? 'var(--color-accent-light)' : 'var(--color-text-muted)',
                minWidth: '80px',
              }}>
                {isToday ? '► HOY' : `${item.diaSemana} ${item.fecha}`}
              </span>
              <PilarBadge pilarId={item.pilarId} />
              <FormatBadge formato={item.formato} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {item.idea}
            </h3>
          </div>
          <div style={{ color: 'var(--color-text-muted)', flexShrink: 0, marginLeft: '12px' }}>
            {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
        </div>

        {/* Hook preview */}
        <p style={{
          fontSize: '14px',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.5,
          fontStyle: 'italic',
        }}>
          &ldquo;{item.hook}&rdquo;
        </p>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{
          borderTop: '1px solid var(--color-border)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}>
          {/* Guion */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-accent-light)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Guion
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {item.guion.map((step, i) => (
                <div key={i} style={{
                  padding: '12px 16px',
                  background: 'var(--color-bg-secondary)',
                  borderRadius: '10px',
                  borderLeft: '3px solid var(--color-accent)',
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-accent-light)', marginBottom: '6px', textTransform: 'uppercase' }}>
                    {step.tiempo}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
                    {step.texto}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Caption */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-green)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Caption para Instagram
              </h4>
              <CopyButton text={item.caption} />
            </div>
            <div style={{
              padding: '16px',
              background: 'var(--color-bg-secondary)',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              fontSize: '13px',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}>
              {item.caption}
            </div>
          </div>

          {/* Notas */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-yellow)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Notas de produccion
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {item.notas.map((nota, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  <span style={{ color: 'var(--color-yellow)', flexShrink: 0 }}>•</span>
                  {nota}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────

export default function MarcaPersonalPage() {
  const [activeTab, setActiveTab] = useState<'calendario' | 'pilares' | 'identidad'>('calendario');

  const tabs = [
    { id: 'calendario' as const, label: 'Calendario', icon: Calendar, count: CALENDARIO.length },
    { id: 'pilares' as const, label: 'Pilares', icon: Target, count: PILARES.length },
    { id: 'identidad' as const, label: 'Identidad', icon: User },
  ];

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #E4405F, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(228, 64, 95, 0.3)',
          }}>
            <Instagram size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Marca Personal
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
              @bravotomas.ia — Motor de contenido para duenos de negocio
            </p>
          </div>
        </div>

        {/* Mensaje central */}
        <div style={{
          marginTop: '20px',
          padding: '16px 20px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(228, 64, 95, 0.05))',
          borderRadius: '12px',
          border: '1px solid rgba(139, 92, 246, 0.2)',
        }}>
          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', fontStyle: 'italic' }}>
            &ldquo;Cada dia que operas manual, perdes plata. Ya no es opinion — es matematica.&rdquo;
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '24px',
        background: 'var(--color-bg-secondary)',
        padding: '4px',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
      }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: isActive ? 'var(--color-accent)' : 'transparent',
                color: isActive ? 'white' : 'var(--color-text-muted)',
                fontSize: '14px',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Icon size={16} />
              {tab.label}
              {tab.count && (
                <span style={{
                  fontSize: '11px',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--color-bg-hover)',
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab: Calendario */}
      {activeTab === 'calendario' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Week labels */}
          {[
            { label: 'Semana 1 — 14 al 19 de Mayo', items: CALENDARIO.slice(0, 3) },
            { label: 'Semana 2 — 21 al 26 de Mayo', items: CALENDARIO.slice(3, 6) },
            { label: 'Semana 3 — 28 May al 2 de Junio', items: CALENDARIO.slice(6, 9) },
          ].map((week, wi) => (
            <div key={wi}>
              <h3 style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '12px',
                paddingLeft: '4px',
              }}>
                {week.label}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {week.items.map((item, i) => (
                  <ContentCard key={i} item={item} isToday={item.fecha === '14 May'} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Pilares */}
      {activeTab === 'pilares' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {PILARES.map(pilar => {
            const Icon = pilar.icon;
            const ideasCount = CALENDARIO.filter(c => c.pilarId === pilar.id).length;
            return (
              <div
                key={pilar.id}
                style={{
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: `${pilar.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Icon size={20} style={{ color: pilar.color }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {pilar.emoji} {pilar.nombre}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      Keyword: {pilar.keyword}
                    </p>
                  </div>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  {pilar.descripcion}
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: 'var(--color-text-muted)',
                }}>
                  <Calendar size={14} />
                  {ideasCount} en el calendario
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Identidad */}
      {activeTab === 'identidad' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Audiencia */}
          <div style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={18} style={{ color: 'var(--color-accent)' }} />
              A quien le hablo
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              <p>Dueno de negocio local con 1 a 20 empleados.</p>
              {['Recibe consultas por WhatsApp y las responde a mano', 'Gasta en publicidad sin saber que campana le da resultados', 'Opera con memoria y mensajes en lugar de sistemas', 'Siente que si el para, el negocio para'].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: 'var(--color-accent)', flexShrink: 0 }}>→</span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Dolor / Deseo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '16px',
              padding: '24px',
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: 'var(--color-red)' }}>
                Punto A — El dolor
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                {['Responde consultas a mano todo el dia', 'Pierde leads por responder tarde', 'No sabe que campana funciona', 'No hace seguimiento', 'Toma decisiones sin datos', 'Si el para, el negocio para'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <span style={{ color: 'var(--color-red)', flexShrink: 0 }}>✕</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '16px',
              padding: '24px',
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: 'var(--color-green)' }}>
                Punto B — Lo que quiere
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                {['Que el negocio funcione sin depender de el', 'Saber que inversion da resultados', 'No perder ninguna oportunidad', 'Tener control sin estar presente'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <span style={{ color: 'var(--color-green)', flexShrink: 0 }}>✓</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tono y reglas */}
          <div style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Megaphone size={18} style={{ color: 'var(--color-yellow)' }} />
              Reglas de contenido
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                'Siempre hablar del costo de NO automatizar',
                'Nunca herramientas sin explicar el problema',
                'Cada video cierra con accion concreta',
                'Usar casos reales siempre que se pueda',
                'Tono directo, sin condescendencia',
                'Nunca prometer resultados magicos',
              ].map((regla, i) => (
                <div key={i} style={{
                  padding: '10px 14px',
                  background: 'var(--color-bg-secondary)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}>
                  <span style={{ color: 'var(--color-yellow)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                  {regla}
                </div>
              ))}
            </div>
          </div>

          {/* Estructura reel */}
          <div style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eye size={18} style={{ color: 'var(--color-accent)' }} />
              Estructura de cada reel (60-90s)
            </h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[
                { tiempo: '0-3s', fase: 'HOOK', desc: 'El dolor o la perdida', color: 'var(--color-red)' },
                { tiempo: '3-15s', fase: 'AGITAR', desc: 'Por que duele mas de lo que crees', color: 'var(--color-orange)' },
                { tiempo: '15-45s', fase: 'MOSTRAR', desc: 'La solucion o caso real', color: 'var(--color-green)' },
                { tiempo: '45-60s', fase: 'LLAMADO', desc: 'Que hacer si les pasa', color: 'var(--color-accent)' },
              ].map((step, i) => (
                <div key={i} style={{
                  flex: 1,
                  padding: '14px',
                  background: 'var(--color-bg-secondary)',
                  borderRadius: '10px',
                  borderTop: `3px solid ${step.color}`,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>{step.tiempo}</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: step.color, marginBottom: '4px' }}>{step.fase}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{step.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
