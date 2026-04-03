'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Flame, Skull, Scissors } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getOrCreateCliente } from '@/lib/supabase';

export default function HomePage() {
    const [telefono, setTelefono] = useState('');
    const [nombre, setNombre] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const router = useRouter();

    const formatPhone = (value: string) => {
        const nums = value.replace(/\D/g, '');
        if (nums.length <= 2) return nums;
        if (nums.length <= 6) return `${nums.slice(0, 2)}-${nums.slice(2)}`;
        return `${nums.slice(0, 2)}-${nums.slice(2, 6)}-${nums.slice(6, 10)}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanPhone = telefono.replace(/\D/g, '');
        const cleanName = nombre.trim();

        if (!cleanName || cleanName.length < 2) {
            setError('Ingresá tu nombre');
            return;
        }
        if (cleanPhone.length < 8) {
            setError('Ingresá un número válido');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await getOrCreateCliente(cleanPhone, cleanName);
            setIsTransitioning(true);
            setTimeout(() => {
                router.push(`/cliente/${cleanPhone}`);
            }, 1400);
        } catch {
            setError('Error al conectar. Intentá de nuevo.');
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
            style={{ background: 'var(--gradient-dark)' }}>

            {/* Freddy stripe top accent */}
            <div className="absolute top-0 left-0 right-0 h-[6px] stripe-banner" />

            {/* Red ambient glow */}
            <div className="pointer-events-none absolute top-[-180px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-[0.06]"
                style={{ background: 'radial-gradient(circle, #8B0000 0%, transparent 70%)' }} />

            {/* Bottom stripe accent */}
            <div className="absolute bottom-0 left-0 right-0 h-[4px] stripe-banner" />

            {/* Epic Horror Transition */}
            <AnimatePresence>
                {isTransitioning && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                        style={{ background: 'radial-gradient(circle, #4A0000 0%, #060606 100%)' }}
                    >
                        <motion.div
                            initial={{ scale: 1, opacity: 1, rotate: 0 }}
                            animate={{ scale: [1, 1.5, 30], opacity: [1, 1, 0], rotate: [0, -10, 20] }}
                            transition={{ duration: 1.2, ease: "easeIn", times: [0, 0.4, 1] }}
                        >
                            <Scissors size={100} style={{ color: '#060606' }} />
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 1.2, times: [0, 0.2, 1] }}
                            className="absolute inset-0"
                            style={{ background: 'rgba(139,0,0,0.4)', mixBlendMode: 'overlay' }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="w-full max-w-sm relative z-10">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center mb-8"
                >
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.15, duration: 0.6, type: 'spring', stiffness: 180 }}
                        className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5"
                        style={{
                            background: 'linear-gradient(135deg, rgba(139,0,0,0.18), rgba(139,0,0,0.04))',
                            border: '1px solid rgba(139,0,0,0.3)',
                            boxShadow: '0 8px 40px rgba(139,0,0,0.15)',
                        }}
                    >
                        <Scissors size={34} style={{ color: '#C41E3A' }} />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35, duration: 0.5 }}
                        className="font-display text-5xl mb-0.5"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        JL BARBER
                    </motion.h1>
                </motion.div>

                {/* Card */}
                <motion.div
                    initial={{ opacity: 0, y: 35 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="glass-card-static p-7"
                    style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 60px rgba(139,0,0,0.04)' }}
                >
                    <div className="flex items-center justify-center gap-2 mb-1.5">
                        <Flame size={16} style={{ color: '#C41E3A' }} />
                        <h2 className="font-display text-2xl" style={{ color: 'var(--text-primary)' }}>
                            BIENVENIDO
                        </h2>
                        <Skull size={14} style={{ color: 'var(--accent-green-light)' }} />
                    </div>
                    <p className="text-center text-sm mb-6 font-body"
                        style={{ color: 'var(--text-muted)' }}>
                        Ingresá para rastrear tus cortes
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name */}
                        <div>
                            <input
                                type="text"
                                className="input-premium"
                                placeholder="Tu nombre"
                                value={nombre}
                                onChange={(e) => { setNombre(e.target.value); setError(''); }}
                                autoFocus
                                style={{ fontSize: '16px', textAlign: 'center' }}
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <input
                                type="tel"
                                className="input-premium"
                                placeholder="Tu número"
                                value={telefono}
                                onChange={(e) => { setTelefono(formatPhone(e.target.value)); setError(''); }}
                                maxLength={12}
                                style={{ fontSize: '18px', letterSpacing: '0.06em', textAlign: 'center' }}
                            />
                        </div>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-sm text-center"
                                style={{ color: '#FCA5A5' }}
                            >
                                {error}
                            </motion.p>
                        )}

                        <button
                            type="submit"
                            className="btn-brand w-full flex items-center justify-center gap-3"
                            disabled={loading || isTransitioning}
                            style={{ marginTop: '16px' }}
                        >
                            {(loading || isTransitioning)
                                ? <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                : <><span>INGRESAR</span><ArrowRight size={18} /></>
                            }
                        </button>
                    </form>
                </motion.div>

                {/* Benefits */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="flex items-center justify-center gap-5 mt-7"
                >
                    <div className="flex items-center gap-1.5">
                        <Flame size={12} style={{ color: '#C41E3A' }} />
                        <span className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>Actitúd</span>
                    </div>
                    <div className="w-1 h-1 rounded-full" style={{ background: 'var(--border-subtle)' }} />
                    <div className="flex items-center gap-1.5">
                        <Skull size={12} style={{ color: 'var(--accent-green-light)' }} />
                        <span className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>Estílo</span>
                    </div>
                </motion.div>

            </div>
        </main>
    );
}
