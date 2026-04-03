'use client';

import { useEffect, useState } from 'react';
import {
    Scissors, LayoutDashboard, Users, QrCode, Search, LogOut, Settings,
    FileText, Edit2, Save, X, RefreshCw, Check, Crown, Trophy, TrendingUp,
    DollarSign, Star, Calendar, ChevronRight, MessageSquare, Instagram,
    Clock, Award, StickyNote, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AIChat from '@/components/AIChat';
import QRCodeDisplay from '@/components/QRCode';
import {
    getDashboardMetrics, registrarCorte, getOrCreateCliente,
    getAllClientes, updateSucursalConfig, updateCliente,
    getPendingCuts, approveCut, rejectCut, getHallOfFame
} from '@/lib/supabase';
import type { Cliente, Sucursal, CorteHistorico } from '@/lib/supabase';
import Link from 'next/link';

type ActiveTab = 'overview' | 'clients' | 'hall' | 'qr' | 'settings' | 'chat';


export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
    const [sucursal, setSucursal] = useState<Sucursal | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Pending
    const [pendingCuts, setPendingCuts] = useState<(CorteHistorico & { cliente?: Cliente })[]>([]);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Metrics
    const [metrics, setMetrics] = useState({
        cortesHoy: 0, cortesMes: 0, revenueToday: 0, revenueMonth: 0,
        projectedRevenue: 0, vipCount: 0, cortesObjetivo: 5, precioCorte: 5000
    });

    // Hall of Fame
    const [hallOfFame, setHallOfFame] = useState<Cliente[]>([]);

    // Clients
    const [allClients, setAllClients] = useState<Cliente[]>([]);
    const [filteredClients, setFilteredClients] = useState<Cliente[]>([]);
    const [clientSearch, setClientSearch] = useState('');
    const [editingClient, setEditingClient] = useState<Cliente | null>(null);
    const [newName, setNewName] = useState('');
    const [editingNotes, setEditingNotes] = useState<string | null>(null);
    const [notesValue, setNotesValue] = useState('');

    // Registration
    const [telefonoInput, setTelefonoInput] = useState('');
    const [searchedClient, setSearchedClient] = useState<Cliente | null>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [askNameMode, setAskNameMode] = useState(false);
    const [clientNameInput, setClientNameInput] = useState('');

    // Settings
    const [configForm, setConfigForm] = useState({ precio_corte: 5000, porcentaje_descuento: 60, config_cortes_premio: 5 });
    const [savingConfig, setSavingConfig] = useState(false);

    // Toast
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        if (!clientSearch.trim()) { setFilteredClients(allClients); }
        else {
            const term = clientSearch.toLowerCase();
            setFilteredClients(allClients.filter(c => c.telefono.includes(term) || (c.nombre && c.nombre.toLowerCase().includes(term))));
        }
    }, [clientSearch, allClients]);

    async function loadData() {
        setLoading(true);
        try {
            const data = await getDashboardMetrics();
            if (data) {
                setMetrics({
                    cortesHoy: data.cortesHoy, cortesMes: data.cortesMes,
                    revenueToday: data.revenueToday, revenueMonth: data.revenueMonth,
                    projectedRevenue: data.projectedRevenue, vipCount: data.vipClients.length,
                    cortesObjetivo: data.cortesObjetivo, precioCorte: data.precioCorte
                });
                if (data.sucursal) {
                    setSucursal(data.sucursal);
                    setConfigForm({
                        precio_corte: data.sucursal.precio_corte || 5000,
                        porcentaje_descuento: data.sucursal.porcentaje_descuento || 60,
                        config_cortes_premio: data.sucursal.config_cortes_premio || 5,
                    });
                }
            }
            const [clients, pending, hall] = await Promise.all([
                getAllClientes(), getPendingCuts(), getHallOfFame(10)
            ]);
            setAllClients(clients); setFilteredClients(clients);
            setPendingCuts(pending as (CorteHistorico & { cliente?: Cliente })[]);
            setHallOfFame(hall);
        } catch (error) {
            console.error(error);
            setHallOfFame([]);
            showToast('Modo demo activado', 'error');
        } finally { setLoading(false); }
    }

    // --- Actions ---
    const handleBuscarCliente = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!telefonoInput || telefonoInput.length < 8) { showToast('Teléfono inválido', 'error'); return; }
        setSearchLoading(true); setSearchedClient(null); setAskNameMode(false);
        try {
            const client = await getOrCreateCliente(telefonoInput);
            if (client) { setSearchedClient(client); if (!client.nombre) setAskNameMode(true); }
        } catch { showToast('Error buscando cliente', 'error'); } finally { setSearchLoading(false); }
    };

    const handleRegistrarCorte = async () => {
        if (!searchedClient) return;
        setActionLoading(true);
        if (askNameMode && clientNameInput.trim()) await updateCliente(searchedClient.id, { nombre: clientNameInput.trim() });
        try {
            const result = await registrarCorte(searchedClient.telefono, metrics.precioCorte);
            if (result.corte) { showToast('Corte registrado ✅'); loadData(); setSearchedClient(null); setTelefonoInput(''); setClientNameInput(''); setAskNameMode(false); }
            else showToast('Error registrando corte', 'error');
        } catch { showToast('Error inesperado', 'error'); } finally { setActionLoading(false); }
    };

    const handleApprove = async (id: string) => {
        setProcessingId(id);
        const success = await approveCut(id);
        if (success) { showToast('Solicitud aprobada ✅'); loadData(); } else showToast('Error al aprobar', 'error');
        setProcessingId(null);
    };

    const handleReject = async (id: string) => {
        if (!confirm('¿Rechazar esta solicitud?')) return;
        setProcessingId(id);
        const success = await rejectCut(id);
        if (success) { showToast('Solicitud rechazada ❌'); loadData(); } else showToast('Error al rechazar', 'error');
        setProcessingId(null);
    };

    const handleSaveClientName = async () => {
        if (!editingClient || !newName.trim()) return;
        const res = await updateCliente(editingClient.id, { nombre: newName.trim() });
        if (res) { showToast('Nombre actualizado'); setEditingClient(null); setNewName(''); loadData(); }
        else showToast('Error al actualizar', 'error');
    };

    const handleSaveNotes = async (clientId: string) => {
        const res = await updateCliente(clientId, { notas_estilo: notesValue });
        if (res) { showToast('Notas guardadas 📝'); setEditingNotes(null); setNotesValue(''); loadData(); }
        else showToast('Error al guardar notas', 'error');
    };

    const handleSaveConfig = async () => {
        if (!sucursal) return;
        setSavingConfig(true);
        try {
            const res = await updateSucursalConfig(sucursal.id, configForm);
            if (res) { showToast('Configuración guardada 💾'); loadData(); } else showToast('Error guardando', 'error');
        } finally { setSavingConfig(false); }
    };

    const handleGenerateStory = (client: Cliente, rank: number) => {
        const medals = ['🥇', '🥈', '🥉'];
        const medal = medals[rank] || '⭐';
        const text = `${medal} HALL OF FAME ${medal}\n\n${client.nombre || 'Cliente'}\n${client.cortes_acumulados} cortes acumulados\n\nAlpha Omega Estudio ✂️`;
        navigator.clipboard.writeText(text).then(() => showToast('Texto copiado para IG Story 📋'));
    };

    const navItems = [
        { id: 'overview', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'clients', icon: Users, label: 'Clientes' },
        { id: 'hall', icon: Trophy, label: 'Hall of Fame' },
        { id: 'qr', icon: QrCode, label: 'Código QR' },
        { id: 'chat', icon: FileText, label: 'Agente IA' },
        { id: 'settings', icon: Settings, label: 'Configuración' },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#050505' }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                    <div className="w-14 h-14 border-2 rounded-full animate-spin mx-auto mb-4"
                        style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: '#D4AF37' }} />
                    <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>Cargando panel...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: '#050505', color: 'var(--text-primary)' }}>
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        className="fixed top-5 left-1/2 z-[100] px-5 py-3 rounded-xl font-body text-sm"
                        style={{
                            background: toast.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                            border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                            color: toast.type === 'success' ? '#22c55e' : '#ef4444',
                            backdropFilter: 'blur(20px)',
                        }}
                    >
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-gold)' }}>
                        <Scissors size={16} style={{ color: '#050505' }} />
                    </div>
                    <span className="font-display text-sm">Alpha Omega</span>
                </div>
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <LayoutDashboard size={18} style={{ color: 'var(--text-secondary)' }} />
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-full lg:w-64 flex-shrink-0`}
                style={{ background: '#080808', borderRight: '1px solid var(--border-subtle)' }}>
                <div className="p-6">
                    <div className="hidden lg:flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-gold)' }}>
                            <Scissors size={18} style={{ color: '#050505' }} />
                        </div>
                        <div>
                            <h1 className="font-display text-base" style={{ color: 'var(--text-primary)' }}>Alpha Omega</h1>
                            <p className="font-body text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Panel ejecutivo</p>
                        </div>
                    </div>

                    <nav className="space-y-1">
                        {navItems.map((item) => (
                            <button key={item.id}
                                onClick={() => { setActiveTab(item.id as ActiveTab); setSidebarOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-body transition-all"
                                style={{
                                    background: activeTab === item.id ? 'rgba(212,175,55,0.06)' : 'transparent',
                                    color: activeTab === item.id ? '#D4AF37' : 'var(--text-secondary)',
                                    border: activeTab === item.id ? '1px solid rgba(212,175,55,0.15)' : '1px solid transparent',
                                    cursor: 'pointer',
                                }}
                            >
                                <item.icon size={18} />
                                {item.label}
                                {item.id === 'overview' && pendingCuts.length > 0 && (
                                    <span className="ml-auto w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold"
                                        style={{ background: '#D4AF37', color: '#050505' }}>
                                        {pendingCuts.length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="mt-auto p-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <Link href="/" className="flex items-center gap-3 px-4 py-2 font-body text-sm transition-colors"
                        style={{ color: 'var(--text-muted)' }}>
                        <LogOut size={16} />
                        <span>Salir</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-5 lg:p-8 overflow-y-auto">
                <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h2 className="font-display text-2xl capitalize" style={{ color: 'var(--text-primary)' }}>
                        {activeTab === 'overview' ? 'Dashboard' : activeTab === 'hall' ? 'Hall of Fame' : activeTab === 'clients' ? 'Clientes' : activeTab === 'qr' ? 'Código QR' : activeTab === 'chat' ? 'Agente IA' : 'Configuración'}
                    </h2>
                    <p className="font-body text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                        {activeTab === 'overview' ? 'Gestión inteligente de tu barbería' : activeTab === 'hall' ? 'Ranking de clientes más fieles' : activeTab === 'clients' ? 'CRM con notas de estilo' : ''}
                    </p>
                </motion.header>

                {/* ═══════════════ OVERVIEW TAB ═══════════════ */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Pending Requests */}
                        <AnimatePresence>
                            {pendingCuts.length > 0 && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="glass-card overflow-hidden"
                                    style={{ border: '1px solid rgba(212,175,55,0.25)', boxShadow: '0 4px 30px rgba(212,175,55,0.08)' }}>
                                    <div className="p-4 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(212,175,55,0.15)', background: 'rgba(212,175,55,0.03)' }}>
                                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#D4AF37' }} />
                                        <h3 className="font-display text-sm" style={{ color: '#D4AF37' }}>
                                            Solicitudes Pendientes ({pendingCuts.length})
                                        </h3>
                                    </div>
                                    <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                                        {pendingCuts.map((cut) => (
                                            <div key={cut.id} className="p-4 flex items-center justify-between transition-colors hover:bg-white/[0.01]">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                                        style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.12)' }}>
                                                        <Users size={18} style={{ color: '#D4AF37' }} />
                                                    </div>
                                                    <div>
                                                        <p className="font-body font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                            {cut.cliente?.nombre || cut.cliente_telefono}
                                                        </p>
                                                        <p className="font-body text-xs flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                                                            <Clock size={12} />
                                                            {new Date(cut.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                            <span className="w-1 h-1 rounded-full" style={{ background: 'var(--text-muted)' }} />
                                                            Check-in desde App
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleReject(cut.id)} disabled={processingId === cut.id}
                                                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                                                        style={{ background: 'rgba(239,68,68,0.06)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.12)', cursor: 'pointer' }}>
                                                        <X size={18} />
                                                    </button>
                                                    <button onClick={() => handleApprove(cut.id)} disabled={processingId === cut.id}
                                                        className="h-10 px-5 rounded-xl flex items-center justify-center gap-2 font-body font-bold text-sm transition-all"
                                                        style={{ background: 'var(--gradient-gold)', color: '#050505', cursor: 'pointer' }}>
                                                        {processingId === cut.id ? <RefreshCw className="animate-spin" size={16} /> : <Check size={16} />}
                                                        Confirmar
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* BI Metrics Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'Cortes Hoy', value: metrics.cortesHoy, icon: Scissors, color: '#D4AF37' },
                                { label: 'Cortes Mes', value: metrics.cortesMes, icon: Calendar, color: '#E8C97A' },
                                { label: 'Recaudación Mes', value: `$${metrics.revenueMonth.toLocaleString()}`, icon: DollarSign, color: '#22c55e' },
                                { label: 'Proyección Mes', value: `$${metrics.projectedRevenue.toLocaleString()}`, icon: TrendingUp, color: '#3b82f6' },
                            ].map((m, i) => (
                                <motion.div key={m.label}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                    className="glass-card p-5"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="font-body text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{m.label}</span>
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                            style={{ background: `${m.color}10`, border: `1px solid ${m.color}20` }}>
                                            <m.icon size={16} style={{ color: m.color }} />
                                        </div>
                                    </div>
                                    <p className="font-display text-2xl" style={{ color: 'var(--text-primary)' }}>{m.value}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Two columns: VIP + Manual Registration */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* VIP Spotlight */}
                            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35, duration: 0.5 }}
                                className="glass-card overflow-hidden">
                                <div className="p-4 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                    <Crown size={16} style={{ color: '#D4AF37' }} />
                                    <h3 className="font-body text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                        Top Clientes
                                    </h3>
                                    <span className="ml-auto font-body text-xs px-2 py-0.5 rounded-full"
                                        style={{ background: 'rgba(212,175,55,0.08)', color: '#D4AF37' }}>
                                        VIP
                                    </span>
                                </div>
                                <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                                    {hallOfFame.slice(0, 5).map((client, i) => (
                                        <div key={client.id} className="flex items-center gap-3 p-4 transition-colors hover:bg-white/[0.01]">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-display text-sm"
                                                style={{
                                                    background: i === 0 ? 'var(--gradient-gold)' : i === 1 ? 'linear-gradient(135deg, #C0C0C0, #E8E8E8)' : i === 2 ? 'linear-gradient(135deg, #CD7F32, #E8B87A)' : 'rgba(255,255,255,0.04)',
                                                    color: i < 3 ? '#050505' : 'var(--text-muted)',
                                                }}>
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-body text-sm truncate" style={{ color: 'var(--text-primary)' }}>{client.nombre || 'Sin nombre'}</p>
                                            </div>
                                            <span className="font-body text-sm font-semibold" style={{ color: '#D4AF37' }}>
                                                {client.cortes_acumulados} <span className="text-xs" style={{ color: 'var(--text-muted)' }}>cortes</span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => setActiveTab('hall')}
                                    className="w-full p-3 flex items-center justify-center gap-1 font-body text-xs transition-colors"
                                    style={{ borderTop: '1px solid var(--border-subtle)', color: '#D4AF37', cursor: 'pointer' }}>
                                    Ver ranking completo <ChevronRight size={14} />
                                </button>
                            </motion.div>

                            {/* Manual Registration */}
                            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.5 }}
                                className="glass-card overflow-hidden">
                                <div className="p-4 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                    <Scissors size={16} style={{ color: '#D4AF37' }} />
                                    <h3 className="font-body text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Registrar Corte Manual</h3>
                                </div>
                                <div className="p-5">
                                    <form onSubmit={handleBuscarCliente} className="flex gap-2 mb-4">
                                        <input type="tel" placeholder="Teléfono (ej. 1199998888)"
                                            className="flex-1 input-premium" value={telefonoInput}
                                            onChange={e => setTelefonoInput(e.target.value)} />
                                        <button className="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
                                            disabled={searchLoading}
                                            style={{ background: 'var(--gradient-gold)', color: '#050505', cursor: 'pointer' }}>
                                            {searchLoading ? <RefreshCw className="animate-spin" size={18} /> : <Search size={18} />}
                                        </button>
                                    </form>

                                    <AnimatePresence>
                                        {searchedClient && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                                className="glass-card p-5">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>Cliente</p>
                                                        <h4 className="font-display text-lg">{searchedClient.nombre || 'Nuevo Cliente'}</h4>
                                                        <p className="font-body text-xs" style={{ color: '#D4AF37' }}>{searchedClient.telefono}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>Progreso</p>
                                                        <p className="font-display text-xl">{searchedClient.cortes_acumulados} <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/ {metrics.cortesObjetivo}</span></p>
                                                    </div>
                                                </div>

                                                {askNameMode && (
                                                    <div className="mb-4">
                                                        <label className="font-body text-xs mb-1 block" style={{ color: '#D4AF37' }}>Nombre del cliente</label>
                                                        <input type="text" placeholder="Nombre" className="w-full input-premium"
                                                            value={clientNameInput} onChange={e => setClientNameInput(e.target.value)} />
                                                    </div>
                                                )}

                                                <button onClick={handleRegistrarCorte} disabled={actionLoading}
                                                    className="w-full py-3 rounded-xl font-body font-bold text-sm flex items-center justify-center gap-2 transition-all"
                                                    style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37', cursor: 'pointer' }}>
                                                    {actionLoading ? <RefreshCw className="animate-spin" size={16} /> : <Scissors size={16} />}
                                                    Confirmar Corte (+1)
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}

                {/* ═══════════════ CLIENTS TAB (CRM) ═══════════════ */}
                {activeTab === 'clients' && (
                    <div className="space-y-5">
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-3.5" size={16} style={{ color: 'var(--text-muted)' }} />
                                <input type="text" placeholder="Buscar por nombre o teléfono..."
                                    className="w-full pl-10 input-premium" value={clientSearch}
                                    onChange={e => setClientSearch(e.target.value)} />
                            </div>
                        </div>

                        <div className="glass-card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.01)' }}>
                                            <th className="p-4 font-body text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Nombre</th>
                                            <th className="p-4 font-body text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Teléfono</th>
                                            <th className="p-4 font-body text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Cortes</th>
                                            <th className="p-4 font-body text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Notas de Estilo</th>
                                            <th className="p-4 font-body text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                                        {filteredClients.map(client => (
                                            <tr key={client.id} className="transition-colors hover:bg-white/[0.01]">
                                                <td className="p-4">
                                                    {client.id === editingClient?.id ? (
                                                        <div className="flex gap-2 items-center">
                                                            <input className="input-premium text-sm w-36" value={newName}
                                                                onChange={e => setNewName(e.target.value)} />
                                                            <button onClick={handleSaveClientName} style={{ color: '#22c55e', cursor: 'pointer' }}><Save size={16} /></button>
                                                            <button onClick={() => setEditingClient(null)} style={{ color: '#ef4444', cursor: 'pointer' }}><X size={16} /></button>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <span className="font-body text-sm" style={{ color: 'var(--text-primary)' }}>
                                                                {client.nombre || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin nombre</span>}
                                                            </span>
                                                            {client.cortes_acumulados >= (metrics.cortesObjetivo - 1) && (
                                                                <span className="ml-2 vip-badge"><Crown size={8} /> VIP</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 font-body text-sm" style={{ color: 'var(--text-secondary)' }}>{client.telefono}</td>
                                                <td className="p-4">
                                                    <span className="font-display text-lg" style={{ color: '#D4AF37' }}>{client.cortes_acumulados}</span>
                                                </td>
                                                <td className="p-4">
                                                    {editingNotes === client.id ? (
                                                        <div className="flex gap-2 items-center">
                                                            <input className="input-premium text-xs w-44" placeholder="Degradado bajo, pomada mate..."
                                                                value={notesValue} onChange={e => setNotesValue(e.target.value)} />
                                                            <button onClick={() => handleSaveNotes(client.id)} style={{ color: '#22c55e', cursor: 'pointer' }}><Save size={14} /></button>
                                                            <button onClick={() => setEditingNotes(null)} style={{ color: '#ef4444', cursor: 'pointer' }}><X size={14} /></button>
                                                        </div>
                                                    ) : (
                                                        <span className="font-body text-xs" style={{ color: client.notas_estilo ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                                                            {client.notas_estilo || '—'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 flex gap-2">
                                                    <button onClick={() => { setEditingClient(client); setNewName(client.nombre || ''); }}
                                                        className="p-2 rounded-lg transition-all hover:bg-white/[0.03]"
                                                        title="Editar nombre" style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>
                                                        <Edit2 size={15} />
                                                    </button>
                                                    <button onClick={() => { setEditingNotes(client.id); setNotesValue(client.notas_estilo || ''); }}
                                                        className="p-2 rounded-lg transition-all hover:bg-white/[0.03]"
                                                        title="Notas de estilo" style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>
                                                        <StickyNote size={15} />
                                                    </button>
                                                    <button onClick={() => window.open(`https://wa.me/${client.telefono}`, '_blank')}
                                                        className="p-2 rounded-lg transition-all hover:bg-white/[0.03]"
                                                        title="WhatsApp" style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>
                                                        <MessageSquare size={15} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredClients.length === 0 && (
                                            <tr><td colSpan={5} className="p-10 text-center font-body text-sm" style={{ color: 'var(--text-muted)' }}>
                                                No se encontraron clientes.
                                            </td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════════════ HALL OF FAME TAB ═══════════════ */}
                {activeTab === 'hall' && (
                    <div className="space-y-6">
                        {/* Podium */}
                        <div className="flex items-end justify-center gap-3 py-8">
                            {[1, 0, 2].map((rank) => {
                                const client = hallOfFame[rank];
                                if (!client) return null;
                                const heights = ['h-40', 'h-32', 'h-24'];
                                const medals = ['🥇', '🥈', '🥉'];
                                return (
                                    <motion.div key={rank}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: rank * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                        className="flex flex-col items-center"
                                    >
                                        <span className="text-3xl mb-2">{medals[rank]}</span>
                                        <p className="font-display text-sm mb-1 truncate max-w-[100px]" style={{ color: 'var(--text-primary)' }}>
                                            {client.nombre?.split(' ')[0] || '—'}
                                        </p>
                                        <p className="font-body text-xs mb-3" style={{ color: '#D4AF37' }}>
                                            {client.cortes_acumulados} cortes
                                        </p>
                                        <div className={`${heights[rank]} w-24 rounded-t-xl flex items-end justify-center pb-2`}
                                            style={{
                                                background: rank === 0 ? 'var(--gradient-gold)' : rank === 1 ? 'linear-gradient(180deg, #C0C0C0, #888)' : 'linear-gradient(180deg, #CD7F32, #8B5A2B)',
                                            }}>
                                            <span className="font-display text-2xl" style={{ color: rank === 0 ? '#050505' : '#fff' }}>{rank + 1}</span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Full Ranking */}
                        <div className="glass-card overflow-hidden">
                            <div className="p-4 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                <Trophy size={16} style={{ color: '#D4AF37' }} />
                                <h3 className="font-body text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Ranking Completo</h3>
                            </div>
                            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                                {hallOfFame.map((client, i) => (
                                    <motion.div key={client.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="flex items-center gap-4 p-4 transition-colors hover:bg-white/[0.01]"
                                    >
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-display text-sm"
                                            style={{
                                                background: i === 0 ? 'var(--gradient-gold)' : i === 1 ? 'linear-gradient(135deg, #C0C0C0, #E8E8E8)' : i === 2 ? 'linear-gradient(135deg, #CD7F32, #E8B87A)' : 'rgba(255,255,255,0.04)',
                                                color: i < 3 ? '#050505' : 'var(--text-muted)',
                                            }}>
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-body text-sm" style={{ color: 'var(--text-primary)' }}>{client.nombre || 'Sin nombre'}</p>
                                            <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>{client.telefono}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="font-display text-lg" style={{ color: '#D4AF37' }}>{client.cortes_acumulados}</p>
                                                <p className="font-body text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>cortes</p>
                                            </div>
                                            <button onClick={() => handleGenerateStory(client, i)}
                                                className="p-2 rounded-lg transition-all hover:bg-white/[0.03]"
                                                title="Generar IG Story" style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>
                                                <Instagram size={16} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════════════ SETTINGS TAB ═══════════════ */}
                {activeTab === 'settings' && sucursal && (
                    <div className="max-w-lg">
                        <div className="glass-card p-6 space-y-5">
                            {[
                                { label: 'Precio del Corte ($)', key: 'precio_corte' as const },
                                { label: 'Meta de Cortes para Premio', key: 'config_cortes_premio' as const },
                                { label: 'Porcentaje de Descuento (%)', key: 'porcentaje_descuento' as const },
                            ].map((field) => (
                                <div key={field.key}>
                                    <label className="font-body text-xs uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>{field.label}</label>
                                    <input type="number" className="w-full input-premium"
                                        value={configForm[field.key]}
                                        onChange={e => setConfigForm({ ...configForm, [field.key]: parseInt(e.target.value) || 0 })} />
                                </div>
                            ))}
                            <button onClick={handleSaveConfig} disabled={savingConfig}
                                className="w-full py-3.5 rounded-xl font-body font-bold text-sm flex items-center justify-center gap-2 transition-all"
                                style={{ background: 'var(--gradient-gold)', color: '#050505', cursor: 'pointer' }}>
                                {savingConfig ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                                Guardar Configuración
                            </button>
                        </div>
                    </div>
                )}

                {/* ═══════════════ QR TAB ═══════════════ */}
                {activeTab === 'qr' && (
                    <div className="flex flex-col items-center justify-center space-y-8 py-10">
                        <QRCodeDisplay />
                        <p className="font-body text-sm text-center max-w-md" style={{ color: 'var(--text-muted)' }}>
                            Imprimí este QR y colocalo en el mostrador. Los clientes pueden escanearlo para ver sus puntos y registrar su llegada.
                        </p>
                    </div>
                )}

                {/* ═══════════════ CHAT TAB ═══════════════ */}
                {activeTab === 'chat' && (
                    <div className="max-w-2xl mx-auto">
                        <AIChat />
                    </div>
                )}
            </main>
        </div>
    );
}
