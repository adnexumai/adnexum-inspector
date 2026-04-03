'use client';

import { useState, useEffect } from 'react';
import { useTasks, useLeads } from '@/lib/hooks';
import type { Task } from '@/lib/types';
import { STAGE_TASKS, PIPELINE_STAGES } from '@/lib/types';
import {
    CheckSquare, Plus, X, Calendar, Tag, AlertCircle,
    Circle, CheckCircle2, Trash2, Filter, Clock,
} from 'lucide-react';

export default function TareasPage() {
    const { tasks, create, toggle, remove } = useTasks();
    const { leads } = useLeads();
    const [showForm, setShowForm] = useState(false);
    const [filterView, setFilterView] = useState<'pendientes' | 'completadas' | 'todas'>('pendientes');
    const [filterLead, setFilterLead] = useState<string>('all');
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    if (!mounted) return <div style={{ padding: '40px', color: 'var(--color-text-muted)' }}>Cargando...</div>;

    const filtered = tasks.filter(t => {
        if (filterView === 'pendientes' && t.completed) return false;
        if (filterView === 'completadas' && !t.completed) return false;
        if (filterLead !== 'all' && t.lead_id !== filterLead) return false;
        return true;
    });

    const pendingCount = tasks.filter(t => !t.completed).length;
    const completedCount = tasks.filter(t => t.completed).length;
    const urgentCount = tasks.filter(t => !t.completed && t.priority === 'urgente').length;

    // Group by priority
    const byPriority: Record<string, Task[]> = { urgente: [], alta: [], media: [], baja: [] };
    filtered.forEach(t => {
        if (byPriority[t.priority]) byPriority[t.priority].push(t);
        else byPriority['media'].push(t);
    });

    const today = new Date().toISOString().split('T')[0];
    const overdue = filtered.filter(t => !t.completed && t.due_date && t.due_date < today);

    return (
        <div style={{ maxWidth: '900px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                        ✅ <span className="text-gradient">Tareas</span>
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
                        {pendingCount} pendientes · {completedCount} completadas {urgentCount > 0 && `· ${urgentCount} urgentes`}
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                    <Plus size={18} /> Nueva Tarea
                </button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {(['pendientes', 'completadas', 'todas'] as const).map(v => (
                    <button key={v} onClick={() => setFilterView(v)}
                        className={`pill ${filterView === v ? 'pill-active' : ''}`}>
                        {v === 'pendientes' ? '⏳' : v === 'completadas' ? '✅' : '📋'} {v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                ))}
                <select value={filterLead} onChange={e => setFilterLead(e.target.value)} style={{ width: '200px', fontSize: '13px' }}>
                    <option value="all">Todos los leads</option>
                    {leads.map(l => (
                        <option key={l.id} value={l.id}>{l.business_name}</option>
                    ))}
                </select>
            </div>

            {/* Overdue Alert */}
            {overdue.length > 0 && (
                <div style={{
                    padding: '14px 18px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '12px',
                    border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '16px',
                    display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                    <AlertCircle size={18} style={{ color: 'var(--color-red)', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: 'var(--color-red-light)', fontWeight: 600 }}>
                        {overdue.length} tarea{overdue.length > 1 ? 's' : ''} vencida{overdue.length > 1 ? 's' : ''}
                    </span>
                </div>
            )}

            {/* Task List by Priority */}
            {filterView !== 'completadas' ? (
                Object.entries(byPriority).map(([priority, tasksInGroup]) =>
                    tasksInGroup.filter(t => !t.completed).length > 0 && (
                        <div key={priority} style={{ marginBottom: '20px' }}>
                            <h3 style={{
                                fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                                marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px',
                                color: priority === 'urgente' ? 'var(--color-red-light)' : priority === 'alta' ? 'var(--color-orange)' : 'var(--color-text-secondary)',
                            }}>
                                {priority === 'urgente' ? '🔴' : priority === 'alta' ? '🟠' : priority === 'media' ? '🟡' : '🟢'} {priority}
                                <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-muted)' }}>
                                    ({tasksInGroup.filter(t => !t.completed).length})
                                </span>
                            </h3>
                            {tasksInGroup.filter(t => !t.completed).map(task => (
                                <TaskItem key={task.id} task={task} leads={leads} onToggle={toggle} onRemove={remove} />
                            ))}
                        </div>
                    )
                )
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {filtered.filter(t => t.completed).map(task => (
                        <TaskItem key={task.id} task={task} leads={leads} onToggle={toggle} onRemove={remove} />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {filtered.length === 0 && (
                <div className="empty-state">
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
                        {filterView === 'pendientes' ? '¡Todo al día!' : 'Sin tareas'}
                    </h3>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '8px' }}>
                        {filterView === 'pendientes' ? 'No tenés tareas pendientes. ¡Buen trabajo!' : 'Creá tu primera tarea para empezar.'}
                    </p>
                </div>
            )}

            {/* Auto-generate from Pipeline */}
            <div className="card-static" style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ⚡ Generar Tareas desde Pipeline
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                    Creá tareas automáticas basadas en la etapa actual de cada lead en tu pipeline.
                </p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {leads.filter(l => !['ganado', 'perdido'].includes(l.estado_actual)).slice(0, 6).map(lead => {
                        const stgTasks = STAGE_TASKS[lead.estado_actual] || [];
                        return (
                            <button key={lead.id} className="pill" onClick={() => {
                                stgTasks.forEach(taskTitle => {
                                    create({
                                        lead_id: lead.id,
                                        title: taskTitle,
                                        stage_related: lead.estado_actual,
                                        priority: lead.nivel_interes === 'caliente' ? 'alta' : 'media',
                                    });
                                });
                            }}>
                                {lead.business_name} ({stgTasks.length})
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* New Task Modal */}
            {showForm && (
                <NewTaskModal
                    leads={leads}
                    onClose={() => setShowForm(false)}
                    onCreate={(task) => { create(task); setShowForm(false); }}
                />
            )}
        </div>
    );
}

function TaskItem({ task, leads, onToggle, onRemove }: {
    task: Task; leads: { id: string; business_name: string }[];
    onToggle: (id: string, completed: boolean) => void;
    onRemove: (id: string) => void;
}) {
    const leadName = task.lead_id ? leads.find(l => l.id === task.lead_id)?.business_name : null;
    const isOverdue = !task.completed && task.due_date && task.due_date < new Date().toISOString().split('T')[0];
    const stage = PIPELINE_STAGES.find(s => s.id === task.stage_related);

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 16px', background: 'var(--color-bg-card)',
            borderRadius: '12px', marginBottom: '6px',
            border: isOverdue ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--color-border)',
            opacity: task.completed ? 0.5 : 1,
            transition: 'all 0.2s',
        }}>
            <button onClick={() => onToggle(task.id, !task.completed)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: '2px' }}>
                {task.completed
                    ? <CheckCircle2 size={20} style={{ color: 'var(--color-green)' }} />
                    : <Circle size={20} style={{ color: 'var(--color-text-muted)' }} />
                }
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 500, textDecoration: task.completed ? 'line-through' : 'none' }}>
                    {task.title}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px', fontSize: '11px', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
                    {leadName && <span>🏢 {leadName}</span>}
                    {stage && <span>{stage.emoji} {stage.label}</span>}
                    {task.due_date && (
                        <span style={{ color: isOverdue ? 'var(--color-red)' : 'inherit' }}>
                            📅 {new Date(task.due_date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                        </span>
                    )}
                </div>
            </div>
            <button onClick={() => onRemove(task.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px' }}>
                <Trash2 size={14} />
            </button>
        </div>
    );
}

function NewTaskModal({ leads, onClose, onCreate }: {
    leads: { id: string; business_name: string }[];
    onClose: () => void;
    onCreate: (task: Partial<Task>) => void;
}) {
    const [title, setTitle] = useState('');
    const [leadId, setLeadId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState<'baja' | 'media' | 'alta' | 'urgente'>('media');

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 800 }}>➕ Nueva Tarea</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                        <X size={20} />
                    </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                        <label>Título *</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Enviar Loom a García" />
                    </div>
                    <div>
                        <label>Lead Asociado</label>
                        <select value={leadId} onChange={e => setLeadId(e.target.value)}>
                            <option value="">Sin lead</option>
                            {leads.map(l => <option key={l.id} value={l.id}>{l.business_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label>Fecha Límite</label>
                        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                    </div>
                    <div>
                        <label>Prioridad</label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {(['baja', 'media', 'alta', 'urgente'] as const).map(p => (
                                <button key={p} onClick={() => setPriority(p)}
                                    className={`pill ${priority === p ? 'pill-active' : ''}`}
                                    style={{ flex: 1, justifyContent: 'center', fontSize: '12px' }}>
                                    {p === 'urgente' ? '🔴' : p === 'alta' ? '🟠' : p === 'media' ? '🟡' : '🟢'} {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                    <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
                    <button className="btn btn-primary" onClick={() => {
                        if (!title) return;
                        onCreate({ title, lead_id: leadId || null, due_date: dueDate || null, priority });
                    }} style={{ flex: 2 }}>
                        <Plus size={16} /> Crear Tarea
                    </button>
                </div>
            </div>
        </div>
    );
}
