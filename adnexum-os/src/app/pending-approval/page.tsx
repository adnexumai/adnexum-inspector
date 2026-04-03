'use client';

export default function PendingApprovalPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/20 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 w-full max-w-md p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl text-center">
                <div className="text-5xl mb-6">⏳</div>
                <h1 className="text-2xl font-bold text-white mb-3">
                    Cuenta pendiente de aprobación
                </h1>
                <p className="text-white/60 mb-6 leading-relaxed">
                    Tu cuenta fue creada exitosamente. Un administrador necesita aprobar tu acceso antes de que puedas usar Adnexum OS.
                </p>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
                    <p className="text-amber-400 text-sm font-medium">
                        📩 El administrador será notificado. Intentá iniciar sesión más tarde.
                    </p>
                </div>
                <a
                    href="/login"
                    className="inline-block px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors"
                >
                    Volver al Login
                </a>
            </div>
        </div>
    );
}
