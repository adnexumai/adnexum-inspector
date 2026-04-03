'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, ArrowRight, UserPlus, LogIn } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const router = useRouter();
    const supabase = createClient();

    // Debug Env Vars
    if (typeof window !== 'undefined') {
        console.log('Supabase URL present:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.log('Supabase Key present:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (mode === 'register') {
            console.log('Attempting register with:', email);
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });
            console.log('Register response:', { data, error });

            if (error) {
                setMessage({ type: 'error', text: error.message });
            } else if (data.user && !data.session) {
                setMessage({ type: 'success', text: '✅ Cuenta creada. Por favor verificá tu email para confirmar.' });
            } else {
                setMessage({ type: 'success', text: '✅ Cuenta creada. Un administrador debe aprobar tu acceso.' });
            }
        } else {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) {
                setMessage({ type: 'error', text: error.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos' : error.message });
            } else {
                router.push('/');
                router.refresh();
            }
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 w-full max-w-md p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-2">
                        Adnexum OS
                    </h1>
                    <p className="text-white/60">
                        {mode === 'login' ? 'Iniciá sesión en tu CRM' : 'Creá tu cuenta'}
                    </p>
                </div>

                {/* Mode Toggle */}
                <div className="flex bg-white/5 rounded-xl p-1 mb-6">
                    <button
                        type="button"
                        onClick={() => { setMode('login'); setMessage(null); }}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${mode === 'login' ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white/80'}`}
                    >
                        <LogIn className="w-4 h-4" />
                        Iniciar Sesión
                    </button>
                    <button
                        type="button"
                        onClick={() => { setMode('register'); setMessage(null); }}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${mode === 'register' ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white/80'}`}
                    >
                        <UserPlus className="w-4 h-4" />
                        Registrarse
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-white/60 mb-2">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500 transition-colors"
                                placeholder="name@company.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-white/60 mb-2">Contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500 transition-colors"
                                placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                                minLength={6}
                                required
                            />
                        </div>
                    </div>

                    {/* Messages */}
                    {message && (
                        <div className={`p-3 rounded-xl text-sm ${message.type === 'error' ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'}`}>
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>

                    <div className="relative my-6 text-center">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <span className="relative px-4 bg-[#0a0a0a]/50 text-white/40 text-xs uppercase tracking-wider">
                            O continuá con
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={async () => {
                            await supabase.auth.signInWithOAuth({
                                provider: 'google',
                                options: {
                                    redirectTo: `${location.origin}/auth/callback`,
                                },
                            });
                        }}
                        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26-1.19-.58z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google
                    </button>
                </form>
            </div>
        </div>
    );
}
