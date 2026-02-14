'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useLeads, useTasks } from '@/lib/hooks';
import { useGoogleCalendar, type GoogleCalendarEvent } from '@/lib/useGoogleCalendar';
import { PIPELINE_STAGES } from '@/lib/types';
import {
    ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock,
    Phone, Video, FileText, Bell, ExternalLink, Check, Loader2, Unplug,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function CalendarioPage() {
    return (
        <Suspense fallback={<div style={{ padding: '40px', color: 'var(--color-text-muted)' }}>Cargando calendario...</div>}>
            <CalendarioContent />
        </Suspense>
    );
}

function CalendarioContent() {

    const { leads } = useLeads();
    const { tasks } = useTasks();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
    const [mounted, setMounted] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const searchParams = useSearchParams();

    // Google Calendar
    const today = new Date();

    // Fix: Memoize these dates to prevent infinite loop in useGoogleCalendar
    const { monthStart, monthEnd } = useMemo(() => {
        const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);
        return { monthStart: start.toISOString(), monthEnd: end.toISOString() };
    }, [currentDate]);

    const {
        events: gcalEvents,
        connected: gcalConnected,
        loading: gcalLoading,
        connect: connectGcal,
        refresh: refreshGcal,
    } = useGoogleCalendar(monthStart, monthEnd);

    useEffect(() => { setMounted(true); }, []);

    // Check for callback params
    useEffect(() => {
        const gcalConnectedParam = searchParams.get('gcal_connected');
        const gcalError = searchParams.get('gcal_error');
        if (gcalConnectedParam === 'true') {
            setToast('✅ Google Calendar conectado correctamente');
            setTimeout(() => setToast(null), 4000);
        } else if (gcalError) {
            setToast(`❌ Error al conectar Google Calendar: ${gcalError}`);
            setTimeout(() => setToast(null), 5000);
        }
    }, [searchParams]);

    if (!mounted) return <div style={{ padding: '40px', color: 'var(--color-text-muted)' }}>Cargando...</div>;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const todayStr = today.toISOString().split('T')[0];

    // Build events from leads and tasks
    const crmEvents = useMemo(() => {
        const ev: CalEvent[] = [];

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

    // Convert Google Calendar events to CalEvent format
    const googleEvents: CalEvent[] = useMemo(() => {
        return gcalEvents.map(ge => ({
            date: ge.start.split('T')[0],
            title: ge.title,
            type: 'google' as const,
            htmlLink: ge.htmlLink,
            location: ge.location,
        }));
    }, [gcalEvents]);

    // Combine all events
    const allEvents = useMemo(() => [...crmEvents, ...googleEvents], [crmEvents, googleEvents]);

    // Calendar grid
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const calendarDays: CalendarDay[] = [];

    for (let i = startOffset - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        calendarDays.push({ date: dateStr, day, isCurrentMonth: false, events: allEvents.filter(e => e.date === dateStr) });
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        calendarDays.push({ date: dateStr, day: d, isCurrentMonth: true, isToday: dateStr === todayStr, events: allEvents.filter(e => e.date === dateStr) });
    }

    const remaining = 42 - calendarDays.length;
    for (let d = 1; d <= remaining; d++) {
        const dateStr = `${year}-${String(month + 2).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        calendarDays.push({ date: dateStr, day: d, isCurrentMonth: false, events: allEvents.filter(e => e.date === dateStr) });
    }

    const monthName = currentDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

    // Upcoming events in next 7 days
    const next7 = new Date(today);
    next7.setDate(next7.getDate() + 7);
    const upcoming = allEvents
        .filter(e => e.date >= todayStr && e.date <= next7.toISOString().split('T')[0] && !e.completed)
        .sort((a, b) => a.date.localeCompare(b.date));

    return (
        <div style={{ maxWidth: '1000px' }}>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
                    padding: '12px 20px', borderRadius: '12px',
                    background: toast.startsWith('✅') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    border: `1px solid ${toast.startsWith('✅') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    color: 'white', fontSize: '13px', fontWeight: 600,
                    backdropFilter: 'blur(12px)',
                }}>
                    {toast}
                </div>
            )}

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
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* Google Calendar Connect Button */}
                    {gcalConnected ? (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 14px', borderRadius: '10px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            fontSize: '12px', fontWeight: 600, color: '#34d399',
                        }}>
                            <Check size={14} />
                            Google Calendar
                        </div>
                    ) : (
                        <button
                            onClick={connectGcal}
                            disabled={gcalLoading}
                            className="btn btn-secondary"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 14px', fontSize: '12px',
                            }}
                        >
                            {gcalLoading ? <Loader2 size={14} className="animate-spin" /> : <GoogleIcon />}
                            Conectar Google Calendar
                        </button>
                    )}
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button className={`pill ${viewMode === 'month' ? 'pill-active' : ''}`} onClick={() => setViewMode('month')}>Mes</button>
                        <button className={`pill ${viewMode === 'week' ? 'pill-active' : ''}`} onClick={() => setViewMode('week')}>Semana</button>
                    </div>
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
                                        cursor: ev.htmlLink ? 'pointer' : 'default',
                                    }}
                                        onClick={() => ev.htmlLink && window.open(ev.htmlLink, '_blank')}
                                    >
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
                                        cursor: ev.htmlLink ? 'pointer' : 'default',
                                    }}
                                        onClick={() => ev.htmlLink && window.open(ev.htmlLink, '_blank')}
                                    >
                                        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {getEventEmoji(ev.type)} {ev.title}
                                            {ev.htmlLink && <ExternalLink size={10} style={{ opacity: 0.5 }} />}
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
                                    { type: 'google', label: 'Google Calendar' },
                                ].map(item => (
                                    <div key={item.type} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: getEventColor(item.type as any).border }} />
                                        <span style={{ color: 'var(--color-text-secondary)' }}>{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Google Calendar Status */}
                        <div style={{
                            marginTop: '16px', padding: '12px', borderRadius: '10px',
                            background: gcalConnected ? 'rgba(16, 185, 129, 0.06)' : 'rgba(139, 92, 246, 0.06)',
                            border: `1px solid ${gcalConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(139, 92, 246, 0.15)'}`,
                        }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {gcalConnected ? (
                                    <Check size={14} style={{ color: '#34d399' }} />
                                ) : (
                                    <CalendarIcon size={14} style={{ color: 'var(--color-accent-light)' }} />
                                )}
                                Google Calendar
                            </div>
                            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                                {gcalConnected
                                    ? `${gcalEvents.length} eventos sincronizados`
                                    : 'Conectá tu Google Calendar para ver y crear eventos.'}
                            </p>
                            {!gcalConnected && (
                                <button
                                    onClick={connectGcal}
                                    className="btn btn-primary"
                                    style={{ width: '100%', marginTop: '8px', fontSize: '11px', padding: '6px' }}
                                >
                                    <GoogleIcon /> Conectar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Types ---
interface CalEvent {
    date: string;
    title: string;
    type: 'discovery' | 'venta' | 'followup' | 'task' | 'google';
    lead_id?: string;
    lead_name?: string;
    completed?: boolean;
    htmlLink?: string;
    location?: string;
}

interface CalendarDay {
    date: string;
    day: number;
    isCurrentMonth: boolean;
    isToday?: boolean;
    events: CalEvent[];
}

// --- Helpers ---
function getEventColor(type: CalEvent['type']) {
    switch (type) {
        case 'discovery':
            return { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: '#3b82f6' };
        case 'venta':
            return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: '#10b981' };
        case 'followup':
            return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: '#f59e0b' };
        case 'task':
            return { bg: 'rgba(139, 92, 246, 0.15)', text: '#a78bfa', border: '#8b5cf6' };
        case 'google':
            return { bg: 'rgba(66, 133, 244, 0.15)', text: '#4285f4', border: '#4285f4' };
    }
}

function getEventEmoji(type: CalEvent['type']) {
    switch (type) {
        case 'discovery': return '🔍';
        case 'venta': return '💼';
        case 'followup': return '📞';
        case 'task': return '✅';
        case 'google': return '📆';
    }
}

function GoogleIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26-1.19-.58z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}
