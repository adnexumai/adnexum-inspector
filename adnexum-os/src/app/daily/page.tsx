'use client';

import { useState, useEffect, useMemo } from 'react';
import { useDailyLog, useDailyLogHistory } from '@/lib/hooks';
import { DAILY_KPI_TARGETS, type TrackedLead } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import confetti from 'canvas-confetti';
import {
    ArrowLeft, ArrowRight, CheckCircle2, Save, Calendar as CalendarIcon,
    Loader2, TrendingUp, Zap, MessageCircle, Phone, FileText,
    Trophy, Minus, Plus, Flame, Target, Pencil, Check, X as XIcon
} from 'lucide-react';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { DailyLeadsList, normalizeItems } from '@/components/DailyLeadsList';

// ── Constants ─────────────────────────────────────────────────────────────────

const HABITS_LIST = [
    { id: 'review_crm', label: 'Revisar CRM y Pipeline' },
    { id: 'follow_up', label: 'Realizar Follow-ups programados' },
    { id: 'content', label: 'Crear/Publicar Contenido' },
    { id: 'inbox_zero', label: 'Inbox Zero (Email/WhatsApp)' },
    { id: 'planning', label: 'Planificar día siguiente' },
    { id: 'learning', label: '30 min Aprendizaje/Lectura' },
];

const KPI_METRICS = [
    { id: 'mensajes_enviados', label: 'Mensajes', icon: MessageCircle, gradient: 'from-blue-500 to-cyan-400', bg: 'bg-blue-500/10', text: 'text-blue-400', color: '#3b82f6', lightColor: '#93c5fd' },
    { id: 'respuestas_recibidas', label: 'Respuestas', icon: Zap, gradient: 'from-violet-500 to-purple-400', bg: 'bg-violet-500/10', text: 'text-violet-400', color: '#8b5cf6', lightColor: '#c4b5fd' },
    { id: 'llamadas_agendadas', label: 'Agenda', icon: CalendarIcon, gradient: 'from-pink-500 to-rose-400', bg: 'bg-pink-500/10', text: 'text-pink-400', color: '#ec4899', lightColor: '#f9a8d4' },
    { id: 'llamadas_realizadas', label: 'Llamadas', icon: Phone, gradient: 'from-orange-500 to-amber-400', bg: 'bg-orange-500/10', text: 'text-orange-400', color: '#f97316', lightColor: '#fdba74' },
    { id: 'propuestas_enviadas', label: 'Propuestas', icon: FileText, gradient: 'from-emerald-500 to-teal-400', bg: 'bg-emerald-500/10', text: 'text-emerald-400', color: '#10b981', lightColor: '#6ee7b7' },
    { id: 'cierres', label: 'Cierres', icon: Trophy, gradient: 'from-yellow-500 to-amber-400', bg: 'bg-yellow-500/10', text: 'text-yellow-400', color: '#eab308', lightColor: '#fde047' },
];

interface CrmLead {
    id: string;
    business_name: string;
    owner_name: string;
    estado_actual: string;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DailyTrackerPage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const { log, loading, save } = useDailyLog(date);
    const { history, loading: historyLoading, refresh: refreshHistory } = useDailyLogHistory(7);
    const [saving, setSaving] = useState(false);

    // State
    const [habits, setHabits] = useState<string[]>([]);
    const [kpis, setKpis] = useState<Record<string, number>>({});
    const [kpiTargets, setKpiTargets] = useState<Record<string, number>>(DAILY_KPI_TARGETS as unknown as Record<string, number>);
    const [editingTarget, setEditingTarget] = useState<string | null>(null);
    const [editingTargetValue, setEditingTargetValue] = useState('');
    const [pomodoros, setPomodoros] = useState(0);
    const [prospectos, setProspectos] = useState<TrackedLead[]>([]);
    const [seguimientos, setSeguimientos] = useState<TrackedLead[]>([]);
    const [notes, setNotes] = useState('');
    const [plan, setPlan] = useState('');
    const [crmLeads, setCrmLeads] = useState<CrmLead[]>([]);

