'use client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const webhookUrl = '/api/webhook';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Types ───────────────────────────────────────────────
export interface Sucursal {
    id: string;
    nombre: string;
    config_cortes_premio: number;
    porcentaje_descuento: number;
    precio_corte: number;
}

export interface Cliente {
    id: string;
    telefono: string;
    nombre: string | null;
    cortes_acumulados: number;
    sucursal_id: string | null;
    notas_estilo?: string | null;
}

export interface CorteHistorico {
    id: string;
    cliente_telefono: string;
    fecha: string;
    precio_final: number;
    sucursal_id?: string;
    notas?: string;
    status: 'pending' | 'approved' | 'rejected';
    cliente?: Cliente;
}

// ─── Client Queries ──────────────────────────────────────

export async function getOrCreateCliente(telefono: string, nombre?: string): Promise<Cliente | null> {
    const { data: existing } = await supabase
        .from('clientes')
        .select('*')
        .eq('telefono', telefono)
        .single();

    if (existing) {
        // Update name if provided and client doesn't have one yet
        if (nombre && !existing.nombre) {
            const { data: updated } = await supabase
                .from('clientes')
                .update({ nombre })
                .eq('telefono', telefono)
                .select()
                .single();
            return updated || existing;
        }
        return existing;
    }

    const { data: newCliente, error } = await supabase
        .from('clientes')
        .insert({ telefono, nombre: nombre || null, cortes_acumulados: 0, sucursal_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
        .select()
        .single();

    if (error) {
        console.error('Error creating client:', error);
        return null;
    }
    return newCliente;
}

export async function getCliente(telefono: string): Promise<Cliente | null> {
    const { data } = await supabase
        .from('clientes')
        .select('*')
        .eq('telefono', telefono)
        .single();
    return data;
}

export async function getSucursal(id?: string): Promise<Sucursal | null> {
    const query = supabase.from('sucursales').select('*');
    if (id) query.eq('id', id);
    const { data } = await query.limit(1).single();
    return data;
}

export async function updateSucursalConfig(
    id: string,
    updates: Partial<Sucursal>
): Promise<Sucursal | null> {
    const { data, error } = await supabase
        .from('sucursales')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) console.error('Error updating branch config:', error);
    return data;
}

export async function updateCliente(
    id: string,
    updates: Partial<Cliente>
): Promise<Cliente | null> {
    const { data, error } = await supabase
        .from('clientes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) console.error('Error updating client:', error);
    return data;
}

// ─── Cut Registration (Traceability) ─────────────────────

export async function registrarCorte(
    clienteTelefono: string,
    precioFinal: number,
    sucursalId: string = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    notas?: string,
    requiresApproval: boolean = false
): Promise<{ corte: CorteHistorico | null; cliente: Cliente | null; error?: string; message?: string }> {

    const cliente = await getOrCreateCliente(clienteTelefono);
    if (!cliente) return { corte: null, cliente: null, error: 'Could not create/find client' };

    const status = requiresApproval ? 'pending' : 'approved';
    const { data: corte, error: corteError } = await supabase
        .from('cortes_historico')
        .insert({
            cliente_telefono: clienteTelefono,
            precio_final: precioFinal,
            sucursal_id: sucursalId,
            status,
            ...(notas ? { notas } : {}),
        })
        .select()
        .single();

    if (corteError) {
        console.error('Error registering cut:', corteError);
        return { corte: null, cliente: null, error: corteError.message };
    }

    if (requiresApproval) {
        if (webhookUrl) notifyWebhook(corte, cliente, 'solicitud_corte');
        return { corte, cliente, message: 'Solicitud enviada a la barbería' };
    }

    const { data: clienteUpdated, error: clienteError } = await supabase
        .rpc('incrementar_cortes', { tel: clienteTelefono });

    if (clienteError) {
        const { data: updated } = await supabase
            .from('clientes')
            .update({ cortes_acumulados: (cliente.cortes_acumulados || 0) + 1 })
            .eq('telefono', clienteTelefono)
            .select()
            .single();
        if (webhookUrl) notifyWebhook(corte, updated || cliente, 'nuevo_corte');
        return { corte, cliente: updated };
    }

    if (webhookUrl) notifyWebhook(corte, clienteUpdated || cliente, 'nuevo_corte');
    return { corte, cliente: clienteUpdated };
}

async function notifyWebhook(corte: CorteHistorico, cliente: Cliente, eventType: string = 'nuevo_corte') {
    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event: eventType,
                cliente: { nombre: cliente.nombre || 'Sin nombre', telefono: cliente.telefono, cortes_acumulados: cliente.cortes_acumulados },
                corte: { id: corte.id, precio: corte.precio_final, fecha: corte.fecha, notas: corte.notas, status: corte.status },
                timestamp: new Date().toISOString()
            })
        });
    } catch (e) { console.error('Error notificando webhook:', e); }
}

