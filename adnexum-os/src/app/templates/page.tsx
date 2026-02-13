'use client';

import { useState, useEffect } from 'react';
import { useTemplates, useLeads } from '@/lib/hooks';
import { MessageTemplate } from '@/lib/types';
import type { Lead } from '@/lib/types';
import {
    MessageCircle, Copy, Check, FileText, Send,
    ChevronDown, ExternalLink, Plus, Pencil, Trash2, Save, RefreshCw
} from 'lucide-react';

// UI Template Interface (mapped from MessageTemplate)
interface Template {
    id: string;
    title: string;
    category: string;
    message: string;
    variables: string[];
}

const DEFAULT_TEMPLATES_DATA = [
    {
        title: 'Primer Contacto — Presentación',
        stage: 'presentacion',
        content: `Hola {nombre}! 👋\n\nSoy [Tu Nombre] de Adnexum. Me encontré con {empresa} y me llamó la atención lo que hacen en {rubro}.\n\nQuería consultar, ¿quién es la persona encargada de las decisiones comerciales o de marketing en la empresa?\n\nTengo una propuesta breve que podría generarles más ventas usando IA y automatización. ¿Te interesaría una llamada de 5 minutos para explicarte?\n\nQuedo atento! 🚀`,
        template_type: 'whatsapp'
    },
    {
        title: 'Follow-up — Sin Respuesta',
        stage: 'followup',
        content: `Hola {nombre}! 👋\n\nTe escribí hace unos días por el tema de automatización para {empresa}. \n\nEntiendo que están ocupados, solo quería confirmar si siguen interesados en explorar cómo la IA podría ayudarlos a captar más clientes y ahorrar tiempo en procesos repetitivos.\n\n¿Les sirve una llamada breve esta semana? 📞\n\nSaludos!`,
        template_type: 'whatsapp'
    },
    {
        title: 'Agendar Discovery Call',
        stage: 'discovery',
        content: `Perfecto {nombre}! 🙌\n\nTe voy a enviar un link para agendar la llamada de descubrimiento. Son 20-30 minutos donde vamos a:\n\n1️⃣ Entender cómo funciona hoy {empresa}\n2️⃣ Identificar dónde se pierden ventas o tiempo\n3️⃣ Ver qué se puede automatizar con IA\n\n📅 Link de agenda: [TU_LINK_CALENDLY]\n\nMientras tanto, te dejo un breve video donde muestro cómo funciona: [LINK_LOOM]\n\nNos vemos! 🚀`,
        template_type: 'whatsapp'
    },
    {
        title: 'Pre-Discovery — Envío de Loom',
        stage: 'loom',
        content: `Hola {nombre}! 🎥\n\nComo te comenté, antes de nuestra llamada quería compartirte este video donde explico:\n\n🔍 El costo de oportunidad de seguir operando sin automatización\n🤖 Un agente de IA funcionando en vivo\n📊 Diferencia entre invertir en ads CON vs SIN sistema de ventas inteligente\n\n👉 Video: [LINK_LOOM]\n\nMiralo cuando puedas así aprovechamos al máximo nuestra llamada del {fecha}.\n\nCualquier duda me escribís! 💪`,
        template_type: 'whatsapp'
    },
    {
        title: 'Pre-Propuesta — 24hs Antes',
        stage: 'propuesta',
        content: `Hola {nombre}! 📋\n\nMañana tenemos nuestra reunión de propuesta para {empresa}. Quería enviarte este video de preparación:\n\n🎯 Punto A: Donde está {empresa} hoy\n🚀 Punto B: Donde debería estar con automatización  \n💎 Punto C: El plan para llegar ahí\n\n👉 Video: [LINK_LOOM_PROPUESTA]\n\nAnalizamos a fondo tu negocio y hay oportunidades increíbles. Mañana te presento todo.\n\nNos vemos a las {hora}! 🔥`,
        template_type: 'whatsapp'
    },
    {
        title: 'Post-Venta — Bienvenida',
        stage: 'cierre',
        content: `{nombre}!! 🎉🎉\n\nBienvenido al equipo! Estamos muy contentos de arrancar a trabajar con {empresa}.\n\nPróximos pasos:\n1️⃣ Te llega un email con el contrato y accesos\n2️⃣ Agendamos el kickoff en los próximos 2 días\n3️⃣ Arrancamos la auditoría de tu negocio\n\nCualquier cosa me escribís. Tu inversión va a dar resultados increíbles! 🚀💪\n\nAbrazo grande!`,
        template_type: 'whatsapp'
    },
];

