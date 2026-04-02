'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Target, MessageCircle, TrendingUp, BarChart2, Users,
    RefreshCw, ChevronDown, ChevronUp, Zap, Clock
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Mensaje {
    id: number;
    telefono: string;
    direccion: 'saliente' | 'entrante';
    tipo: string;
    contenido: string;
    nombre_contacto: string;
    timestamp: string;
}

interface Prospecto {
    id: number;
    telefono: string;
    negocio: string;
    nombre_contacto: string;
    primer_contacto: string;
    ultimo_contacto: string;
    estado: string;
    mensajes_enviados: number;
    respondio: boolean;
    notas: string;
    resumen_ia: string;
    oportunidad_score: number;
    ultimo_analisis: string;
}

interface KPIHoy { contactos: number; respuestas: number; tasa: number }
interface DiaStat { dia: string; contactos: number; respuestas: number }

const ESTADO_STYLE: Record<string, string> = {
    enviado:          'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    respondio:        'bg-green-500/15 text-green-400 border border-green-500/30',
    seguimiento:      'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
    cerrado_positivo: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    cerrado_negativo: 'bg-red-500/15 text-red-400 border border-red-500/30',
};
const ESTADO_LABEL: Record<string, string> = {
    enviado: 'Enviado', respondio: 'Respondió', seguimiento: 'Seguimiento',
    cerrado_positivo: 'Cerrado ✓', cerrado_negativo: 'Cerrado ✗',
};

