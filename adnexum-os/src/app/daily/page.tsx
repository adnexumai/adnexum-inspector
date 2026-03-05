'use client';

import { useState, useEffect, useMemo } from 'react';
import { useDailyLog, useDailyLogHistory } from '@/lib/hooks';
import { DAILY_KPI_TARGETS } from '@/lib/types';
import confetti from 'canvas-confetti';
import {
    ArrowLeft, ArrowRight, CheckCircle2, Save, Calendar as CalendarIcon,
    Loader2, TrendingUp, Target, Zap, MessageCircle, Phone, FileText,
    Trophy, Minus, Plus, Flame
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
    { id: 'mensajes_enviados', label: 'Mensajes', icon: MessageCircle, target: DAILY_KPI_TARGETS.mensajes_enviados, gradient: 'from-blue-500 to-cyan-400', bg: 'bg-blue-500/10', text: 'text-blue-400', color: '#3b82f6', lightColor: '#93c5fd' },
    { id: 'respuestas_recibidas', label: 'Respuestas', icon: Zap, target: DAILY_KPI_TARGETS.respuestas_recibidas, gradient: 'from-violet-500 to-purple-400', bg: 'bg-violet-500/10', text: 'text-violet-400', color: '#8b5cf6', lightColor: '#c4b5fd' },
    { id: 'llamadas_agendadas', label: 'Agenda', icon: CalendarIcon, target: DAILY_KPI_TARGETS.llamadas_agendadas, gradient: 'from-pink-500 to-rose-400', bg: 'bg-pink-500/10', text: 'text-pink-400', color: '#ec4899', lightColor: '#f9a8d4' },
    { id: 'llamadas_realizadas', label: 'Llamadas', icon: Phone, target: DAILY_KPI_TARGETS.llamadas_realizadas, gradient: 'from-orange-500 to-amber-400', bg: 'bg-orange-500/10', text: 'text-orange-400', color: '#f97316', lightColor: '#fdba74' },
    { id: 'propuestas_enviadas', label: 'Propuestas', icon: FileText, target: DAILY_KPI_TARGETS.propuestas_enviadas, gradient: 'from-emerald-500 to-teal-400', bg: 'bg-emerald-500/10', text: 'text-emerald-400', color: '#10b981', lightColor: '#6ee7b7' },
    { id: 'cierres', label: 'Cierres', icon: Trophy, target: DAILY_KPI_TARGETS.cierres || 1, gradient: 'from-yellow-500 to-amber-400', bg: 'bg-yellow-500/10', text: 'text-yellow-400', color: '#eab308', lightColor: '#fde047' },
];

