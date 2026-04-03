// ============================================
// Lead States
// ============================================
export const LEAD_ESTADOS = [
    "Nuevo",
    "Interesado",
    "Llamada Agendada",
    "Propuesta",
    "Ganado",
    "Perdido",
] as const;

export type LeadEstado = (typeof LEAD_ESTADOS)[number];

export const LEAD_TEMPERATURAS = [
    "🔥 Caliente",
    "🌡 Tibio",
    "🧊 Frío",
] as const;

export type LeadTemperatura = (typeof LEAD_TEMPERATURAS)[number];

// ============================================
// Task States
// ============================================
export const TASK_ESTADOS = [
    "Inbox",
    "Próximo",
    "En Progreso",
    "Esperando",
    "Hecho",
] as const;

export type TaskEstado = (typeof TASK_ESTADOS)[number];

export const TASK_PRIORIDADES = ["Alta", "Media", "Baja"] as const;

export type TaskPrioridad = (typeof TASK_PRIORIDADES)[number];

// ============================================
// Project States
// ============================================
export const PROJECT_STATUSES = [
    "Onboarding",
    "Desarrollo",
    "QA",
    "Go-Live",
    "Mantenimiento",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_DEVELOPERS = ["Tomás", "Erwin"] as const;

export type ProjectDeveloper = (typeof PROJECT_DEVELOPERS)[number];

// ============================================
// Color mappings
// ============================================
export const TEMPERATURA_COLORS: Record<LeadTemperatura, string> = {
    "🔥 Caliente": "text-red-400 bg-red-500/10 border-red-500/20",
    "🌡 Tibio": "text-orange-400 bg-orange-500/10 border-orange-500/20",
    "🧊 Frío": "text-blue-400 bg-blue-500/10 border-blue-500/20",
};

export const ESTADO_COLORS: Record<LeadEstado, string> = {
    "Nuevo": "text-zinc-400",
    "Interesado": "text-blue-400",
    "Llamada Agendada": "text-yellow-400",
    "Propuesta": "text-purple-400",
    "Ganado": "text-emerald-400",
    "Perdido": "text-red-400",
};

export const PRIORIDAD_COLORS: Record<TaskPrioridad, string> = {
    "Alta": "text-red-400 bg-red-500/10 border-red-500/20",
    "Media": "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    "Baja": "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
    "Onboarding": "text-blue-400 bg-blue-500/10 border-blue-500/20",
    "Desarrollo": "text-purple-400 bg-purple-500/10 border-purple-500/20",
    "QA": "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    "Go-Live": "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    "Mantenimiento": "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
};
