'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Target, MessageCircle, TrendingUp, BarChart2, Users, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Prospecto {
    id: number;
    telefono: string;
    negocio: string;
    primer_contacto: string;
    ultimo_contacto: string;
    estado: string;
    mensajes_enviados: number;
    respondio: boolean;
    notas: string;
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

    // Auto-refresh cada 30s
    useEffect(() => {
        const t = setInterval(cargar, 30000);
        return () => clearInterval(t);
    }, [cargar]);

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
                        <p className="text-sm text-gray-500">Tracker automático · YCloud WhatsApp</p>
                    </div>
                </div>
                <button
                    onClick={cargar}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white transition-colors"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Actualizar
                </button>
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
                        <span className="flex items-center gap-1 text-xs text-gray-600">
                            <span className="w-2 h-2 rounded-sm bg-blue-500/70 inline-block" /> Contactos
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-600">
                            <span className="w-2 h-2 rounded-sm bg-green-400/80 inline-block" /> Respuestas
                        </span>
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
                        <p className="text-xs mt-1">Se registran automáticamente cuando enviás mensajes de WhatsApp.</p>
                    </div>
                ) : (
                    <div className="bg-[#0f0f0f] border border-white/8 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="border-b border-white/8">
                                <tr>
                                    {['Teléfono', 'Negocio', 'Estado', 'Primer contacto', 'Último contacto', 'Msgs', ''].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-xs text-gray-600 font-medium uppercase tracking-wide">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {prospectos.map(p => (
                                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.telefono}</td>
                                        <td className="px-4 py-3 font-medium text-white">
                                            {p.negocio || <span className="text-gray-700 italic">Sin nombre</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${ESTADO_STYLE[p.estado] || ''}`}>
                                                {ESTADO_LABEL[p.estado] || p.estado}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-600">
                                            {formatDistanceToNow(new Date(p.primer_contacto), { addSuffix: true, locale: es })}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-600">
                                            {formatDistanceToNow(new Date(p.ultimo_contacto), { addSuffix: true, locale: es })}
                                        </td>
                                        <td className="px-4 py-3 text-center text-xs text-gray-500">{p.mensajes_enviados}</td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => abrirEdicion(p)}
                                                className="px-2.5 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                            >
                                                Editar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
                                <input
                                    value={form.negocio}
                                    onChange={e => setForm(f => ({ ...f, negocio: e.target.value }))}
                                    placeholder="Ej: La Keso, BBM Solutions..."
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1.5">Estado</label>
                                <select
                                    value={form.estado}
                                    onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500/50"
                                >
                                    {Object.entries(ESTADO_LABEL).map(([v, l]) => (
                                        <option key={v} value={v}>{l}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1.5">Notas</label>
                                <textarea
                                    value={form.notas}
                                    onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                                    placeholder="Contexto del prospecto..."
                                    rows={3}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500/50 resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end mt-6">
                            <button onClick={() => setEditando(null)} className="px-4 py-2 text-sm rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors">
                                Cancelar
                            </button>
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
