// ============================================
// Database Types (mirrors Supabase schema)
// ============================================

export interface Lead {
    id: string;
    user_id: string;
    created_at: string;
    prospecto: string;
    contacto: string | null;
    whatsapp: string | null;
    email: string | null;
    estado: LeadEstado;
    temperatura: LeadTemperatura;
    ticket_estimado: number;
    servicio_interes: string | null;
    ultimo_contacto: string | null;
    proximo_paso: string | null;
}

export interface Project {
    id: string;
    user_id: string;
    lead_id: string | null;
    nombre: string;
    created_at: string;
    status_delivery: ProjectStatus;
    developer: ProjectDeveloper | null;
    fecha_entrega: string | null;
    links_clave: Record<string, string>[];
    description?: string; // Markdown summary
}

export interface ProjectFile {
    id: string;
    project_id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    uploaded_by: string;
    created_at: string;
}

export interface Task {
    id: string;
    user_id: string;
    titulo: string;
    notas: string | null;
    created_at: string;
    estado: TaskEstado;
    prioridad: TaskPrioridad;
    lead_id: string | null;
    project_id: string | null;
    due_date: string | null;
}

// ============================================
// Enum types (from constants)
// ============================================
export type LeadEstado = string;

export type LeadTemperatura = "🔥 Caliente" | "🌡 Tibio" | "🧊 Frío";

export type TaskEstado =
    | "Inbox"
    | "Próximo"
    | "En Progreso"
    | "Esperando"
    | "Hecho";

export type TaskPrioridad = "Alta" | "Media" | "Baja";

export type ProjectStatus =
    | "Onboarding"
    | "Desarrollo"
    | "QA"
    | "Go-Live"
    | "Mantenimiento";

export type ProjectDeveloper = "Tomás" | "Erwin";

// ============================================
// Form types
// ============================================
export interface LeadFormData {
    prospecto: string;
    contacto?: string;
    whatsapp?: string;
    email?: string;
    temperatura?: LeadTemperatura;
    ticket_estimado?: number;
    servicio_interes?: string;
    estado?: string;
    proximo_paso?: string;
}

export interface TaskFormData {
    titulo: string;
    notas?: string;
    prioridad?: TaskPrioridad;
    lead_id?: string;
    project_id?: string;
    due_date?: string;
}

export interface ProjectFormData {
    nombre: string;
    lead_id?: string;
    status?: ProjectStatus;
    developer?: ProjectDeveloper;
    fecha_entrega?: string;
    links_clave?: Record<string, string>[];
}
