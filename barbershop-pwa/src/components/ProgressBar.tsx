'use client';

import { Check, Scissors } from 'lucide-react';

interface ProgressBarProps {
    current: number;
    total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
    return (
        <div className="space-y-4">
            {/* Label */}
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)', fontFamily: 'Inter, sans-serif' }}>
                    Tu Progreso
                </span>
                <span className="text-sm font-bold" style={{ color: 'var(--accent-gold)', fontFamily: 'Inter, sans-serif' }}>
                    {current >= total ? '¡COMPLETO!' : `${current} de ${total}`}
                </span>
            </div>

            {/* Segments */}
            <div className="flex gap-2">
                {Array.from({ length: total }, (_, i) => (
                    <div
                        key={i}
                        className={`progress-segment ${i < current ? 'filled' : ''}`}
                        style={{
                            animationDelay: `${i * 0.15}s`,
                            animation: i < current ? `scaleIn 0.4s ease-out ${i * 0.15}s both` : 'none',
                        }}
                    />
                ))}
            </div>

            {/* Icons under segments */}
            <div className="flex justify-between px-1">
                {Array.from({ length: total }, (_, i) => (
                    <div key={i} className="flex flex-col items-center">
                        {i < current ? (
                            <div className="w-6 h-6 rounded-full flex items-center justify-center"
                                style={{ background: 'var(--accent-gold)' }}>
                                <Check size={14} color="#0a0a0a" strokeWidth={3} />
                            </div>
                        ) : (
                            <div className="w-6 h-6 rounded-full flex items-center justify-center"
                                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                                <Scissors size={12} style={{ color: 'var(--text-muted)' }} />
                            </div>
                        )}
                        <span className="text-xs mt-1" style={{ color: i < current ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
                            {i + 1}
                        </span>
                    </div>
                ))}
            </div>

            {/* Message */}
            <p className="text-center text-sm"
                style={{ color: 'var(--text-secondary)', fontFamily: 'Inter, sans-serif' }}>
                {current >= total
                    ? '🎉 ¡Felicidades! Desbloqueaste tu corte con descuento'
                    : current === total - 1
                        ? '🔥 ¡Te falta solo 1 corte para tu premio!'
                        : `Llevas ${current} de ${total} cortes. ¡Seguí así!`
                }
            </p>
        </div>
    );
}
