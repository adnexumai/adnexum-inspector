'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Copy, Check, Download, ExternalLink } from 'lucide-react';

interface QRCodeDisplayProps {
    baseUrl?: string;
}

export default function QRCodeDisplay({ baseUrl }: QRCodeDisplayProps) {
    const [copied, setCopied] = useState(false);

    // Auto-detect base URL from current window
    const url = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://barberpro.app');

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
            const input = document.createElement('input');
            input.value = url;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownload = () => {
        const svg = document.getElementById('qr-code-svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = 512;
            canvas.height = 512;
            if (ctx) {
                ctx.fillStyle = '#0a0a0a';
                ctx.fillRect(0, 0, 512, 512);
                ctx.drawImage(img, 56, 56, 400, 400);

                // Add branding text
                ctx.fillStyle = '#d4a853';
                ctx.font = 'bold 24px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Alpha Omega Estudio', 256, 490);
            }

            const pngUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'barberpro-qr.png';
            link.href = pngUrl;
            link.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    return (
        <div className="glass-card-static p-6 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-5">
                <QrCode size={20} style={{ color: 'var(--accent-gold)' }} />
                <h3 className="text-lg" style={{ color: 'var(--text-primary)' }}>
                    QR para Clientes
                </h3>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-5">
                <div className="p-4 rounded-2xl" style={{ background: '#ffffff' }}>
                    <QRCodeSVG
                        id="qr-code-svg"
                        value={url}
                        size={180}
                        level="H"
                        bgColor="#ffffff"
                        fgColor="#0a0a0a"
                        imageSettings={{
                            src: '',
                            height: 0,
                            width: 0,
                            excavate: false,
                        }}
                    />
                </div>
            </div>

            {/* URL display */}
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                <ExternalLink size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span className="text-xs truncate" style={{ color: 'var(--text-secondary)', fontFamily: 'Inter, sans-serif' }}>
                    {url}
                </span>
                <button
                    onClick={handleCopy}
                    className="ml-auto flex-shrink-0 p-1.5 rounded-lg transition-colors"
                    style={{ background: 'var(--bg-card)', cursor: 'pointer', border: 'none' }}
                    title="Copiar enlace"
                >
                    {copied
                        ? <Check size={14} style={{ color: '#22c55e' }} />
                        : <Copy size={14} style={{ color: 'var(--text-muted)' }} />
                    }
                </button>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
                <button onClick={handleCopy} className="btn-outline text-xs py-2.5 flex items-center justify-center gap-2"
                    style={{ fontSize: '12px', padding: '10px' }}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? '¡Copiado!' : 'Copiar Link'}
                </button>
                <button onClick={handleDownload} className="btn-gold text-xs py-2.5 flex items-center justify-center gap-2"
                    style={{ fontSize: '12px', padding: '10px' }}>
                    <Download size={14} />
                    Descargar QR
                </button>
            </div>

            {/* Instructions */}
            <p className="text-xs text-center mt-4" style={{ color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}>
                Imprimí este QR y colocalo en tu barbería. Los clientes lo escanean para ver su progreso y registrar sus cortes.
            </p>
        </div>
    );
}
