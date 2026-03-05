'use client';

import { useState, useEffect, useMemo } from 'react';
import { useDailyLog, useDailyLogHistory } from '@/lib/hooks';
import { DAILY_KPI_TARGETS } from '@/lib/types';
import confetti from 'canvas-confetti';
import {
    ArrowLeft, ArrowRight, CheckCircle2, Save, Calendar as CalendarIcon,
    Loader2, TrendingUp, Target, Zap, MessageCircle, Phone, FileText,
    Trophy, Minus, Plus
} from 'lucide-react';

const HABITS_LIST = [
    { id: 'review_crm', label: 'Revisar CRM y Pipeline' },
    { id: 'follow_up', label: 'Realizar Follow-ups programados' },
    { id: 'content', label: 'Crear/Publicar Contenido' },
    { id: 'inbox_zero', label: 'Inbox Zero (Email/WhatsApp)' },
    { id: 'planning', label: 'Planificar día siguiente' },
    { id: 'learning', label: '30 min Aprendizaje/Lectura' },
];

const KPI_METRICS = [
    { id: 'mensajes_enviados', label: 'Mensajes', icon: MessageCircle, target: DAILY_KPI_TARGETS.mensajes_enviados, color: '#6366f1', bg: 'bg-indigo-50', text: 'text-indigo-600', ring: 'ring-indigo-500/20' },
    { id: 'respuestas_recibidas', label: 'Respuestas', icon: Zap, target: DAILY_KPI_TARGETS.respuestas_recibidas, color: '#8b5cf6', bg: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-violet-500/20' },
    { id: 'llamadas_agendadas', label: 'Agenda', icon: CalendarIcon, target: DAILY_KPI_TARGETS.llamadas_agendadas, color: '#ec4899', bg: 'bg-pink-50', text: 'text-pink-600', ring: 'ring-pink-500/20' },
    { id: 'llamadas_realizadas', label: 'Llamadas', icon: Phone, target: DAILY_KPI_TARGETS.llamadas_realizadas, color: '#f97316', bg: 'bg-orange-50', text: 'text-orange-600', ring: 'ring-orange-500/20' },
    { id: 'propuestas_enviadas', label: 'Propuestas', icon: FileText, target: DAILY_KPI_TARGETS.propuestas_enviadas, color: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-500/20' },
    { id: 'cierres', label: 'Cierres', icon: Trophy, target: DAILY_KPI_TARGETS.cierres || 1, color: '#eab308', bg: 'bg-yellow-50', text: 'text-yellow-600', ring: 'ring-yellow-500/20' },
];

export default function DailyTrackerPage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const { log, loading, save, refresh } = useDailyLog(date);
    const { history, loading: historyLoading, refresh: refreshHistory } = useDailyLogHistory(7);
    const [saving, setSaving] = useState(false);

    // Local state for immediate UI feedback
    const [habits, setHabits] = useState<string[]>([]);
    const [kpis, setKpis] = useState<Record<string, number>>({});
    const [notes, setNotes] = useState('');
    const [plan, setPlan] = useState('');

    useEffect(() => {
        if (log) {
            setHabits(log.habits || []);
            setKpis(log.kpis || {});
            setNotes(log.notes || '');
            setPlan(log.plan_next_day || '');
        } else if (!loading) {
            setHabits([]);
            setKpis({});
            setNotes('');
            setPlan('');
        }
    }, [log, loading, date]);

    const handleDateChange = (days: number) => {
        const currentDate = new Date(date);
        currentDate.setDate(currentDate.getDate() + days);
        setDate(currentDate.toISOString().split('T')[0]);
    };

    const toggleHabit = async (habitId: string) => {
        const isCompleted = habits.includes(habitId);
        let newHabits: string[];

        if (isCompleted) {
            newHabits = habits.filter(h => h !== habitId);
        } else {
            newHabits = [...habits, habitId];
            confetti({
                particleCount: 80,
                spread: 60,
                origin: { y: 0.6 },
                colors: ['#6366f1', '#a855f7', '#ec4899']
            });
        }

        setHabits(newHabits);
        await save({ habits: newHabits });
    };

    const incrementKPI = async (kpiId: string, delta: number) => {
        const current = kpis[kpiId] || 0;
        const newValue = Math.max(0, current + delta);
        const newKpis = { ...kpis, [kpiId]: newValue };
        setKpis(newKpis);

        // Check if just reached target
        const metric = KPI_METRICS.find(m => m.id === kpiId);
        if (metric && delta > 0 && current < metric.target && newValue >= metric.target) {
            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.5 },
                colors: ['#10b981', '#6366f1', '#eab308', '#ec4899']
            });
        }

        await save({ kpis: newKpis });
        refreshHistory();
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await save({ habits, kpis, notes, plan_next_day: plan });
        } finally {
            setSaving(false);
        }
    };

    const handleBlur = () => {
        save({ notes, plan_next_day: plan });
    };

    // Compute total prospecting actions today
    const totalActions = Object.values(kpis).reduce((sum, v) => sum + v, 0);

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 space-y-8 font-sans text-slate-800">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Prospecting Tracker
                    </h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                        {totalActions} acciones hoy · Mide, mejora, mete volumen 🚀
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                    <button onClick={() => handleDateChange(-1)} className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div className="flex items-center gap-2 px-2 font-semibold text-slate-700 text-sm">
                        <CalendarIcon className="w-4 h-4 text-slate-400" />
                        {new Date(date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                    <button onClick={() => handleDateChange(1)} className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
                        <ArrowRight className="w-5 h-5 text-slate-600" />
                    </button>
                    {new Date(date).toDateString() !== new Date().toDateString() && (
                        <button
                            onClick={() => setDate(new Date().toISOString().split('T')[0])}
                            className="text-xs text-indigo-600 hover:text-indigo-700 font-bold px-2"
                        >
                            Hoy
                        </button>
                    )}
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
            ) : (
                <div className="space-y-8">
                    {/* === SECTION 1: Quick KPI Counters === */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Target className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-lg font-bold text-slate-800">KPIs de Hoy</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {KPI_METRICS.map(metric => {
                                const value = kpis[metric.id] || 0;
                                const pct = Math.min(100, Math.round((value / metric.target) * 100));
                                const reached = value >= metric.target;
                                const Icon = metric.icon;

                                return (
                                    <div
                                        key={metric.id}
                                        className={`relative bg-white rounded-2xl p-4 shadow-sm border transition-all duration-300 ${reached ? 'border-emerald-200 shadow-emerald-100' : 'border-slate-100 hover:border-slate-200'
                                            }`}
                                    >
                                        {reached && (
                                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                                                <CheckCircle2 className="w-3 h-3 text-white" />
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 mb-3">
                                            <div className={`p-1.5 rounded-lg ${metric.bg}`}>
                                                <Icon className={`w-3.5 h-3.5 ${metric.text}`} />
                                            </div>
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{metric.label}</span>
                                        </div>

                                        {/* Counter */}
                                        <div className="flex items-center justify-between mb-3">
                                            <button
                                                onClick={() => incrementKPI(metric.id, -1)}
                                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors active:scale-95"
                                            >
                                                <Minus className="w-3.5 h-3.5 text-slate-500" />
                                            </button>

                                            <div className="text-center">
                                                <span className="text-2xl font-black text-slate-900 tabular-nums">{value}</span>
                                                <span className="text-xs text-slate-400 font-medium block">/ {metric.target}</span>
                                            </div>

                                            <button
                                                onClick={() => incrementKPI(metric.id, 1)}
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 shadow-sm ${reached
                                                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                                                    }`}
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        {/* Progress bar */}
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500 ease-out"
                                                style={{
                                                    width: `${pct}%`,
                                                    background: reached ? '#10b981' : metric.color,
                                                }}
                                            />
                                        </div>
                                        <div className="text-right mt-1">
                                            <span className={`text-[10px] font-bold ${reached ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {pct}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* === SECTION 2: 7-Day History Chart === */}
                    <HistoryChart history={history} loading={historyLoading} />

                    {/* === SECTION 3: Habits + Journal (existing) === */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Habits */}
                        <section className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-slate-100 h-fit">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800">Hábitos Diarios</h2>
                            </div>

                            <div className="space-y-2">
                                {HABITS_LIST.map((habit) => {
                                    const isDone = habits.includes(habit.id);
                                    return (
                                        <button
                                            key={habit.id}
                                            onClick={() => toggleHabit(habit.id)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${isDone ? 'bg-indigo-50' : 'hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all ${isDone ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 group-hover:border-indigo-400'
                                                }`}>
                                                {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                            <span className={`text-sm font-medium ${isDone ? 'text-indigo-700' : 'text-slate-600'}`}>
                                                {habit.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <div className="flex justify-between text-sm text-slate-500">
                                    <span>Progreso</span>
                                    <span className="font-bold text-slate-700">{Math.round((habits.length / HABITS_LIST.length) * 100)}%</span>
                                </div>
                                <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                                        style={{ width: `${(habits.length / HABITS_LIST.length) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Journal & Plan */}
                        <section className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-slate-100 h-fit space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-pink-100 rounded-lg text-pink-600">
                                    <Edit3Icon className="w-5 h-5" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800">Diario & Plan</h2>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Review del Día</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    onBlur={handleBlur}
                                    placeholder="¿Qué lograste hoy? ¿Qué aprendiste?"
                                    className="w-full h-28 p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 resize-none transition-all placeholder:text-slate-400"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Plan para Mañana</label>
                                <textarea
                                    value={plan}
                                    onChange={(e) => setPlan(e.target.value)}
                                    onBlur={handleBlur}
                                    placeholder="3 prioridades clave..."
                                    className="w-full h-28 p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 resize-none transition-all placeholder:text-slate-400"
                                />
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {saving ? 'Guardando...' : 'Guardar Notas'}
                            </button>
                        </section>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============ History Chart Component ============
function HistoryChart({ history, loading }: { history: any[]; loading: boolean }) {
    const [selectedMetric, setSelectedMetric] = useState('mensajes_enviados');

    const metric = KPI_METRICS.find(m => m.id === selectedMetric)!;

    // Build 7-day data (fill gaps with 0)
    const chartData = useMemo(() => {
        const days: { date: string; label: string; value: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayLog = history.find(h => h.date === dateStr);
            const value = dayLog?.kpis?.[selectedMetric] || 0;
            days.push({
                date: dateStr,
                label: d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
                value,
            });
        }
        return days;
    }, [history, selectedMetric]);

    const maxValue = Math.max(...chartData.map(d => d.value), metric.target, 1);
    const weekTotal = chartData.reduce((sum, d) => sum + d.value, 0);
    const weekAvg = Math.round(weekTotal / 7 * 10) / 10;

    if (loading) {
        return (
            <section className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
            </section>
        );
    }

    return (
        <section className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Historial 7 Días</h2>
                        <p className="text-xs text-slate-400 font-medium">Promedio: {weekAvg}/día · Total: {weekTotal}</p>
                    </div>
                </div>

                {/* Metric Selector */}
                <div className="flex flex-wrap gap-1.5">
                    {KPI_METRICS.map(m => (
                        <button
                            key={m.id}
                            onClick={() => setSelectedMetric(m.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedMetric === m.id
                                    ? `${m.bg} ${m.text} ring-2 ${m.ring}`
                                    : 'bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bar Chart */}
            <div className="flex items-end gap-3 h-40">
                {chartData.map((day, i) => {
                    const barHeight = maxValue > 0 ? (day.value / maxValue) * 100 : 0;
                    const isToday = day.date === new Date().toISOString().split('T')[0];
                    const reachedTarget = day.value >= metric.target;

                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                            {/* Value label */}
                            <span className={`text-xs font-bold transition-opacity ${day.value > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                                } ${reachedTarget ? 'text-emerald-600' : 'text-slate-500'}`}>
                                {day.value}
                            </span>

                            {/* Bar */}
                            <div className="w-full relative h-28 flex items-end">
                                {/* Target line */}
                                {metric.target > 0 && (
                                    <div
                                        className="absolute left-0 right-0 border-t-2 border-dashed border-slate-200 z-10"
                                        style={{ bottom: `${(metric.target / maxValue) * 100}%` }}
                                    />
                                )}
                                <div
                                    className={`w-full rounded-lg transition-all duration-500 ease-out ${isToday ? 'shadow-sm' : ''
                                        }`}
                                    style={{
                                        height: `${Math.max(barHeight, 2)}%`,
                                        background: reachedTarget
                                            ? 'linear-gradient(to top, #10b981, #34d399)'
                                            : isToday
                                                ? `linear-gradient(to top, ${metric.color}, ${metric.color}cc)`
                                                : '#e2e8f0',
                                    }}
                                />
                            </div>

                            {/* Day label */}
                            <span className={`text-[10px] font-bold uppercase tracking-wide ${isToday ? 'text-indigo-600' : 'text-slate-400'
                                }`}>
                                {isToday ? 'Hoy' : day.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

// ============ Custom Icons ============
function Edit3Icon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
    )
}
