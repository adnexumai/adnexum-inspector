'use client';

import { History, Scissors } from 'lucide-react';
import type { CorteHistorico } from '@/lib/supabase';

interface ClientHistoryProps {
    historial: CorteHistorico[];
}

export default function ClientHistory({ historial }: ClientHistoryProps) {
    if (historial.length === 0) {
        return (
            <div className="glass-card-static p-6 text-center animate-fade-in-up stagger-3" style={{ opacity: 0 }}>
                <Scissors size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}>
                    Todavía no tenés cortes registrados
                </p>
            </div>
        );
    }

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="glass-card-static overflow-hidden animate-fade-in-up stagger-3" style={{ opacity: 0 }}>
            <div className="p-5 flex items-center gap-2"
                style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <History size={18} style={{ color: 'var(--accent-gold)' }} />
                <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
                    Historial de Cortes
                </h3>
                <span className="ml-auto text-xs px-2 py-1 rounded-lg"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}>
                    {historial.length} cortes
                </span>
            </div>

            <div className="divide-y" style={{ borderColor: 'var(--glass-border)' }}>
                {historial.slice(0, 10).map((corte, i) => (
                    <div key={corte.id || i} className="flex items-center gap-3 p-4">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: corte.status === 'pending' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(212, 168, 83, 0.1)' }}>
                            {corte.status === 'pending' ? (
                                <History size={16} className="text-yellow-400" />
                            ) : (
                                <Scissors size={16} style={{ color: 'var(--accent-gold)' }} />
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium"
                                style={{ color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
                                {formatDate(corte.fecha)}
                                {corte.status === 'pending' && (
                                    <span className="ml-2 text-[10px] uppercase tracking-wider text-yellow-400 border border-yellow-400/30 px-1.5 py-0.5 rounded-sm">
                                        Pendiente
                                    </span>
                                )}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}>
                                {formatTime(corte.fecha)}
                            </p>
                        </div>
                        <span className={`text-sm font-semibold ${corte.status === 'pending' ? 'text-yellow-400/70' : ''}`}
                            style={{ color: corte.status === 'pending' ? undefined : 'var(--accent-gold)', fontFamily: 'Inter, sans-serif' }}>
                            ${corte.precio_final?.toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>

            {historial.length > 10 && (
                <div className="p-3 text-center"
                    style={{ borderTop: '1px solid var(--glass-border)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}>
                        Mostrando los últimos 10 de {historial.length} cortes
                    </p>
                </div>
            )}
        </div>
    );
}
