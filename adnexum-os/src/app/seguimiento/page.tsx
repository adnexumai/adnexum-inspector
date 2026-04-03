'use client';

import { useState, useEffect } from 'react';
import { useLeads } from '@/lib/hooks';
import { PIPELINE_STAGES, DAILY_KPI_TARGETS } from '@/lib/types';
import type { Lead } from '@/lib/types';
import {
    MessageCircle, Flame, Thermometer, Snowflake, AlertTriangle,
    DollarSign, Clock, Phone, Target, ArrowRight, CheckCircle2,
    TrendingUp,
} from 'lucide-react';

export default function SeguimientoPage() {
    const { leads, markFollowUp } = useLeads();
    const [toast, setToast] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const handleWhatsApp = (lead: Lead) => {
        const phone = lead.owner_phone || lead.business_phone;
        if (!phone) { showToast('⚠️ No hay número de teléfono'); return; }
        markFollowUp(lead.id);
        const cleanPhone = phone.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
        showToast(`✅ Contacto #${(lead.contador_seguimientos || 0) + 1} con ${lead.business_name}`);
    };

    if (!mounted) return <div style={{ padding: '40px', color: 'var(--color-text-muted)' }}>Cargando...</div>;

    // Filter leads for follow-up
    const today = new Date().toISOString().split('T')[0];
    const activeLeads = leads.filter(l =>
        l.seguimiento_activo &&
        !['ganado', 'perdido'].includes(l.estado_actual)
    );

    const pendientes = activeLeads.filter(l => !l.seguido_hoy);
    const completados = activeLeads.filter(l => l.seguido_hoy);

    const calientes = pendientes.filter(l => l.nivel_interes === 'caliente');
    const tibios = pendientes.filter(l => l.nivel_interes === 'tibio');
    const frios = pendientes.filter(l => l.nivel_interes === 'frio');
    const urgentes = pendientes.filter(l => l.dias_sin_contacto >= 3);
    const potencialTotal = pendientes.reduce((sum, l) => sum + (l.valor_estimado_usd || 0), 0);

    // Daily KPIs
    const contactosHoy = completados.length;
    const totalPendientes = pendientes.length;
    const porcentaje = activeLeads.length > 0 ? Math.round((contactosHoy / activeLeads.length) * 100) : 0;

    const groups = [
        { title: '🔥 Calientes — Listos para Cerrar', leads: calientes, badge: 'badge-caliente' },
        { title: '🟡 Tibios — En Evaluación', leads: tibios, badge: 'badge-tibio' },
        { title: '🔵 Fríos — Recién Contactados', leads: frios, badge: 'badge-frio' },
    ];

    return (
        <div style={{ maxWidth: '900px' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '4px' }}>
                    📋 <span className="text-gradient">Seguimiento Diario</span>
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                    {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} · Prospección y follow-ups
                </p>
            </div>

            {/* Sticky Summary */}
            <div style={{
                position: 'sticky', top: '0', zIndex: 10, padding: '16px 0', marginBottom: '20px',
                background: 'var(--color-bg-primary)',
            }}>
                {/* Big number */}
                <div className="card-static gradient-header" style={{ marginBottom: '12px', textAlign: 'center', padding: '24px' }}>
                    <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                        Pendientes de Contactar Hoy
                    </div>
                    <div className="stat-number" style={{ fontSize: '56px' }}>{totalPendientes}</div>
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <div style={{
                            height: '6px', flex: 1, maxWidth: '200px', background: 'var(--color-bg-hover)',
                            borderRadius: '3px', overflow: 'hidden',
                        }}>
                            <div style={{
                                height: '100%', width: `${porcentaje}%`,
                                background: 'linear-gradient(90deg, var(--color-accent), var(--color-green))',
                                borderRadius: '3px', transition: 'width 0.5s',
                            }} />
                        </div>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                            {porcentaje}% completado
                        </span>
                    </div>
                </div>

                {/* Stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    <StatCard icon={<Flame size={18} />} label="Calientes" value={calientes.length} color="var(--color-green)" />
                    <StatCard icon={<Thermometer size={18} />} label="Tibios" value={tibios.length} color="var(--color-yellow)" />
                    <StatCard icon={<AlertTriangle size={18} />} label="Urgentes" value={urgentes.length} color="var(--color-red)" />
                    <StatCard icon={<DollarSign size={18} />} label="Potencial" value={`$${potencialTotal.toLocaleString()}`} color="var(--color-accent-light)" />
                </div>
            </div>

            {/* Daily KPI Tracker */}
            <div className="card-static" style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={16} style={{ color: 'var(--color-accent-light)' }} />
                    KPIs del Día
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    <KPIProgress label="Contactados" current={contactosHoy} target={DAILY_KPI_TARGETS.mensajes_enviados} />
                    <KPIProgress label="Pendientes" current={totalPendientes} target={totalPendientes} isReverse />
                    <KPIProgress label="Completados" current={contactosHoy} target={activeLeads.length} />
                </div>
            </div>

            {/* Urgentes First */}
            {urgentes.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: 'var(--color-red-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={18} /> URGENTES — 3+ días sin contacto
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {urgentes.map(lead => (
                            <FollowUpCard key={lead.id} lead={lead} onWhatsApp={() => handleWhatsApp(lead)} isUrgent />
                        ))}
                    </div>
                </div>
            )}

            {/* Groups by priority */}
            {groups.map(group => group.leads.length > 0 && (
                <div key={group.title} style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {group.title}
                        <span className={`badge ${group.badge}`}>{group.leads.length}</span>
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {group.leads.map(lead => (
                            <FollowUpCard key={lead.id} lead={lead} onWhatsApp={() => handleWhatsApp(lead)} />
                        ))}
                    </div>
                </div>
            ))}

            {/* Completed Today */}
            {completados.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: 'var(--color-green)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={18} /> Contactados Hoy ({completados.length})
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {completados.map(lead => (
                            <div key={lead.id} style={{
                                padding: '12px 16px', background: 'rgba(16, 185, 129, 0.06)',
                                borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                opacity: 0.7,
                            }}>
                                <div>
                                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{lead.business_name}</span>
                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginLeft: '8px' }}>
                                        Contacto #{lead.contador_seguimientos}
                                    </span>
                                </div>
                                <CheckCircle2 size={18} style={{ color: 'var(--color-green)' }} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty state */}
            {pendientes.length === 0 && completados.length === 0 && (
                <div className="empty-state" style={{ padding: '60px 20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Sin seguimientos pendientes</h3>
                    <p style={{ color: 'var(--color-text-muted)', maxWidth: '400px' }}>
                        Agregá leads desde el Pipeline para empezar tu rutina de prospección diaria.
                    </p>
                </div>
            )}

            {/* Toast */}
            {toast && <div className="toast toast-success">{toast}</div>}
        </div>
    );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
    return (
        <div className="card-static" style={{ textAlign: 'center', padding: '14px' }}>
            <div style={{ color, marginBottom: '6px', display: 'flex', justifyContent: 'center' }}>{icon}</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{label}</div>
        </div>
    );
}

function KPIProgress({ label, current, target, isReverse }: { label: string; current: number; target: number; isReverse?: boolean }) {
    const pct = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
    const color = isReverse
        ? (pct > 50 ? 'var(--color-red)' : 'var(--color-green)')
        : (pct >= 80 ? 'var(--color-green)' : pct >= 40 ? 'var(--color-yellow)' : 'var(--color-red)');
    return (
        <div style={{ padding: '10px', background: 'var(--color-bg-hover)', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{label}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color }}>{current}/{target}</span>
            </div>
            <div style={{ height: '4px', background: 'var(--color-bg-primary)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '2px', transition: 'width 0.5s' }} />
            </div>
        </div>
    );
}

function FollowUpCard({ lead, onWhatsApp, isUrgent }: { lead: Lead; onWhatsApp: () => void; isUrgent?: boolean }) {
    const stage = PIPELINE_STAGES.find(s => s.id === lead.estado_actual);
    return (
        <div
            className={isUrgent ? 'urgency-critical' : ''}
            style={{
                padding: '16px', background: 'var(--color-bg-card)', borderRadius: '14px',
                border: `1px solid ${isUrgent ? 'rgba(239, 68, 68, 0.3)' : 'var(--color-border)'}`,
                display: 'flex', alignItems: 'center', gap: '16px',
                transition: 'all 0.2s',
            }}
        >
            {/* Lead Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '15px' }}>{lead.business_name}</span>
                    <span className={`badge ${lead.nivel_interes === 'caliente' ? 'badge-caliente' : lead.nivel_interes === 'tibio' ? 'badge-tibio' : 'badge-frio'}`}>
                        {lead.nivel_interes}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {lead.owner_name && <span>👤 {lead.owner_name}</span>}
                    {lead.ciudad && <span>📍 {lead.ciudad}</span>}
                    {lead.rubro && <span>📌 {lead.rubro}</span>}
                    {stage && <span>{stage.emoji} {stage.label}</span>}
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '12px' }}>
                    {lead.valor_estimado_usd > 0 && (
                        <span style={{ color: 'var(--color-green)', fontWeight: 600 }}>
                            💰 ${lead.valor_estimado_usd.toLocaleString()}
                        </span>
                    )}
                    {lead.dias_sin_contacto > 0 && (
                        <span style={{ color: lead.dias_sin_contacto >= 7 ? 'var(--color-red)' : lead.dias_sin_contacto >= 3 ? 'var(--color-orange)' : 'var(--color-text-muted)' }}>
                            ⏰ {lead.dias_sin_contacto}d sin contacto
                        </span>
                    )}
                    {lead.fecha_proximo_followup && (
                        <span style={{ color: 'var(--color-text-muted)' }}>
                            📅 {new Date(lead.fecha_proximo_followup).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                        </span>
                    )}
                </div>
            </div>

            {/* WhatsApp Button */}
            <button
                onClick={onWhatsApp}
                className="btn-whatsapp"
                style={{
                    padding: '16px 24px', borderRadius: '16px', fontSize: '14px',
                    fontWeight: 800, border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0,
                    boxShadow: '0 4px 20px rgba(37, 211, 102, 0.3)',
                }}
            >
                <MessageCircle size={20} /> Contactar
            </button>
        </div>
    );
}
