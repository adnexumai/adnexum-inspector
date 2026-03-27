'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Scissors, Users, TrendingUp, DollarSign, Clock,
    CheckCircle, XCircle, Flame, Trophy, Skull, Settings,
    QrCode, BarChart3, MessageSquare, RefreshCw, Phone, Edit3, Save, X
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
    getDashboardMetrics, getPendingCuts, getAllClientes, getHallOfFame, getWeeklyRevenue,
    approveCut, rejectCut, updateCliente, updateSucursalConfig,
    Cliente, CorteHistorico, Sucursal
} from '@/lib/supabase';

type Tab = 'dashboard' | 'clientes' | 'hall' | 'qr' | 'config';

interface Metrics {
    cortesHoy: number;
    cortesMes: number;
    revenueToday: number;
    revenueMonth: number;
    projectedRevenue: number;
    vipClients: Cliente[];
    totalClientes: number;
    nuevosEsteMes: number;
    cortesObjetivo: number;
    precioCorte: number;
    sucursal: Sucursal | null;
}

export default function DashboardPage() {
    const [tab, setTab] = useState<Tab>('dashboard');
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [pending, setPending] = useState<(CorteHistorico & { cliente?: Cliente })[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [hall, setHall] = useState<Cliente[]>([]);
    const [weeklyData, setWeeklyData] = useState<{ day: string; revenue: number; cuts: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingClient, setEditingClient] = useState<string | null>(null);
    const [editNota, setEditNota] = useState('');
    const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
    const [baseUrl, setBaseUrl] = useState('https://jl-barbershop.vercel.app');
    const [configForm, setConfigForm] = useState({ precio: '', objetivo: '', descuento: '' });
    const [savingConfig, setSavingConfig] = useState(false);

    useEffect(() => { if (typeof window !== 'undefined') setBaseUrl(window.location.origin); }, []);

    const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [m, p, c, h, w] = await Promise.all([
                getDashboardMetrics(),
                getPendingCuts(),
                getAllClientes(),
                getHallOfFame(10),
                getWeeklyRevenue(),
            ]);
            setMetrics(m as Metrics);
            setPending(p as (CorteHistorico & { cliente?: Cliente })[]);
            setClientes(c);
            setHall(h);
            setWeeklyData(w);
            setConfigForm({
                precio: String(m.precioCorte),
                objetivo: String(m.cortesObjetivo),
                descuento: String(m.sucursal?.porcentaje_descuento || 50),
            });
        } catch (e) {
            console.error(e);
            showToast('Error al cargar datos', 'err');
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { loadAll(); }, [loadAll]);

    const handleApprove = async (id: string) => {
        const ok = await approveCut(id);
        if (ok) { showToast('✓ Corte aprobado'); await loadAll(); }
        else showToast('Error al aprobar', 'err');
    };
    const handleReject = async (id: string) => {
        const ok = await rejectCut(id);
        if (ok) { showToast('Solicitud rechazada'); await loadAll(); }
        else showToast('Error al rechazar', 'err');
    };

    const saveNota = async (cliente: Cliente) => {
        await updateCliente(cliente.id, { notas_estilo: editNota });
        setEditingClient(null);
        showToast('Nota guardada');
        await loadAll();
    };

    const saveConfig = async () => {
        if (!metrics?.sucursal) return;
        setSavingConfig(true);
        await updateSucursalConfig(metrics.sucursal.id, {
            precio_corte: parseInt(configForm.precio),
            config_cortes_premio: parseInt(configForm.objetivo),
            porcentaje_descuento: parseInt(configForm.descuento),
        });
        showToast('Configuración guardada');
        setSavingConfig(false);
        await loadAll();
    };

    const maxRev = Math.max(...weeklyData.map(d => d.revenue), 1);

    const fmtARS = (n: number) => `$${n.toLocaleString('es-AR')}`;
    const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
        { id: 'clientes',  label: 'Clientes',  icon: Users },
        { id: 'hall',      label: 'Ranking',   icon: Trophy },
        { id: 'qr',        label: 'QR',        icon: QrCode },
        { id: 'config',    label: 'Config',    icon: Settings },
    ];

    return (
        <main className="min-h-screen pb-10" style={{ background: 'var(--gradient-dark)' }}>
            <div className="h-[6px] stripe-banner" />

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl font-body text-sm font-semibold"
                        style={{ background: toast.type === 'ok' ? 'rgba(61,90,31,0.9)' : 'rgba(139,0,0,0.9)', color: '#F0EDE8', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-2xl mx-auto p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-5 pt-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'rgba(139,0,0,0.15)', border: '1px solid rgba(139,0,0,0.3)' }}>
                            <Scissors size={20} style={{ color: '#C41E3A' }} />
                        </div>
                        <div>
                            <h1 className="font-display text-2xl leading-none" style={{ color: 'var(--text-primary)' }}>JL BARBER</h1>
                            <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>Panel de control</p>
                        </div>
                    </div>
                    <button onClick={loadAll} className="btn-outline flex items-center gap-2 !py-2 !px-3 !text-xs">
                        <RefreshCw size={13} /> Actualizar
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`tab-btn flex items-center gap-1.5 ${tab === t.id ? 'active' : ''}`}>
                            <t.icon size={13} /> {t.label}
                            {t.id === 'dashboard' && pending.length > 0 && (
                                <span className="ml-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse"
                                    style={{ background: '#8B0000', color: '#F0EDE8' }}>{pending.length}</span>
                            )}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                            style={{ borderColor: 'var(--accent-red)', borderTopColor: 'transparent' }} />
                    </div>
                ) : (
                    <>
                        {/* ── DASHBOARD TAB ── */}
                        {tab === 'dashboard' && (
                            <div className="space-y-4">
                                {/* BI Metrics grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'Cortes hoy',      value: metrics?.cortesHoy,      icon: Scissors,     color: '#C41E3A' },
                                        { label: 'Cortes mes',      value: metrics?.cortesMes,      icon: Flame,        color: 'var(--accent-green-light)' },
                                        { label: 'Ingresos hoy',    value: fmtARS(metrics?.revenueToday || 0),  icon: DollarSign, color: '#C41E3A', isText: true },
                                        { label: 'Ingresos mes',    value: fmtARS(metrics?.revenueMonth || 0),  icon: TrendingUp, color: 'var(--accent-green-light)', isText: true },
                                    ].map((m, i) => (
                                        <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.06 }} className="metric-card">
                                            <div className="flex items-center gap-2 mb-2">
                                                <m.icon size={14} style={{ color: m.color }} />
                                                <span className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>{m.label}</span>
                                            </div>
                                            <div className={`font-display ${m.isText ? 'text-xl' : 'text-3xl'}`} style={{ color: 'var(--text-primary)' }}>
                                                {m.value}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* 2 extra metrics */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="metric-card">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Users size={14} style={{ color: 'var(--accent-red-light)' }} />
                                            <span className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>Clientes totales</span>
                                        </div>
                                        <div className="font-display text-3xl" style={{ color: 'var(--text-primary)' }}>{metrics?.totalClientes}</div>
                                        <div className="font-body text-xs mt-1" style={{ color: 'var(--accent-green-light)' }}>+{metrics?.nuevosEsteMes} este mes</div>
                                    </div>
                                    <div className="metric-card">
                                        <div className="flex items-center gap-2 mb-1">
                                            <TrendingUp size={14} style={{ color: 'var(--accent-green-light)' }} />
                                            <span className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>Proyección mes</span>
                                        </div>
                                        <div className="font-display text-xl" style={{ color: 'var(--text-primary)' }}>{fmtARS(metrics?.projectedRevenue || 0)}</div>
                                    </div>
                                </div>

                                {/* Weekly revenue chart */}
                                {weeklyData.length > 0 && (
                                    <div className="glass-card-static p-5">
                                        <h3 className="font-display text-lg mb-4" style={{ color: 'var(--text-primary)' }}>INGRESOS ÚLTIMOS 7 DÍAS</h3>
                                        <div className="flex items-end gap-2 h-28">
                                            {weeklyData.map((d, i) => (
                                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                                    <div className="font-body text-[9px]" style={{ color: 'var(--text-muted)' }}>{d.cuts}</div>
                                                    <div className="rev-bar w-full" style={{ height: `${Math.max((d.revenue / maxRev) * 90, 4)}px` }}>
                                                        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
                                                            style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '4px 4px 0 0', fontSize: '9px', color: '#F0EDE8' }}>
                                                            {fmtARS(d.revenue)}
                                                        </div>
                                                    </div>
                                                    <div className="font-body text-[10px]" style={{ color: 'var(--text-muted)' }}>{d.day}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Approval queue */}
                                <div className="glass-card-static p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-display text-lg" style={{ color: 'var(--text-primary)' }}>COLA DE APROBACIÓN</h3>
                                        {pending.length > 0 && (
                                            <span className="animate-pulse w-2 h-2 rounded-full" style={{ background: '#C41E3A', display: 'inline-block' }} />
                                        )}
                                    </div>
                                    {pending.length === 0 ? (
                                        <p className="font-body text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
                                            Sin solicitudes pendientes ✓
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {pending.map((corte) => (
                                                <div key={corte.id} className="glass-card-red p-4 flex items-center justify-between gap-3">
                                                    <div>
                                                        <p className="font-body text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                            {corte.cliente?.nombre || 'Sin nombre'}
                                                        </p>
                                                        <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
                                                            {corte.cliente_telefono} · {new Date(corte.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}hs
                                                        </p>
                                                        <p className="font-body text-xs mt-0.5" style={{ color: 'var(--accent-red-light)' }}>
                                                            Cortes: {corte.cliente?.cortes_acumulados || 0}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2 flex-shrink-0">
                                                        <button onClick={() => handleApprove(corte.id)}
                                                            className="flex items-center gap-1 px-3 py-2 rounded-lg font-body text-xs font-bold transition-all hover:scale-105"
                                                            style={{ background: 'rgba(61,90,31,0.3)', border: '1px solid rgba(61,90,31,0.4)', color: '#86EFAC' }}>
                                                            <CheckCircle size={14} /> OK
                                                        </button>
                                                        <button onClick={() => handleReject(corte.id)}
                                                            className="flex items-center gap-1 px-3 py-2 rounded-lg font-body text-xs font-bold transition-all hover:scale-105"
                                                            style={{ background: 'rgba(139,0,0,0.2)', border: '1px solid rgba(139,0,0,0.3)', color: '#FCA5A5' }}>
                                                            <XCircle size={14} /> No
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* VIP Spotlight */}
                                {(metrics?.vipClients || []).length > 0 && (
                                    <div className="glass-card-static p-5">
                                        <h3 className="font-display text-lg mb-3" style={{ color: 'var(--text-primary)' }}>
                                            VIP — A 1 CORTE DEL PREMIO 🔥
                                        </h3>
                                        <div className="space-y-2">
                                            {metrics!.vipClients.map(c => (
                                                <div key={c.id} className="flex items-center justify-between py-2"
                                                    style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                                    <div className="flex items-center gap-2">
                                                        <Flame size={14} style={{ color: '#C41E3A' }} />
                                                        <span className="font-body text-sm" style={{ color: 'var(--text-primary)' }}>{c.nombre || 'Sin nombre'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <a href={`https://wa.me/54${c.telefono}`} target="_blank" rel="noopener noreferrer"
                                                            className="flex items-center gap-1 px-2 py-1 rounded-lg font-body text-xs"
                                                            style={{ background: 'rgba(37,211,102,0.12)', color: '#25D366', border: '1px solid rgba(37,211,102,0.2)' }}>
                                                            <Phone size={11} /> WhatsApp
                                                        </a>
                                                        <span className="badge-pending">{c.cortes_acumulados} cortes</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── CLIENTES TAB ── */}
                        {tab === 'clientes' && (
                            <div className="glass-card-static p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-display text-xl" style={{ color: 'var(--text-primary)' }}>
                                        CLIENTES ({clientes.length})
                                    </h3>
                                </div>
                                <div className="space-y-2">
                                    {clientes.map((c, i) => (
                                        <div key={c.id} className="py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-body text-xs w-5 text-center" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
                                                    <div>
                                                        <p className="font-body text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                            {c.nombre || 'Sin nombre'}
                                                        </p>
                                                        <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>{c.telefono}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-body text-sm font-bold" style={{ color: 'var(--accent-red-light)' }}>
                                                        {c.cortes_acumulados} ✂
                                                    </span>
                                                    <a href={`https://wa.me/54${c.telefono}`} target="_blank" rel="noopener noreferrer"
                                                        className="p-1.5 rounded-lg" style={{ background: 'rgba(37,211,102,0.1)', color: '#25D366' }}>
                                                        <Phone size={12} />
                                                    </a>
                                                    <button onClick={() => { setEditingClient(c.id); setEditNota(c.notas_estilo || ''); }}
                                                        className="p-1.5 rounded-lg transition-colors"
                                                        style={{ background: 'rgba(139,0,0,0.1)', color: 'var(--accent-red-light)' }}>
                                                        <Edit3 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                            {editingClient === c.id && (
                                                <div className="mt-2 flex gap-2">
                                                    <input
                                                        className="input-premium flex-1 !py-2 !text-xs"
                                                        placeholder="Notas de estilo..."
                                                        value={editNota}
                                                        onChange={e => setEditNota(e.target.value)}
                                                    />
                                                    <button onClick={() => saveNota(c)} className="btn-green !py-2 !px-3 !text-xs flex items-center gap-1">
                                                        <Save size={12} />
                                                    </button>
                                                    <button onClick={() => setEditingClient(null)} className="btn-outline !py-2 !px-3 !text-xs">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            )}
                                            {c.notas_estilo && editingClient !== c.id && (
                                                <p className="font-body text-xs mt-1.5 ml-7 italic" style={{ color: 'var(--text-muted)' }}>
                                                    📝 {c.notas_estilo}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── HALL OF FAME TAB ── */}
                        {tab === 'hall' && (
                            <div className="space-y-4">
                                <div className="glass-card-static p-5">
                                    <h3 className="font-display text-xl mb-5" style={{ color: 'var(--text-primary)' }}>RANKING DE CLIENTES</h3>

                                    {/* Podium top 3 */}
                                    {hall.length >= 3 && (
                                        <div className="flex items-end justify-center gap-4 mb-6 h-28">
                                            {[hall[1], hall[0], hall[2]].map((c, idx) => {
                                                const positions = [1, 0, 2];
                                                const rank = positions[idx];
                                                const heights = ['70%', '100%', '55%'];
                                                const medals = ['🥈', '🥇', '🥉'];
                                                const colors = ['rgba(192,192,192,0.15)', 'rgba(139,0,0,0.2)', 'rgba(205,127,50,0.12)'];
                                                return (
                                                    <div key={c.id} className="flex flex-col items-center gap-1" style={{ height: heights[idx] }}>
                                                        <span className="font-body text-lg">{medals[idx]}</span>
                                                        <div className="flex-1 w-16 rounded-t-xl flex flex-col items-center justify-end pb-2 relative"
                                                            style={{ background: colors[idx], border: `1px solid ${idx === 1 ? 'rgba(139,0,0,0.3)' : 'rgba(255,255,255,0.05)'}` }}>
                                                            <p className="font-body text-[10px] font-bold px-1 text-center" style={{ color: 'var(--text-primary)' }}>
                                                                {(c.nombre || '?').split(' ')[0]}
                                                            </p>
                                                            <p className="font-display text-sm" style={{ color: idx === 1 ? '#C41E3A' : 'var(--text-secondary)' }}>
                                                                {c.cortes_acumulados}✂
                                                            </p>
                                                        </div>
                                                        <p className="font-body text-[9px]" style={{ color: 'var(--text-muted)' }}>#{rank + 1}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        {hall.map((c, i) => (
                                            <div key={c.id} className="flex items-center gap-3 py-2"
                                                style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                                <span className="font-display text-xl w-8 text-center"
                                                    style={{ color: i < 3 ? 'var(--accent-red-light)' : 'var(--text-muted)' }}>
                                                    {i + 1}
                                                </span>
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                                                    style={{ background: i < 3 ? 'rgba(139,0,0,0.2)' : 'rgba(255,255,255,0.04)', color: i < 3 ? '#C41E3A' : 'var(--text-muted)' }}>
                                                    {(c.nombre || '?')[0].toUpperCase()}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-body text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                        {c.nombre || 'Sin nombre'}
                                                    </p>
                                                    <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>{c.telefono}</p>
                                                </div>
                                                <div className="font-display text-xl" style={{ color: 'var(--accent-red-light)' }}>
                                                    {c.cortes_acumulados}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── QR TAB ── */}
                        {tab === 'qr' && (
                            <div className="glass-card-static p-7 text-center">
                                <Skull size={28} style={{ color: '#C41E3A', margin: '0 auto 12px' }} />
                                <h3 className="font-display text-2xl mb-1" style={{ color: 'var(--text-primary)' }}>QR DE ACCESO</h3>
                                <p className="font-body text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                                    Ponelo en la barbería para que los clientes escaneen
                                </p>
                                <div className="flex justify-center mb-4">
                                    <div className="p-4 rounded-2xl" style={{ background: '#F0EDE8' }}>
                                        <QRCodeSVG
                                            value={baseUrl}
                                            size={200}
                                            bgColor="#F0EDE8"
                                            fgColor="#060606"
                                            level="M"
                                        />
                                    </div>
                                </div>
                                <p className="font-display text-xl mt-2 mb-2" style={{ color: 'var(--text-primary)', letterSpacing: '0.05em' }}>JL BARBER SHOP</p>
                                <div className="stripe-banner h-1 rounded-full mt-4" />
                            </div>
                        )}

                        {/* ── CONFIG TAB ── */}
                        {tab === 'config' && (
                            <div className="glass-card-static p-6 space-y-5">
                                <h3 className="font-display text-xl" style={{ color: 'var(--text-primary)' }}>CONFIGURACIÓN</h3>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Precio corte ($)', key: 'precio', placeholder: '7000' },
                                        { label: 'Cortes para premio', key: 'objetivo', placeholder: '6' },
                                        { label: 'Descuento premio (%)', key: 'descuento', placeholder: '50' },
                                    ].map(field => (
                                        <div key={field.key}>
                                            <label className="font-body text-sm mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                                                {field.label}
                                            </label>
                                            <input
                                                type="number"
                                                className="input-premium"
                                                placeholder={field.placeholder}
                                                value={configForm[field.key as keyof typeof configForm]}
                                                onChange={e => setConfigForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <button onClick={saveConfig} disabled={savingConfig}
                                    className="btn-brand w-full flex items-center justify-center gap-2" style={{ fontSize: '16px' }}>
                                    {savingConfig
                                        ? <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        : <><Save size={15} /> GUARDAR</>
                                    }
                                </button>

                                <div className="pt-2 mt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                                    <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
                                        Sucursal actual: <span style={{ color: 'var(--text-secondary)' }}>{metrics?.sucursal?.nombre || 'JL Barber Shop'}</span>
                                    </p>
                                    <p className="font-body text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                        ID: <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '10px' }}>{metrics?.sucursal?.id}</span>
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 h-[5px] stripe-banner" />
        </main>
    );
}
