'use client';

import { useState } from 'react';
import { useProjects } from '@/lib/hooks';
import type { Project } from '@/lib/types';
import { Plus, Search, Calendar, DollarSign, Folder, ExternalLink, MoreHorizontal, LayoutGrid, List } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ProjectsPage() {
    const { projects, create, update, remove, loading } = useProjects();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);

    const filteredProjects = projects.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="p-8 text-muted-foreground">Cargando proyectos...</div>;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">🚀 Proyectos</h1>
                    <p className="text-muted-foreground">
                        {projects.length} proyectos activos
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar proyecto..."
                            className="pl-9 pr-4 py-2 border rounded-lg bg-background w-64"
                        />
                    </div>
                    <div className="flex border rounded-lg overflow-hidden">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                        >
                            <LayoutGrid size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                        >
                            <List size={20} />
                        </button>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Plus size={18} /> Nuevo Proyecto
                    </button>
                </div>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map(project => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                    {filteredProjects.length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                            <Folder className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No hay proyectos que coincidan con tu búsqueda</p>
                        </div>
                    )}
                </div>
            ) : (
                /* List View - Placeholder for now */
                <div className="bg-card rounded-xl border p-4">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-sm text-muted-foreground border-b">
                                <th className="pb-3 pl-4">Proyecto</th>
                                <th className="pb-3">Status</th>
                                <th className="pb-3">Fecha Inicio</th>
                                <th className="pb-3">Presupuesto</th>
                                <th className="pb-3">Links</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProjects.map(project => (
                                <tr key={project.id} className="border-b last:border-0 hover:bg-muted/50">
                                    <td className="py-4 pl-4 font-medium">{project.title}</td>
                                    <td className="py-4">
                                        <StatusBadge status={project.status} />
                                    </td>
                                    <td className="py-4 text-sm text-muted-foreground">
                                        {project.start_date ? format(new Date(project.start_date), 'dd MMM yyyy', { locale: es }) : '-'}
                                    </td>
                                    <td className="py-4 text-sm">
                                        {project.budget ? `$${project.budget.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="py-4 flex gap-2">
                                        {project.drive_folder_url && <a href={project.drive_folder_url} target="_blank" className="text-blue-500 hover:underline"><Folder size={16} /></a>}
                                        {project.figma_url && <a href={project.figma_url} target="_blank" className="text-purple-500 hover:underline"><LayoutGrid size={16} /></a>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showForm && (
                <ProjectFormModal
                    onClose={() => setShowForm(false)}
                    onSubmit={async (data) => {
                        await create(data);
                        setShowForm(false);
                    }}
                />
            )}
        </div>
    );
}

function ProjectCard({ project }: { project: Project }) {
    return (
        <div className="bg-card border rounded-xl p-5 hover:shadow-lg transition-all hover:border-primary/50 group">
            <div className="flex justify-between items-start mb-4">
                <StatusBadge status={project.status} />
                <button className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal size={20} />
                </button>
            </div>

            <h3 className="text-xl font-bold mb-2 line-clamp-1">{project.title}</h3>
            <p className="text-muted-foreground text-sm mb-4 line-clamp-2 min-h-[40px]">
                {project.description || 'Sin descripción'}
            </p>

            <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar size={14} />
                    <span>
                        {project.start_date ? format(new Date(project.start_date), 'dd MMM', { locale: es }) : 'Sin fecha'}
                        {project.end_date && ` - ${format(new Date(project.end_date), 'dd MMM', { locale: es })}`}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign size={14} />
                    <span>{project.budget ? `USD ${project.budget.toLocaleString()}` : 'Sin presupuesto'}</span>
                </div>
            </div>

            <div className="flex gap-2 border-t pt-4 mt-auto">
                <ResourceLink href={project.drive_folder_url} icon={<Folder size={14} />} label="Drive" color="text-blue-500 bg-blue-500/10" />
                <ResourceLink href={project.figma_url} icon={<LayoutGrid size={14} />} label="Figma" color="text-purple-500 bg-purple-500/10" />
                <ResourceLink href={project.repo_url} icon={<ExternalLink size={14} />} label="Repo" color="text-zinc-500 bg-zinc-500/10" />
            </div>
        </div>
    );
}

function ResourceLink({ href, icon, label, color }: { href?: string, icon: React.ReactNode, label: string, color: string }) {
    if (!href) return null;
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium hover:opacity-80 transition-opacity ${color}`}
        >
            {icon} {label}
        </a>
    );
}

function StatusBadge({ status }: { status: Project['status'] }) {
    const styles = {
        not_started: 'bg-zinc-100 text-zinc-600 border-zinc-200',
        in_progress: 'bg-blue-50 text-blue-600 border-blue-200',
        completed: 'bg-green-50 text-green-600 border-green-200',
        on_hold: 'bg-orange-50 text-orange-600 border-orange-200',
    };

    const labels = {
        not_started: 'Por empezar',
        in_progress: 'En curso',
        completed: 'Completado',
        on_hold: 'En espera',
    };

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
            {labels[status]}
        </span>
    );
}

function ProjectFormModal({ onClose, onSubmit }: { onClose: () => void, onSubmit: (data: Partial<Project>) => Promise<void> }) {
    const [form, setForm] = useState<Partial<Project>>({
        title: '',
        description: '',
        status: 'not_started',
        budget: 0,
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title) return;
        setLoading(true);
        try {
            await onSubmit(form);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card w-full max-w-md rounded-xl p-6 border shadow-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">Nuevo Proyecto</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Título</label>
                        <input
                            autoFocus
                            className="w-full p-2 border rounded-md"
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            placeholder="Ej: Rediseño Web Cliente X"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Descripción</label>
                        <textarea
                            className="w-full p-2 border rounded-md"
                            rows={3}
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Presupuesto (USD)</label>
                            <input
                                type="number"
                                className="w-full p-2 border rounded-md"
                                value={form.budget}
                                onChange={e => setForm({ ...form, budget: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Estado Inicial</label>
                            <select
                                className="w-full p-2 border rounded-md"
                                value={form.status}
                                onChange={e => setForm({ ...form, status: e.target.value as Project['status'] })}
                            >
                                <option value="not_started">Por empezar</option>
                                <option value="in_progress">En curso</option>
                                <option value="on_hold">En espera</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm hover:bg-muted rounded-md">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!form.title || loading}
                            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md disabled:opacity-50"
                        >
                            {loading ? 'Creando...' : 'Crear Proyecto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
