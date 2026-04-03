'use client';

import { useState, useEffect } from 'react';
import { useLeads } from '@/lib/hooks';
import { PIPELINE_STAGES, type Lead, type NivelInteres, type PotencialVenta, type Fuente, type ChecklistItem, STAGE_TASKS } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, X, Phone, Globe, Instagram, MessageCircle,
    MapPin, User, Building2, Mail, FileText, Video, Link2, Calendar, Tag, Trash2,
    DollarSign, Clock, CheckCircle2, MoreVertical, Edit2, Save
} from 'lucide-react';

export default function PipelinePage() {
    const { leads, create, update, move, remove, markFollowUp } = useLeads();
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [dragId, setDragId] = useState<string | null>(null);
    const [dragOverStage, setDragOverStage] = useState<string | null>(null);
    const [filterInteres, setFilterInteres] = useState<string>('all');
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const filteredLeads = leads.filter(l => {
        const matchSearch = !search || l.business_name.toLowerCase().includes(search.toLowerCase()) ||
            (l.owner_name && l.owner_name.toLowerCase().includes(search.toLowerCase())) ||
            (l.rubro && l.rubro.toLowerCase().includes(search.toLowerCase()));
        const matchInteres = filterInteres === 'all' || l.nivel_interes === filterInteres;
        return matchSearch && matchInteres;
    });

    const handleWhatsApp = (lead: Lead) => {
        const phone = lead.owner_phone || lead.business_phone;
        if (!phone) return;
        markFollowUp(lead.id);
        const cleanPhone = phone.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
    };

    const handleDragStart = (leadId: string) => setDragId(leadId);
    const handleDragOver = (e: React.DragEvent, stageId: string) => {
        e.preventDefault();
        setDragOverStage(stageId);
    };
    const handleDrop = (stageId: string) => {
        if (dragId) {
            const lead = leads.find(l => l.id === dragId);
            if (lead && lead.estado_actual !== stageId) {
                move(dragId, stageId, lead.estado_actual);
            }
        }
        setDragId(null);
        setDragOverStage(null);
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 font-sans text-slate-800">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                            CRM Pipeline
                        </h1>
                        <p className="text-sm text-slate-500 font-medium mt-1">
                            {leads.length} leads activos · {leads.filter(l => l.estado_actual === 'ganado').length} ganados
                        </p>
                    </div>

                    {/* Button moved to the LEFT as requested */}
                    <button
                        onClick={() => setShowForm(true)}
                        className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl shadow-lg shadow-violet-200 hover:shadow-xl hover:bg-violet-700 hover:-translate-y-0.5 transition-all text-sm font-bold"
                    >
                        <Plus className="w-5 h-5" /> Nuevo Lead
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar leads..."
                            className="pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all w-64 text-sm"
                        />
                    </div>

                    <select
                        value={filterInteres}
                        onChange={e => setFilterInteres(e.target.value)}
                        className="px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
                    >
                        <option value="all">🔥 Todos</option>
                        <option value="caliente">🟢 Calientes</option>
                        <option value="tibio">🟡 Tibios</option>
                        <option value="frio">🔵 Fríos</option>
                    </select>
                </div>
            </header>

            <div className="overflow-x-auto pb-4 h-[calc(100vh-140px)]">
                <div className="flex gap-4 min-w-max pb-4 h-full">
                    {PIPELINE_STAGES.map(stage => {
                        const stageLeads = filteredLeads.filter(l => l.estado_actual === stage.id);
                        const isOver = dragOverStage === stage.id;

                        return (
                            <div
                                key={stage.id}
                                onDragOver={e => handleDragOver(e, stage.id)}
                                onDragLeave={() => setDragOverStage(null)}
                                onDrop={() => handleDrop(stage.id)}
                                className={`
                                    w-[320px] flex flex-col rounded-2xl p-3 h-full transition-colors duration-200
                                    ${isOver ? 'bg-violet-50/80 border-violet-200' : 'bg-slate-100/50 border border-transparent'}
                                `}
                            >
                                <div className="flex items-center justify-between mb-4 px-1 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-2.5 h-2.5 rounded-full shadow-sm"
                                            style={{ background: stage.color }}
                                        />
                                        <span className="font-bold text-sm text-slate-700">{stage.label}</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full shadow-sm border border-slate-100">
                                        {stageLeads.length}
                                    </span>
                                </div>

                                {/* Inline Quick Add - The Easiest Way to Load a Lead */}
                                {stage.id === 'nuevo_lead' && (
                                    <div className="mb-3">
                                        <div className="bg-white p-3 rounded-xl shadow-sm border border-violet-100 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all flex items-center gap-2">
                                            <Plus className="w-4 h-4 text-violet-400" />
                                            <input
                                                placeholder="Agregar lead rápido..."
                                                className="w-full text-sm outline-none placeholder:text-slate-400 font-medium text-slate-700"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        const target = e.target as HTMLInputElement;
                                                        if (target.value.trim()) {
                                                            create({ business_name: target.value.trim(), estado_actual: 'nuevo_lead' });
                                                            target.value = '';
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                    <AnimatePresence mode='popLayout'>
                                        {stageLeads.map(lead => (
                                            <LeadCard
                                                key={lead.id}
                                                lead={lead}
                                                onDragStart={() => handleDragStart(lead.id)}
                                                onClick={() => setSelectedLead(lead)}
                                                onWhatsApp={() => handleWhatsApp(lead)}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowQuickAdd(true)}
                className="fixed bottom-8 right-8 md:hidden w-14 h-14 bg-violet-600 text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:bg-violet-700 transition-colors"
            >
                <Plus className="w-6 h-6" />
            </motion.button>

            {showQuickAdd && (
                <QuickAddModal
                    onClose={() => setShowQuickAdd(false)}
                    onCreate={create}
                />
            )}

            {showForm && (
                <LeadFormModal
                    onClose={() => setShowForm(false)}
                    onCreate={create}
                />
            )}

            {selectedLead && (
                <LeadDetailSheet
                    lead={selectedLead}
                    onClose={() => setSelectedLead(null)}
                    onUpdate={(updates: Partial<Lead>) => {
                        update(selectedLead.id, updates);
                        setSelectedLead(prev => prev ? { ...prev, ...updates } : null);
                    }}
                    onDelete={() => {
                        remove(selectedLead.id);
                        setSelectedLead(null);
                    }}
                    onWhatsApp={() => handleWhatsApp(selectedLead)}
                />
            )}
        </div>
    );
}

function LeadCard({ lead, onDragStart, onClick, onWhatsApp }: any) {
    const urgencyColor = lead.dias_sin_contacto >= 7 ? 'bg-red-50 text-red-600 border-red-100' : lead.dias_sin_contacto >= 3 ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-transparent text-slate-400 border-transparent';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            draggable
            onDragStart={onDragStart}
            onClick={onClick}
            className="group bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-violet-200 transition-all cursor-grab active:cursor-grabbing relative overflow-hidden"
        >
            <div className={`absolute top-0 right-0 w-1 h-full bg-slate-200 transition-colors group-hover:bg-violet-500`} />

            <div className="flex justify-between items-start mb-2 pr-2">
                <h3 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2">{lead.business_name}</h3>
                {lead.nivel_interes === 'caliente' && <div className="w-2 h-2 rounded-full bg-green-500 ring-2 ring-green-100" />}
            </div>

            <div className="space-y-1.5 mb-3">
                {lead.owner_name && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <User className="w-3 h-3" /> {lead.owner_name}
                    </div>
                )}
                {(lead.rubro || lead.ciudad) && (
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                        {lead.rubro && <span>{lead.rubro}</span>}
                        {lead.ciudad && <span>• {lead.ciudad}</span>}
                    </div>
                )}
                {lead.monto_propuesta > 0 && (
                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 w-fit px-1.5 py-0.5 rounded">
                        <DollarSign className="w-3 h-3" />
                        {lead.monto_propuesta.toLocaleString()}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                <div className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${urgencyColor}`}>
                    <Clock className="w-3 h-3" />
                    {lead.dias_sin_contacto}d
                </div>

                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={onWhatsApp}
                        className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="WhatsApp"
                    >
                        <MessageCircle className="w-4 h-4" />
                    </button>
                    {lead.instagram && (
                        <button
                            onClick={() => window.open(`https://instagram.com/${lead.instagram.replace('@', '')}`, '_blank')}
                            className="p-1.5 text-slate-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                            title="Instagram"
                        >
                            <Instagram className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

function QuickAddModal({ onClose, onCreate }: any) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        setLoading(true);
        try {
            await onCreate({ business_name: name, owner_phone: phone, estado_actual: 'nuevo_lead' });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-900">Nuevo Lead Rápido</h2>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Nombre Negocio</label>
                        <input
                            value={name} onChange={e => setName(e.target.value)}
                            className="w-full mt-1 p-3 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 outline-none"
                            placeholder="Ej. Tienda Ejemplo"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">WhatsApp (Opcional)</label>
                        <input
                            value={phone} onChange={e => setPhone(e.target.value)}
                            className="w-full mt-1 p-3 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 outline-none"
                            placeholder="+54..."
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !name}
                        className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors flex justify-center"
                    >
                        {loading ? 'Guardando...' : 'Crear Lead'}
                    </button>
                </form>
            </motion.div>
        </div>
    )
}

function LeadFormModal({ onClose, onCreate }: any) {
    const [form, setForm] = useState<Partial<Lead>>({
        business_name: '',
        owner_name: '',
        owner_phone: '',
        rubro: '',
        ciudad: '',
        instagram: '',
        email: '',
        estado_actual: 'nuevo_lead',
        notas: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreate(form);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl relative my-8"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full text-slate-400">
                    <X className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Nuevo Lead Completo</h2>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre del Negocio *</label>
                        <input
                            required
                            value={form.business_name}
                            onChange={e => setForm({ ...form, business_name: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 outline-none"
                            placeholder="Ej. Constructora SRL"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre Dueño</label>
                        <input
                            value={form.owner_name}
                            onChange={e => setForm({ ...form, owner_name: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 outline-none"
                            placeholder="Ej. Juan Pérez"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                        <input
                            value={form.owner_phone}
                            onChange={e => setForm({ ...form, owner_phone: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 outline-none"
                            placeholder="+54 9 11..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Rubro</label>
                        <input
                            value={form.rubro}
                            onChange={e => setForm({ ...form, rubro: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 outline-none"
                            placeholder="Ej. Construcción"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Ciudad</label>
                        <input
                            value={form.ciudad}
                            onChange={e => setForm({ ...form, ciudad: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 outline-none"
                            placeholder="Ej. Buenos Aires"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Instagram</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">@</span>
                            <input
                                value={form.instagram?.replace('@', '')}
                                onChange={e => setForm({ ...form, instagram: '@' + e.target.value })}
                                className="w-full pl-8 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 outline-none"
                                placeholder="usuario"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 outline-none"
                            placeholder="correo@ejemplo.com"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Notas Iniciales</label>
                        <textarea
                            value={form.notas}
                            onChange={e => setForm({ ...form, notas: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 outline-none min-h-[100px]"
                            placeholder="Detalles importantes..."
                        />
                    </div>

                    <div className="col-span-2 pt-4 border-t border-slate-100 flex gap-4">
                        <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl transition-colors">Cancelar</button>
                        <button
                            type="submit"
                            className="flex-1 py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200"
                        >
                            Crear Lead
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

function LeadDetailSheet({ lead, onClose, onUpdate, onDelete, onWhatsApp }: any) {
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Lead>>(lead);

    useEffect(() => { setEditForm(lead); }, [lead]);

    const handleSave = () => {
        onUpdate(editForm);
        setIsEditing(false);
    };

    return (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-50 flex justify-end" onClick={onClose}>
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                    <div className="flex-1 pr-4">
                        {isEditing ? (
                            <input
                                value={editForm.business_name}
                                onChange={e => setEditForm({ ...editForm, business_name: e.target.value })}
                                className="text-2xl font-extrabold text-slate-900 bg-white border border-slate-200 rounded px-2 w-full mb-1"
                            />
                        ) : (
                            <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">{lead.business_name}</h2>
                        )}

                        {isEditing ? (
                            <input
                                value={editForm.rubro}
                                onChange={e => setEditForm({ ...editForm, rubro: e.target.value })}
                                className="text-sm text-slate-500 font-medium bg-white border border-slate-200 rounded px-2 w-full mt-1"
                                placeholder="Rubro"
                            />
                        ) : (
                            <span className="text-sm text-slate-500 font-medium">{lead.rubro || 'Sin rubro'}</span>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Actions Toolbar */}
                <div className="px-6 py-4 grid grid-cols-2 gap-3 border-b border-slate-100">
                    <button onClick={onWhatsApp} className="flex items-center justify-center gap-2 py-2.5 bg-green-50 text-green-700 font-bold rounded-xl hover:bg-green-100 transition-colors text-sm">
                        <MessageCircle className="w-4 h-4" /> Enviar WhatsApp
                    </button>
                    <button
                        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                        className={`flex items-center justify-center gap-2 py-2.5 font-bold rounded-xl transition-colors text-sm ${isEditing ? 'bg-violet-600 text-white hover:bg-violet-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                        {isEditing ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                        {isEditing ? 'Guardar' : 'Editar'}
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Status & Value */}
                    <section className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Estado</label>
                            <select
                                value={lead.estado_actual}
                                onChange={e => onUpdate({ estado_actual: e.target.value })}
                                className="w-full bg-white text-sm font-semibold text-slate-700 p-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-violet-500/20"
                            >
                                {PIPELINE_STAGES.map(s => (
                                    <option key={s.id} value={s.id}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Valor Propuesta</label>
                            <div className="relative">
                                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    type="number"
                                    value={editForm.monto_propuesta || ''}
                                    onChange={e => {
                                        const val = Number(e.target.value);
                                        setEditForm({ ...editForm, monto_propuesta: val });
                                        if (!isEditing) onUpdate({ monto_propuesta: val });
                                    }}
                                    className="w-full pl-7 p-2 bg-white text-sm font-semibold text-slate-700 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-violet-500/20"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Contact Info */}
                    <section>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <User className="w-3 h-3" /> Contacto
                        </h3>
                        <div className="space-y-3 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <User className="w-4 h-4 text-slate-400 shrink-0" />
                                {isEditing ? (
                                    <input
                                        value={editForm.owner_name}
                                        onChange={e => setEditForm({ ...editForm, owner_name: e.target.value })}
                                        className="text-sm text-slate-700 border-b border-slate-200 w-full focus:outline-none focus:border-violet-500"
                                        placeholder="Nombre Dueño"
                                    />
                                ) : (
                                    <span className="text-sm text-slate-700">{lead.owner_name || 'Sin nombre'}</span>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                                {isEditing ? (
                                    <input
                                        value={editForm.owner_phone}
                                        onChange={e => setEditForm({ ...editForm, owner_phone: e.target.value })}
                                        className="text-sm text-slate-700 border-b border-slate-200 w-full focus:outline-none focus:border-violet-500"
                                        placeholder="Teléfono"
                                    />
                                ) : (
                                    <span className="text-sm text-slate-700 font-mono">{lead.owner_phone || 'Sin teléfono'}</span>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <Instagram className="w-4 h-4 text-slate-400 shrink-0" />
                                {isEditing ? (
                                    <input
                                        value={editForm.instagram}
                                        onChange={e => setEditForm({ ...editForm, instagram: e.target.value })}
                                        className="text-sm text-slate-700 border-b border-slate-200 w-full focus:outline-none focus:border-violet-500"
                                        placeholder="@usuario"
                                    />
                                ) : (
                                    <span className="text-sm text-blue-600 cursor-pointer hover:underline" onClick={() => lead.instagram && window.open(`https://instagram.com/${lead.instagram.replace('@', '')}`, '_blank')}>
                                        {lead.instagram || 'Sin Instagram'}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                {isEditing ? (
                                    <input
                                        value={editForm.ciudad}
                                        onChange={e => setEditForm({ ...editForm, ciudad: e.target.value })}
                                        className="text-sm text-slate-700 border-b border-slate-200 w-full focus:outline-none focus:border-violet-500"
                                        placeholder="Ciudad"
                                    />
                                ) : (
                                    <span className="text-sm text-slate-700">{lead.ciudad || 'Sin ciudad'}</span>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Notes */}
                    <section>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <FileText className="w-3 h-3" /> Notas
                        </h3>
                        <textarea
                            value={editForm.notas || ''}
                            onChange={e => {
                                setEditForm({ ...editForm, notas: e.target.value });
                                if (!isEditing) onUpdate({ notas: e.target.value });
                            }}
                            className="w-full h-32 p-4 bg-yellow-50/50 border border-yellow-100 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-yellow-400/20 outline-none resize-none leading-relaxed"
                            placeholder="Escribe notas, observaciones, o detalles de la última llamada..."
                        />
                    </section>

                    {/* Delete Zone */}
                    <div className="pt-8 mt-8 border-t border-slate-100">
                        <button
                            onClick={() => {
                                if (confirm('¿Seguro que quieres eliminar este lead? No se puede deshacer.')) onDelete();
                            }}
                            className="w-full py-3 text-red-500 font-medium hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                            <Trash2 className="w-4 h-4" /> Eliminar Lead
                        </button>
                    </div>

                </div>
            </motion.div>
        </div>
    );
}
