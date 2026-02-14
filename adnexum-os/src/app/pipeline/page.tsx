'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLeads } from '@/lib/hooks';
import { PIPELINE_STAGES, type Lead, type NivelInteres, type PotencialVenta, type Fuente, STAGE_TASKS } from '@/lib/types';
import {
    Plus, Search, X, Phone, Globe, Instagram, MessageCircle,
    ChevronRight, Clock, DollarSign, MapPin, User, Building2,
    Mail, FileText, Video, Link2, Calendar, Tag, Trash2, Edit3,
    CheckSquare, ArrowRight, ExternalLink, Copy, Filter,
} from 'lucide-react';

export default function PipelinePage() {
    const { leads, create, update, move, remove, markFollowUp } = useLeads();
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [dragId, setDragId] = useState<string | null>(null);
    const [dragOverStage, setDragOverStage] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
    const [filterInteres, setFilterInteres] = useState<string>('all');
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const showToast = (msg: string, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const filteredLeads = leads.filter(l => {
        const matchSearch = !search || l.business_name.toLowerCase().includes(search.toLowerCase()) ||
            l.owner_name.toLowerCase().includes(search.toLowerCase()) ||
            l.rubro.toLowerCase().includes(search.toLowerCase()) ||
            l.ciudad.toLowerCase().includes(search.toLowerCase());
        const matchInteres = filterInteres === 'all' || l.nivel_interes === filterInteres;
        return matchSearch && matchInteres;
    });

    const handleWhatsApp = (lead: Lead) => {
        const phone = lead.owner_phone || lead.business_phone;
        if (!phone) { showToast('No hay número de teléfono', 'error'); return; }
        markFollowUp(lead.id);
        const cleanPhone = phone.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
        showToast(`Contacto #${(lead.contador_seguimientos || 0) + 1} — Próximo: ${new Date(Date.now() + (lead.follow_up_interval_days || 3) * 86400000).toLocaleDateString('es-AR')}`);
    };

    const handleDragStart = (leadId: string) => setDragId(leadId);
    const handleDragOver = (e: React.DragEvent, stageId: string) => {
        e.preventDefault();
        setDragOverStage(stageId);
    };
    const handleDragLeave = () => setDragOverStage(null);
    const handleDrop = (stageId: string) => {
        if (dragId) {
            const lead = leads.find(l => l.id === dragId);
            if (lead && lead.estado_actual !== stageId) {
                move(dragId, stageId, lead.estado_actual);
                showToast(`Lead movido a ${PIPELINE_STAGES.find(s => s.id === stageId)?.label || stageId}`, 'success');
            }
        }
        setDragId(null);
        setDragOverStage(null);
    };

    if (!mounted) return <div style={{ padding: '40px', color: 'var(--color-text-muted)' }}>Cargando pipeline...</div>;

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                        🔥 <span className="text-gradient">Pipeline</span>
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
                        {leads.length} leads · {leads.filter(l => l.estado_actual === 'ganado').length} ganados
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar leads..."
                            style={{ paddingLeft: '36px', width: '220px' }}
                        />
                    </div>
                    <select value={filterInteres} onChange={e => setFilterInteres(e.target.value)} style={{ width: '130px' }}>
                        <option value="all">Todos</option>
                        <option value="caliente">🟢 Calientes</option>
                        <option value="tibio">🟡 Tibios</option>
                        <option value="frio">🔵 Fríos</option>
                    </select>
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                        <Plus size={18} /> Nuevo Lead
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="kanban-scroll" style={{ minHeight: 'calc(100vh - 160px)' }}>
                {PIPELINE_STAGES.map(stage => {
                    const stageLeads = filteredLeads.filter(l => l.estado_actual === stage.id);
                    const isOver = dragOverStage === stage.id;
                    return (
                        <div
                            key={stage.id}
                            className="pipeline-column"
                            onDragOver={e => handleDragOver(e, stage.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={() => handleDrop(stage.id)}
                            style={{
                                background: isOver ? 'rgba(139, 92, 246, 0.06)' : 'var(--color-bg-secondary)',
                                borderRadius: '16px',
                                border: `1px solid ${isOver ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                padding: '12px',
                                transition: 'all 0.2s',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            {/* Column Header */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid var(--color-border)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{
                                        width: '8px', height: '8px', borderRadius: '50%',
                                        background: stage.color, boxShadow: `0 0 8px ${stage.color}60`,
                                    }} />
                                    <span style={{ fontSize: '13px', fontWeight: 700 }}>{stage.emoji} {stage.label}</span>
                                </div>
                                <span style={{
                                    fontSize: '11px', fontWeight: 700, padding: '2px 8px',
                                    borderRadius: '10px', background: 'var(--color-bg-hover)', color: 'var(--color-text-muted)',
                                }}>
                                    {stageLeads.length}
                                </span>
                            </div>

                            {/* Cards */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minHeight: '60px' }}>
                                {stageLeads.map(lead => (
                                    <LeadCard
                                        key={lead.id}
                                        lead={lead}
                                        onDragStart={() => handleDragStart(lead.id)}
                                        onClick={() => setSelectedLead(lead)}
                                        onWhatsApp={() => handleWhatsApp(lead)}
                                    />
                                ))}
                                {stageLeads.length === 0 && (
                                    <div style={{
                                        padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)',
                                        fontSize: '12px', borderRadius: '10px', border: '1px dashed var(--color-border)',
                                    }}>
                                        Arrastrá leads aquí
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Lead Form Modal */}
            {showForm && (
                <LeadFormModal
                    onClose={() => setShowForm(false)}
                    onCreate={async (data) => {
                        try {
                            const newLead = await create(data);
                            setShowForm(false);
                            showToast('Lead creado exitosamente');
                            return newLead;
                        } catch (error) {
                            console.error(error);
                            showToast('Error al crear lead: ' + (error as Error).message, 'error');
                            throw error;
                        }
                    }}
                    onWhatsApp={handleWhatsApp}
                />
            )}

            {/* Lead Detail Sheet */}
            {selectedLead && (
                <LeadDetailSheet
                    lead={selectedLead}
                    onClose={() => setSelectedLead(null)}
                    onUpdate={(updates) => {
                        update(selectedLead.id, updates);
                        setSelectedLead({ ...selectedLead, ...updates });
                        showToast('Lead actualizado');
                    }}
                    onDelete={() => {
                        remove(selectedLead.id);
                        setSelectedLead(null);
                        showToast('Lead eliminado', 'error');
                    }}
                    onWhatsApp={() => handleWhatsApp(selectedLead)}
                />
            )}

            {/* Toast */}
            {toast && (
                <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
                    {toast.msg}
                </div>
            )}
        </div>
    );
}

/* ============ Lead Card ============ */
function LeadCard({ lead, onDragStart, onClick, onWhatsApp }: {
    lead: Lead; onDragStart: () => void; onClick: () => void; onWhatsApp: () => void;
}) {
    const urgencyClass = lead.dias_sin_contacto >= 7 ? 'urgency-critical' : lead.dias_sin_contacto >= 3 ? 'urgency-warning' : '';
    const interesClass = lead.nivel_interes === 'caliente' ? 'badge-caliente' : lead.nivel_interes === 'tibio' ? 'badge-tibio' : 'badge-frio';

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onClick={onClick}
            className={urgencyClass}
            style={{
                background: 'var(--color-bg-card)',
                borderRadius: '12px',
                padding: '12px',
                cursor: 'grab',
                border: '1px solid var(--color-border)',
                transition: 'all 0.2s',
                fontSize: '13px',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--color-border-light)';
                e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.transform = 'scale(1)';
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', flex: 1 }}>{lead.business_name}</div>
                <span className={`badge ${interesClass}`} style={{ fontSize: '10px' }}>
                    {lead.nivel_interes}
                </span>
            </div>

            {lead.owner_name && (
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={11} /> {lead.owner_name}
                </div>
            )}
            {(lead.rubro || lead.ciudad) && (
                <div style={{ color: 'var(--color-text-muted)', fontSize: '11px', marginBottom: '6px', display: 'flex', gap: '8px' }}>
                    {lead.rubro && <span>📌 {lead.rubro}</span>}
                    {lead.ciudad && <span><MapPin size={10} /> {lead.ciudad}</span>}
                </div>
            )}

            {lead.monto_propuesta > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-green)', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
                    <DollarSign size={13} />${lead.monto_propuesta.toLocaleString()} USD
                </div>
            )}

            {lead.dias_sin_contacto >= 3 && (
                <div style={{ fontSize: '11px', color: lead.dias_sin_contacto >= 7 ? 'var(--color-red)' : 'var(--color-orange)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={11} /> {lead.dias_sin_contacto} días sin contacto
                </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }} onClick={e => e.stopPropagation()}>
                <button
                    onClick={onWhatsApp}
                    className="btn-whatsapp"
                    style={{
                        flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px',
                        fontWeight: 700, border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                    }}
                >
                    <MessageCircle size={14} /> WhatsApp
                </button>
                {lead.instagram && (
                    <button
                        onClick={() => window.open(`https://instagram.com/${lead.instagram.replace('@', '')}`, '_blank')}
                        style={{
                            padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            background: '#E4405F', color: 'white', display: 'flex', alignItems: 'center',
                        }}
                    >
                        <Instagram size={14} />
                    </button>
                )}
                {lead.website && (
                    <button
                        onClick={() => window.open(lead.website.startsWith('http') ? lead.website : `https://${lead.website}`, '_blank')}
                        style={{
                            padding: '8px', borderRadius: '8px', cursor: 'pointer',
                            background: 'var(--color-bg-hover)', color: 'var(--color-text-secondary)',
                            display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)',
                        }}
                    >
                        <Globe size={14} />
                    </button>
                )}
            </div>
        </div>
    );
}

/* ============ Lead Form Modal ============ */
function LeadFormModal({ onClose, onCreate, onWhatsApp }: {
    onClose: () => void;
    onCreate: (data: Partial<Lead>) => Promise<Lead>;
    onWhatsApp: (lead: Lead) => void;
}) {
    const [form, setForm] = useState<Partial<Lead>>({
        business_name: '', owner_name: '', business_phone: '', owner_phone: '',
        email: '', instagram: '', website: '',
        rubro: '', ciudad: '', fuente: 'whatsapp' as Fuente,
        nivel_interes: 'frio' as NivelInteres, potencial_venta: 'medio' as PotencialVenta,
        valor_estimado_usd: 0, notas: '',
    });
    const [created, setCreated] = useState<Lead | null>(null);

    const set = (key: string, value: string | number) => setForm(prev => ({ ...prev, [key]: value }));

    const handleSubmit = async () => {
        if (!form.business_name) return;

        try {
            const newLead = await onCreate(form);
            setCreated(newLead);
        } catch (err) {
            // Error handled in parent
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                {!created ? (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>➕ Nuevo Lead</h2>
                            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                                <X size={22} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label>Nombre del Negocio *</label>
                                <input value={form.business_name} onChange={e => set('business_name', e.target.value)} placeholder="Metalúrgica García S.A." />
                            </div>
                            <div>
                                <label>Dueño / Contacto</label>
                                <input value={form.owner_name} onChange={e => set('owner_name', e.target.value)} placeholder="Juan García" />
                            </div>
                            <div>
                                <label>WhatsApp del Dueño</label>
                                <input value={form.owner_phone} onChange={e => set('owner_phone', e.target.value)} placeholder="+54 9 11 1234-5678" />
                            </div>
                            <div>
                                <label>Teléfono Negocio</label>
                                <input value={form.business_phone} onChange={e => set('business_phone', e.target.value)} placeholder="+54 11 4567-8901" />
                            </div>
                            <div>
                                <label>Email</label>
                                <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="info@empresa.com" />
                            </div>
                            <div>
                                <label>Instagram</label>
                                <input value={form.instagram} onChange={e => set('instagram', e.target.value)} placeholder="@empresa" />
                            </div>
                            <div>
                                <label>Website</label>
                                <input value={form.website} onChange={e => set('website', e.target.value)} placeholder="www.empresa.com" />
                            </div>
                            <div>
                                <label>Rubro</label>
                                <input value={form.rubro} onChange={e => set('rubro', e.target.value)} placeholder="Metalúrgica, Plásticos..." />
                            </div>
                            <div>
                                <label>Ciudad</label>
                                <input value={form.ciudad} onChange={e => set('ciudad', e.target.value)} placeholder="Buenos Aires" />
                            </div>

                            <div>
                                <label>Fuente</label>
                                <select value={form.fuente} onChange={e => set('fuente', e.target.value)}>
                                    <option value="whatsapp">WhatsApp</option>
                                    <option value="instagram">Instagram</option>
                                    <option value="ads">Ads</option>
                                    <option value="referido">Referido</option>
                                    <option value="manual">Manual</option>
                                    <option value="google">Google</option>
                                    <option value="linkedin">LinkedIn</option>
                                </select>
                            </div>

                            <div>
                                <label>Nivel de Interés</label>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    {(['frio', 'tibio', 'caliente'] as NivelInteres[]).map(n => (
                                        <button key={n} onClick={() => set('nivel_interes', n)}
                                            className={`pill ${form.nivel_interes === n ? 'pill-active' : ''}`}
                                            style={{ flex: 1, justifyContent: 'center', fontSize: '12px' }}
                                        >
                                            {n === 'frio' ? '🔵' : n === 'tibio' ? '🟡' : '🟢'} {n}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label>Potencial de Venta</label>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    {(['bajo', 'medio', 'alto'] as PotencialVenta[]).map(p => (
                                        <button key={p} onClick={() => set('potencial_venta', p)}
                                            className={`pill ${form.potencial_venta === p ? 'pill-active' : ''}`}
                                            style={{ flex: 1, justifyContent: 'center', fontSize: '12px' }}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label>Valor Estimado USD</label>
                                <input type="number" value={form.valor_estimado_usd || ''} onChange={e => set('valor_estimado_usd', Number(e.target.value))} placeholder="0" />
                            </div>

                            <div style={{ gridColumn: 'span 2' }}>
                                <label>Notas</label>
                                <textarea
                                    value={form.notas} onChange={e => set('notas', e.target.value)}
                                    placeholder="Notas sobre el lead..."
                                    style={{ minHeight: '80px', resize: 'vertical' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                            <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleSubmit} style={{ flex: 2 }}>
                                <Plus size={18} /> Crear Lead
                            </button>
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Lead Creado</h3>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>{created.business_name}</p>
                        {(created.owner_phone || created.business_phone) && (
                            <button className="btn btn-whatsapp btn-xl" onClick={() => onWhatsApp(created)}>
                                <MessageCircle size={20} /> Contactar Ahora por WhatsApp
                            </button>
                        )}
                        <button className="btn btn-secondary" onClick={onClose} style={{ width: '100%', marginTop: '12px' }}>
                            Cerrar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ============ Lead Detail Sheet ============ */
function LeadDetailSheet({ lead, onClose, onUpdate, onDelete, onWhatsApp }: {
    lead: Lead; onClose: () => void; onUpdate: (updates: Partial<Lead>) => void;
    onDelete: () => void; onWhatsApp: () => void;
}) {
    const [activeTab, setActiveTab] = useState('general');
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState<Partial<Lead>>(lead);

    const set = (key: string, value: string | number | boolean) => setForm(prev => ({ ...prev, [key]: value }));

    const tabs = [
        { id: 'general', label: '📋 General' },
        { id: 'progreso', label: '📊 Progreso' },
        { id: 'tareas', label: '✅ Tareas' },
        { id: 'docs', label: '📁 Documentos' },
    ];

    const currentStageIdx = PIPELINE_STAGES.findIndex(s => s.id === lead.estado_actual);
    const stageTasks = STAGE_TASKS[lead.estado_actual] || [];

    return (
        <>
            <div className="sheet-overlay" onClick={onClose} />
            <div className="sheet-content">
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>{lead.business_name}</h2>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <span className={`badge ${lead.nivel_interes === 'caliente' ? 'badge-caliente' : lead.nivel_interes === 'tibio' ? 'badge-tibio' : 'badge-frio'}`}>
                                {lead.nivel_interes}
                            </span>
                            <span className="badge" style={{ background: 'var(--color-bg-hover)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                                {PIPELINE_STAGES.find(s => s.id === lead.estado_actual)?.emoji} {PIPELINE_STAGES.find(s => s.id === lead.estado_actual)?.label}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px' }}>
                        <X size={22} />
                    </button>
                </div>

                {/* Quick Actions */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
                    <button className="btn btn-whatsapp btn-sm" onClick={onWhatsApp} style={{ flex: 1 }}>
                        <MessageCircle size={14} /> WhatsApp
                    </button>
                    {lead.instagram && (
                        <button className="btn btn-sm" onClick={() => window.open(`https://instagram.com/${lead.instagram.replace('@', '')}`, '_blank')}
                            style={{ background: '#E4405F', color: 'white', border: 'none' }}>
                            <Instagram size={14} />
                        </button>
                    )}
                    {lead.website && (
                        <button className="btn btn-secondary btn-sm" onClick={() => window.open(lead.website.startsWith('http') ? lead.website : `https://${lead.website}`, '_blank')}>
                            <Globe size={14} />
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--color-border)', marginBottom: '20px', overflowX: 'auto' }}>
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'general' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <DetailField icon={<User size={14} />} label="Dueño" value={lead.owner_name} />
                        <DetailField icon={<Phone size={14} />} label="WhatsApp" value={lead.owner_phone} />
                        <DetailField icon={<Phone size={14} />} label="Tel. Negocio" value={lead.business_phone} />
                        <DetailField icon={<Mail size={14} />} label="Email" value={lead.email} />
                        <DetailField icon={<Instagram size={14} />} label="Instagram" value={lead.instagram} />
                        <DetailField icon={<Globe size={14} />} label="Website" value={lead.website} />
                        <DetailField icon={<Building2 size={14} />} label="Rubro" value={lead.rubro} />
                        <DetailField icon={<MapPin size={14} />} label="Ciudad" value={lead.ciudad} />
                        <DetailField icon={<Tag size={14} />} label="Fuente" value={lead.fuente} />
                        <DetailField icon={<DollarSign size={14} />} label="Valor Estimado" value={lead.valor_estimado_usd ? `$${lead.valor_estimado_usd} USD` : ''} />
                        <DetailField icon={<DollarSign size={14} />} label="Monto Propuesta" value={lead.monto_propuesta ? `$${lead.monto_propuesta} USD` : ''} />
                        <DetailField icon={<Calendar size={14} />} label="Último Contacto" value={lead.fecha_ultima_interaccion ? new Date(lead.fecha_ultima_interaccion).toLocaleDateString('es-AR') : ''} />
                        <DetailField icon={<Calendar size={14} />} label="Próximo Follow-up" value={lead.fecha_proximo_followup ? new Date(lead.fecha_proximo_followup).toLocaleDateString('es-AR') : ''} />
                        <DetailField icon={<MessageCircle size={14} />} label="Total Seguimientos" value={String(lead.contador_seguimientos || 0)} />

                        {lead.notas && (
                            <div style={{ marginTop: '8px' }}>
                                <label>Notas</label>
                                <div style={{ padding: '12px', background: 'var(--color-bg-hover)', borderRadius: '10px', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
                                    {lead.notas}
                                </div>
                            </div>
                        )}

                        {/* Move Stage */}
                        <div style={{ marginTop: '12px' }}>
                            <label>Mover a Etapa</label>
                            <select value={lead.estado_actual} onChange={e => onUpdate({ estado_actual: e.target.value })} style={{ width: '100%' }}>
                                {PIPELINE_STAGES.map(s => (
                                    <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Danger Zone */}
                        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                            <button className="btn btn-danger btn-sm" onClick={onDelete}>
                                <Trash2 size={14} /> Eliminar Lead
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'progreso' && (
                    <div>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>Progreso en Pipeline</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {PIPELINE_STAGES.map((stage, idx) => {
                                const isPast = idx < currentStageIdx;
                                const isCurrent = idx === currentStageIdx;
                                const isFuture = idx > currentStageIdx;
                                return (
                                    <div key={stage.id} style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        padding: '10px 12px', borderRadius: '10px',
                                        background: isCurrent ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                                        border: isCurrent ? '1px solid var(--color-accent)' : '1px solid transparent',
                                        opacity: isFuture ? 0.4 : 1,
                                    }}>
                                        <div style={{
                                            width: '24px', height: '24px', borderRadius: '50%',
                                            background: isPast ? 'var(--color-green)' : isCurrent ? stage.color : 'var(--color-bg-hover)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '12px', fontWeight: 700, color: 'white',
                                            border: isFuture ? '1px solid var(--color-border)' : 'none',
                                        }}>
                                            {isPast ? '✓' : stage.emoji}
                                        </div>
                                        <span style={{ fontSize: '13px', fontWeight: isCurrent ? 700 : 400 }}>
                                            {stage.label}
                                        </span>
                                        {isCurrent && <span style={{ fontSize: '11px', color: 'var(--color-accent-light)', marginLeft: 'auto' }}>Actual</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeTab === 'tareas' && (
                    <div>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>
                            Tareas para: {PIPELINE_STAGES.find(s => s.id === lead.estado_actual)?.emoji} {PIPELINE_STAGES.find(s => s.id === lead.estado_actual)?.label}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {stageTasks.map((task, idx) => (
                                <div key={idx} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '12px', background: 'var(--color-bg-hover)', borderRadius: '10px',
                                }}>
                                    <CheckSquare size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                                    <span style={{ fontSize: '13px' }}>{task}</span>
                                </div>
                            ))}
                            {stageTasks.length === 0 && (
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>No hay tareas para esta etapa</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'docs' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>Documentos y Links</h3>
                        <DocLinkField icon={<Video size={14} />} label="Loom URL" value={lead.loom_url} onChange={v => onUpdate({ loom_url: v })} />
                        <DocLinkField icon={<FileText size={14} />} label="Propuesta URL" value={lead.propuesta_url} onChange={v => onUpdate({ propuesta_url: v })} />
                        <DocLinkField icon={<FileText size={14} />} label="Propuesta PDF" value={lead.propuesta_pdf_url} onChange={v => onUpdate({ propuesta_pdf_url: v })} />
                        <DocLinkField icon={<Link2 size={14} />} label="Notas del Negocio" value={lead.notas_negocio_url} onChange={v => onUpdate({ notas_negocio_url: v })} />
                        <DocLinkField icon={<Link2 size={14} />} label="SOP Links (Notion)" value={lead.sop_links} onChange={v => onUpdate({ sop_links: v })} />
                    </div>
                )}
            </div>
        </>
    );
}

function DetailField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    if (!value) return null;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>{icon}</div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{label}</div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{value}</div>
            </div>
        </div>
    );
}

function DocLinkField({ icon, label, value, onChange }: {
    icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(value || '');

    return (
        <div style={{ padding: '12px', background: 'var(--color-bg-hover)', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div style={{ color: 'var(--color-text-muted)' }}>{icon}</div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{label}</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                    {value && (
                        <button onClick={() => window.open(value.startsWith('http') ? value : `https://${value}`, '_blank')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent-light)', padding: '2px' }}>
                            <ExternalLink size={12} />
                        </button>
                    )}
                    <button onClick={() => setEditing(!editing)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '2px' }}>
                        <Edit3 size={12} />
                    </button>
                </div>
            </div>
            {editing ? (
                <div style={{ display: 'flex', gap: '6px' }}>
                    <input value={val} onChange={e => setVal(e.target.value)} placeholder={`Pegar link de ${label}...`} style={{ fontSize: '12px', padding: '6px 10px' }} />
                    <button className="btn btn-primary btn-sm" onClick={() => { onChange(val); setEditing(false); }}>OK</button>
                </div>
            ) : (
                <div style={{ fontSize: '12px', color: value ? 'var(--color-accent-light)' : 'var(--color-text-muted)' }}>
                    {value || 'Sin configurar'}
                </div>
            )}
        </div>
    );
}
