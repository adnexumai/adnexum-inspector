'use client';

import { useState, useCallback, useEffect } from 'react';
import { useProjects } from '@/lib/hooks';
import type { Project, ProjectDocument, ProjectDeliverable, ChecklistItem } from '@/lib/types';
import {
    Plus, Search, Calendar, DollarSign, Folder, ExternalLink, MoreHorizontal,
    LayoutGrid, List, X, FileText, Package, CheckSquare, StickyNote, Trash2,
    Edit3, Link2, Tag, Mail, Phone, Globe, ChevronRight, Percent, ArrowUpRight
} from 'lucide-react';

const SERVICE_TYPES = ['Desarrollo Web', 'Consultoría IA', 'Automatización', 'Chatbots', 'CRM Implementation', 'Diseño UX/UI', 'Marketing', 'Otro'];

const PROJECT_PHASES = ['Kickoff', 'Planning', 'Design', 'Development', 'Testing', 'Deployment', 'Handover'];

const DOC_CATEGORIES = [
    { value: 'propuesta', label: 'Propuesta', color: 'bg-blue-100 text-blue-700' },
    { value: 'contrato', label: 'Contrato', color: 'bg-green-100 text-green-700' },
    { value: 'sop', label: 'SOP / Documentación', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'entregable', label: 'Entregable Final', color: 'bg-purple-100 text-purple-700' },
    { value: 'referencia', label: 'Referencia / Brief', color: 'bg-gray-100 text-gray-700' },
    { value: 'otro', label: 'Otro', color: 'bg-zinc-100 text-zinc-700' },
];

const DELIVERABLE_STATUSES = [
    { value: 'pending', label: 'Pendiente', color: 'bg-gray-100 text-gray-600' },
    { value: 'in_progress', label: 'En curso', color: 'bg-blue-100 text-blue-600' },
    { value: 'delivered', label: 'Entregado', color: 'bg-yellow-100 text-yellow-600' },
    { value: 'approved', label: 'Aprobado', color: 'bg-green-100 text-green-600' },
];