const CATEGORIES = [
    { id: 'presentacion', label: '👋 Presentación', color: 'var(--color-accent)' },
    { id: 'followup', label: '📞 Follow-up', color: 'var(--color-orange)' },
    { id: 'discovery', label: '🔍 Discovery', color: '#3b82f6' },
    { id: 'loom', label: '🎥 Loom', color: 'var(--color-yellow)' },
    { id: 'propuesta', label: '📋 Propuesta', color: 'var(--color-green)' },
    { id: 'cierre', label: '✅ Cierre', color: '#10b981' },
    { id: 'custom', label: '🔧 Custom', color: 'var(--color-text-muted)' },
];

export default function TemplatesPage() {
    const { templates: dbTemplates, loading, create, update, remove, refresh } = useTemplates();
    const { leads } = useLeads(); // Changed from useLocalLeads
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [previewText, setPreviewText] = useState('');
    const [copied, setCopied] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    // Map DB templates to UI format
    const templates: Template[] = dbTemplates.map(t => ({
        id: t.id,
        title: t.title,
        category: t.stage,
        message: t.content,
        variables: (t.content.match(/\{(\w+)\}/g) || []).map(v => v.replace(/[{}]/g, '')),
    }));

    if (!mounted) return <div style={{ padding: '40px', color: 'var(--color-text-muted)' }}>Cargando...</div>;

    const filtered = activeCategory === 'all'
        ? templates
        : templates.filter(t => t.category === activeCategory);

    const fillTemplate = (template: Template, lead: Lead | null) => {
        let text = template.message;
        if (lead) {
            text = text.replace(/\{nombre\}/g, lead.owner_name || lead.business_name);
            text = text.replace(/\{empresa\}/g, lead.business_name);
            text = text.replace(/\{rubro\}/g, lead.rubro || '[rubro]');
            text = text.replace(/\{ciudad\}/g, lead.ciudad || '[ciudad]');
            const now = new Date();
            text = text.replace(/\{fecha\}/g, now.toLocaleDateString('es-AR'));
            text = text.replace(/\{hora\}/g, now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }));
        }
        return text;
    };

    const handleSelectTemplate = (template: Template) => {
        setSelectedTemplate(template);
        setPreviewText(fillTemplate(template, selectedLead));
    };

    const handleSelectLead = (lead: Lead) => {
        setSelectedLead(lead);
        if (selectedTemplate) {
            setPreviewText(fillTemplate(selectedTemplate, lead));
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(previewText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSendWhatsApp = () => {
        const phone = selectedLead?.owner_phone || selectedLead?.business_phone;
        if (!phone) return;
        const cleanPhone = phone.replace(/\D/g, '');
        const encoded = encodeURIComponent(previewText);
        window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
    };

    const handleSeedDefaults = async () => {
        if (!confirm('¿Cargar plantillas por defecto? Esto agregará 6 plantillas a tu cuenta.')) return;
        try {
            for (const tpl of DEFAULT_TEMPLATES_DATA) {
                await create({
                    title: tpl.title,
                    stage: tpl.stage,
                    content: tpl.content,
                    template_type: tpl.template_type as any,
                    user_id: 'current', // handled by RLS/backend usually or we pass it if stored. 
                    // Actually createTemplate in supabase.ts might need updates if RLS handles user_id automatically.
                    // Assuming createTemplate and Supabase setup handles user identity via session.
                });
            }
            refresh();
        } catch (e) {
            console.error(e);
            alert('Error al cargar plantillas. Revisa si ya existen o si hay problemas de conexión.');
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('¿Eliminar esta plantilla?')) return;
        try {
            await remove(id);
            if (selectedTemplate?.id === id) setSelectedTemplate(null);
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <div style={{ maxWidth: '1100px' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                        💬 <span className="text-gradient">Templates de Mensajes</span>
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
                        Scripts de prospección y seguimiento para WhatsApp · {templates.length} plantillas
                    </p>
                </div>
                {templates.length === 0 && !loading && (
                    <button onClick={handleSeedDefaults} className="btn-secondary" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <RefreshCw size={16} /> Cargar Defaults
                    </button>
                )}
            </div>

            {/* Category Filter */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <button className={`pill ${activeCategory === 'all' ? 'pill-active' : ''}`}
                    onClick={() => setActiveCategory('all')}>📋 Todas</button>
                {CATEGORIES.map(cat => (
                    <button key={cat.id} className={`pill ${activeCategory === cat.id ? 'pill-active' : ''}`}
                        onClick={() => setActiveCategory(cat.id)}>
                        {cat.label}
                    </button>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Templates List */}
                <div>
                    <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', color: 'var(--color-text-muted)' }}>
                        Plantillas
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {loading ? <div style={{ padding: '20px', textAlign: 'center' }}>Cargando plantillas...</div> : filtered.map(template => {
                            const cat = CATEGORIES.find(c => c.id === template.category);
                            const isSelected = selectedTemplate?.id === template.id;
                            return (
                                <div key={template.id} onClick={() => handleSelectTemplate(template)}
                                    className="card-interactive" style={{
                                        cursor: 'pointer',
                                        border: isSelected ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                                        background: isSelected ? 'rgba(139, 92, 246, 0.06)' : 'var(--color-bg-card)',
                                        position: 'relative',
                                        paddingRight: '40px'
                                    }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>{template.title}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: '1.3' }}>
                                                {template.message.substring(0, 80)}...
                                            </div>
                                        </div>
                                        <div style={{ flexShrink: 0, marginLeft: '12px' }}>
                                            <span style={{
                                                fontSize: '10px', padding: '3px 8px', borderRadius: '6px',
                                                background: cat ? `${cat.color}22` : 'var(--color-bg-hover)',
                                                color: cat?.color || 'var(--color-text-muted)', fontWeight: 600,
                                            }}>{cat?.label || template.category}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(template.id, e)}
                                        style={{
                                            position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                                            padding: '6px', border: 'none', background: 'transparent', cursor: 'pointer',
                                            color: 'var(--color-text-muted)', opacity: 0.5
                                        }}
                                        title="Eliminar plantilla"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            );
                        })}
                        {!loading && filtered.length === 0 && (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                No hay plantillas en esta categoría.
                            </div>
                        )}
                    </div>

                    {/* SOP Links Section */}
                    <div className="card-static" style={{ marginTop: '20px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            📖 SOPs y Documentos
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                            Links rápidos a tus procesos documentados en Notion u otra plataforma.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {[
                                { label: 'Proceso de Prospección', icon: '🎯' },
                                { label: 'Script de Discovery Call', icon: '📞' },
                                { label: 'Guía de Propuestas', icon: '📋' },
                                { label: 'Proceso de Onboarding', icon: '🚀' },
                                { label: 'Manejo de Objeciones', icon: '🛡️' },
                            ].map((sop, i) => (
                                <div key={i} style={{
                                    padding: '10px 14px', background: 'var(--color-bg-hover)', borderRadius: '10px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
                                }}>
                                    <span style={{ fontSize: '13px' }}>{sop.icon} {sop.label}</span>
                                    <ExternalLink size={14} style={{ color: 'var(--color-text-muted)' }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Preview & Send */}
                <div>
                    <div className="card-static" style={{ position: 'sticky', top: '20px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>
                            ✨ Vista Previa y Envío
                        </h3>

                        {/* Lead Selector */}
                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', display: 'block', color: 'var(--color-text-muted' }}>
                                Seleccionar Lead
                            </label>
                            <select
                                value={selectedLead?.id || ''}
                                onChange={e => {
                                    const lead = leads.find(l => l.id === e.target.value);
                                    if (lead) handleSelectLead(lead);
                                }}
                                style={{ fontSize: '13px', width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card)', color: 'var(--color-text-primary)' }}
                            >
                                <option value="">-- Elegir lead --</option>
                                {leads.map(l => (
                                    <option key={l.id} value={l.id}>{l.business_name} — {l.owner_name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Preview */}
                        {selectedTemplate ? (
                            <>
                                <div style={{
                                    background: 'var(--color-bg-hover)', borderRadius: '12px', padding: '16px',
                                    fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap', marginBottom: '14px',
                                    maxHeight: '350px', overflowY: 'auto', border: '1px solid var(--color-border)',
                                }}>
                                    {previewText}
                                </div>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="btn btn-secondary" onClick={handleCopy} style={{ flex: 1 }}>
                                        {copied ? <Check size={16} /> : <Copy size={16} />}
                                        {copied ? 'Copiado!' : 'Copiar'}
                                    </button>
                                    {selectedLead && (selectedLead.owner_phone || selectedLead.business_phone) && (
                                        <button className="btn-whatsapp" onClick={handleSendWhatsApp}
                                            style={{
                                                flex: 2, padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                                                fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center',
                                                justifyContent: 'center', gap: '8px',
                                                boxShadow: '0 4px 15px rgba(37, 211, 102, 0.2)'
                                            }}>
                                            <Send size={16} /> Enviar por WhatsApp
                                        </button>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div style={{
                                textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-muted)',
                            }}>
                                <FileText size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
                                <p style={{ fontSize: '13px' }}>Seleccioná una plantilla para ver la vista previa</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