    // Load CRM leads for autocomplete (just names/status)
    useEffect(() => {
        supabase
            .from('leads')
            .select('id, business_name, owner_name, estado_actual')
            .order('business_name')
            .limit(200)
            .then(({ data }) => { if (data) setCrmLeads(data as CrmLead[]); });
    }, []);

    // Sync daily log to state
    useEffect(() => {
        if (log) {
            setHabits(log.habits || []);
            setKpis(log.kpis || {});
            setKpiTargets((log.kpi_targets && Object.keys(log.kpi_targets).length > 0)
                ? log.kpi_targets
                : (DAILY_KPI_TARGETS as unknown as Record<string, number>));
            setPomodoros(log.pomodoros || 0);
            // normalizeItems handles legacy string[] arrays gracefully
            setProspectos(normalizeItems((log.prospectos_hoy || []) as (TrackedLead | string)[]));
            setSeguimientos(normalizeItems((log.seguimientos_hoy || []) as (TrackedLead | string)[]));
            setNotes(log.notes || '');
            setPlan(log.plan_next_day || '');
        } else if (!loading) {
            setHabits([]);
            setKpis({});
            setKpiTargets(DAILY_KPI_TARGETS as unknown as Record<string, number>);
            setPomodoros(0);
            setProspectos([]);
            setSeguimientos([]);
            setNotes('');
            setPlan('');
        }
    }, [log, loading, date]);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handlePomodoroComplete = async () => {
        const newVal = pomodoros + 1;
        setPomodoros(newVal);
        await save({ pomodoros: newVal });
        refreshHistory();
    };

    const handleAddProspecto = async (item: TrackedLead) => {
        const newVal = [item, ...prospectos];
        setProspectos(newVal);
        await save({ prospectos_hoy: newVal });
        // Auto-increment outreach KPI
        const newKpis = { ...kpis, mensajes_enviados: (kpis.mensajes_enviados || 0) + 1 };
        setKpis(newKpis);
        await save({ kpis: newKpis });
    };

    const handleRemoveProspecto = async (name: string) => {
        const newVal = prospectos.filter(p => p.name !== name);
        setProspectos(newVal);
        await save({ prospectos_hoy: newVal });
    };

    const handleAddSeguimiento = async (item: TrackedLead) => {
        const newVal = [item, ...seguimientos];
        setSeguimientos(newVal);
        await save({ seguimientos_hoy: newVal });
    };

    const handleRemoveSeguimiento = async (name: string) => {
        const newVal = seguimientos.filter(p => p.name !== name);
        setSeguimientos(newVal);
        await save({ seguimientos_hoy: newVal });
    };

    const handleDateChange = (days: number) => {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        setDate(d.toISOString().split('T')[0]);
    };

