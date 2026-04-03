import { createClient } from "@/lib/supabase/server";
import { KPICard } from "@/components/dashboard/kpi-card";
import { UrgentTasksList } from "@/components/dashboard/urgent-tasks-list";
import { StaleLeadsList } from "@/components/dashboard/stale-leads-list";
import { formatCurrency, getDaysSinceContact } from "@/lib/utils";
import { Lead, Task, Project } from "@/types";
import { DollarSign, Flame, CalendarCheck, Briefcase } from "lucide-react";

// Add specific revalidation to ensure dashboard is fresh
export const revalidate = 60; // Revalidate every minute

export default async function DashboardPage() {
    const supabase = await createClient();

    // Parallel data fetching
    const [leadsRes, tasksRes, projectsRes] = await Promise.all([
        supabase.from("leads").select("*").not("estado", "in", "(Perdido,Ganado)"),
        supabase.from("tasks").select("*").eq("estado", "Incomplete").or("estado.neq.Hecho"), // Fetch not done
        supabase.from("projects").select("*").eq("status", "En Progreso"),
    ]);

    const leads = (leadsRes.data || []) as Lead[];
    const tasks = (tasksRes.data || []).filter(t => t.estado !== 'Hecho') as Task[];
    const projects = (projectsRes.data || []) as Project[];

    // Calculate KPIs
    const pipelineValue = leads.reduce((acc, lead) => acc + (lead.ticket_estimado || 0), 0);
    const hotLeadsCount = leads.filter(l => l.temperatura === "🔥 Caliente").length;

    const today = new Date();
    const tasksTodayCount = tasks.filter(t => {
        if (!t.due_date) return false;
        const due = new Date(t.due_date);
        return due.getDate() === today.getDate() && due.getMonth() === today.getMonth() && due.getFullYear() === today.getFullYear();
    }).length;

    // Stale leads: > 3 days without contact
    const staleLeads = leads.filter(l => {
        const days = getDaysSinceContact(l.ultimo_contacto);
        return days !== null && days > 3;
    }).sort((a, b) => (new Date(a.ultimo_contacto || 0).getTime() - new Date(b.ultimo_contacto || 0).getTime())); // Oldest first

    // Urgent tasks: High priority or Overdue
    const urgentTasks = tasks.filter(t => {
        const isHigh = t.prioridad === "Alta";
        const isOverdue = t.due_date ? new Date(t.due_date) < today : false;
        return isHigh || isOverdue;
    }).sort((a, b) => {
        // Prioritize High Priority, then Date
        if (a.prioridad === "Alta" && b.prioridad !== "Alta") return -1;
        if (a.prioridad !== "Alta" && b.prioridad === "Alta") return 1;
        return 0;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold">Resumen de Operación</h1>
                <p className="text-muted-foreground text-sm flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Sistema activo • {leads.length} leads en seguimiento
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Pipeline Total"
                    value={formatCurrency(pipelineValue)}
                    icon={DollarSign}
                    description="En leads activos"
                />
                <KPICard
                    title="Leads Calientes"
                    value={hotLeadsCount}
                    icon={Flame}
                    description="Necesitan cierre"
                    trend={hotLeadsCount > 0 ? "🔥" : undefined}
                />
                <KPICard
                    title="Tareas para Hoy"
                    value={tasksTodayCount}
                    icon={CalendarCheck}
                    description="Pendientes urgentes"
                />
                <KPICard
                    title="Proyectos Activos"
                    value={projects.length}
                    icon={Briefcase}
                    description="En desarrollo"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
                <div className="md:col-span-4 h-full">
                    <StaleLeadsList leads={staleLeads} />
                </div>
                <div className="md:col-span-3 h-full">
                    <UrgentTasksList tasks={urgentTasks} />
                </div>
            </div>
        </div>
    );
}
