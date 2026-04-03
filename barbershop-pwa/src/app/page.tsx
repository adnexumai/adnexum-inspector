'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scissors, Phone, ArrowRight, Crown, Sparkles, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { getOrCreateCliente } from '@/lib/supabase';

export default function HomePage() {
  const [telefono, setTelefono] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

    if (cleanPhone.length < 8) {
      setError('Ingresá un número de teléfono válido');
      return;
    }

    if (!cleanName || cleanName.length < 3) {
      setError('Ingresá tu nombre completo');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create or update client with name
      await getOrCreateCliente(cleanPhone, cleanName);
      // Redirect to profile
      router.push(`/cliente/${cleanPhone}`);
    } catch (err) {
      console.error(err);
      setError('Hubo un error. Intentá de nuevo.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'var(--gradient-dark)' }}>

      {/* Ambient gold glow */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04]"
        style={{ background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)' }} />

      {/* Top gold accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: 'var(--gradient-gold)' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo + Brand */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4"
            style={{
              background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.03))',
              border: '1px solid rgba(212,175,55,0.25)',
              boxShadow: '0 8px 40px rgba(212,175,55,0.1)',
            }}
          >
            <Scissors size={32} style={{ color: '#D4AF37' }} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="font-display text-3xl mb-1"
            style={{ color: 'var(--text-primary)' }}
          >
            Alpha Omega
          </motion.h1>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card-static p-8"
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 80px rgba(212,175,55,0.03)' }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Crown size={18} style={{ color: '#D4AF37' }} />
            <h2 className="font-display text-xl" style={{ color: 'var(--text-primary)' }}>
              Bienvenido
            </h2>
          </div>
          <p className="text-center text-sm mb-6 font-body"
            style={{ color: 'var(--text-muted)' }}>
            Completá tus datos para ingresar
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input */}
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-premium pl-12"
                placeholder="Tu Nombre Completo"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  setError('');
                }}
                autoFocus
                style={{ fontSize: '16px' }}
              />
            </div>

            {/* Phone Input */}
            <div className="relative">
              <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }} />
              <input
                type="tel"
                className="input-premium pl-12"
                placeholder="11-2233-4455"
                value={telefono}
                onChange={(e) => {
                  setTelefono(formatPhone(e.target.value));
                  setError('');
                }}
                maxLength={12}
                style={{ fontSize: '18px', letterSpacing: '0.05em' }}
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-center"
                style={{ color: '#ef4444' }}
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              className="btn-gold w-full flex items-center justify-center gap-3"
              disabled={loading}
              style={{ padding: '14px 24px', fontSize: '15px' }}
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Ingresar
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Benefits badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="flex items-center justify-center gap-6 mt-8"
        >
          <div className="flex items-center gap-1.5">
            <Sparkles size={13} style={{ color: '#D4AF37' }} />
            <span className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
              Acumulá cortes
            </span>
          </div>
          <div className="w-1 h-1 rounded-full" style={{ background: 'var(--border-subtle)' }} />
          <div className="flex items-center gap-1.5">
            <Crown size={13} style={{ color: '#D4AF37' }} />
            <span className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
              Ganá descuentos
            </span>
          </div>
        </motion.div>

        {/* Powered by line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="text-center text-[10px] mt-10 font-body"
          style={{ color: 'rgba(255,255,255,0.15)' }}
        >
          Powered by Adnexum AI
        </motion.p>
      </div>
    </main>
  );
}
