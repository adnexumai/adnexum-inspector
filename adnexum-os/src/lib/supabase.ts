import { createClient } from '@/lib/supabase/client';
import type { Lead, Task, CalendarEvent, MessageTemplate, LeadInteraction } from './types';

export const supabase = createClient();

// ============ LEADS ============

export async function getLeads() {
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Lead[];
}

export async function getLeadsByStage(stage: string) {
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('estado_actual', stage)
        .order('updated_at', { ascending: false });
    if (error) throw error;
    return data as Lead[];
}

async function triggerWebhook(event: string, payload: any) {
    try {
        await fetch('/api/trigger-webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event, payload }),
        });
    } catch (err) {
        console.error('Failed to trigger webhook:', err);
    }
}

export async function createLead(lead: Partial<Lead>) {
    const { data, error } = await supabase
        .from('leads')
        .insert([lead])
        .select()
        .single();
    if (error) throw error;

    // Trigger Webhook
    triggerWebhook('lead.created', data);

    return data as Lead;
}

export async function updateLead(id: string, updates: Partial<Lead>) {
    const { data, error } = await supabase
        .from('leads')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;

    // Trigger Webhook
    triggerWebhook('lead.updated', data);

    return data as Lead;
}

export async function moveLead(id: string, newStage: string, previousStage: string) {
    const { error: updateError } = await supabase
        .from('leads')
        .update({
            estado_actual: newStage,
            updated_at: new Date().toISOString(),
            fecha_proximo_followup: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        })
        .eq('id', id);
    if (updateError) throw updateError;

    await supabase.from('lead_stage_history').insert([{
        lead_id: id,
        previous_stage: previousStage,
        new_stage: newStage,
    }]);

    await supabase.from('lead_interactions').insert([{
        lead_id: id,
        tipo_interaccion: 'cambio_etapa',
        descripcion: `${previousStage} → ${newStage}`,
    }]);

    // Trigger Webhook
    triggerWebhook('lead.updated', { id, newStage, previousStage });
}

export async function deleteLead(id: string) {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) throw error;
}

export async function markFollowUp(leadId: string) {
    const { data, error } = await supabase.rpc('mark_follow_up', { p_lead_id: leadId });
    if (error) throw error;
    return data;
}

export async function getFollowUpsPendientes() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('seguimiento_activo', true)
        .not('estado_actual', 'in', '("ganado","perdido")')
        .or(`fecha_proximo_followup.lte.${today},seguido_hoy.eq.false`)
        .order('nivel_interes', { ascending: false });
    if (error) throw error;
    return data as Lead[];
}

// ============ INTERACTIONS ============

export async function getLeadInteractions(leadId: string) {
    const { data, error } = await supabase
        .from('lead_interactions')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data as LeadInteraction[];
}

// ============ TASKS ============

export async function getTasks(filter?: { lead_id?: string; completed?: boolean }) {
    let query = supabase.from('tasks').select('*').order('due_date', { ascending: true });
    if (filter?.lead_id) query = query.eq('lead_id', filter.lead_id);
    if (filter?.completed !== undefined) query = query.eq('completed', filter.completed);
    const { data, error } = await query;
    if (error) throw error;
    return data as Task[];
}

export async function createTask(task: Partial<Task>) {
    const { data, error } = await supabase.from('tasks').insert([task]).select().single();
    if (error) throw error;
    return data as Task;
}

export async function updateTask(id: string, updates: Partial<Task>) {
    const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data as Task;
}

export async function toggleTask(id: string, completed: boolean) {
    return updateTask(id, {
        completed,
        completed_at: completed ? new Date().toISOString() : null,
    });
}

export async function deleteTask(id: string) {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
}

// ============ CALENDAR EVENTS ============

export async function getCalendarEvents(startDate?: string, endDate?: string) {
    let query = supabase.from('calendar_events').select('*').order('start_time', { ascending: true });
    if (startDate) query = query.gte('start_time', startDate);
    if (endDate) query = query.lte('start_time', endDate);
    const { data, error } = await query;
    if (error) throw error;
    return data as CalendarEvent[];
}

export async function createCalendarEvent(event: Partial<CalendarEvent>) {
    const { data, error } = await supabase.from('calendar_events').insert([event]).select().single();
    if (error) throw error;
    return data as CalendarEvent;
}

export async function deleteCalendarEvent(id: string) {
    const { error } = await supabase.from('calendar_events').delete().eq('id', id);
    if (error) throw error;
}

// ============ TEMPLATES ============

export async function getTemplates() {
    const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .order('stage', { ascending: true });
    if (error) throw error;
    return data as MessageTemplate[];
}

export async function createTemplate(template: Partial<MessageTemplate>) {
    const { data, error } = await supabase.from('message_templates').insert([template]).select().single();
    if (error) throw error;
    return data as MessageTemplate;
}

export async function updateTemplate(id: string, updates: Partial<MessageTemplate>) {
    const { data, error } = await supabase
        .from('message_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data as MessageTemplate;
}

export async function deleteTemplate(id: string) {
    const { error } = await supabase.from('message_templates').delete().eq('id', id);
    if (error) throw error;
}

// ============ METRICS ============

export async function getDashboardMetrics() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();

    const [activeLeads, meetings, proposals, won] = await Promise.all([
        supabase.from('leads').select('id', { count: 'exact' }).not('estado_actual', 'in', '("ganado","perdido")'),
        supabase.from('leads').select('id', { count: 'exact' }).or(`fecha_discovery.gte.${startOfWeek},fecha_venta.gte.${startOfWeek}`),
        supabase.from('leads').select('id', { count: 'exact' }).not('propuesta_url', 'eq', ''),
        supabase.from('leads').select('monto_propuesta').eq('estado_actual', 'ganado').gte('updated_at', startOfMonth),
    ]);

    const totalWonAmount = (won.data || []).reduce((sum: number, l: any) => sum + (l.monto_propuesta || 0), 0);

    return {
        pipelineActivo: activeLeads.count || 0,
        reunionesAgendadas: meetings.count || 0,
        propuestasEnviadas: proposals.count || 0,
        ganadosDelMes: (won.data || []).length,
        montoGanado: totalWonAmount,
    };
}
