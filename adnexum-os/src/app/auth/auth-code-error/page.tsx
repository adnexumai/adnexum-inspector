'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-[#0a0a0a] text-white">
            <h1 className="text-3xl font-bold text-red-500 mb-4">Authentication Error</h1>
            <p className="text-xl mb-8">No pudimos iniciar tu sesión.</p>

            <div className="bg-white/10 p-4 rounded-lg mb-8 max-w-md">
                <p className="text-sm text-white/70">
                    Esto suele pasar si el link expiró o si abriste el correo en un navegador diferente al que usaste para pedir el link.
                </p>
                {error && <p className="mt-4 text-red-400 font-mono text-sm">{error}</p>}
            </div>

            <Link
                href="/login"
                className="px-6 py-3 bg-violet-600 hover:bg-violet-700 rounded-lg font-medium transition-colors"
            >
                Volver al Login e intentar de nuevo
            </Link>
        </div>
    );
}

export default function AuthErrorPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">Cargando...</div>}>
            <ErrorContent />
        </Suspense>
    );
}
