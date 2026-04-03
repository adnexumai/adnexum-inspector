'use client';

import { Star, Phone, User } from 'lucide-react';
import type { Cliente } from '@/lib/supabase';

interface VIPListProps {
    clients: Cliente[];
    cortesObjetivo: number;
}

export default function VIPList({ clients, cortesObjetivo }: VIPListProps) {
    if (clients.length === 0) {
        return (
            <div className="glass-card-static p-6 text-center">
                <Star size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}>
                    No hay clientes VIP en este momento
                </p>
            </div>
        );
    }

    return (
        <div className="glass-card-static overflow-hidden">
            <div className="p-5 flex items-center gap-2"
                style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <Star size={18} style={{ color: 'var(--accent-gold)' }} />
                <h3 className="text-lg" style={{ color: 'var(--text-primary)' }}>
                    Clientes VIP
                </h3>
                <span className="vip-badge ml-auto">{clients.length}</span>
            </div>

            <div className="divide-y" style={{ borderColor: 'var(--glass-border)' }}>
                {clients.map((client, i) => (
                    <div key={client.telefono}
                        className={`flex items-center gap-4 p-4 transition-colors hover:bg-[rgba(212,168,83,0.04)] animate-fade-in-up stagger-${i + 1}`}
                        style={{ opacity: 0 }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, rgba(212,168,83,0.15), rgba(212,168,83,0.05))', border: '1px solid rgba(212,168,83,0.2)' }}>
                            <User size={18} style={{ color: 'var(--accent-gold)' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate"
                                style={{ color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
                                {client.nombre || 'Sin nombre'}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                                <Phone size={12} style={{ color: 'var(--text-muted)' }} />
                                <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}>
                                    {client.telefono}
                                </span>
                            </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <span className="text-xs px-2 py-1 rounded-lg font-semibold"
                                style={{
                                    background: 'rgba(212, 168, 83, 0.1)',
                                    color: 'var(--accent-gold)',
                                    fontFamily: 'Inter, sans-serif'
                                }}>
                                ⭐ {client.cortes_acumulados}/{cortesObjetivo}
                            </span>
                            <p className="text-xs mt-1" style={{ color: 'var(--accent-gold)', fontFamily: 'Inter, sans-serif' }}>
                                ¡Próximo corte gratis!
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