const PHASE_TASKS: Record<string, string[]> = {
    'Kickoff': ['Reunión inicial con cliente', 'Definir alcance y objetivos', 'Firmar contrato', 'Pago inicial'],
    'Planning': ['Crear cronograma detallado', 'Definir stack tecnológico', 'Asignar equipo', 'Configurar repo/entorno'],
    'Design': ['Wireframes baja fidelidad', 'Mockups alta fidelidad', 'Aprobación de diseño', 'Handoff a desarrollo'],
    'Development': ['Configuración inicial', 'Desarrollo Backend/API', 'Desarrollo Frontend', 'Integración'],
    'Testing': ['Pruebas unitarias', 'Pruebas de integración', 'QA interno', 'UAT (User Acceptance Testing)'],
    'Deployment': ['Setup servidor producción', 'Deploy Backend', 'Deploy Frontend', 'Configuración DNS/SSL'],
    'Handover': ['Capacitación usuario', 'Entrega documentación', 'Cierre administrativo', 'Solicitar testimonio'],
};
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ProjectsPage() {
    const { projects, create, update, remove, loading } = useProjects();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const filteredProjects = projects.filter(p => {
        const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.client_name?.toLowerCase().includes(search.toLowerCase()) ||
            p.service_type?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' || p.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const handleUpdateProject = async (updates: Partial<Project>) => {
        if (!selectedProject) return;
        await update(selectedProject.id, updates);
        setSelectedProject(prev => prev ? { ...prev, ...updates } : null);
    };

    if (loading) return <div className="p-8 text-muted-foreground">Cargando proyectos...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold mb-1">🚀 Proyectos</h1>
                    <p className="text-muted-foreground text-sm">{projects.length} proyectos · {projects.filter(p => p.status === 'in_progress').length} en curso</p>
                </div>
                <div className="flex gap-3 items-center">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-9 pr-4 py-2 border rounded-lg bg-background w-56 text-sm" />
                    </div>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-lg bg-background text-sm">
                        <option value="all">Todos</option>
                        <option value="not_started">Por empezar</option>
                        <option value="in_progress">En curso</option>
                        <option value="on_hold">En espera</option>
                        <option value="completed">Completados</option>
                    </select>
                    <div className="flex border rounded-lg overflow-hidden">
                        <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}><LayoutGrid size={18} /></button>
                        <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}><List size={18} /></button>
                    </div>
                    <button onClick={() => setShowForm(true)} className="btn btn-primary flex items-center gap-2 text-sm"><Plus size={16} /> Nuevo</button>
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredProjects.map(project => (
                        <ProjectCard key={project.id} project={project} onClick={() => setSelectedProject(project)} />
                    ))}
                    {filteredProjects.length === 0 && (
                        <div className="col-span-full text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl">
                            <Folder className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No hay proyectos</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-card rounded-xl border overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs text-muted-foreground border-b bg-muted/30">
                                <th className="py-3 px-4">Proyecto</th>
                                <th className="py-3 px-3">Cliente</th>
                                <th className="py-3 px-3">Servicio</th>
                                <th className="py-3 px-3">Status</th>
                                <th className="py-3 px-3">Progreso</th>
                                <th className="py-3 px-3">Presupuesto</th>
                                <th className="py-3 px-3">Docs</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProjects.map(project => (
                                <tr key={project.id} onClick={() => setSelectedProject(project)} className="border-b last:border-0 hover:bg-muted/50 cursor-pointer">
                                    <td className="py-3 px-4 font-medium text-sm">{project.title}</td>
                                    <td className="py-3 px-3 text-sm text-muted-foreground">{project.client_name || '-'}</td>
                                    <td className="py-3 px-3"><ServiceBadge type={project.service_type} /></td>
                                    <td className="py-3 px-3"><StatusBadge status={project.status} /></td>
                                    <td className="py-3 px-3"><div className="w-20 bg-muted rounded-full h-2"><div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${project.progress || 0}%` }} /></div></td>
                                    <td className="py-3 px-3 text-sm">{project.budget ? `$${project.budget.toLocaleString()}` : '-'}</td>
                                    <td className="py-3 px-3 text-sm text-muted-foreground">{(project.documents || []).length}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showForm && <ProjectFormModal onClose={() => setShowForm(false)} onSubmit={async (data) => { await create(data); setShowForm(false); }} />}
            {selectedProject && <ProjectDetailSheet project={selectedProject} onClose={() => setSelectedProject(null)} onUpdate={handleUpdateProject} onDelete={async () => { await remove(selectedProject.id); setSelectedProject(null); }} />}
        </div>
    );
}

/* ============ PROJECT CARD ============ */
function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
    const docCount = (project.documents || []).length;
    const delCount = (project.deliverables || []).length;
    const delDone = (project.deliverables || []).filter(d => d.status === 'approved' || d.status === 'delivered').length;

    return (
        <div onClick={onClick} className="bg-card border rounded-xl p-5 hover:shadow-lg transition-all hover:border-primary/50 cursor-pointer group">
            <div className="flex justify-between items-start mb-3">
                <StatusBadge status={project.status} />
                {project.service_type && <ServiceBadge type={project.service_type} />}
            </div>
            <h3 className="text-lg font-bold mb-1 line-clamp-1">{project.title}</h3>
            {project.client_name && <p className="text-sm text-muted-foreground mb-2">👤 {project.client_name}</p>}
            <p className="text-muted-foreground text-xs mb-4 line-clamp-2 min-h-[32px]">{project.description || 'Sin descripción'}</p>

            {/* Progress */}
            <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="font-medium">{project.progress || 0}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-gradient-to-r from-primary to-primary/70 rounded-full h-2 transition-all" style={{ width: `${project.progress || 0}%` }} />
                </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                {project.budget ? <span className="flex items-center gap-1"><DollarSign size={12} />${project.budget.toLocaleString()}</span> : null}
                {project.start_date && <span className="flex items-center gap-1"><Calendar size={12} />{format(new Date(project.start_date), 'dd MMM', { locale: es })}</span>}
            </div>

            {/* Tags */}
            {(project.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                    {(project.tags || []).slice(0, 3).map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">{tag}</span>
                    ))}
                    {(project.tags || []).length > 3 && <span className="text-[10px] text-muted-foreground">+{(project.tags || []).length - 3}</span>}
                </div>
            )}

            <div className="flex gap-3 border-t pt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><FileText size={12} /> {docCount} docs</span>
                <span className="flex items-center gap-1"><Package size={12} /> {delDone}/{delCount} entregables</span>
            </div>
        </div>
    );
}

/* ============ BADGES ============ */
function StatusBadge({ status }: { status: Project['status'] }) {
    const cfg: Record<string, { style: string; label: string }> = {
        not_started: { style: 'bg-zinc-100 text-zinc-600', label: 'Por empezar' },
        in_progress: { style: 'bg-blue-50 text-blue-600', label: 'En curso' },
        completed: { style: 'bg-green-50 text-green-600', label: 'Completado' },
        on_hold: { style: 'bg-orange-50 text-orange-600', label: 'En espera' },
    };
    const c = cfg[status] || cfg.not_started;
    return <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${c.style}`}>{c.label}</span>;
}

function ServiceBadge({ type }: { type?: string }) {
    if (!type) return null;
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-500/10 text-violet-600">{type}</span>;
}

/* ============ PROJECT FORM MODAL ============ */
function ProjectFormModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: Partial<Project>) => Promise<void> }) {
    const [form, setForm] = useState<Partial<Project>>({ title: '', client_name: '', service_type: '', description: '', status: 'not_started', budget: 0, monthly_revenue: 0, tags: [], documents: [], deliverables: [], checklist_data: {}, kpis: {}, notas: '', progress: 0 });
    const [tagInput, setTagInput] = useState('');
    const [loading, setLoading] = useState(false);
    const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));

    const addTag = () => { if (tagInput.trim()) { set('tags', [...(form.tags || []), tagInput.trim()]); setTagInput(''); } };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card w-full max-w-lg rounded-xl p-6 border shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-5">🚀 Nuevo Proyecto</h2>
                <form onSubmit={async e => { e.preventDefault(); if (!form.title) return; setLoading(true); try { await onSubmit(form); } finally { setLoading(false); } }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2"><label className="block text-xs font-medium mb-1">Título del Proyecto *</label><input autoFocus className="w-full p-2 border rounded-md text-sm" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ej: Chatbot IA para Clínica X" /></div>
                        <div><label className="block text-xs font-medium mb-1">Cliente</label><input className="w-full p-2 border rounded-md text-sm" value={form.client_name} onChange={e => set('client_name', e.target.value)} placeholder="Nombre del cliente" /></div>
                        <div><label className="block text-xs font-medium mb-1">Tipo de Servicio</label>
                            <select className="w-full p-2 border rounded-md text-sm" value={form.service_type} onChange={e => set('service_type', e.target.value)}>
                                <option value="">Seleccionar...</option>
                                {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div><label className="block text-xs font-medium mb-1">Descripción</label><textarea className="w-full p-2 border rounded-md text-sm" rows={2} value={form.description} onChange={e => set('description', e.target.value)} /></div>
                    <div className="grid grid-cols-3 gap-3">
                        <div><label className="block text-xs font-medium mb-1">Presupuesto USD</label><input type="number" className="w-full p-2 border rounded-md text-sm" value={form.budget} onChange={e => set('budget', Number(e.target.value))} /></div>
                        <div><label className="block text-xs font-medium mb-1">Revenue Mensual</label><input type="number" className="w-full p-2 border rounded-md text-sm" value={form.monthly_revenue} onChange={e => set('monthly_revenue', Number(e.target.value))} /></div>
                        <div><label className="block text-xs font-medium mb-1">Estado</label>
                            <select className="w-full p-2 border rounded-md text-sm" value={form.status} onChange={e => set('status', e.target.value)}>
                                <option value="not_started">Por empezar</option><option value="in_progress">En curso</option><option value="on_hold">En espera</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-medium mb-1">Fecha Inicio</label><input type="date" className="w-full p-2 border rounded-md text-sm" value={form.start_date || ''} onChange={e => set('start_date', e.target.value)} /></div>
                        <div><label className="block text-xs font-medium mb-1">Fecha Fin</label><input type="date" className="w-full p-2 border rounded-md text-sm" value={form.end_date || ''} onChange={e => set('end_date', e.target.value)} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-medium mb-1">📁 Google Drive URL</label><input className="w-full p-2 border rounded-md text-sm" value={form.drive_folder_url || ''} onChange={e => set('drive_folder_url', e.target.value)} placeholder="https://drive.google.com/..." /></div>
                        <div><label className="block text-xs font-medium mb-1">📋 Notion URL</label><input className="w-full p-2 border rounded-md text-sm" value={form.notion_url || ''} onChange={e => set('notion_url', e.target.value)} placeholder="https://notion.so/..." /></div>
                        <div><label className="block text-xs font-medium mb-1">🔗 Repo URL</label><input className="w-full p-2 border rounded-md text-sm" value={form.repo_url || ''} onChange={e => set('repo_url', e.target.value)} placeholder="https://github.com/..." /></div>
                        <div><label className="block text-xs font-medium mb-1">🎨 Figma URL</label><input className="w-full p-2 border rounded-md text-sm" value={form.figma_url || ''} onChange={e => set('figma_url', e.target.value)} placeholder="https://figma.com/..." /></div>
                    </div>
                    {/* Tags */}
                    <div>
                        <label className="block text-xs font-medium mb-1">Tags</label>
                        <div className="flex gap-2">
                            <input className="flex-1 p-2 border rounded-md text-sm" value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Agregar tag..." onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
                            <button type="button" onClick={addTag} className="px-3 py-2 text-xs bg-muted rounded-md hover:bg-muted/80">+</button>
                        </div>
                        {(form.tags || []).length > 0 && <div className="flex flex-wrap gap-1 mt-2">{(form.tags || []).map((t, i) => <span key={i} className="px-2 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary flex items-center gap-1">{t}<button type="button" onClick={() => set('tags', (form.tags || []).filter((_, j) => j !== i))} className="hover:text-red-500">×</button></span>)}</div>}
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm hover:bg-muted rounded-md">Cancelar</button>
                        <button type="submit" disabled={!form.title || loading} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md disabled:opacity-50">{loading ? 'Creando...' : 'Crear Proyecto'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ============ PROJECT DETAIL SHEET ============ */
type DetailTab = 'general' | 'docs' | 'deliverables' | 'tasks' | 'notes';

function ProjectDetailSheet({ project, onClose, onUpdate, onDelete }: { project: Project; onClose: () => void; onUpdate: (u: Partial<Project>) => void; onDelete: () => void }) {
    const [tab, setTab] = useState<DetailTab>('general');
    const tabs: { id: DetailTab; label: string; icon: React.ReactNode }[] = [
        { id: 'general', label: 'General', icon: <LayoutGrid size={14} /> },
        { id: 'docs', label: 'Documentos', icon: <FileText size={14} /> },
        { id: 'deliverables', label: 'Entregables', icon: <Package size={14} /> },
        { id: 'tasks', label: 'Tareas', icon: <CheckSquare size={14} /> },
        { id: 'notes', label: 'Notas', icon: <StickyNote size={14} /> },
    ];

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={onClose}>
            <div className="bg-card w-full max-w-2xl h-full overflow-y-auto border-l shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="sticky top-0 bg-card border-b z-10 p-4">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <StatusBadge status={project.status} />
                                {project.service_type && <ServiceBadge type={project.service_type} />}
                            </div>
                            <h2 className="text-xl font-bold truncate">{project.title}</h2>
                            {project.client_name && <p className="text-sm text-muted-foreground">👤 {project.client_name}</p>}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={onDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-md" title="Eliminar"><Trash2 size={16} /></button>
                            <button onClick={onClose} className="p-2 hover:bg-muted rounded-md"><X size={18} /></button>
                        </div>
                    </div>
                    {/* Quick Links */}
                    <div className="flex gap-2 mb-3">
                        {project.drive_folder_url && <a href={project.drive_folder_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-blue-500/10 text-blue-600 hover:opacity-80"><Folder size={12} /> Drive</a>}
                        {project.notion_url && <a href={project.notion_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-zinc-500/10 text-zinc-600 hover:opacity-80"><Globe size={12} /> Notion</a>}
                        {project.repo_url && <a href={project.repo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-zinc-800/10 text-zinc-700 hover:opacity-80"><ExternalLink size={12} /> Repo</a>}
                        {project.figma_url && <a href={project.figma_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-purple-500/10 text-purple-600 hover:opacity-80"><LayoutGrid size={12} /> Figma</a>}
                    </div>
                    {/* Tabs */}
                    <div className="flex gap-1">
                        {tabs.map(t => (
                            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${tab === t.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>{t.icon}{t.label}</button>
                        ))}
                    </div>
                </div>

                <div className="p-4">
                    {tab === 'general' && <GeneralTab project={project} onUpdate={onUpdate} />}
                    {tab === 'docs' && <DocumentsTab project={project} onUpdate={onUpdate} />}
                    {tab === 'deliverables' && <DeliverablesTab project={project} onUpdate={onUpdate} />}
                    {tab === 'tasks' && <TasksTab project={project} onUpdate={onUpdate} />}
                    {tab === 'notes' && <NotesTab project={project} onUpdate={onUpdate} />}
                </div>
            </div>
        </div>
    );
}

/* ============ GENERAL TAB ============ */
function GeneralTab({ project, onUpdate }: { project: Project; onUpdate: (u: Partial<Project>) => void }) {
    const set = (k: string, v: unknown) => onUpdate({ [k]: v });
    return (
        <div className="space-y-4">
            {/* Progress */}
            <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-2"><span className="font-medium">Progreso General</span><span className="font-bold">{project.progress || 0}%</span></div>
                <input type="range" min={0} max={100} step={5} value={project.progress || 0} onChange={e => set('progress', Number(e.target.value))} className="w-full h-2 accent-primary" />
            </div>
            {/* Status + Service */}
            <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium mb-1">Estado</label>
                    <select className="w-full p-2 border rounded-md text-sm" value={project.status} onChange={e => set('status', e.target.value)}>
                        <option value="not_started">Por empezar</option><option value="in_progress">En curso</option><option value="on_hold">En espera</option><option value="completed">Completado</option>
                    </select>
                </div>
                <div><label className="block text-xs font-medium mb-1">Tipo de Servicio</label>
                    <select className="w-full p-2 border rounded-md text-sm" value={project.service_type || ''} onChange={e => set('service_type', e.target.value)}>
                        <option value="">-</option>{SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>
            {/* Client Info */}
            <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium mb-1">👤 Cliente</label><input className="w-full p-2 border rounded-md text-sm" value={project.client_name || ''} onBlur={e => set('client_name', e.target.value)} defaultValue={project.client_name || ''} /></div>
                <div><label className="block text-xs font-medium mb-1">📧 Email</label><input type="email" className="w-full p-2 border rounded-md text-sm" defaultValue={project.contact_email || ''} onBlur={e => set('contact_email', e.target.value)} /></div>
                <div><label className="block text-xs font-medium mb-1">📱 Teléfono</label><input className="w-full p-2 border rounded-md text-sm" defaultValue={project.contact_phone || ''} onBlur={e => set('contact_phone', e.target.value)} /></div>
                <div><label className="block text-xs font-medium mb-1">📝 Descripción</label><input className="w-full p-2 border rounded-md text-sm" defaultValue={project.description || ''} onBlur={e => set('description', e.target.value)} /></div>
            </div>
            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium mb-1">📅 Inicio</label><input type="date" className="w-full p-2 border rounded-md text-sm" defaultValue={project.start_date || ''} onBlur={e => set('start_date', e.target.value)} /></div>
                <div><label className="block text-xs font-medium mb-1">📅 Fin</label><input type="date" className="w-full p-2 border rounded-md text-sm" defaultValue={project.end_date || ''} onBlur={e => set('end_date', e.target.value)} /></div>
            </div>
            {/* Budget */}
            <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium mb-1">💰 Presupuesto USD</label><input type="number" className="w-full p-2 border rounded-md text-sm" defaultValue={project.budget || 0} onBlur={e => set('budget', Number(e.target.value))} /></div>
                <div><label className="block text-xs font-medium mb-1">📈 Revenue Mensual USD</label><input type="number" className="w-full p-2 border rounded-md text-sm" defaultValue={project.monthly_revenue || 0} onBlur={e => set('monthly_revenue', Number(e.target.value))} /></div>
            </div>
            {/* Quick Links Editable */}
            <div className="space-y-2">
                <h4 className="text-xs font-medium">🔗 Links Rápidos</h4>
                <div className="grid grid-cols-2 gap-2">
                    <input className="p-2 border rounded-md text-xs" placeholder="Google Drive URL" defaultValue={project.drive_folder_url || ''} onBlur={e => set('drive_folder_url', e.target.value)} />
                    <input className="p-2 border rounded-md text-xs" placeholder="Notion URL" defaultValue={project.notion_url || ''} onBlur={e => set('notion_url', e.target.value)} />
                    <input className="p-2 border rounded-md text-xs" placeholder="Repo URL" defaultValue={project.repo_url || ''} onBlur={e => set('repo_url', e.target.value)} />
                    <input className="p-2 border rounded-md text-xs" placeholder="Figma URL" defaultValue={project.figma_url || ''} onBlur={e => set('figma_url', e.target.value)} />
                </div>
            </div>
            {/* Tags */}
            <TagsEditor tags={project.tags || []} onChange={tags => set('tags', tags)} />
        </div>
    );
}

/* ============ TAGS EDITOR ============ */
function TagsEditor({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
    const [input, setInput] = useState('');
    const add = () => { if (input.trim()) { onChange([...tags, input.trim()]); setInput(''); } };
    return (
        <div>
            <label className="block text-xs font-medium mb-1">🏷️ Tags</label>
            <div className="flex gap-2 mb-2">
                <input className="flex-1 p-2 border rounded-md text-xs" value={input} onChange={e => setInput(e.target.value)} placeholder="Agregar tag..." onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
                <button type="button" onClick={add} className="px-3 py-1 text-xs bg-muted rounded-md">+</button>
            </div>
            <div className="flex flex-wrap gap-1">
                {tags.map((t, i) => <span key={i} className="px-2 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary flex items-center gap-1">{t}<button onClick={() => onChange(tags.filter((_, j) => j !== i))} className="hover:text-red-500 ml-0.5">×</button></span>)}
            </div>
        </div>
    );
}

/* ============ DOCUMENTS TAB ============ */
function DocumentsTab({ project, onUpdate }: { project: Project; onUpdate: (u: Partial<Project>) => void }) {
    const docs = project.documents || [];
    const [isAdding, setIsAdding] = useState(false);
    const [newDoc, setNewDoc] = useState<Partial<ProjectDocument>>({ label: '', url: '', category: 'otro' });

    const add = () => {
        if (!newDoc.label || !newDoc.url) return;
        const doc: ProjectDocument = { id: crypto.randomUUID(), label: newDoc.label, url: newDoc.url, category: newDoc.category as any };
        onUpdate({ documents: [...docs, doc] });
        setNewDoc({ label: '', url: '', category: 'otro' });
        setIsAdding(false);
    };

    const remove = (id: string) => onUpdate({ documents: docs.filter(d => d.id !== id) });

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold">📂 Documentos del Proyecto</h3>
                <button onClick={() => setIsAdding(!isAdding)} className="btn btn-sm btn-outline text-xs"><Plus size={14} /> Agregar</button>
            </div>
            {isAdding && (
                <div className="bg-muted/30 p-3 rounded-md mb-4 border space-y-2">
                    <input className="w-full p-2 border rounded text-xs" placeholder="Nombre (ej: Contrato Firmado)" value={newDoc.label} onChange={e => setNewDoc({ ...newDoc, label: e.target.value })} />
                    <input className="w-full p-2 border rounded text-xs" placeholder="URL (https://...)" value={newDoc.url} onChange={e => setNewDoc({ ...newDoc, url: e.target.value })} />
                    <div className="flex gap-2">
                        <select className="p-2 border rounded text-xs flex-1" value={newDoc.category} onChange={e => setNewDoc({ ...newDoc, category: e.target.value as any })}>
                            {DOC_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                        <button onClick={add} className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs">Guardar</button>
                    </div>
                </div>
            )}
            <div className="space-y-2">
                {docs.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No hay documentos adjuntos.</p>}
                {docs.map(doc => {
                    const cat = DOC_CATEGORIES.find(c => c.value === doc.category) || DOC_CATEGORIES[5];
                    return (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-card border rounded-lg hover:shadow-sm transition-all group">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`p-2 rounded-md ${cat.color}`}><FileText size={16} /></div>
                                <div className="min-w-0">
                                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline truncate block">{doc.label}</a>
                                    <span className="text-[10px] text-muted-foreground">{cat.label}</span>
                                </div>
                            </div>
                            <button onClick={() => remove(doc.id)} className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ============ DELIVERABLES TAB ============ */
function DeliverablesTab({ project, onUpdate }: { project: Project; onUpdate: (u: Partial<Project>) => void }) {
    const dels = project.deliverables || [];
    const [isAdding, setIsAdding] = useState(false);
    const [newDel, setNewDel] = useState('');

    const add = () => {
        if (!newDel.trim()) return;
        const del: ProjectDeliverable = { id: crypto.randomUUID(), title: newDel, status: 'pending' };
        onUpdate({ deliverables: [...dels, del] });
        setNewDel('');
        setIsAdding(false);
    };

    const updateAuth = (id: string, u: Partial<ProjectDeliverable>) => {
        onUpdate({ deliverables: dels.map(d => d.id === id ? { ...d, ...u } : d) });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold">📦 Entregables</h3>
                <button onClick={() => setIsAdding(!isAdding)} className="btn btn-sm btn-outline text-xs"><Plus size={14} /> Agregar</button>
            </div>
            {isAdding && (
                <div className="flex gap-2 mb-4">
                    <input className="flex-1 p-2 border rounded text-xs" placeholder="Nuevo entregable..." value={newDel} onChange={e => setNewDel(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} />
                    <button onClick={add} className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs">Guardar</button>
                </div>
            )}
            <div className="space-y-2">
                {dels.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No hay entregables definidos.</p>}
                {dels.map(del => {
                    const status = DELIVERABLE_STATUSES.find(s => s.value === del.status) || DELIVERABLE_STATUSES[0];
                    return (
                        <div key={del.id} className="p-3 bg-card border rounded-lg hover:shadow-sm transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <input className="font-medium text-sm bg-transparent border-none p-0 focus:ring-0 w-full" value={del.title} onChange={e => updateAuth(del.id, { title: e.target.value })} />
                                <button onClick={() => onUpdate({ deliverables: dels.filter(d => d.id !== del.id) })} className="text-muted-foreground hover:text-red-500"><Trash2 size={14} /></button>
                            </div>
                            <div className="flex gap-2 items-center">
                                <select className={`text-[10px] font-medium px-2 py-1 rounded-md border-none ${status.color}`} value={del.status} onChange={e => updateAuth(del.id, { status: e.target.value as any })}>
                                    {DELIVERABLE_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                </select>
                                <input className="text-xs border-b border-transparent hover:border-border transition-colors bg-transparent flex-1" placeholder="URL del entregable..." value={del.url || ''} onChange={e => updateAuth(del.id, { url: e.target.value })} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ============ TASKS TAB ============ */
function TasksTab({ project, onUpdate }: { project: Project; onUpdate: (u: Partial<Project>) => void }) {
    const [phase, setPhase] = useState(PROJECT_PHASES[0]);
    const data = project.checklist_data || {};
    const items = data[phase] || [];

    const updateItems = (newItems: ChecklistItem[]) => onUpdate({ checklist_data: { ...data, [phase]: newItems } });

    // Initialize if empty
    useEffect(() => {
        if (items.length === 0 && PHASE_TASKS[phase]) {
            const initial = PHASE_TASKS[phase].map((text, i) => ({ id: `${phase}-${i}-${Date.now()}`, text, completed: false }));
            updateItems(initial);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    const progress = items.length > 0 ? Math.round((items.filter(i => i.completed).length / items.length) * 100) : 0;

    return (
        <div>
            <div className="flex gap-1 overflow-x-auto pb-2 mb-4 border-b">
                {PROJECT_PHASES.map(p => (
                    <button key={p} onClick={() => setPhase(p)} className={`px-3 py-1.5 text-xs whitespace-nowrap rounded-md transition-colors ${phase === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>{p}</button>
                ))}
            </div>

            <div className="flex items-center gap-3 mb-4 bg-muted/20 p-3 rounded-lg border">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden"><div className="bg-primary h-full transition-all" style={{ width: `${progress}%` }} /></div>
                <span className="text-xs font-medium w-8 text-right">{progress}%</span>
            </div>

            <div className="space-y-1">
                {items.map(item => (
                    <div key={item.id} className="flex items-start gap-2 group hover:bg-muted/30 p-2 rounded-md transition-colors">
                        <input type="checkbox" checked={item.completed} onChange={() => updateItems(items.map(i => i.id === item.id ? { ...i, completed: !i.completed } : i))} className="mt-1" />
                        <div className="flex-1 min-w-0">
                            <input className={`w-full bg-transparent text-sm border-none p-0 focus:ring-0 ${item.completed ? 'text-muted-foreground line-through' : ''}`} value={item.text} onChange={e => updateItems(items.map(i => i.id === item.id ? { ...i, text: e.target.value } : i))} />
                            <div className="flex items-center gap-2 mt-1">
                                {item.link ? (
                                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:align-baseline flex items-center gap-1"><Link2 size={10} /> {item.linkLabel || 'Link'}</a>
                                ) : (
                                    <button onClick={() => { const url = prompt('URL:'); if (url) updateItems(items.map(i => i.id === item.id ? { ...i, link: url, linkLabel: 'Recurso' } : i)); }} className="text-[10px] text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">+ Link</button>
                                )}
                            </div>
                        </div>
                        <button onClick={() => updateItems(items.filter(i => i.id !== item.id))} className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100"><X size={14} /></button>
                    </div>
                ))}
            </div>
            <button onClick={() => updateItems([...items, { id: crypto.randomUUID(), text: 'Nueva tarea', completed: false }])} className="mt-4 text-xs text-primary hover:underline flex items-center gap-1"><Plus size={12} /> Agregar tarea</button>
        </div>
    );
}

/* ============ NOTES TAB ============ */
function NotesTab({ project, onUpdate }: { project: Project; onUpdate: (u: Partial<Project>) => void }) {
    return (
        <div className="h-full flex flex-col">
            <h3 className="text-sm font-bold mb-2">📝 Notas del Proyecto</h3>
            <textarea className="flex-1 w-full p-4 border rounded-lg bg-yellow-50/50 text-sm leading-relaxed resize-none focus:ring-primary focus:border-primary" placeholder="Escribe notas, minutas de reuniones, ideas..." value={project.notas || ''} onChange={e => onUpdate({ notas: e.target.value })} />
        </div>
    );
}

