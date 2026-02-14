'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Lead, Task, CalendarEvent, MessageTemplate } from './types';
import * as db from './supabase';

// ============ useLeads ============
export function useLeads() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    const [version, setVersion] = useState(0);

    const refresh = useCallback(() => {
        setVersion(v => v + 1);
    }, []);

    useEffect(() => {
        let mounted = true;
        const fetchLeads = async () => {
            if (!mounted) return;
            setLoading(true);
            try {
                const data = await db.getLeads();
                if (mounted) setLeads(data);
            } catch (err) {
                console.error('Error fetching leads:', err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchLeads();

        const channel = db.supabase
            .channel('leads-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'leads' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setLeads((prev) => [payload.new as Lead, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        setLeads((prev) => prev.map((l) => (l.id === payload.new.id ? (payload.new as Lead) : l)));
                    } else if (payload.eventType === 'DELETE') {
                        setLeads((prev) => prev.filter((l) => l.id !== payload.old.id));
                    }
                }
            )
            .subscribe((status) => {
                // Optional: handle subscription status
            });

        return () => {
            mounted = false;
            db.supabase.removeChannel(channel);
        };
    }, [version]);

    const create = async (lead: Partial<Lead>) => {
        const newLead = await db.createLead(lead);
        setLeads(prev => [newLead, ...prev]);
        return newLead;
    };

    const update = async (id: string, updates: Partial<Lead>) => {
        const updated = await db.updateLead(id, updates);
        setLeads(prev => prev.map(l => l.id === id ? updated : l));
        return updated;
    };

    const move = async (id: string, newStage: string, previousStage: string) => {
        await db.moveLead(id, newStage, previousStage);
        setLeads(prev => prev.map(l => l.id === id ? { ...l, estado_actual: newStage } : l));
    };

    const remove = async (id: string) => {
        await db.deleteLead(id);
        setLeads(prev => prev.filter(l => l.id !== id));
    };

    const markFollowUp = async (id: string) => {
        const result = await db.markFollowUp(id);
        await refresh();
        return result;
    };

    return { leads, loading, refresh, create, update, move, remove, markFollowUp };
}

