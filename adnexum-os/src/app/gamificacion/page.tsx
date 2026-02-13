'use client';

import { useState, useEffect } from 'react';
import { useLeads, useTasks } from '@/lib/hooks';
import {
    Trophy, Star, Zap, Flame, Target, Award, Shield, Rocket,
    Crown, Lock, CheckCircle2, TrendingUp, Calendar, Swords,
} from 'lucide-react';

interface Badge {
    id: string;
    emoji: string;
    name: string;
    description: string;
    unlocked: boolean;
    date?: string;
}

interface Achievement {
    id: string;
    title: string;
    description: string;
    xp: number;
    completed: boolean;
    date?: string;
}

const LEVELS = [
    { level: 1, title: 'Novato', xp: 0, emoji: '🌱' },
    { level: 2, title: 'Aprendiz', xp: 100, emoji: '📘' },
    { level: 3, title: 'Prospector', xp: 300, emoji: '🔍' },
    { level: 4, title: 'Vendedor', xp: 600, emoji: '💼' },
    { level: 5, title: 'Estratega', xp: 1000, emoji: '🎯' },
    { level: 6, title: 'Experto', xp: 1500, emoji: '🏆' },
    { level: 7, title: 'Maestro', xp: 2200, emoji: '👑' },
    { level: 8, title: 'Leyenda', xp: 3000, emoji: '⚡' },
    { level: 9, title: 'Élite', xp: 4000, emoji: '💎' },
    { level: 10, title: 'Jefe Final', xp: 5000, emoji: '🔱' },
];

