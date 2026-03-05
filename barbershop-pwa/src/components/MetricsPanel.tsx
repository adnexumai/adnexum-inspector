'use client';

import { Scissors, DollarSign, Star } from 'lucide-react';

interface MetricsPanelProps {
    cortesHoy: number;
    recaudacionHoy: number;
    vipCount: number;
}

export default function MetricsPanel({ cortesHoy, recaudacionHoy, vipCount }: MetricsPanelProps) {
    const metrics = [
        {
            label: 'Cortes Hoy',
            value: cortesHoy,
            icon: Scissors,
            color: 'var(--accent-gold)',
            bgGlow: 'rgba(212, 168, 83, 0.08)',
        },
        {
            label: 'Recaudación Día',
            value: `$${recaudacionHoy.toLocaleString()}`,
            icon: DollarSign,
            color: '#22c55e',
            bgGlow: 'rgba(34, 197, 94, 0.08)',
        },
        {
            label: 'Clientes VIP',
            value: vipCount,
            icon: Star,
            color: 'var(--accent-red-light)',
            bgGlow: 'rgba(224, 72, 50, 0.08)',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metrics.map((metric, i) => (
                <div key={metric.label}
                    className={`metric-card animate-fade-in-up stagger-${i + 1}`}
                    style={{ opacity: 0 }}>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium"
                            style={{ color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}>
                            {metric.label}
                        </span>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: metric.bgGlow }}>
                            <metric.icon size={20} style={{ color: metric.color }} />
                        </div>
                    </div>
                    <div className="metric-value">
                        {metric.value}
                    </div>
                </div>
            ))}
        </div>
    );
}
