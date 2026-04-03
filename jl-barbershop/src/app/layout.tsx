import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'JL Barber Shop — Tu corte, tu historia',
    description: 'Programa de fidelización premium de JL Barber Shop. Acumulá cortes y ganás descuentos.',
    manifest: '/manifest.json',
    appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'JL Barber' },
};

export const viewport: Viewport = {
    themeColor: '#8B0000',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es">
            <body suppressHydrationWarning>{children}</body>
        </html>
    );
}