    const toggleHabit = async (habitId: string) => {
        const isCompleted = habits.includes(habitId);
        const newHabits = isCompleted ? habits.filter(h => h !== habitId) : [...habits, habitId];
        if (!isCompleted) confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 }, colors: ['#6366f1', '#a855f7', '#ec4899'] });
        setHabits(newHabits);
        await save({ habits: newHabits });
    };

    const incrementKPI = async (kpiId: string, delta: number) => {
        const current = kpis[kpiId] || 0;
        const newValue = Math.max(0, current + delta);
        const newKpis = { ...kpis, [kpiId]: newValue };
        setKpis(newKpis);
        const target = kpiTargets[kpiId] || 1;
        if (delta > 0 && current < target && newValue >= target) {
            confetti({ particleCount: 200, spread: 120, origin: { y: 0.4 }, colors: ['#10b981', '#6366f1', '#eab308', '#ec4899', '#3b82f6'] });
        }
        await save({ kpis: newKpis });
        refreshHistory();
    };

    const startEditTarget = (kpiId: string) => {
        setEditingTarget(kpiId);
        setEditingTargetValue(String(kpiTargets[kpiId] || 1));
    };

    const confirmEditTarget = async (kpiId: string) => {
        const val = parseInt(editingTargetValue, 10);
        if (!isNaN(val) && val > 0) {
            const newTargets = { ...kpiTargets, [kpiId]: val };
            setKpiTargets(newTargets);
            await save({ kpi_targets: newTargets });
        }
        setEditingTarget(null);
    };

    const handleSave = async () => {
        setSaving(true);
        try { await save({ habits, kpis, notes, plan_next_day: plan, kpi_targets: kpiTargets }); }
        finally { setSaving(false); }
    };

    const handleBlur = () => save({ notes, plan_next_day: plan });

    // ── Computed metrics ──────────────────────────────────────────────────────

    const totalActions = Object.values(kpis).reduce((sum, v) => sum + v, 0);
    const completedTargets = KPI_METRICS.filter(m => (kpis[m.id] || 0) >= (kpiTargets[m.id] || 1)).length;
    const habitsScore = (habits.length / HABITS_LIST.length) * 40;
    const kpisScore = (completedTargets / KPI_METRICS.length) * 40;
    const pomodoroScore = Math.min((pomodoros / 4) * 20, 20);
    const efficiencyScore = Math.round(habitsScore + kpisScore + pomodoroScore);
    const efficiencyColor = efficiencyScore >= 80 ? 'text-emerald-400' : efficiencyScore >= 50 ? 'text-amber-400' : 'text-rose-400';
    const efficiencyBg = efficiencyScore >= 80 ? 'from-emerald-600 to-teal-500' : efficiencyScore >= 50 ? 'from-amber-500 to-orange-500' : 'from-rose-600 to-pink-500';

    // Conversion rate: prospectos → seguimientos overlap
    const prospectNames = new Set(prospectos.map(p => p.name.toLowerCase()));
    const convertedCount = seguimientos.filter(s => prospectNames.has(s.name.toLowerCase())).length;
    const conversionRate = prospectos.length > 0 ? Math.round((convertedCount / prospectos.length) * 100) : null;

    // ── JSX ───────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-[#0a0a14] p-4 md:p-8 space-y-6 font-sans">

            {/* ── Header ── */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl shadow-lg shadow-violet-500/20">
                            <Flame className="w-6 h-6 text-white" />
                        </div>
                        Prospecting Tracker
                    </h1>
                    <div className="flex items-center gap-3 mt-3 ml-14 flex-wrap">
                        {/* Efficiency badge */}
                        <div className={`flex items-center gap-1.5 bg-gradient-to-r ${efficiencyBg} px-3 py-1.5 rounded-lg shadow-lg`}>
                            <TrendingUp className="w-3.5 h-3.5 text-white" />
                            <span className="text-sm font-black text-white">{efficiencyScore}% eficiencia</span>
                        </div>
                        <p className="text-sm text-slate-500 font-medium">
                            <span className="text-white font-bold">{totalActions}</span> acciones ·{' '}
                            <span className="text-emerald-400 font-bold">{completedTargets}/{KPI_METRICS.length}</span> metas ·{' '}
                            <span className="text-violet-400 font-bold">{pomodoros}</span> 🍅
                        </p>
                        {conversionRate !== null && (
                            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                                <span className="text-xs text-slate-400">Conversión:</span>
                                <span className={`text-xs font-black ${conversionRate >= 20 ? 'text-emerald-400' : 'text-amber-400'}`}>{conversionRate}%</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Date nav */}
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
                    {date !== new Date().toISOString().split('T')[0] && (
                        <button onClick={() => setDate(new Date().toISOString().split('T')[0])} className="text-xs text-violet-400 hover:text-violet-300 font-bold px-2">
                            Hoy
                        </button>
                    )}
                </div>
            </header>

            {/* ── Efficiency bar ── */}
            <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <div
                    className={`h-full bg-gradient-to-r ${efficiencyBg} rounded-full transition-all duration-700`}
                    style={{ width: `${efficiencyScore}%` }}
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                </div>
            ) : (
                <div className="space-y-6">

                    {/* ── KPI COUNTERS ── */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Target className="w-4 h-4 text-slate-500" />
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">KPIs del Día</span>
                            <span className="text-[10px] text-slate-600 ml-1">— tocá el lápiz para editar la meta</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            {KPI_METRICS.map(metric => {
                                const target = kpiTargets[metric.id] || 1;
                                const value = kpis[metric.id] || 0;
                                const pct = Math.min(100, Math.round((value / target) * 100));
                                const reached = value >= target;
                                const isEditing = editingTarget === metric.id;
                                const Icon = metric.icon;
                                const radius = 36;
                                const circumference = 2 * Math.PI * radius;
                                const strokeDash = (pct / 100) * circumference;

                                return (
                                    <div
                                        key={metric.id}
                                        className={`relative bg-[#13131f] rounded-2xl p-4 border transition-all duration-500 group ${reached ? 'border-emerald-500/30 shadow-lg shadow-emerald-500/10' : 'border-white/[0.06] hover:border-white/[0.12]'}`}
                                    >
                                        {reached && <div className="absolute inset-0 rounded-2xl bg-emerald-500/5 pointer-events-none" />}

                                        {/* Circular progress */}
                                        <div className="flex justify-center mb-3">
                                            <div className="relative w-20 h-20">
                                                <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                                                    <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4.5" />
                                                    <circle
                                                        cx="40" cy="40" r={radius} fill="none"
                                                        stroke={reached ? '#10b981' : metric.color}
                                                        strokeWidth="4.5" strokeLinecap="round"
                                                        strokeDasharray={`${strokeDash} ${circumference}`}
                                                        className="transition-all duration-700 ease-out"
                                                        style={{ filter: `drop-shadow(0 0 6px ${reached ? '#10b981' : metric.color}50)` }}
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-xl font-black text-white tabular-nums">{value}</span>
                                                    {/* Editable target */}
                                                    {isEditing ? (
                                                        <div className="flex items-center gap-0.5 mt-0.5">
                                                            <input
                                                                autoFocus
                                                                type="number"
                                                                value={editingTargetValue}
                                                                onChange={e => setEditingTargetValue(e.target.value)}
                                                                onKeyDown={e => { if (e.key === 'Enter') confirmEditTarget(metric.id); if (e.key === 'Escape') setEditingTarget(null); }}
                                                                className="w-8 text-center text-[10px] bg-white/10 border border-white/20 rounded text-white focus:outline-none"
                                                                min={1}
                                                            />
                                                            <button onClick={() => confirmEditTarget(metric.id)} className="text-emerald-400 hover:text-emerald-300">
                                                                <Check className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => startEditTarget(metric.id)}
                                                            className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-0.5 group/t"
                                                        >
                                                            <span>/{target}</span>
                                                            <Pencil className="w-2.5 h-2.5 opacity-0 group-hover/t:opacity-100 transition-opacity" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Label */}
                                        <div className="flex items-center justify-center gap-1 mb-3">
                                            <Icon className={`w-3 h-3 ${metric.text}`} />
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{metric.label}</span>
                                        </div>

                                        {/* +/- buttons */}
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => incrementKPI(metric.id, -1)}
                                                className="flex-1 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] flex items-center justify-center transition-all active:scale-95 border border-white/[0.05]"
                                            >
                                                <Minus className="w-3.5 h-3.5 text-slate-500" />
                                            </button>
                                            <button
                                                onClick={() => incrementKPI(metric.id, 1)}
                                                className={`flex-1 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 font-bold shadow-md ${reached
                                                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                                                    : `bg-gradient-to-r ${metric.gradient} text-white`}`}
                                                style={{ boxShadow: reached ? undefined : `0 4px 14px ${metric.color}30` }}
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* ── DEEP WORK + LEAD LISTS ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Pomodoro */}
                        <div className="lg:col-span-1">
                            <PomodoroTimer pomodorosCompleted={pomodoros} onComplete={handlePomodoroComplete} />
                        </div>

                        {/* Lead Lists */}
                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DailyLeadsList
                                title="Prospectos Nuevos"
                                badgeLabel="Prospecto"
                                badgeColor="bg-blue-500/20 text-blue-300"
                                headerGradient="from-blue-600 to-cyan-500"
                                items={prospectos}
                                onAdd={handleAddProspecto}
                                onRemove={handleRemoveProspecto}
                                placeholder="Buscar o escribir lead..."
                                emptyText="Agregá prospectos a medida que los contactás. Cada uno sube tu KPI de mensajes automáticamente."
                                crmLeads={crmLeads}
                            />
                            <DailyLeadsList
                                title="Seguimientos del Día"
                                badgeLabel="Follow-up"
                                badgeColor="bg-emerald-500/20 text-emerald-300"
                                headerGradient="from-emerald-600 to-teal-500"
                                items={seguimientos}
                                onAdd={handleAddSeguimiento}
                                onRemove={handleRemoveSeguimiento}
                                placeholder="¿A quién hiciste follow-up hoy?"
                                emptyText="Registrá los leads a los que hiciste seguimiento hoy."
                                crmLeads={crmLeads}
                            />
                        </div>
                    </div>

                    {/* ── Conversion Stats ── */}
                    {(prospectos.length > 0 || seguimientos.length > 0) && (
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Prospectos', value: prospectos.length, color: 'text-blue-400', sub: 'contactados hoy' },
                                { label: 'Seguimientos', value: seguimientos.length, color: 'text-emerald-400', sub: 'follow-ups hechos' },
                                { label: 'Tasa Conversión', value: conversionRate !== null ? `${conversionRate}%` : '—', color: 'text-violet-400', sub: 'prosp. → seguimiento' },
                            ].map(stat => (
                                <div key={stat.label} className="bg-[#13131f] rounded-xl p-4 border border-white/[0.06] text-center">
                                    <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                                    <div className="text-xs font-bold text-white mt-1">{stat.label}</div>
                                    <div className="text-[10px] text-slate-600 mt-0.5">{stat.sub}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── 7-DAY CHART ── */}
                    <HistoryChart history={history} loading={historyLoading} kpis={kpis} kpiTargets={kpiTargets} />

                    {/* ── HABITS + JOURNAL ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Habits */}
                        <section className="bg-[#13131f] rounded-2xl p-5 border border-white/[0.06]">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-indigo-500/10 rounded-lg">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                                </div>
                                <h2 className="text-base font-bold text-white">Hábitos Diarios</h2>
                                <span className="ml-auto text-sm font-black text-indigo-400">{habits.length}/{HABITS_LIST.length}</span>
                            </div>

                            <div className="space-y-1.5">
                                {HABITS_LIST.map(habit => {
                                    const isDone = habits.includes(habit.id);
                                    return (
                                        <button
                                            key={habit.id}
                                            onClick={() => toggleHabit(habit.id)}
                                            className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 group ${isDone ? 'bg-indigo-500/10' : 'hover:bg-white/[0.03]'}`}
                                        >
                                            <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${isDone ? 'bg-indigo-500 border-indigo-500' : 'border-slate-700 group-hover:border-indigo-500'}`}>
                                                {isDone && <CheckCircle2 className="w-3 h-3 text-white" />}
                                            </div>
                                            <span className={`text-sm text-left ${isDone ? 'text-indigo-300 line-through opacity-60' : 'text-slate-400'}`}>
                                                {habit.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/[0.06]">
                                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                                    <span>Progreso</span>
                                    <span className="font-black text-white">{Math.round((habits.length / HABITS_LIST.length) * 100)}%</span>
                                </div>
                                <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${(habits.length / HABITS_LIST.length) * 100}%` }} />
                                </div>
                            </div>
                        </section>

                        {/* Journal */}
                        <section className="bg-[#13131f] rounded-2xl p-5 border border-white/[0.06] space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-pink-500/10 rounded-lg">
                                    <Edit3Icon className="w-4 h-4 text-pink-400" />
                                </div>
                                <h2 className="text-base font-bold text-white">Diario & Plan</h2>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Review del Día</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    onBlur={handleBlur}
                                    placeholder="¿Qué lograste hoy? ¿Qué aprendiste?"
                                    className="w-full h-24 p-3 bg-black/20 border border-white/[0.06] rounded-xl text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-pink-500/30 resize-none transition-all placeholder:text-slate-700"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Plan para Mañana</label>
                                <textarea
                                    value={plan}
                                    onChange={e => setPlan(e.target.value)}
                                    onBlur={handleBlur}
                                    placeholder="3 prioridades clave..."
                                    className="w-full h-24 p-3 bg-black/20 border border-white/[0.06] rounded-xl text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-pink-500/30 resize-none transition-all placeholder:text-slate-700"
                                />
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-violet-500/20"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {saving ? 'Guardando...' : 'Guardar Todo'}
                            </button>
                        </section>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── History Chart ──────────────────────────────────────────────────────────────

function HistoryChart({ history, loading, kpis, kpiTargets }: {
    history: any[];
    loading: boolean;
    kpis: Record<string, number>;
    kpiTargets: Record<string, number>;
}) {
    const [selectedMetric, setSelectedMetric] = useState('mensajes_enviados');
    const metric = KPI_METRICS.find(m => m.id === selectedMetric)!;

    const chartData = useMemo(() => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayLog = history.find(h => h.date === dateStr);
            days.push({
                date: dateStr,
                label: d.toLocaleDateString('es-ES', { day: 'numeric' }),
                dayName: d.toLocaleDateString('es-ES', { weekday: 'short' }),
                value: dayLog?.kpis?.[selectedMetric] || 0,
            });
        }
        return days;
    }, [history, selectedMetric]);

    const target = kpiTargets[selectedMetric] || 1;
    const maxValue = Math.max(...chartData.map(d => d.value), target, 1);
    const weekTotal = chartData.reduce((sum, d) => sum + d.value, 0);
    const weekAvg = Math.round(weekTotal / 7 * 10) / 10;

    if (loading) return (
        <section className="bg-[#13131f] rounded-2xl p-6 border border-white/[0.06]">
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
        </section>
    );

    return (
        <section className="bg-[#13131f] rounded-2xl p-5 border border-white/[0.06]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-500/10 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-white">Últimos 7 Días</h2>
                        <p className="text-xs text-slate-600 mt-0.5">
                            Promedio: <span className="text-white font-bold">{weekAvg}</span>/día · Total: <span className="text-white font-bold">{weekTotal}</span>
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {KPI_METRICS.map(m => {
                        const MIcon = m.icon;
                        return (
                            <button
                                key={m.id}
                                onClick={() => setSelectedMetric(m.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${selectedMetric === m.id
                                    ? `${m.bg} ${m.text} ring-1 ring-current/50`
                                    : 'bg-white/[0.04] text-slate-600 hover:text-slate-300'}`}
                            >
                                <MIcon className="w-3 h-3" />
                                {m.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex items-end gap-2 h-40 px-1">
                {chartData.map((day, i) => {
                    const barH = maxValue > 0 ? (day.value / maxValue) * 100 : 0;
                    const isToday = day.date === new Date().toISOString().split('T')[0];
                    const reached = day.value >= target;
                    const targetPos = (target / maxValue) * 100;

                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                            <span className={`text-[11px] font-black tabular-nums transition-all ${day.value > 0 ? isToday ? 'opacity-100 text-white' : 'opacity-0 group-hover:opacity-100 text-slate-400' : 'opacity-0'}`}>
                                {day.value}
                            </span>
                            <div className="w-full relative h-28 flex items-end rounded-t overflow-hidden bg-white/[0.03]">
                                {/* target line */}
                                <div className="absolute left-0 right-0 border-t border-dashed z-10" style={{ bottom: `${targetPos}%`, borderColor: `${metric.color}35` }} />
                                {/* bar */}
                                <div
                                    className="w-full rounded-t transition-all duration-700 ease-out"
                                    style={{
                                        height: `${Math.max(barH, day.value > 0 ? 4 : 0)}%`,
                                        background: reached
                                            ? 'linear-gradient(to top, #059669, #34d399)'
                                            : isToday
                                                ? `linear-gradient(to top, ${metric.color}, ${metric.lightColor})`
                                                : `linear-gradient(to top, ${metric.color}25, ${metric.color}55)`,
                                    }}
                                />
                            </div>
                            <div className="text-center">
                                <span className={`block text-[10px] font-black uppercase ${isToday ? 'text-violet-400' : 'text-slate-700'}`}>{day.dayName}</span>
                                <span className={`block text-[10px] ${isToday ? 'text-white font-bold' : 'text-slate-600'}`}>{day.label}</span>
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
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
    );
}