// ─── Approval Workflow ───────────────────────────────────

export async function getPendingCuts(): Promise<CorteHistorico[]> {
    const { data } = await supabase
        .from('cortes_historico')
        .select('*, cliente:clientes(*)')
        .eq('status', 'pending')
        .order('fecha', { ascending: false });
    return data || [];
}

export async function approveCut(corteId: string): Promise<boolean> {
    const { data: corte, error } = await supabase
        .from('cortes_historico')
        .update({ status: 'approved' })
        .eq('id', corteId)
        .select()
        .single();

    if (error || !corte) return false;

    const { data: cliente } = await supabase
        .from('clientes')
        .select('*')
        .eq('telefono', corte.cliente_telefono)
        .single();

    if (cliente) {
        const { data: updatedCliente } = await supabase
            .rpc('incrementar_cortes', { tel: cliente.telefono });
        notifyWebhook(corte, updatedCliente || cliente, 'nuevo_corte');
    }
    return true;
}

export async function rejectCut(corteId: string): Promise<boolean> {
    const { error } = await supabase
        .from('cortes_historico')
        .update({ status: 'rejected' })
        .eq('id', corteId);
    return !error;
}

export async function resetCortesCliente(clienteTelefono: string): Promise<Cliente | null> {
    const { data } = await supabase
        .from('clientes')
        .update({ cortes_acumulados: 0 })
        .eq('telefono', clienteTelefono)
        .select()
        .single();
    return data;
}

export async function getHistorialCortes(clienteTelefono: string): Promise<CorteHistorico[]> {
    const { data } = await supabase
        .from('cortes_historico')
        .select('*')
        .eq('cliente_telefono', clienteTelefono)
        .order('fecha', { ascending: false });
    return data || [];
}

// ─── BI Dashboard Queries ────────────────────────────────

export async function getDashboardMetrics() {
    const now = new Date();
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const sucursal = await getSucursal();
    const cortesObjetivo = sucursal?.config_cortes_premio || 5;

    // Cuts today
    const { data: cortesHoy } = await supabase
        .from('cortes_historico')
        .select('*')
        .eq('status', 'approved')
        .gte('fecha', today.toISOString())
        .lt('fecha', tomorrow.toISOString());

    // Cuts this month
    const { data: cortesMes } = await supabase
        .from('cortes_historico')
        .select('*')
        .eq('status', 'approved')
        .gte('fecha', monthStart.toISOString());

    // VIP Clients (near prize)
    const { data: vipClients } = await supabase
        .from('clientes')
        .select('*')
        .eq('cortes_acumulados', cortesObjetivo - 1);

    const revenueToday = (cortesHoy || []).reduce((sum, c) => sum + (c.precio_final || 0), 0);
    const revenueMonth = (cortesMes || []).reduce((sum, c) => sum + (c.precio_final || 0), 0);

    // Calculate average recurrence (days between cuts per client this month)
    const totalCutsMonth = (cortesMes || []).length;
    const daysInMonth = now.getDate();
    const avgCutsPerDay = daysInMonth > 0 ? totalCutsMonth / daysInMonth : 0;

    // Revenue projection for month
    const daysRemaining = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - daysInMonth;
    const projectedRevenue = revenueMonth + (avgCutsPerDay * (sucursal?.precio_corte || 5000) * daysRemaining);

    return {
        cortesHoy: cortesHoy?.length || 0,
        cortesMes: totalCutsMonth,
        vipClients: vipClients || [],
        revenueToday,
        revenueMonth,
        projectedRevenue: Math.round(projectedRevenue),
        cortesObjetivo,
        precioCorte: sucursal?.precio_corte || 5000,
        sucursal: sucursal || null,
    };
}

// ─── Hall of Fame (Top Clients this year) ────────────────

export async function getHallOfFame(limit: number = 10): Promise<Cliente[]> {
    const { data } = await supabase
        .from('clientes')
        .select('*')
        .order('cortes_acumulados', { ascending: false })
        .limit(limit);
    return data || [];
}

export async function getAllClientes(): Promise<Cliente[]> {
    const { data } = await supabase
        .from('clientes')
        .select('*')
        .order('cortes_acumulados', { ascending: false });
    return data || [];
}