function ScoreBadge({ score }: { score: number }) {
    if (!score) return null;
    const color = score >= 7 ? 'text-green-400 bg-green-500/10 border-green-500/30'
        : score >= 4 ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
        : 'text-red-400 bg-red-500/10 border-red-500/30';
    return (
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${color}`}>
            {score}/10
        </span>
    );
}

export default function ProspeccionPage() {
    const supabase = createClient();
    const [prospectos, setProspectos] = useState<Prospecto[]>([]);
    const [kpi, setKpi] = useState<KPIHoy>({ contactos: 0, respuestas: 0, tasa: 0 });
    const [porDia, setPorDia] = useState<DiaStat[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [editando, setEditando] = useState<Prospecto | null>(null);
    const [form, setForm] = useState({ negocio: '', estado: '', notas: '' });
    const [saving, setSaving] = useState(false);
    const [expandido, setExpandido] = useState<number | null>(null);
    const [mensajesExpandido, setMensajesExpandido] = useState<Mensaje[]>([]);
    const [loadingMensajes, setLoadingMensajes] = useState(false);
    const [analizando, setAnalizando] = useState<string | null>(null);

    const cargar = useCallback(async () => {
        const hoy = new Date().toISOString().split('T')[0];
        const [{ data: lista }, { count: totalHoy }, { count: respHoy }, { data: dias }, { count: hist }] =
            await Promise.all([
                supabase.from('prospectos').select('*').order('ultimo_contacto', { ascending: false }).limit(200),
                supabase.from('prospectos').select('*', { count: 'exact', head: true })
                    .gte('primer_contacto', `${hoy}T00:00:00`).lte('primer_contacto', `${hoy}T23:59:59`),
                supabase.from('prospectos').select('*', { count: 'exact', head: true })
                    .gte('primer_contacto', `${hoy}T00:00:00`).lte('primer_contacto', `${hoy}T23:59:59`).eq('respondio', true),
                supabase.rpc('kpis_por_dia'),
                supabase.from('prospectos').select('*', { count: 'exact', head: true }),
            ]);

        const c = totalHoy ?? 0;
        const r = respHoy ?? 0;
        setProspectos((lista as Prospecto[]) || []);
        setKpi({ contactos: c, respuestas: r, tasa: c > 0 ? Math.round((r / c) * 100) : 0 });
        setPorDia(dias || []);
        setTotal(hist ?? 0);
        setLoading(false);
    }, [supabase]);

    useEffect(() => { cargar(); }, [cargar]);

    // Realtime — escuchar cambios en prospectos y mensajes
    useEffect(() => {
        const channel = supabase.channel('prospeccion-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'prospectos' }, () => {
                cargar();
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'prospectos_mensajes' }, (payload) => {
                // Si el expandido es este teléfono, recargar mensajes
                const nuevoMsg = payload.new as Mensaje;
                setMensajesExpandido(prev => {
                    if (prev.length && prev[0]?.telefono === nuevoMsg.telefono) {
                        return [...prev, nuevoMsg].sort((a, b) =>
                            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                        );
                    }
                    return prev;
                });
                cargar();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [supabase, cargar]);

    async function toggleExpandido(p: Prospecto) {
        if (expandido === p.id) {
            setExpandido(null);
            setMensajesExpandido([]);
            return;
        }
        setExpandido(p.id);
        setLoadingMensajes(true);
        const { data } = await supabase
            .from('prospectos_mensajes')
            .select('*')
            .eq('telefono', p.telefono)
            .order('timestamp', { ascending: true });
        setMensajesExpandido((data as Mensaje[]) || []);
        setLoadingMensajes(false);
    }

    async function analizarProspecto(telefono: string) {
        setAnalizando(telefono);
        try {
            await fetch('/api/analizar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telefono }),
            });
            await cargar();
        } finally {
            setAnalizando(null);
        }
    }

    function abrirEdicion(p: Prospecto) {
        setEditando(p);
        setForm({ negocio: p.negocio || '', estado: p.estado, notas: p.notas || '' });
    }

    async function guardar() {
        if (!editando) return;
        setSaving(true);
        await supabase.from('prospectos').update(form).eq('telefono', editando.telefono);
        setSaving(false);
        setEditando(null);
        cargar();
    }

    const ultimos14 = [...porDia].reverse().slice(-14);
    const maxVal = Math.max(...ultimos14.map(d => d.contactos), 1);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                        <Target className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Prospección en Frío</h1>
                        <p className="text-sm text-gray-500">Tracker automático · YCloud WhatsApp · Análisis IA cada 24h</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => fetch('/api/analizar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then(() => cargar())}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    >
                        <Zap className="w-3.5 h-3.5" />
                        Analizar todo
                    </button>
                    <button
                        onClick={cargar}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Actualizar
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Contactados hoy', value: kpi.contactos, icon: MessageCircle, color: 'text-green-400' },
                    { label: 'Respuestas hoy', value: kpi.respuestas, icon: TrendingUp, color: 'text-blue-400' },
                    { label: 'Tasa respuesta', value: `${kpi.tasa}%`, icon: BarChart2, color: kpi.tasa >= 20 ? 'text-green-400' : 'text-yellow-400' },
                    { label: 'Total histórico', value: total, icon: Users, color: 'text-gray-400' },
                ].map(c => (
                    <div key={c.label} className="bg-[#0f0f0f] border border-white/8 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">{c.label}</span>
                            <c.icon className={`w-4 h-4 ${c.color}`} />
                        </div>
                        <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
                    </div>
                ))}
            </div>

            {/* Chart */}
            {ultimos14.length > 0 && (
                <div className="bg-[#0f0f0f] border border-white/8 rounded-xl p-4">
                    <div className="flex items-center gap-4 mb-4">
                        <span className="text-sm text-gray-500">Últimos 14 días</span>
                        <span className="flex items-center gap-1 text-xs text-gray-600"><span className="w-2 h-2 rounded-sm bg-blue-500/70 inline-block" /> Contactos</span>
                        <span className="flex items-center gap-1 text-xs text-gray-600"><span className="w-2 h-2 rounded-sm bg-green-400/80 inline-block" /> Respuestas</span>
                    </div>
                    <div className="flex items-end gap-1.5 h-24">
                        {ultimos14.map(d => {
                            const hC = Math.max((d.contactos / maxVal) * 88, 4);
                            const hR = Math.max((d.respuestas / maxVal) * 88, d.respuestas > 0 ? 4 : 0);
                            return (
                                <div key={d.dia} className="flex flex-col items-center gap-1 flex-1">
                                    <div className="flex items-end gap-0.5 h-20 w-full justify-center">
                                        <div title={`${d.contactos} contactos`} className="bg-blue-500/60 rounded-sm flex-1 min-w-[4px]" style={{ height: `${hC}px` }} />
                                        <div title={`${d.respuestas} respuestas`} className="bg-green-400/70 rounded-sm flex-1 min-w-[4px]" style={{ height: `${hR}px` }} />
                                    </div>
                                    <span className="text-[9px] text-gray-600">{d.dia.slice(5)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Tabla */}
            <div>
                <p className="text-sm text-gray-500 mb-3">Prospectos ({prospectos.length})</p>
                {loading ? (
                    <div className="text-center py-12 text-gray-600 text-sm">Cargando...</div>
                ) : prospectos.length === 0 ? (
                    <div className="text-center py-16 text-gray-600">
                        <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No hay prospectos aún.</p>
                        <p className="text-xs mt-1">Se registran automáticamente al enviar mensajes de WhatsApp.</p>
                    </div>
                ) : (
                    <div className="bg-[#0f0f0f] border border-white/8 rounded-xl overflow-hidden">
                        {prospectos.map((p, i) => (
                            <div key={p.id} className={i < prospectos.length - 1 ? 'border-b border-white/5' : ''}>
                                {/* Fila principal */}
                                <div
                                    className="grid grid-cols-[1fr_1fr_120px_80px_80px_100px_80px] gap-2 px-4 py-3 hover:bg-white/3 transition-colors cursor-pointer items-center"
                                    onClick={() => toggleExpandido(p)}
                                >
                                    <div>
                                        <p className="font-medium text-sm text-white">
                                            {p.negocio || p.nombre_contacto || <span className="text-gray-600 italic text-xs">Sin nombre</span>}
                                        </p>
                                        <p className="font-mono text-[10px] text-gray-600">{p.telefono}</p>
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">
                                        {p.resumen_ia ? p.resumen_ia.split('\n').find(l => l.startsWith('RESUMEN:'))?.replace('RESUMEN:', '').trim() || '—' : '—'}
                                    </div>
                                    <div>
                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${ESTADO_STYLE[p.estado] || ''}`}>
                                            {ESTADO_LABEL[p.estado] || p.estado}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <ScoreBadge score={p.oportunidad_score} />
                                    </div>
                                    <div className="text-center text-xs text-gray-600">{p.mensajes_enviados}</div>
                                    <div className="text-xs text-gray-600">
                                        {formatDistanceToNow(new Date(p.ultimo_contacto), { addSuffix: true, locale: es })}
                                    </div>
                                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={() => abrirEdicion(p)}
                                            className="px-2 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                        >
                                            Editar
                                        </button>
                                        {expandido === p.id ? <ChevronUp className="w-3.5 h-3.5 text-gray-600" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-600" />}
                                    </div>
                                </div>

                                {/* Panel expandido */}
                                {expandido === p.id && (
                                    <div className="border-t border-white/5 bg-black/20 px-4 py-4 grid grid-cols-2 gap-6">
                                        {/* Conversación */}
                                        <div>
                                            <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide">Conversación</p>
                                            {loadingMensajes ? (
                                                <p className="text-xs text-gray-600">Cargando mensajes...</p>
                                            ) : mensajesExpandido.length === 0 ? (
                                                <p className="text-xs text-gray-600">Sin mensajes registrados</p>
                                            ) : (
                                                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                                    {mensajesExpandido.map(m => (
                                                        <div key={m.id} className={`flex ${m.direccion === 'saliente' ? 'justify-end' : 'justify-start'}`}>
                                                            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs ${
                                                                m.direccion === 'saliente'
                                                                    ? 'bg-green-500/20 text-green-100'
                                                                    : 'bg-white/8 text-gray-300'
                                                            }`}>
                                                                <p className="mb-0.5">{m.contenido || `[${m.tipo}]`}</p>
                                                                <p className="text-[10px] opacity-50">
                                                                    {format(new Date(m.timestamp), 'dd/MM HH:mm')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Análisis IA */}
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <p className="text-xs text-gray-500 uppercase tracking-wide">Análisis IA</p>
                                                <button
                                                    onClick={() => analizarProspecto(p.telefono)}
                                                    disabled={analizando === p.telefono}
                                                    className="flex items-center gap-1 px-2 py-1 text-[10px] rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
                                                >
                                                    <Zap className="w-3 h-3" />
                                                    {analizando === p.telefono ? 'Analizando...' : 'Analizar ahora'}
                                                </button>
                                            </div>
                                            {p.resumen_ia ? (
                                                <div className="space-y-2">
                                                    {p.resumen_ia.split('\n').filter(Boolean).map((linea, i) => {
                                                        const [clave, ...resto] = linea.split(':');
                                                        const valor = resto.join(':').trim();
                                                        if (!valor) return null;
                                                        return (
                                                            <div key={i}>
                                                                <span className="text-[10px] text-gray-600 uppercase tracking-wide">{clave.trim()}</span>
                                                                <p className="text-xs text-gray-300 mt-0.5">{valor}</p>
                                                            </div>
                                                        );
                                                    })}
                                                    {p.ultimo_analisis && (
                                                        <p className="text-[10px] text-gray-700 flex items-center gap-1 mt-2">
                                                            <Clock className="w-3 h-3" />
                                                            {formatDistanceToNow(new Date(p.ultimo_analisis), { addSuffix: true, locale: es })}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-gray-600">Sin análisis aún. Hacé clic en "Analizar ahora".</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal editar */}
            {editando && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setEditando(null)}>
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-base font-semibold mb-5">Editar prospecto</h3>
                        <p className="font-mono text-xs text-gray-500 mb-4">{editando.telefono}</p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1.5">Nombre del negocio</label>
                                <input value={form.negocio} onChange={e => setForm(f => ({ ...f, negocio: e.target.value }))}
                                    placeholder="Ej: La Keso, BBM Solutions..."
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500/50" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1.5">Estado</label>
                                <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500/50">
                                    {Object.entries(ESTADO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1.5">Notas</label>
                                <textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                                    placeholder="Contexto del prospecto..." rows={3}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500/50 resize-none" />
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end mt-6">
                            <button onClick={() => setEditando(null)} className="px-4 py-2 text-sm rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors">Cancelar</button>
                            <button onClick={guardar} disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-green-500 hover:bg-green-400 text-black font-semibold transition-colors disabled:opacity-50">
                                {saving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}