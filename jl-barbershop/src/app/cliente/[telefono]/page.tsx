'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Scissors, Flame, Clock, CheckCircle, XCircle, AlertCircle, Skull, Trophy, Star
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getCliente, getSucursal, getHistorialCortes, registrarCorte, Cliente, Sucursal, CorteHistorico } from '@/lib/supabase';

export default function ClientePage() {
    const params = useParams();
    const telefono = params.telefono as string;

    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [sucursal, setSucursal] = useState<Sucursal | null>(null);
    const [historial, setHistorial] = useState<CorteHistorico[]>([]);
    const [loading, setLoading] = useState(true);
    const [showWelcome, setShowWelcome] = useState(true);
    const [solicitudPendiente, setSolicitudPendiente] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [passShown, setPassShown] = useState(false);
    const [registerError, setRegisterError] = useState('');

    const loadData = useCallback(async () => {
        try {
            const [clienteData, sucursalData, historialData] = await Promise.all([
                getCliente(telefono),
                getSucursal(),
                getHistorialCortes(telefono),
            ]);
            setCliente(clienteData || { id: 'new', telefono, nombre: null, cortes_acumulados: 0, sucursal_id: null });
            setSucursal(sucursalData || { id: 'default', nombre: 'JL Barber Shop', config_cortes_premio: 6, porcentaje_descuento: 50, precio_corte: 7000 });
            setHistorial(historialData);

            const cortesPremio = sucursalData?.config_cortes_premio || 6;
            const acum = clienteData?.cortes_acumulados || 0;
            if (acum > 0 && acum % cortesPremio === 0 && !passShown) {
                setTimeout(() => { setShowPass(true); fireConfetti(); }, 1200);
            }
        } catch (error) {
            console.error(error);
            setCliente({ id: 'new', telefono, nombre: null, cortes_acumulados: 0, sucursal_id: null });
            setSucursal({ id: 'default', nombre: 'JL Barber Shop', config_cortes_premio: 6, porcentaje_descuento: 50, precio_corte: 7000 });
        } finally { setLoading(false); }
    }, [telefono, passShown]);

    useEffect(() => { loadData(); }, [loadData]);
    useEffect(() => {
        if (!showWelcome) return;
        const t = setTimeout(() => setShowWelcome(false), 2800);
        return () => clearTimeout(t);
    }, [showWelcome]);

    const hasPending = historial.some(h => h.status === 'pending');

    const handleSolicitar = async () => {
        if (hasPending || solicitudPendiente) return;
        setSolicitudPendiente(true);
        setRegisterError('');
        try {
            const { error, message } = await registrarCorte(
                telefono,
                sucursal?.precio_corte || 7000,
                sucursal?.id,
                undefined,
                true
            );
            if (error) { setRegisterError(error); setSolicitudPendiente(false); return; }
            if (message) { await loadData(); setSolicitudPendiente(false); }
        } catch { setRegisterError('Error al enviar. Intentá de nuevo.'); setSolicitudPendiente(false); }
    };

    function fireConfetti() {
        setPassShown(true);
        const fire = (opts: confetti.Options) => confetti({ particleCount: 60, spread: 80, zIndex: 9999, ...opts });
        fire({ angle: 60,  origin: { x: 0, y: 0.7 }, colors: ['#8B0000', '#C41E3A', '#3D5A1F', '#F0EDE8'] });
        fire({ angle: 120, origin: { x: 1, y: 0.7 }, colors: ['#8B0000', '#C41E3A', '#3D5A1F', '#F0EDE8'] });
    }

    if (loading) return (
        <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--gradient-dark)' }}>
            <div className="text-center">
                <div className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
                    style={{ borderColor: 'var(--accent-red)', borderTopColor: 'transparent' }} />
                <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>Cargando tu perfil...</p>
            </div>
        </main>
    );

    const cortesObjetivo = sucursal?.config_cortes_premio || 6;
    const cortesAcumulados = cliente?.cortes_acumulados || 0;
    const cortesEnCiclo = cortesAcumulados % cortesObjetivo;
    const progreso = cortesEnCiclo / cortesObjetivo;
    const descuento = sucursal?.porcentaje_descuento || 50;
    const cortesRestantes = cortesObjetivo - cortesEnCiclo;
    const nombre = cliente?.nombre || 'Amigo';

    return (
        <main className="min-h-screen pb-10" style={{ background: 'var(--gradient-dark)' }}>
            {/* Freddy stripe header */}
            <div className="h-[6px] stripe-banner" />

            {/* Welcome overlay */}
            <AnimatePresence>
                {showWelcome && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.5 }}
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        style={{ background: '#060606' }}
                    >
                        <div className="text-center px-6">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}>
                                <Scissors size={48} style={{ color: '#C41E3A', margin: '0 auto 16px' }} />
                            </motion.div>
                            <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                                className="font-display text-4xl mb-2" style={{ color: 'var(--text-primary)' }}>
                                ¡Hola, {nombre}!
                            </motion.h1>
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
                                className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>
                                Bienvenido a JL Barber Shop
                            </motion.p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* JL Pass overlay */}
            <AnimatePresence>
                {showPass && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6"
                        style={{ background: 'rgba(0,0,0,0.9)' }}
                        onClick={() => setShowPass(false)}
                    >
                        <motion.div initial={{ scale: 0.7, y: 40 }} animate={{ scale: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 180 }}
                            className="jl-pass p-8 text-center max-w-xs w-full"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="relative z-10">
                                <Trophy size={44} style={{ color: '#C41E3A', margin: '0 auto 12px' }} />
                                <h2 className="font-display text-3xl mb-1" style={{ color: 'var(--text-primary)' }}>JL PASS</h2>
                                <p className="font-body text-xs uppercase tracking-widest mb-5" style={{ color: 'var(--accent-red-light)' }}>Descuento exclusivo</p>
                                <div className="font-display text-7xl mb-2" style={{ color: '#C41E3A' }}>{descuento}%</div>
                                <p className="font-body text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>OFF en tu próximo corte</p>
                                <p className="font-body text-xs mt-4" style={{ color: 'var(--text-muted)' }}>Mostralo al barbero</p>
                                <button onClick={() => setShowPass(false)} className="btn-brand w-full mt-6" style={{ fontSize: '16px' }}>
                                    ¡GENIAL!
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-md mx-auto p-4 space-y-4 pt-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-1">
                    <div>
                        <h1 className="font-display text-3xl" style={{ color: 'var(--text-primary)' }}>{nombre.toUpperCase()}</h1>
                        <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>{telefono}</p>
                    </div>
                    {cortesAcumulados >= cortesObjetivo && (
                        <button onClick={() => { setShowPass(true); fireConfetti(); }}
                            className="vip-badge flex items-center gap-1.5 cursor-pointer">
                            <Trophy size={12} /> JL PASS
                        </button>
                    )}
                </div>

                {/* Progress card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="glass-card-static p-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <p className="font-display text-xl" style={{ color: 'var(--text-primary)' }}>
                                CORTE {cortesEnCiclo} DE {cortesObjetivo}
                            </p>
                            <p className="font-body text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                {cortesRestantes === 0
                                    ? '¡Ganaste tu descuento!'
                                    : `${cortesRestantes} corte${cortesRestantes !== 1 ? 's' : ''} para ${descuento}% OFF`}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="font-display text-3xl" style={{ color: 'var(--accent-red-light)' }}>{cortesAcumulados}</div>
                            <div className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>total</div>
                        </div>
                    </div>

                    {/* Freddy progress bar */}
                    <div className="freddy-track" style={{ height: '12px' }}>
                        <div className="freddy-fill" style={{ width: `${Math.max(progreso * 100, 4)}%` }} />
                    </div>

                    {/* Steps */}
                    <div className="flex justify-between mt-4">
                        {Array.from({ length: cortesObjetivo }, (_, i) => {
                            const completed = i < cortesEnCiclo;
                            const active = i === cortesEnCiclo;
                            return (
                                <div key={i} className={`step-dot ${completed ? 'completed' : active ? 'active' : 'inactive'}`}>
                                    {completed ? <CheckCircle size={16} /> : i + 1}
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Total cortes', value: cortesAcumulados, icon: Scissors, color: 'var(--accent-red-light)' },
                        { label: 'En ciclo', value: cortesEnCiclo, icon: Flame, color: '#C41E3A' },
                        { label: 'Faltan', value: cortesRestantes, icon: Star, color: 'var(--accent-green-light)' },
                    ].map((stat, i) => (
                        <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + i * 0.08 }} className="metric-card text-center">
                            <stat.icon size={18} style={{ color: stat.color, margin: '0 auto 4px' }} />
                            <div className="font-display text-2xl" style={{ color: 'var(--text-primary)' }}>{stat.value}</div>
                            <div className="font-body text-[10px]" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Check-in button */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
                    {hasPending ? (
                        <div className="glass-card-static p-4 flex items-center gap-3">
                            <AlertCircle size={20} style={{ color: '#FBBF24', flexShrink: 0 }} />
                            <div>
                                <p className="font-body text-sm font-semibold" style={{ color: '#FBBF24' }}>Solicitud pendiente</p>
                                <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>El barbero confirmará en breve</p>
                            </div>
                            <div className="ml-auto w-2 h-2 rounded-full animate-pulse" style={{ background: '#FBBF24' }} />
                        </div>
                    ) : (
                        <div>
                            <button
                                onClick={handleSolicitar}
                                disabled={solicitudPendiente}
                                className="btn-brand w-full flex items-center justify-center gap-3"
                                style={{ fontSize: '17px', padding: '16px' }}
                            >
                                {solicitudPendiente
                                    ? <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    : <><Scissors size={18} /><span>REGISTRAR VISITA</span></>
                                }
                            </button>
                            {registerError && <p className="text-xs text-center mt-2" style={{ color: '#FCA5A5' }}>{registerError}</p>}
                        </div>
                    )}
                </motion.div>

                {/* Historial */}
                {historial.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
                        className="glass-card-static p-5">
                        <h3 className="font-display text-xl mb-4" style={{ color: 'var(--text-primary)' }}>HISTORIAL</h3>
                        <div className="space-y-2.5">
                            {historial.slice(0, 10).map((corte) => {
                                const fecha = new Date(corte.fecha);
                                const statusMap = {
                                    approved: { icon: CheckCircle, cls: 'badge-approved', label: 'Aprobado' },
                                    pending:  { icon: Clock,        cls: 'badge-pending',  label: 'Pendiente' },
                                    rejected: { icon: XCircle,      cls: 'badge-rejected', label: 'Rechazado' },
                                };
                                const s = statusMap[corte.status];
                                return (
                                    <div key={corte.id} className="flex items-center justify-between py-2"
                                        style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                        <div className="flex items-center gap-3">
                                            <s.icon size={16} style={{ color: corte.status === 'approved' ? '#86EFAC' : corte.status === 'pending' ? '#FBBF24' : '#FCA5A5' }} />
                                            <div>
                                                <p className="font-body text-sm" style={{ color: 'var(--text-primary)' }}>
                                                    {fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                                                    {' · '}
                                                    {fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                </p>
                                                {corte.notas && <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>{corte.notas}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-body text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                ${corte.precio_final.toLocaleString('es-AR')}
                                            </span>
                                            <span className={s.cls}>{s.label}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                <p className="text-center text-[10px] font-body" style={{ color: 'rgba(255,255,255,0.1)' }}>
                    Powered by Adnexum AI
                </p>
            </div>

            {/* Bottom stripe */}
            <div className="fixed bottom-0 left-0 right-0 h-[5px] stripe-banner" />
        </main>
    );
}
