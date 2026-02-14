// ============================================
// ADNEXUM OS — Type Definitions
// ============================================

export type NivelInteres = 'frio' | 'tibio' | 'caliente';
export type PotencialVenta = 'bajo' | 'medio' | 'alto';
export type TipoCliente = 'mayorista' | 'minorista' | 'local_servicio' | 'industrial' | 'saas' | 'ecommerce';
export type Fuente = 'instagram' | 'ads' | 'referido' | 'manual' | 'google' | 'whois' | 'whatsapp' | 'linkedin';
export type EventType = 'discovery' | 'venta' | 'followup' | 'loom' | 'otro';

export interface PipelineStage {
    id: string;
    label: string;
    emoji: string;
    color: string;
    order: number;
}

export const PIPELINE_STAGES: PipelineStage[] = [
    { id: 'nuevo_lead', label: 'Nuevo Lead', emoji: '🆕', color: '#6366f1', order: 0 },
    { id: 'mensaje_enviado', label: 'Mensaje Enviado', emoji: '📤', color: '#8b5cf6', order: 1 },
    { id: 'respuesta_recibida', label: 'Respuesta Recibida', emoji: '📥', color: '#a78bfa', order: 2 },
    { id: 'micro_discovery', label: 'Micro Discovery', emoji: '🔍', color: '#c084fc', order: 3 },
    { id: 'discovery_agendar', label: 'Agendar Discovery', emoji: '📅', color: '#e879f9', order: 4 },
    { id: 'discovery_agendada', label: 'Discovery Agendada', emoji: '✅', color: '#f472b6', order: 5 },
    { id: 'discovery_realizada', label: 'Discovery Realizada', emoji: '🎯', color: '#fb7185', order: 6 },
    { id: 'loom_enviado', label: 'Loom Enviado', emoji: '🎥', color: '#f97316', order: 7 },
    { id: 'venta_agendada', label: 'Venta Agendada', emoji: '💰', color: '#eab308', order: 8 },
    { id: 'venta_realizada', label: 'Venta Realizada', emoji: '🤝', color: '#84cc16', order: 9 },
    { id: 'follow_up', label: 'Follow Up', emoji: '🔄', color: '#22c55e', order: 10 },
    { id: 'ganado', label: 'Ganado', emoji: '🏆', color: '#10b981', order: 11 },
    { id: 'perdido', label: 'Perdido', emoji: '❌', color: '#ef4444', order: 12 },
];

export interface Lead {
    id: string;
    user_id?: string;
    created_at: string;
    updated_at: string;

    // Business info
    business_name: string;
    owner_name: string;
    business_phone: string;
    owner_phone: string;
    email: string;
    instagram: string;
    website: string;

    // Classification
    rubro: string;
    ciudad: string;
    tipo_cliente: TipoCliente;
    fuente: Fuente;

    // Pipeline
    estado_actual: string;
    nivel_interes: NivelInteres;
    potencial_venta: PotencialVenta;
    valor_estimado_usd: number;
    monto_propuesta: number;

    // Follow-up
    fecha_ultima_interaccion: string | null;
    fecha_proximo_followup: string | null;
    contador_seguimientos: number;
    dias_sin_contacto: number;
    seguido_hoy: boolean;
    seguimiento_activo: boolean;
    follow_up_interval_days: number;

    // Discovery
    micro_discovery_completado: boolean;
    fecha_discovery: string | null;
    fecha_venta: string | null;

    // Documents
    loom_url: string;
    propuesta_url: string;
    propuesta_pdf_url: string;
    notas_negocio_url: string;
    notas: string;
    sop_links: string;

    tipo_negocio: string;
}

export interface LeadStageHistory {
    id: string;
    lead_id: string;
    user_id: string;
    previous_stage: string;
    new_stage: string;
    notes: string;
    created_at: string;
}

export interface LeadInteraction {
    id: string;
    lead_id: string;
    user_id: string;
    tipo_interaccion: string;
    descripcion: string;
    metadata: Record<string, unknown>;
    created_at: string;
}

export interface Task {
    id: string;
    lead_id: string | null;
    user_id: string;
    title: string;
    description: string;
    due_date: string | null;
    completed: boolean;
    completed_at: string | null;
    stage_related: string;
    priority: 'baja' | 'media' | 'alta' | 'urgente';
    created_at: string;
}

export interface CalendarEvent {
    id: string;
    lead_id: string | null;
    user_id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    event_type: EventType;
    lead_name?: string;
    created_at: string;
}

export interface MessageTemplate {
    id: string;
    user_id: string;
    stage: string;
    title: string;
    content: string;
    template_type: 'whatsapp' | 'email' | 'loom_script';
    created_at: string;
}

// Stage-specific task templates
export const STAGE_TASKS: Record<string, string[]> = {
    nuevo_lead: ['Investigar negocio online', 'Buscar número de WhatsApp del dueño', 'Preparar mensaje de presentación'],
    mensaje_enviado: ['Esperar respuesta 24-48h', 'Preparar follow-up si no responde', 'Investigar redes sociales'],
    respuesta_recibida: ['Analizar nivel de interés', 'Preparar pitch breve de 5 min', 'Confirmar si habla el dueño'],
    micro_discovery: ['Recopilar info básica del negocio', 'Identificar dolores principales', 'Evaluar potencial de venta'],
    discovery_agendar: ['Enviar opciones de horario', 'Confirmar disponibilidad', 'Preparar calendario'],
    discovery_agendada: ['Grabar Loom explicativo previo', 'Preparar preguntas de discovery', 'Revisar info del negocio'],
    discovery_realizada: ['Procesar notas de la llamada', 'Identificar dolores y oportunidades', 'Armar propuesta personalizada'],
    loom_enviado: ['Follow-up 24h después del Loom', 'Preparar recap de dolores', 'Preparar presentación de propuesta'],
    venta_agendada: ['Enviar video 24h antes con punto A-B-C', 'Preparar presentación de fases + ROI', 'Tener CBU listo', 'Cargar celular', 'Revisar guión personalizado'],
    venta_realizada: ['Enviar recap por email', 'Agendar kickoff si cerró', 'Registrar objeciones si no cerró'],
    follow_up: ['Contactar según intervalo configurado', 'Evaluar si sigue interesado', 'Actualizar nivel de interés'],
    ganado: ['🎉 Celebrar cierre', 'Iniciar onboarding', 'Agendar kickoff del proyecto'],
    perdido: ['Registrar motivo de pérdida', 'Agendar follow-up futuro (30-60 días)', 'Aprender de la experiencia'],
};

// KPI targets for daily tracking
export interface DailyKPIs {
    mensajes_enviados: number;
    respuestas_recibidas: number;
    llamadas_agendadas: number;
    llamadas_realizadas: number;
    propuestas_enviadas: number;
    cierres: number;
}

export const DAILY_KPI_TARGETS: DailyKPIs = {
    mensajes_enviados: 20,
    respuestas_recibidas: 5,
    llamadas_agendadas: 3,
    llamadas_realizadas: 2,
    propuestas_enviadas: 1,
    cierres: 0,
};

export interface Project {
    id: string;
    user_id: string;
    lead_id?: string;
    title: string;
    description: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
    start_date?: string;
    end_date?: string;
    budget?: number;
    kpis: Record<string, number>;
    drive_folder_url?: string;
    repo_url?: string;
    figma_url?: string;
    created_at: string;
    updated_at: string;
    lead?: Lead; // Join
}