// ============ useTasks ============
export function useTasks(filter?: { lead_id?: string; completed?: boolean }) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    const [version, setVersion] = useState(0);

    const refresh = useCallback(async () => {
        setVersion(v => v + 1);
    }, []);

    useEffect(() => {
        let mounted = true;

        const fetchTasks = async () => {
            if (!mounted) return;
            setLoading(true);
            try {
                const data = await db.getTasks(filter);
                if (mounted) setTasks(data);
            } catch (err) {
                console.error('Error fetching tasks:', err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchTasks();

        const channel = db.supabase
            .channel('tasks-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tasks' },
                (payload) => {
                    if (filter?.lead_id && payload.new && (payload.new as Task).lead_id !== filter.lead_id) return;

                    if (payload.eventType === 'INSERT') {
                        setTasks((prev) => [...prev, payload.new as Task]);
                    } else if (payload.eventType === 'UPDATE') {
                        setTasks((prev) => prev.map((t) => (t.id === payload.new.id ? (payload.new as Task) : t)));
                    } else if (payload.eventType === 'DELETE') {
                        setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            mounted = false;
            db.supabase.removeChannel(channel);
        };
    }, [version, filter?.lead_id, filter?.completed]);

    const create = async (task: Partial<Task>) => {
        const newTask = await db.createTask(task);
        setTasks(prev => [...prev, newTask]);
        return newTask;
    };

    const update = async (id: string, updates: Partial<Task>) => {
        const updated = await db.updateTask(id, updates);
        setTasks(prev => prev.map(t => t.id === id ? updated : t));
    };

    const toggle = async (id: string, completed: boolean) => {
        const updated = await db.toggleTask(id, completed);
        setTasks(prev => prev.map(t => t.id === id ? updated : t));
    };

    const remove = async (id: string) => {
        await db.deleteTask(id);
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    return { tasks, loading, refresh, create, update, toggle, remove };
}

// ============ useCalendar ============
export function useCalendar() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async (startDate?: string, endDate?: string) => {
        setLoading(true);
        try {
            const data = await db.getCalendarEvents(startDate, endDate);
            setEvents(data);
        } catch (err) {
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    const create = async (event: Partial<CalendarEvent>) => {
        const newEvent = await db.createCalendarEvent(event);
        setEvents(prev => [...prev, newEvent]);
        return newEvent;
    };

    const remove = async (id: string) => {
        await db.deleteCalendarEvent(id);
        setEvents(prev => prev.filter(e => e.id !== id));
    };

    return { events, loading, refresh, create, remove };
}

// ============ useTemplates ============
export function useTemplates() {
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const data = await db.getTemplates();
            setTemplates(data);
        } catch (err) {
            console.error('Error fetching templates:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    const create = async (template: Partial<MessageTemplate>) => {
        const newTemplate = await db.createTemplate(template);
        setTemplates(prev => [...prev, newTemplate]);
        return newTemplate;
    };

    const update = async (id: string, updates: Partial<MessageTemplate>) => {
        const updated = await db.updateTemplate(id, updates);
        setTemplates(prev => prev.map(t => t.id === id ? updated : t));
    };

    const remove = async (id: string) => {
        await db.deleteTemplate(id);
        setTemplates(prev => prev.filter(t => t.id !== id));
    };

    return { templates, loading, refresh, create, update, remove };
}

// ============ useLocalLeads (fallback sin Supabase) ============
export function useLocalLeads() {
    const [leads, setLeads] = useState<Lead[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('adnexum_leads');
        if (stored) setLeads(JSON.parse(stored));
    }, []);

    const save = (newLeads: Lead[]) => {
        setLeads(newLeads);
        localStorage.setItem('adnexum_leads', JSON.stringify(newLeads));
    };

    const create = (lead: Partial<Lead>): Lead => {
        const newLead: Lead = {
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            business_name: lead.business_name || '',
            owner_name: lead.owner_name || '',
            business_phone: lead.business_phone || '',
            owner_phone: lead.owner_phone || '',
            email: lead.email || '',
            instagram: lead.instagram || '',
            website: lead.website || '',
            rubro: lead.rubro || '',
            ciudad: lead.ciudad || '',
            tipo_cliente: lead.tipo_cliente || 'industrial',
            fuente: lead.fuente || 'whatsapp',
            estado_actual: lead.estado_actual || 'nuevo_lead',
            nivel_interes: lead.nivel_interes || 'frio',
            potencial_venta: lead.potencial_venta || 'medio',
            valor_estimado_usd: lead.valor_estimado_usd || 0,
            monto_propuesta: lead.monto_propuesta || 0,
            fecha_ultima_interaccion: new Date().toISOString(),
            fecha_proximo_followup: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
            contador_seguimientos: 0,
            dias_sin_contacto: 0,
            seguido_hoy: false,
            seguimiento_activo: true,
            follow_up_interval_days: lead.follow_up_interval_days || 3,
            micro_discovery_completado: false,
            fecha_discovery: null,
            fecha_venta: null,
            loom_url: lead.loom_url || '',
            propuesta_url: lead.propuesta_url || '',
            propuesta_pdf_url: lead.propuesta_pdf_url || '',
            notas_negocio_url: lead.notas_negocio_url || '',
            notas: lead.notas || '',
            sop_links: lead.sop_links || '',
            tipo_negocio: lead.tipo_negocio || '',
        };
        save([newLead, ...leads]);
        return newLead;
    };

    const update = (id: string, updates: Partial<Lead>) => {
        save(leads.map(l => l.id === id ? { ...l, ...updates, updated_at: new Date().toISOString() } : l));
    };

    const move = (id: string, newStage: string) => {
        save(leads.map(l => l.id === id ? {
            ...l,
            estado_actual: newStage,
            updated_at: new Date().toISOString(),
            fecha_proximo_followup: new Date(Date.now() + (l.follow_up_interval_days || 3) * 86400000).toISOString().split('T')[0],
        } : l));
    };

    const remove = (id: string) => {
        save(leads.filter(l => l.id !== id));
    };

    const markFollowUp = (id: string) => {
        const lead = leads.find(l => l.id === id);
        if (!lead) return;
        const count = (lead.contador_seguimientos || 0) + 1;
        const nextFollowup = new Date(Date.now() + (lead.follow_up_interval_days || 3) * 86400000).toISOString().split('T')[0];
        save(leads.map(l => l.id === id ? {
            ...l,
            contador_seguimientos: count,
            fecha_ultima_interaccion: new Date().toISOString(),
            fecha_proximo_followup: nextFollowup,
            seguido_hoy: true,
            dias_sin_contacto: 0,
            updated_at: new Date().toISOString(),
        } : l));
        return { success: true, next_followup: nextFollowup, follow_up_count: count };
    };

    return { leads, loading: false, create, update, move, remove, markFollowUp, refresh: () => { } };
}

// ============ useLocalTasks ============
export function useLocalTasks() {
    const [tasks, setTasks] = useState<Task[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('adnexum_tasks');
        if (stored) setTasks(JSON.parse(stored));
    }, []);

    const save = (newTasks: Task[]) => {
        setTasks(newTasks);
        localStorage.setItem('adnexum_tasks', JSON.stringify(newTasks));
    };

    const create = (task: Partial<Task>): Task => {
        const newTask: Task = {
            id: crypto.randomUUID(),
            lead_id: task.lead_id || null,
            user_id: '',
            title: task.title || '',
            description: task.description || '',
            due_date: task.due_date || null,
            completed: false,
            completed_at: null,
            stage_related: task.stage_related || '',
            priority: task.priority || 'media',
            created_at: new Date().toISOString(),
        };
        save([...tasks, newTask]);
        return newTask;
    };

    const toggle = (id: string, completed: boolean) => {
        save(tasks.map(t => t.id === id ? { ...t, completed, completed_at: completed ? new Date().toISOString() : null } : t));
    };

    const remove = (id: string) => {
        save(tasks.filter(t => t.id !== id));
    };

    return { tasks, loading: false, create, toggle, remove, refresh: () => { } };
}

// ============ useLocalCalendar ============
export function useLocalCalendar() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('adnexum_events');
        if (stored) setEvents(JSON.parse(stored));
    }, []);

    const save = (newEvents: CalendarEvent[]) => {
        setEvents(newEvents);
        localStorage.setItem('adnexum_events', JSON.stringify(newEvents));
    };

    const create = (event: Partial<CalendarEvent>): CalendarEvent => {
        const newEvent: CalendarEvent = {
            id: crypto.randomUUID(),
            lead_id: event.lead_id || null,
            user_id: '',
            title: event.title || '',
            description: event.description || '',
            start_time: event.start_time || new Date().toISOString(),
            end_time: event.end_time || new Date().toISOString(),
            event_type: event.event_type || 'otro',
            lead_name: event.lead_name || '',
            created_at: new Date().toISOString(),
        };
        save([...events, newEvent]);
        return newEvent;
    };

    const remove = (id: string) => {
        save(events.filter(e => e.id !== id));
    };

    return { events, loading: false, create, remove, refresh: () => { } };
}
