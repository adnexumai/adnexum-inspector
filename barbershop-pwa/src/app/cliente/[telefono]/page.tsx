'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Gift, Scissors, History, Check, Clock, Crown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { getCliente, getSucursal, getHistorialCortes, registrarCorte } from '@/lib/supabase';
import type { Cliente, Sucursal, CorteHistorico } from '@/lib/supabase';



function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function ClientePage({ params }: { params: Promise<{ telefono: string }> }) {
    const { telefono } = use(params);
    const router = useRouter();
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [sucursal, setSucursal] = useState<Sucursal | null>(null);
    const [historial, setHistorial] = useState<CorteHistorico[]>([]);
    const [loading, setLoading] = useState(true);
    const [showWelcome, setShowWelcome] = useState(true);
    const [confettiFired, setConfettiFired] = useState(false);
    const [registering, setRegistering] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const [clienteData, sucursalData, historialData] = await Promise.all([
                    getCliente(telefono), getSucursal(), getHistorialCortes(telefono),
                ]);
                setCliente(clienteData || { id: 'new', telefono, nombre: null, cortes_acumulados: 0, sucursal_id: null });
                setSucursal(sucursalData || { id: 'default', nombre: 'Alpha Omega Estudio', config_cortes_premio: 5, porcentaje_descuento: 60, precio_corte: 5000 });
                setHistorial(historialData);
            } catch (error) {
                console.error('Error loading client data:', error);
                setCliente({ id: 'new', telefono, nombre: null, cortes_acumulados: 0, sucursal_id: null });
                setSucursal({ id: 'default', nombre: 'Alpha Omega Estudio', config_cortes_premio: 5, porcentaje_descuento: 60, precio_corte: 5000 });
                setHistorial([]);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [telefono]);

    // Dismiss welcome after 2.5s
    useEffect(() => {
        if (!loading && cliente) {
            const timer = setTimeout(() => setShowWelcome(false), 2500);
            return () => clearTimeout(timer);
        }
    }, [loading, cliente]);

    const fireConfetti = useCallback(() => {
        if (confettiFired) return;
        setConfettiFired(true);
        const duration = 4000;
        const end = Date.now() + duration;
        const frame = () => {
            confetti({ particleCount: 4, angle: 60, spread: 70, origin: { x: 0, y: 0.6 }, colors: ['#D4AF37', '#E8C97A', '#B8922F', '#FFF8DC'] });
            confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1, y: 0.6 }, colors: ['#D4AF37', '#E8C97A', '#B8922F', '#FFF8DC'] });
            if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();
    }, [confettiFired]);

    useEffect(() => {
        if (!loading && cliente && sucursal && cliente.cortes_acumulados >= sucursal.config_cortes_premio) {
            setTimeout(fireConfetti, 800);
        }
    }, [loading, cliente, sucursal, fireConfetti]);

    const lastCut = historial[0];
    const isPending = lastCut?.status === 'pending';
    const hasDiscount = cliente && sucursal ? cliente.cortes_acumulados >= sucursal.config_cortes_premio : false;
    const current = cliente?.cortes_acumulados || 0;
    const total = sucursal?.config_cortes_premio || 5;

    const handleRegistrarVisita = async () => {
        if (!sucursal || registering || isPending) return;
        const confirmed = window.confirm('¿Estás en la barbería? Esto enviará una solicitud para confirmar tu llegada.');
        if (!confirmed) return;
        setRegistering(true);
        try {
            await registrarCorte(telefono, sucursal.precio_corte, sucursal.id, undefined, true);
            alert('¡Solicitud enviada! Avisale al barbero que ya hiciste el check-in.');
            window.location.reload();
        } catch (error) {
            console.error('Error registering:', error);
            alert('Error al enviar solicitud.');
            setRegistering(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center" style={{ background: '#050505' }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                    <div className="w-14 h-14 border-2 rounded-full animate-spin mx-auto mb-4"
                        style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: '#D4AF37' }} />
                    <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>Cargando tu perfil...</p>
                </motion.div>
            </main>
        );
    }

    return (
        <main className="min-h-screen pb-10 relative overflow-hidden" style={{ background: '#050505' }}>
            {/* Ambient light effect */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
                style={{ background: 'radial-gradient(ellipse, rgba(212,175,55,0.04) 0%, transparent 70%)' }} />

            {/* Welcome Animation */}
            <AnimatePresence>
                {showWelcome && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        style={{ background: '#050505' }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="text-center px-8"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 15 }}
                                className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                                style={{ background: 'var(--gradient-gold-subtle)', border: '1px solid rgba(212,175,55,0.2)' }}
                            >
                                <Scissors size={28} className="text-gold" style={{ color: '#D4AF37' }} />
                            </motion.div>
                            <h1 className="font-display text-2xl mb-2" style={{ color: 'var(--text-primary)' }}>
                                Hola{cliente?.nombre ? `, ${cliente.nombre.split(' ')[0]}` : ''}
                            </h1>
                            <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>
                                Bienvenido de nuevo a <span style={{ color: '#D4AF37' }}>Alpha Omega</span>
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Top gold line */}
            <div className="h-[2px]" style={{ background: 'var(--gradient-gold)' }} />

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: showWelcome ? 0 : 1, y: showWelcome ? -10 : 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="p-5 flex items-center gap-3"
            >
                <button onClick={() => router.push('/')}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:border-[rgba(212,175,55,0.2)]"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
                    <ArrowLeft size={17} style={{ color: 'var(--text-secondary)' }} />
                </button>
                <div className="flex-1">
                    <h1 className="font-display text-lg" style={{ color: 'var(--text-primary)' }}>
                        {cliente?.nombre || 'Invitado'}
                    </h1>
                    <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>Alpha Omega Estudio</p>
                </div>
                {current >= total - 1 && current < total && (
                    <span className="vip-badge flex items-center gap-1"><Crown size={10} /> Casi VIP</span>
                )}
            </motion.div>

            <div className="px-5 space-y-5">
                {/* ─── Alpha Pass (Reward Card) ─── */}
                <AnimatePresence>
                    {hasDiscount && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                            className="alpha-pass p-7 text-center"
                        >
                            <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}>
                                <Sparkles size={36} style={{ color: '#D4AF37' }} className="mx-auto mb-3" />
                            </motion.div>
                            <h2 className="font-display text-3xl mb-1 text-gold">ALPHA PASS</h2>
                            <div className="inline-block px-5 py-2 rounded-full my-3"
                                style={{ background: 'var(--gradient-gold)', color: '#050505' }}>
                                <span className="font-body text-sm font-bold tracking-wider">
                                    {sucursal?.porcentaje_descuento || 60}% DESCUENTO
                                </span>
                            </div>
                            <p className="font-body text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                                Completaste tus {total} cortes. Mostrá esto al pagar.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ─── Loyalty Tracker (Metallic Progress) ─── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: showWelcome ? 0 : 1, y: showWelcome ? 20 : 0 }}
                    transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="glass-card-gold p-6"
                >
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <p className="font-body text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
                                Tu progreso
                            </p>
                            <h2 className="font-display text-xl">
                                Corte <span className="text-gold">{current}</span> de {total}
                            </h2>
                        </div>
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                            style={{ background: 'var(--gradient-gold-subtle)', border: '1px solid rgba(212,175,55,0.15)' }}>
                            <Gift size={20} style={{ color: '#D4AF37' }} />
                        </div>
                    </div>

                    {/* Metallic Bar */}
                    <div className="metallic-track h-4 mb-5">
                        <motion.div
                            className="metallic-fill"
                            initial={{ width: '0%' }}
                            animate={{ width: `${Math.min((current / total) * 100, 100)}%` }}
                            transition={{ delay: 0.5, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        />
                    </div>

                    {/* Step Dots */}
                    <div className="flex justify-between">
                        {Array.from({ length: total }, (_, i) => (
                            <motion.div
                                key={i}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.6 + i * 0.08, type: 'spring', stiffness: 300, damping: 20 }}
                                className={`step-dot ${i < current ? 'completed' : i === current ? 'active' : 'inactive'}`}
                            >
                                {i < current ? <Check size={14} strokeWidth={3} /> : (
                                    i === total - 1 ? <Crown size={14} /> : <span>{i + 1}</span>
                                )}
                            </motion.div>
                        ))}
                    </div>

                    <p className="font-body text-xs text-center mt-4" style={{ color: 'var(--text-muted)' }}>
                        {hasDiscount
                            ? '🎉 ¡Premio desbloqueado!'
                            : `Te ${total - current === 1 ? 'falta' : 'faltan'} ${total - current} corte${total - current !== 1 ? 's' : ''} para tu ${sucursal?.porcentaje_descuento || 60}% OFF`}
                    </p>
                </motion.div>

                {/* ─── Check-in Button ─── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: showWelcome ? 0 : 1, y: showWelcome ? 20 : 0 }}
                    transition={{ delay: 0.35, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="glass-card-static p-5"
                >
                    <button
                        onClick={handleRegistrarVisita}
                        disabled={registering || isPending}
                        className="w-full py-4 rounded-xl font-body font-bold tracking-wide transition-all active:scale-[0.97] flex items-center justify-center gap-2.5"
                        style={{
                            background: isPending ? 'rgba(212,175,55,0.08)' : 'var(--gradient-gold)',
                            color: isPending ? '#D4AF37' : '#050505',
                            border: isPending ? '1px solid rgba(212,175,55,0.2)' : 'none',
                            opacity: registering ? 0.5 : 1,
                            cursor: isPending || registering ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {registering ? (
                            <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: '#050505', borderTopColor: 'transparent' }} />
                        ) : isPending ? (
                            <><Clock size={20} /><span>Esperando confirmación...</span></>
                        ) : (
                            <><Scissors size={20} /><span className="text-sm uppercase tracking-wider">Solicitar Check-in</span></>
                        )}
                    </button>
                    <p className="text-center font-body text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                        {isPending ? 'El barbero confirmará tu visita para sumar el punto.' : 'Tocá cuando llegues al local.'}
                    </p>
                </motion.div>

                {/* ─── History ─── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: showWelcome ? 0 : 1, y: showWelcome ? 20 : 0 }}
                    transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="glass-card-static overflow-hidden"
                >
                    <div className="p-4 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <History size={16} style={{ color: '#D4AF37' }} />
                        <h3 className="font-body text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Historial</h3>
                        <span className="ml-auto font-body text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(212,175,55,0.08)', color: '#D4AF37' }}>
                            {historial.filter(h => h.status === 'approved').length} visitas
                        </span>
                    </div>
                    {historial.length === 0 ? (
                        <div className="p-8 text-center">
                            <Scissors size={24} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                            <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>Aún no tenés visitas registradas</p>
                        </div>
                    ) : (
                        <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                            {historial.slice(0, 8).map((corte, i) => (
                                <motion.div
                                    key={corte.id || i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.6 + i * 0.05 }}
                                    className="flex items-center gap-3 p-4 transition-colors hover:bg-white/[0.01]"
                                >
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{
                                            background: corte.status === 'pending' ? 'rgba(212,175,55,0.06)' : 'rgba(212,175,55,0.06)',
                                            border: corte.status === 'pending' ? '1px solid rgba(212,175,55,0.15)' : '1px solid transparent'
                                        }}>
                                        {corte.status === 'pending' ? <Clock size={14} style={{ color: '#D4AF37' }} /> : <Check size={14} style={{ color: '#D4AF37' }} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-body text-sm" style={{ color: 'var(--text-primary)' }}>
                                            {formatDate(corte.fecha)}
                                            {corte.status === 'pending' && (
                                                <span className="ml-2 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                                                    style={{ color: '#D4AF37', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.12)' }}>
                                                    Pendiente
                                                </span>
                                            )}
                                        </p>
                                        <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>{formatTime(corte.fecha)}</p>
                                    </div>
                                    <span className="font-body text-sm font-semibold"
                                        style={{ color: corte.status === 'pending' ? 'rgba(212,175,55,0.4)' : '#D4AF37' }}>
                                        ${corte.precio_final?.toLocaleString()}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* ─── Info Footer ─── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: showWelcome ? 0 : 1 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                    className="glass-card-static p-5"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Gift size={14} style={{ color: '#D4AF37' }} />
                        <h3 className="font-body text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Programa de Fidelidad</h3>
                    </div>
                    <p className="font-body text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        Cada corte se acumula automáticamente. Al llegar a {total} cortes,
                        recibís un <strong style={{ color: '#D4AF37' }}>{sucursal?.porcentaje_descuento || 60}% de descuento</strong> en tu próximo corte. ✂️
                    </p>
                </motion.div>
            </div>
        </main>
    );
}
