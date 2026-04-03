import { useState } from 'react';
import Head from 'next/head';
import {
    BarChart3,
    Users,
    LayoutDashboard,
    MessageSquare,
    Settings,
    Search,
    Briefcase,
    ChevronRight,
    TrendingUp,
    Inbox,
    LogOut
} from 'lucide-react';

// CRM Components (Simulados para el MVP visual)
const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
    <div
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl transition-all ${active ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
    >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
    </div>
);

export default function AdnexumOS() {
    const [view, setView] = useState('dashboard');

    return (
        <div className="flex h-screen bg-[#0B0B0F] text-white">
            <Head>
                <title>Adnexum OS | Operational Excellence</title>
            </Head>

            {/* Sidebar */}
            <aside className="w-64 border-r border-gray-800 p-6 flex flex-col gap-8 bg-[#0F0F13]">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold">A</div>
                    <span className="text-xl font-bold tracking-tight">Adnexum <span className="text-indigo-400">OS</span></span>
                </div>

                <nav className="flex flex-col gap-2 flex-1">
                    <SidebarItem
                        icon={LayoutDashboard}
                        label="Dashboard"
                        active={view === 'dashboard'}
                        onClick={() => setView('dashboard')}
                    />
                    <SidebarItem
                        icon={Search}
                        label="Prospección"
                        active={view === 'prospecting'}
                        onClick={() => setView('prospecting')}
                    />
                    <SidebarItem
                        icon={Users}
                        label="Funnels / CRM"
                        active={view === 'crm'}
                        onClick={() => setView('crm')}
                    />
                    <SidebarItem
                        icon={Inbox}
                        label="Inbox Unificado"
                        active={view === 'inbox'}
                        onClick={() => setView('inbox')}
                    />
                    <SidebarItem
                        icon={Briefcase}
                        label="Activos / Oferta"
                        active={view === 'assets'}
                        onClick={() => setView('assets')}
                    />
                </nav>

                <div className="border-t border-gray-800 pt-6 flex flex-col gap-2">
                    <SidebarItem icon={Settings} label="Configuración" />
                    <SidebarItem icon={LogOut} label="Salir" />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-[#0B0B0F]">
                <header className="h-16 border-b border-gray-800 flex items-center justify-between px-8 bg-[#0F0F13]/50 backdrop-blur-md sticky top-0 z-50">
                    <h2 className="text-lg font-semibold capitalize">{view.replace('-', ' ')}</h2>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-xs text-gray-400">Tomás Adnexum</p>
                            <p className="text-sm font-medium">Administrador</p>
                        </div>
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full border-2 border-gray-800" />
                    </div>
                </header>

                <div className="p-8">
                    {view === 'dashboard' && <DashboardView />}
                    {view === 'prospecting' && <ProspectingView />}
                    {view === 'crm' && <PipelineView />}
                    {view === 'inbox' && <InboxView />}
                    {view === 'assets' && <AssetsView />}
                </div>
            </main>
        </div>
    );
}

// ---- VIEWS ----

const DashboardView = () => (
    <div className="flex flex-col gap-8 animate-in">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Leads Totales" value="248" trend="+12%" />
            <StatCard label="Pipeline Value" value="$14,200" trend="+8%" />
            <StatCard label="Cierres Mes" value="18" trend="+5%" />
            <StatCard label="N PS Score" value="94" trend="+2%" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#0F0F13] p-6 rounded-2xl border border-gray-800 shadow-xl">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <TrendingUp className="text-indigo-400" size={20} />
                    Actividad Reciente
                </h3>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center">✓</div>
                                <div>
                                    <p className="text-sm font-medium">Lead Cerrado: Mottesi Materiales</p>
                                    <p className="text-xs text-gray-500">Hace 2 horas</p>
                                </div>
                            </div>
                            <span className="text-indigo-400 font-bold">$1,500</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-[#0F0F13] p-6 rounded-2xl border border-gray-800 shadow-xl">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <MessageSquare className="text-indigo-400" size={20} />
                    Chats Pendientes
                </h3>
                <div className="space-y-4">
                    {[1, 2].map(i => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg border border-gray-800 cursor-pointer hover:bg-gray-800">
                            <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 font-bold">JD</div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">Juan Perez</p>
                                <p className="text-xs text-gray-400 truncate">¿Cuándo podríamos agendar la demo?</p>
                            </div>
                            <span className="text-[10px] bg-indigo-600 px-2 py-0.5 rounded-full">New</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

const StatCard = ({ label, value, trend }: any) => (
    <div className="bg-[#0F0F13] p-6 rounded-2xl border border-gray-800 hover:border-indigo-500/50 transition-all group">
        <p className="text-sm text-gray-400 mb-2 group-hover:text-indigo-300 transition-colors uppercase tracking-wider font-bold">{label}</p>
        <div className="flex items-end justify-between">
            <span className="text-3xl font-bold">{value}</span>
            <span className="text-green-400 text-sm font-medium bg-green-400/10 px-2 py-0.5 rounded-lg">{trend}</span>
        </div>
    </div>
);

// Mocks para las otras vistas (se completarán en turnos siguientes)
const ProspectingView = () => {
    const [url, setUrl] = useState('');
    const [isDeep, setIsDeep] = useState(true);

    return (
        <div className="max-w-4xl mx-auto py-12 animate-in text-center">
            <div className="inline-block p-3 bg-indigo-500/10 rounded-2xl mb-6">
                <Search className="text-indigo-400" size={32} />
            </div>
            <h1 className="text-4xl font-bold mb-4">Investigación de Mercado 360°</h1>
            <p className="text-gray-400 mb-12 max-w-xl mx-auto">
                Ingresa la URL de tu próximo gran cliente. Adnexum hará un barrido de su web, reputación, competencia e IA para darte la propuesta perfecta.
            </p>

            <div className="bg-[#0F0F13] p-8 rounded-3xl border border-gray-800 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-600/10 transition-all" />

                <div className="flex flex-col gap-6 relative z-10">
                    <div className="flex gap-4">
                        <input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="flex-1 bg-gray-950 border border-gray-800 rounded-2xl px-6 py-4 text-lg outline-none focus:border-indigo-500 transition-all"
                            placeholder="https://empresa-objetivo.com"
                        />
                        <button className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 rounded-2xl font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95">
                            Analizar Ahora
                        </button>
                    </div>

                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" checked={isDeep} onChange={() => setIsDeep(!isDeep)} className="w-5 h-5 rounded-md border-gray-800 bg-gray-950 checked:bg-indigo-600" />
                                <span className="text-sm font-medium group-hover:text-indigo-400 transition-colors">Investigación Profunda (AI 360°)</span>
                            </label>
                        </div>
                        <div className="text-xs text-gray-500">
                            Tiempo estimado: {isDeep ? '3-5 min' : '1 min'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left">
                <FeatureSmall icon={Briefcase} title="Gap Analysis" desc="Compara con tu catálogo" />
                <FeatureSmall icon={Users} title="Market Insights" desc="Noticias y Competencia" />
                <FeatureSmall icon={TrendingUp} title="ROI Predictor" desc="Datos financieros reales" />
            </div>
        </div>
    );
};

const FeatureSmall = ({ icon: Icon, title, desc }: any) => (
    <div className="flex items-start gap-4 p-4 bg-[#0F0F13]/50 rounded-2xl border border-gray-800/50">
        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
            <Icon size={18} />
        </div>
        <div>
            <h4 className="font-semibold text-sm">{title}</h4>
            <p className="text-xs text-gray-500">{desc}</p>
        </div>
    </div>
);
// ---- VIEWS ----

const PipelineView = () => {
    const stages = [
        { name: 'Nuevos', color: 'bg-blue-500' },
        { name: 'Investigación', color: 'bg-purple-500' },
        { name: 'Propuesta', color: 'bg-orange-500' },
        { name: 'Negociación', color: 'bg-indigo-500' },
        { name: 'Cerrados', color: 'bg-green-500' }
    ];

    return (
        <div className="flex gap-4 h-[calc(100vh-180px)] overflow-x-auto pb-4 animate-in">
            {stages.map(stage => (
                <div key={stage.name} className="flex-shrink-0 w-80 flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                            <h3 className="font-semibold">{stage.name}</h3>
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-900 px-2 py-0.5 rounded-full">3 leads</span>
                    </div>

                    <div className="bg-[#0F0F13] p-2 rounded-2xl flex-1 border border-gray-800 space-y-3 overflow-y-auto">
                        {[1, 2].map(i => (
                            <div key={i} className="bg-gray-900 border border-gray-800 p-4 rounded-xl hover:border-indigo-500 transition-all cursor-grab active:cursor-grabbing">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">Hot Lead</span>
                                    <span className="text-xs text-gray-500">2d</span>
                                </div>
                                <h4 className="font-medium mb-1 truncate">Mottesi Materiales</h4>
                                <p className="text-xs text-gray-400 mb-4">Puntos de dolor detectados: 3</p>
                                <div className="flex items-center justify-between border-t border-gray-800 pt-3">
                                    <div className="flex -space-x-2">
                                        <div className="w-6 h-6 rounded-full bg-indigo-600 border border-gray-900 flex items-center justify-center text-[8px]">T</div>
                                    </div>
                                    <span className="text-sm font-bold">$1,200</span>
                                </div>
                            </div>
                        ))}
                        <button className="w-full py-2 border-2 border-dashed border-gray-800 rounded-xl text-gray-500 text-sm hover:border-gray-700 hover:text-gray-400 transition-all">
                            + Añadir Lead
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const InboxView = () => (
    <div className="flex gap-6 h-[calc(100vh-180px)] animate-in">
        {/* Chat List */}
        <div className="w-80 bg-[#0F0F13] rounded-2xl border border-gray-800 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-800">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-indigo-500" placeholder="Buscar chats..." />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`p-4 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-all ${i === 1 ? 'bg-indigo-600/10 border-l-4 border-l-indigo-500' : ''}`}>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 text-sm font-bold">JD</div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-medium text-sm">Juan Delgado</h4>
                                    <span className="text-[10px] text-gray-500">10:45 AM</span>
                                </div>
                                <p className="text-xs text-gray-400 truncate">Me interesa la propuesta del bot...</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Chat Detail */}
        <div className="flex-1 bg-[#0F0F13] rounded-2xl border border-gray-800 flex flex-col overflow-hidden relative">
            <header className="p-4 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 font-bold">JD</div>
                    <div>
                        <h4 className="font-medium">Juan Delgado</h4>
                        <span className="text-xs text-green-400 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                            WhatsApp Online
                        </span>
                    </div>
                </div>
                <button className="bg-gray-800 p-2 rounded-lg hover:bg-gray-700">
                    <Briefcase size={18} />
                </button>
            </header>

            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                <div className="flex justify-start">
                    <div className="bg-gray-800 p-3 rounded-2xl rounded-tl-none max-w-md text-sm leading-relaxed">
                        Hola Tomás, vi el informe de Mottesi Materiales. ¿Cuál sería el costo de implementación inicial?
                    </div>
                </div>
                <div className="flex justify-end">
                    <div className="bg-indigo-600 p-3 rounded-2xl rounded-tr-none max-w-md text-sm leading-relaxed shadow-lg shadow-indigo-500/20">
                        Hola Juan! Según nuestro catálogo Adnexum, la implementación del Bot de IA tiene un costo de $1,200. Incluye integración con tu stock.
                    </div>
                </div>
            </div>

            <div className="p-4 bg-gray-900/50 backdrop-blur-md border-t border-gray-800">
                <div className="flex gap-3">
                    <button className="bg-gray-800 p-2 rounded-xl text-indigo-400 hover:bg-gray-700">
                        <TrendingUp size={20} />
                    </button>
                    <input className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 outline-none focus:border-indigo-500" placeholder="Escribe tu mensaje..." />
                    <button className="bg-indigo-600 px-6 py-2 rounded-xl font-bold hover:bg-indigo-500 active:scale-95 transition-all">
                        Enviar
                    </button>
                </div>
            </div>
        </div>
    </div>
);
const AssetsView = () => (
    <div className="flex flex-col gap-8 animate-in">
        <div className="flex justify-between items-center">
            <div>
                <h3 className="text-2xl font-bold">Gestión de Activos Estratégicos</h3>
                <p className="text-gray-400">Configura lo que vendes para que la IA haga el match perfecto.</p>
            </div>
            <button className="bg-indigo-600 px-6 py-2 rounded-xl font-bold hover:bg-indigo-500 transition-all">
                Guardar Cambios
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Catálogo Editor */}
            <div className="bg-[#0F0F13] rounded-3xl border border-gray-800 overflow-hidden">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                    <h4 className="font-semibold flex items-center gap-2">
                        <Briefcase className="text-indigo-400" size={18} />
                        Catálogo de Servicios (xlsx)
                    </h4>
                    <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">Sincronizado</span>
                </div>
                <div className="p-0 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-900/50">
                            <tr>
                                <th className="px-6 py-3">Servicio</th>
                                <th className="px-6 py-3 text-right">Precio</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {[
                                { id: 1, name: 'Bot WhatsApp IA', price: '$1,200' },
                                { id: 2, name: 'Integración CRM', price: '$800' },
                                { id: 3, name: 'Recuperación ROI', price: '$500+' }
                            ].map(item => (
                                <tr key={item.id} className="hover:bg-gray-800/30 transition-colors">
                                    <td className="px-6 py-4 font-medium">{item.name}</td>
                                    <td className="px-6 py-4 text-right text-indigo-400 font-bold">{item.price}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button className="w-full py-4 text-gray-500 transition-colors hover:text-white border-t border-gray-800 bg-gray-900/20">
                        + Editar Servicios en Excel Online
                    </button>
                </div>
            </div>

            {/* Perfil de Empresa Editor */}
            <div className="bg-[#0F0F13] rounded-3xl border border-gray-800 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-800">
                    <h4 className="font-semibold flex items-center gap-2">
                        <Users className="text-indigo-400" size={18} />
                        Perfil / Promesa de Adnexum (md)
                    </h4>
                </div>
                <div className="flex-1 p-0">
                    <textarea
                        className="w-full h-72 bg-transparent border-none outline-none p-6 text-sm leading-relaxed text-gray-300 resize-none font-mono focus:ring-0"
                        defaultValue={`# Adnexum Power Profile
En Adnexum ayudamos a empresas a escalar mediante automatización.

## Nuestra Promesa
Sincronizamos tus procesos de venta con IA en 7 días.

## Diferenciales
- Implementación 100% personalizada.
- Foco en ROI (Retorno de Inversión) inmediato.`}
                    />
                </div>
            </div>
        </div>
    </div>
);