export default function GamificacionPage() {
    const { leads } = useLeads();
    const { tasks } = useTasks();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    if (!mounted) return <div style={{ padding: '40px', color: 'var(--color-text-muted)' }}>Cargando...</div>;

    // Calculate XP from real data
    const leadsCreated = leads.length;
    const leadsContacted = leads.filter(l => l.contador_seguimientos > 0).length;
    const leadsGanados = leads.filter(l => l.estado_actual === 'ganado').length;
    const discoveryDone = leads.filter(l => l.fecha_discovery).length;
    const tasksCompleted = tasks.filter(t => t.completed).length;
    const followUpsDone = leads.reduce((sum, l) => sum + (l.contador_seguimientos || 0), 0);

    const totalXP =
        leadsCreated * 10 +
        leadsContacted * 15 +
        followUpsDone * 5 +
        discoveryDone * 50 +
        leadsGanados * 200 +
        tasksCompleted * 20;

    const currentLevel = LEVELS.reduce((best, lvl) => totalXP >= lvl.xp ? lvl : best, LEVELS[0]);
    const nextLevel = LEVELS.find(l => l.xp > totalXP) || LEVELS[LEVELS.length - 1];
    const xpProgress = nextLevel.xp > currentLevel.xp
        ? ((totalXP - currentLevel.xp) / (nextLevel.xp - currentLevel.xp)) * 100
        : 100;

    // Streak - days with at least one follow-up (simplified for now)
    const streak = leads.filter(l => l.seguido_hoy).length > 0 ? 1 : 0;
    const maxStreak = Math.max(streak, leadsContacted > 0 ? Math.min(leadsContacted, 7) : 0);
    const energyPct = Math.min(Math.round((followUpsDone / Math.max(leadsCreated, 1)) * 100), 100);

    // Calculate badges
    const badges: Badge[] = [
        { id: '1', emoji: '🏁', name: 'Primer Paso', description: 'Crear tu primer lead', unlocked: leadsCreated >= 1 },
        { id: '2', emoji: '📞', name: 'Primer Contacto', description: 'Contactar un lead por WhatsApp', unlocked: leadsContacted >= 1 },
        { id: '3', emoji: '🔥', name: 'En Llamas', description: 'Contactar 5 leads en un día', unlocked: leads.filter(l => l.seguido_hoy).length >= 5 },
        { id: '4', emoji: '📚', name: 'Coleccionista', description: 'Tener 10+ leads en el pipeline', unlocked: leadsCreated >= 10 },
        { id: '5', emoji: '🔍', name: 'Detective', description: 'Completar tu primer discovery', unlocked: discoveryDone >= 1 },
        { id: '6', emoji: '🎯', name: 'Sniper', description: 'Cerrar tu primera venta', unlocked: leadsGanados >= 1 },
        { id: '7', emoji: '💪', name: 'Imparable', description: 'Hacer 20+ follow-ups', unlocked: followUpsDone >= 20 },
        { id: '8', emoji: '⚡', name: 'Velocista', description: 'Completar 10 tareas', unlocked: tasksCompleted >= 10 },
        { id: '9', emoji: '🏆', name: 'Campeón', description: 'Ganar 3+ deals', unlocked: leadsGanados >= 3 },
        { id: '10', emoji: '👑', name: 'Rey del Pipe', description: '20+ leads activos simultáneos', unlocked: leads.filter(l => !['ganado', 'perdido'].includes(l.estado_actual)).length >= 20 },
        { id: '11', emoji: '💎', name: 'Alto Valor', description: 'Deal de $1000+ USD', unlocked: leads.some(l => (l.valor_estimado_usd || 0) >= 1000) },
        { id: '12', emoji: '🔱', name: 'Élite Total', description: 'Alcanzar nivel 5+', unlocked: currentLevel.level >= 5 },
    ];

    const unlockedBadges = badges.filter(b => b.unlocked);

    // Achievements
    const achievements: Achievement[] = [
        { id: '1', title: 'Pipeline Inicial', description: 'Crear 5 leads', xp: 50, completed: leadsCreated >= 5 },
        { id: '2', title: 'Máquina de Contacto', description: 'Realizar 10 follow-ups', xp: 100, completed: followUpsDone >= 10 },
        { id: '3', title: 'Organizador', description: 'Completar 5 tareas', xp: 75, completed: tasksCompleted >= 5 },
        { id: '4', title: 'Closer', description: 'Cerrar tu primer deal', xp: 200, completed: leadsGanados >= 1 },
        { id: '5', title: 'Discovery Master', description: 'Realizar 3 discoveries', xp: 150, completed: discoveryDone >= 3 },
    ];

    const daysActive = Math.max(1, Math.ceil((Date.now() - new Date(leads[0]?.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24)));

    return (
        <div style={{ maxWidth: '900px' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                    🏆 <span className="text-gradient">Gamificación</span>
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
                    Tu progreso, badges y nivel de ventas
                </p>
            </div>

            {/* Avatar & Level Card */}
            <div className="card-static gradient-header" style={{ textAlign: 'center', padding: '32px', marginBottom: '20px' }}>
                <div style={{ fontSize: '64px', marginBottom: '8px' }}>{currentLevel.emoji}</div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>
                    Nivel {currentLevel.level}: {currentLevel.title}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '12px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 600 }}>{totalXP} XP</span>
                    <div style={{
                        flex: 1, maxWidth: '250px', height: '8px', background: 'var(--color-bg-hover)',
                        borderRadius: '4px', overflow: 'hidden',
                    }}>
                        <div style={{
                            height: '100%', width: `${xpProgress}%`,
                            background: 'linear-gradient(90deg, var(--color-accent), var(--color-accent-light))',
                            borderRadius: '4px', transition: 'width 0.8s ease',
                        }} />
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 600 }}>{nextLevel.xp} XP</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                    {nextLevel.xp - totalXP} XP para alcanzar {nextLevel.emoji} {nextLevel.title}
                </p>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                <div className="card-static" style={{ textAlign: 'center', padding: '16px' }}>
                    <Flame size={22} style={{ color: 'var(--color-orange)', marginBottom: '6px' }} />
                    <div style={{ fontSize: '28px', fontWeight: 800 }}>{streak}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Días de Racha</div>
                </div>
                <div className="card-static" style={{ textAlign: 'center', padding: '16px' }}>
                    <Zap size={22} style={{ color: 'var(--color-yellow)', marginBottom: '6px' }} />
                    <div style={{ fontSize: '28px', fontWeight: 800 }}>{energyPct}%</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Energía</div>
                </div>
                <div className="card-static" style={{ textAlign: 'center', padding: '16px' }}>
                    <Trophy size={22} style={{ color: 'var(--color-green)', marginBottom: '6px' }} />
                    <div style={{ fontSize: '28px', fontWeight: 800 }}>{maxStreak}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Racha Máxima</div>
                </div>
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
                <MiniStat icon={<Star size={16} />} label="XP Totales" value={totalXP} color="var(--color-accent-light)" />
                <MiniStat icon={<Award size={16} />} label="Badges" value={`${unlockedBadges.length}/${badges.length}`} color="var(--color-yellow)" />
                <MiniStat icon={<Target size={16} />} label="Logros" value={`${achievements.filter(a => a.completed).length}/${achievements.length}`} color="var(--color-green)" />
                <MiniStat icon={<Calendar size={16} />} label="Días Activos" value={daysActive} color="var(--color-accent)" />
            </div>

            {/* Badges Grid */}
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award size={18} style={{ color: 'var(--color-yellow)' }} /> Badges
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
                    {badges.map(badge => (
                        <div key={badge.id} className="card-static" style={{
                            textAlign: 'center', padding: '16px',
                            opacity: badge.unlocked ? 1 : 0.35,
                            border: badge.unlocked ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--color-border)',
                            position: 'relative',
                        }}>
                            <div style={{ fontSize: '32px', marginBottom: '6px' }}>{badge.emoji}</div>
                            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '2px' }}>{badge.name}</div>
                            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', lineHeight: '1.3' }}>{badge.description}</div>
                            {!badge.unlocked && (
                                <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                                    <Lock size={12} style={{ color: 'var(--color-text-muted)' }} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Achievements */}
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Target size={18} style={{ color: 'var(--color-green)' }} /> Logros
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {achievements.map(ach => (
                        <div key={ach.id} className="card-static" style={{
                            display: 'flex', alignItems: 'center', gap: '14px',
                            opacity: ach.completed ? 1 : 0.5,
                            border: ach.completed ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--color-border)',
                        }}>
                            {ach.completed
                                ? <CheckCircle2 size={22} style={{ color: 'var(--color-green)', flexShrink: 0 }} />
                                : <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px solid var(--color-text-muted)', flexShrink: 0 }} />
                            }
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: '14px' }}>{ach.title}</div>
                                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{ach.description}</div>
                            </div>
                            <div style={{
                                fontSize: '12px', fontWeight: 700, color: 'var(--color-accent-light)',
                                background: 'rgba(139, 92, 246, 0.1)', padding: '4px 10px', borderRadius: '8px',
                            }}>
                                +{ach.xp} XP
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Next Levels */}
            <div className="card-static">
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={16} style={{ color: 'var(--color-accent-light)' }} /> Progreso de Nivel
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {LEVELS.filter(l => l.level >= currentLevel.level).slice(0, 4).map(lvl => {
                        const isCurrentLvl = lvl.level === currentLevel.level;
                        const pct = totalXP >= lvl.xp ? 100 : Math.round((totalXP / lvl.xp) * 100);
                        return (
                            <div key={lvl.level} style={{
                                display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px',
                                background: isCurrentLvl ? 'rgba(139, 92, 246, 0.06)' : 'transparent',
                                borderRadius: '10px',
                            }}>
                                <span style={{ fontSize: '22px' }}>{lvl.emoji}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: isCurrentLvl ? 700 : 500 }}>
                                            Nivel {lvl.level}: {lvl.title}
                                        </span>
                                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{lvl.xp} XP</span>
                                    </div>
                                    <div style={{ height: '4px', background: 'var(--color-bg-hover)', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', width: `${pct}%`,
                                            background: pct === 100 ? 'var(--color-green)' : 'var(--color-accent)',
                                            borderRadius: '2px', transition: 'width 0.5s',
                                        }} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* XP Breakdown */}
            <div className="card-static" style={{ marginTop: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>📊 Desglose de XP</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '12px' }}>
                    <XPItem label="Leads creados" count={leadsCreated} xpPer={10} />
                    <XPItem label="Leads contactados" count={leadsContacted} xpPer={15} />
                    <XPItem label="Follow-ups" count={followUpsDone} xpPer={5} />
                    <XPItem label="Discoveries" count={discoveryDone} xpPer={50} />
                    <XPItem label="Deals ganados" count={leadsGanados} xpPer={200} />
                    <XPItem label="Tareas completadas" count={tasksCompleted} xpPer={20} />
                </div>
            </div>
        </div>
    );
}

function MiniStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
    return (
        <div className="card-static" style={{ textAlign: 'center', padding: '14px' }}>
            <div style={{ color, marginBottom: '4px', display: 'flex', justifyContent: 'center' }}>{icon}</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{label}</div>
        </div>
    );
}

function XPItem({ label, count, xpPer }: { label: string; count: number; xpPer: number }) {
    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between', padding: '8px 12px',
            background: 'var(--color-bg-hover)', borderRadius: '8px',
        }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>{label} (×{count})</span>
            <span style={{ fontWeight: 700, color: 'var(--color-accent-light)' }}>+{count * xpPer} XP</span>
        </div>
    );
}