export default function DailyTrackerPage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const { log, loading, save } = useDailyLog(date);
    const { history, loading: historyLoading, refresh: refreshHistory } = useDailyLogHistory(7);
    const [saving, setSaving] = useState(false);

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
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        setDate(d.toISOString().split('T')[0]);
    };

    const toggleHabit = async (habitId: string) => {
        const isCompleted = habits.includes(habitId);
        let newHabits: string[];
        if (isCompleted) {
            newHabits = habits.filter(h => h !== habitId);
        } else {
            newHabits = [...habits, habitId];
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ['#6366f1', '#a855f7', '#ec4899'] });
        }
        setHabits(newHabits);
        await save({ habits: newHabits });
    };

    const incrementKPI = async (kpiId: string, delta: number) => {
        const current = kpis[kpiId] || 0;
        const newValue = Math.max(0, current + delta);
        const newKpis = { ...kpis, [kpiId]: newValue };
        setKpis(newKpis);

        const metric = KPI_METRICS.find(m => m.id === kpiId);
        if (metric && delta > 0 && current < metric.target && newValue >= metric.target) {
            confetti({ particleCount: 200, spread: 120, origin: { y: 0.4 }, colors: ['#10b981', '#6366f1', '#eab308', '#ec4899', '#3b82f6'] });
        }

        await save({ kpis: newKpis });
        refreshHistory();
    };

    const handleSave = async () => {
        setSaving(true);
        try { await save({ habits, kpis, notes, plan_next_day: plan }); } finally { setSaving(false); }
    };

    const handleBlur = () => { save({ notes, plan_next_day: plan }); };

    const totalActions = Object.values(kpis).reduce((sum, v) => sum + v, 0);
    const completedTargets = KPI_METRICS.filter(m => (kpis[m.id] || 0) >= m.target).length;

    return (
        <div className="min-h-screen bg-[#0f0f1a] p-6 md:p-8 space-y-8 font-sans">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl shadow-lg shadow-violet-500/20">
                            <Flame className="w-6 h-6 text-white" />
                        </div>
                        Prospecting Tracker
                    </h1>
                    <p className="text-sm text-slate-400 font-medium mt-2 ml-14">
                        <span className="text-white font-bold">{totalActions}</span> acciones · <span className="text-emerald-400 font-bold">{completedTargets}/{KPI_METRICS.length}</span> metas cumplidas
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm p-1.5 rounded-xl border border-white/10">
                    <button onClick={() => handleDateChange(-1)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <ArrowLeft className="w-4 h-4 text-slate-300" />
                    </button>
                    <div className="flex items-center gap-2 px-3 font-semibold text-white text-sm">
                        <CalendarIcon className="w-4 h-4 text-slate-400" />
                        {new Date(date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                    <button onClick={() => handleDateChange(1)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <ArrowRight className="w-4 h-4 text-slate-300" />
                    </button>
                    {new Date(date).toDateString() !== new Date().toDateString() && (
                        <button onClick={() => setDate(new Date().toISOString().split('T')[0])} className="text-xs text-violet-400 hover:text-violet-300 font-bold px-2">
                            Hoy
                        </button>
                    )}
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                </div>
            ) : (
                <div className="space-y-8">
                    {/* === KPI COUNTERS === */}
                    <section>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {KPI_METRICS.map(metric => {
                                const value = kpis[metric.id] || 0;
                                const pct = Math.min(100, Math.round((value / metric.target) * 100));
                                const reached = value >= metric.target;
                                const Icon = metric.icon;

                                // SVG circular progress
                                const radius = 38;
                                const circumference = 2 * Math.PI * radius;
                                const strokeDash = (pct / 100) * circumference;

                                return (
                                    <div
                                        key={metric.id}
                                        className={`relative bg-white/[0.04] backdrop-blur-sm rounded-2xl p-5 border transition-all duration-500 group hover:bg-white/[0.07] ${reached ? 'border-emerald-500/30 shadow-lg shadow-emerald-500/10' : 'border-white/[0.06]'
                                            }`}
                                    >
                                        {/* Glow effect when reached */}
                                        {reached && (
                                            <div className="absolute inset-0 rounded-2xl bg-emerald-500/5 pointer-events-none" />
                                        )}

                                        {/* Circular progress + value */}
                                        <div className="flex justify-center mb-4">
                                            <div className="relative w-24 h-24">
                                                <svg className="w-full h-full -rotate-90" viewBox="0 0 84 84">
                                                    {/* Background ring */}
                                                    <circle cx="42" cy="42" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                                                    {/* Progress ring */}
                                                    <circle
                                                        cx="42" cy="42" r={radius}
                                                        fill="none"
                                                        stroke={reached ? '#10b981' : metric.color}
                                                        strokeWidth="5"
                                                        strokeLinecap="round"
                                                        strokeDasharray={`${strokeDash} ${circumference}`}
                                                        className="transition-all duration-700 ease-out"
                                                        style={{ filter: `drop-shadow(0 0 6px ${reached ? '#10b981' : metric.color}40)` }}
                                                    />
                                                </svg>
                                                {/* Center value */}
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-2xl font-black text-white tabular-nums">{value}</span>
                                                    <span className="text-[10px] text-slate-500 font-medium">/ {metric.target}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Label */}
                                        <div className="flex items-center justify-center gap-1.5 mb-4">
                                            <Icon className={`w-3.5 h-3.5 ${metric.text}`} />
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{metric.label}</span>
                                        </div>

                                        {/* +/- buttons */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => incrementKPI(metric.id, -1)}
                                                className="flex-1 h-9 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition-all active:scale-95 border border-white/[0.06]"
                                            >
                                                <Minus className="w-4 h-4 text-slate-400" />
                                            </button>
                                            <button
                                                onClick={() => incrementKPI(metric.id, 1)}
                                                className={`flex-1 h-9 rounded-lg flex items-center justify-center transition-all active:scale-95 font-bold text-sm shadow-lg ${reached
                                                        ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/25'
                                                        : `bg-gradient-to-r ${metric.gradient} text-white shadow-lg`
                                                    }`}
                                                style={{ boxShadow: reached ? undefined : `0 4px 14px ${metric.color}30` }}
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* === 7-DAY HISTORY CHART === */}
                    <HistoryChart history={history} loading={historyLoading} kpis={kpis} />

                    {/* === HABITS + JOURNAL === */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Habits */}
                        <section className="bg-white/[0.04] backdrop-blur-sm rounded-2xl p-6 border border-white/[0.06]">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-indigo-500/10 rounded-lg">
                                    <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                                </div>
                                <h2 className="text-lg font-bold text-white">Hábitos Diarios</h2>
                                <span className="ml-auto text-sm font-bold text-indigo-400">{habits.length}/{HABITS_LIST.length}</span>
                            </div>

                            <div className="space-y-2">
                                {HABITS_LIST.map((habit) => {
                                    const isDone = habits.includes(habit.id);
                                    return (
                                        <button
                                            key={habit.id}
                                            onClick={() => toggleHabit(habit.id)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${isDone ? 'bg-indigo-500/10' : 'hover:bg-white/[0.04]'
                                                }`}
                                        >
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${isDone ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600 group-hover:border-indigo-400'
                                                }`}>
                                                {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                            <span className={`text-sm font-medium text-left ${isDone ? 'text-indigo-300' : 'text-slate-400'}`}>
                                                {habit.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/[0.06]">
                                <div className="flex justify-between text-xs text-slate-500 mb-2">
                                    <span>Progreso</span>
                                    <span className="font-bold text-white">{Math.round((habits.length / HABITS_LIST.length) * 100)}%</span>
                                </div>
                                <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                                        style={{ width: `${(habits.length / HABITS_LIST.length) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Journal */}
                        <section className="bg-white/[0.04] backdrop-blur-sm rounded-2xl p-6 border border-white/[0.06] space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-pink-500/10 rounded-lg">
                                    <Edit3Icon className="w-5 h-5 text-pink-400" />
                                </div>
                                <h2 className="text-lg font-bold text-white">Diario & Plan</h2>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Review del Día</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    onBlur={handleBlur}
                                    placeholder="¿Qué lograste hoy? ¿Qué aprendiste?"
                                    className="w-full h-28 p-4 bg-white/[0.04] border border-white/[0.06] rounded-xl text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500/30 resize-none transition-all placeholder:text-slate-600"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plan para Mañana</label>
                                <textarea
                                    value={plan}
                                    onChange={(e) => setPlan(e.target.value)}
                                    onBlur={handleBlur}
                                    placeholder="3 prioridades clave..."
                                    className="w-full h-28 p-4 bg-white/[0.04] border border-white/[0.06] rounded-xl text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500/30 resize-none transition-all placeholder:text-slate-600"
                                />
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-violet-500/20"
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
function HistoryChart({ history, loading, kpis }: { history: any[]; loading: boolean; kpis: Record<string, number> }) {
    const [selectedMetric, setSelectedMetric] = useState('mensajes_enviados');
    const metric = KPI_METRICS.find(m => m.id === selectedMetric)!;

    const chartData = useMemo(() => {
        const days: { date: string; label: string; value: number; dayName: string }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayLog = history.find(h => h.date === dateStr);
            const value = dayLog?.kpis?.[selectedMetric] || 0;
            days.push({
                date: dateStr,
                label: d.toLocaleDateString('es-ES', { day: 'numeric' }),
                dayName: d.toLocaleDateString('es-ES', { weekday: 'short' }),
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
            <section className="bg-white/[0.04] backdrop-blur-sm rounded-2xl p-6 border border-white/[0.06]">
                <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                </div>
            </section>
        );
    }

    return (
        <section className="bg-white/[0.04] backdrop-blur-sm rounded-2xl p-6 border border-white/[0.06]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Últimos 7 Días</h2>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                            <span>Promedio: <span className="text-white font-bold">{weekAvg}</span>/día</span>
                            <span>·</span>
                            <span>Total: <span className="text-white font-bold">{weekTotal}</span></span>
                        </div>
                    </div>
                </div>

                {/* Metric Selector Pills */}
                <div className="flex flex-wrap gap-1.5">
                    {KPI_METRICS.map(m => {
                        const MIcon = m.icon;
                        return (
                            <button
                                key={m.id}
                                onClick={() => setSelectedMetric(m.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedMetric === m.id
                                        ? `${m.bg} ${m.text} ring-1 ring-current`
                                        : 'bg-white/[0.04] text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]'
                                    }`}
                            >
                                <MIcon className="w-3 h-3" />
                                {m.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Bar Chart */}
            <div className="flex items-end gap-3 h-44 px-2">
                {chartData.map((day, i) => {
                    const barHeight = maxValue > 0 ? (day.value / maxValue) * 100 : 0;
                    const isToday = day.date === new Date().toISOString().split('T')[0];
                    const reachedTarget = day.value >= metric.target;
                    const targetLinePos = (metric.target / maxValue) * 100;

                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                            {/* Value on hover / always for today */}
                            <span className={`text-xs font-bold tabular-nums transition-all ${day.value > 0
                                    ? isToday ? 'opacity-100 text-white' : 'opacity-0 group-hover:opacity-100 text-slate-400'
                                    : 'opacity-0'
                                }`}>
                                {day.value}
                            </span>

                            {/* Bar container */}
                            <div className="w-full relative h-32 flex items-end rounded-t-lg overflow-hidden">
                                {/* Target line */}
                                {metric.target > 0 && (
                                    <div
                                        className="absolute left-0 right-0 border-t border-dashed z-10"
                                        style={{
                                            bottom: `${targetLinePos}%`,
                                            borderColor: `${metric.color}40`,
                                        }}
                                    >
                                        <span className="absolute -top-3 right-0 text-[8px] font-bold" style={{ color: `${metric.color}80` }}>
                                            META
                                        </span>
                                    </div>
                                )}

                                {/* Bar */}
                                <div
                                    className="w-full rounded-t-lg transition-all duration-700 ease-out relative overflow-hidden"
                                    style={{
                                        height: `${Math.max(barHeight, day.value > 0 ? 4 : 0)}%`,
                                        background: reachedTarget
                                            ? 'linear-gradient(to top, #059669, #10b981, #34d399)'
                                            : isToday
                                                ? `linear-gradient(to top, ${metric.color}, ${metric.lightColor})`
                                                : `linear-gradient(to top, ${metric.color}30, ${metric.color}60)`,
                                    }}
                                >
                                    {/* Shine effect */}
                                    {(isToday || reachedTarget) && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                    )}
                                </div>
                            </div>

                            {/* Day label */}
                            <div className="text-center">
                                <span className={`block text-[10px] font-bold uppercase tracking-wide ${isToday ? 'text-violet-400' : 'text-slate-600'
                                    }`}>
                                    {day.dayName}
                                </span>
                                <span className={`block text-[10px] ${isToday ? 'text-white font-bold' : 'text-slate-500'}`}>
                                    {day.label}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

function Edit3Icon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
    )
}
