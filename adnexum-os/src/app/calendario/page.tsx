'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLeads, useTasks } from '@/lib/hooks';
import { PIPELINE_STAGES } from '@/lib/types';
import {
    ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock,
    Phone, Video, FileText, Bell,
} from 'lucide-react';

export default function CalendarioPage() {
    const { leads } = useLeads();
    const { tasks } = useTasks();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    if (!mounted) return <div style={{ padding: '40px', color: 'var(--color-text-muted)' }}>Cargando...</div>;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Build events from leads and tasks
    const events = useMemo(() => {
        const ev: CalendarEvent[] = [];

        leads.forEach(lead => {
            if (lead.fecha_discovery) {
                ev.push({
                    date: lead.fecha_discovery.split('T')[0],
                    title: `Discovery: ${lead.business_name}`,
                    type: 'discovery',
                    lead_id: lead.id,
                    lead_name: lead.business_name,
                });
            }
            if (lead.fecha_venta) {
                ev.push({
                    date: lead.fecha_venta.split('T')[0],
                    title: `Venta: ${lead.business_name}`,
                    type: 'venta',
                    lead_id: lead.id,
                    lead_name: lead.business_name,
                });
            }
            if (lead.fecha_proximo_followup) {
                ev.push({
                    date: lead.fecha_proximo_followup,
                    title: `Follow-up: ${lead.business_name}`,
                    type: 'followup',
                    lead_id: lead.id,
                    lead_name: lead.business_name,
                });
            }
        });

        tasks.forEach(task => {
            if (task.due_date) {
                ev.push({
                    date: task.due_date,
                    title: task.title,
                    type: 'task',
                    completed: task.completed,
                });
            }
        });

        return ev;
    }, [leads, tasks]);

    // Calendar grid
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Monday start

    const calendarDays: CalendarDay[] = [];

    // Previous month days
    for (let i = startOffset - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        calendarDays.push({ date: dateStr, day, isCurrentMonth: false, events: events.filter(e => e.date === dateStr) });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        calendarDays.push({ date: dateStr, day: d, isCurrentMonth: true, isToday: dateStr === todayStr, events: events.filter(e => e.date === dateStr) });
    }

    // Fill remaining
    const remaining = 42 - calendarDays.length;
    for (let d = 1; d <= remaining; d++) {
        const dateStr = `${year}-${String(month + 2).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        calendarDays.push({ date: dateStr, day: d, isCurrentMonth: false, events: events.filter(e => e.date === dateStr) });
    }

    const monthName = currentDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

    // Upcoming events in next 7 days
    const next7 = new Date(today);
    next7.setDate(next7.getDate() + 7);
    const upcoming = events
        .filter(e => e.date >= todayStr && e.date <= next7.toISOString().split('T')[0] && !e.completed)
        .sort((a, b) => a.date.localeCompare(b.date));

    return (
        <div style={{ maxWidth: '1000px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                        📅 <span className="text-gradient">Calendario</span>
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
                        Reuniones, follow-ups y tareas programadas
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <button className={`pill ${viewMode === 'month' ? 'pill-active' : ''}`} onClick={() => setViewMode('month')}>Mes</button>
                    <button className={`pill ${viewMode === 'week' ? 'pill-active' : ''}`} onClick={() => setViewMode('week')}>Semana</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px' }}>
                {/* Calendar Grid */}
                <div className="card-static" style={{ padding: '20px' }}>
                    {/* Month Nav */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <button className="btn btn-secondary" style={{ padding: '8px' }}
                            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>
                            <ChevronLeft size={18} />
                        </button>
                        <h2 style={{ fontSize: '18px', fontWeight: 700, textTransform: 'capitalize' }}>{monthName}</h2>
                        <button className="btn btn-secondary" style={{ padding: '8px' }}
                            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {/* Day Headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
                        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                            <div key={d} style={{
                                textAlign: 'center', fontSize: '11px', fontWeight: 700,
                                color: 'var(--color-text-muted)', padding: '6px', textTransform: 'uppercase',
                            }}>{d}</div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                        {calendarDays.map((cd, i) => (
                            <div key={i} style={{
                                minHeight: '80px', padding: '4px 6px',
                                background: cd.isToday ? 'rgba(139, 92, 246, 0.08)' : cd.isCurrentMonth ? 'var(--color-bg-hover)' : 'transparent',
                                borderRadius: '8px',
                                border: cd.isToday ? '1px solid var(--color-accent)' : '1px solid transparent',
                                opacity: cd.isCurrentMonth ? 1 : 0.3,
                            }}>
                                <div style={{
                                    fontSize: '12px', fontWeight: cd.isToday ? 800 : 500,
                                    color: cd.isToday ? 'var(--color-accent-light)' : 'var(--color-text-secondary)',
                                    marginBottom: '4px',
                                }}>{cd.day}</div>
                                {cd.events.slice(0, 3).map((ev, j) => (
                                    <div key={j} style={{
                                        fontSize: '9px', padding: '2px 4px', borderRadius: '4px',
                                        marginBottom: '2px', fontWeight: 600, lineHeight: '1.2',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        background: getEventColor(ev.type).bg,
                                        color: getEventColor(ev.type).text,
                                    }}>
                                        {getEventEmoji(ev.type)} {ev.title.length > 15 ? ev.title.slice(0, 15) + '…' : ev.title}
                                    </div>
                                ))}
                                {cd.events.length > 3 && (
                                    <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                                        +{cd.events.length - 3} más
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar - Upcoming */}
                <div>
                    <div className="card-static" style={{ position: 'sticky', top: '20px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Bell size={16} style={{ color: 'var(--color-accent-light)' }} />
                            Próximos 7 días
                        </h3>
                        {upcoming.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                                Sin eventos próximos
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {upcoming.map((ev, i) => (
                                    <div key={i} style={{
                                        padding: '10px 12px', background: 'var(--color-bg-hover)',
                                        borderRadius: '10px', borderLeft: `3px solid ${getEventColor(ev.type).border}`,
                                    }}>
                                        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                                            {getEventEmoji(ev.type)} {ev.title}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                            📅 {new Date(ev.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Event Legend */}
                        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text-muted)' }}>LEYENDA</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {[
                                    { type: 'discovery', label: 'Discovery Call' },
                                    { type: 'venta', label: 'Llamada de Venta' },
                                    { type: 'followup', label: 'Follow-up' },
                                    { type: 'task', label: 'Tarea' },
                                ].map(item => (
                                    <div key={item.type} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: getEventColor(item.type as any).border }} />
                                        <span style={{ color: 'var(--color-text-secondary)' }}>{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Google Calendar Integration Note */}
                        <div style={{
                            marginTop: '16px', padding: '12px', background: 'rgba(139, 92, 246, 0.06)',
                            borderRadius: '10px', border: '1px solid rgba(139, 92, 246, 0.15)',
                        }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <CalendarIcon size={14} style={{ color: 'var(--color-accent-light)' }} />
                                Google Calendar
                            </div>
                            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                                Próximamente: sincronización con Google Calendar para ver tus eventos y agendarlos directamente.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface CalendarEvent {
    date: string;
    title: string;
    type: 'discovery' | 'venta' | 'followup' | 'task';
    lead_id?: string;
    lead_name?: string;
    completed?: boolean;
}

interface CalendarDay {
    date: string;
    day: number;
    isCurrentMonth: boolean;
    isToday?: boolean;
    events: CalendarEvent[];
}

function getEventColor(type: CalendarEvent['type']) {
    switch (type) {
        case 'discovery':
            return { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: '#3b82f6' };
        case 'venta':
            return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: '#10b981' };
        case 'followup':
            return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: '#f59e0b' };
        case 'task':
            return { bg: 'rgba(139, 92, 246, 0.15)', text: '#a78bfa', border: '#8b5cf6' };
    }
}

function getEventEmoji(type: CalendarEvent['type']) {
    switch (type) {
        case 'discovery': return '🔍';
        case 'venta': return '💼';
        case 'followup': return '📞';
        case 'task': return '✅';
    }
}
