'use client';

import { useState, useEffect } from 'react';
import { useLeads, useTasks, useCalendar } from '@/lib/hooks';
import { PIPELINE_STAGES } from '@/lib/types';
import {
  TrendingUp,
  Users,
  Phone,
  DollarSign,
  Target,
  AlertTriangle,
  ArrowRight,
  Flame,
  MessageSquare,
  CalendarDays,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { leads } = useLeads();
  const { tasks } = useTasks();
  const { events } = useCalendar();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div style={{ padding: '40px', color: 'var(--color-text-muted)' }}>Cargando...</div>;

  const activeLeads = leads.filter(l => !['ganado', 'perdido'].includes(l.estado_actual));
  const calientes = leads.filter(l => l.nivel_interes === 'caliente' && !['ganado', 'perdido'].includes(l.estado_actual));
  const urgentes = leads.filter(l => l.dias_sin_contacto >= 3 && !['ganado', 'perdido'].includes(l.estado_actual));
  const sinContactar = leads.filter(l => !l.seguido_hoy && l.seguimiento_activo && !['ganado', 'perdido'].includes(l.estado_actual));
  const ganados = leads.filter(l => l.estado_actual === 'ganado');
  const montoTotal = ganados.reduce((sum, l) => sum + (l.monto_propuesta || 0), 0);
  const pendingTasks = tasks.filter(t => !t.completed);
  const todayEvents = events.filter(e => new Date(e.start_time).toDateString() === new Date().toDateString());

  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 86400000);
  const reuniones = leads.filter(l => {
    const disc = l.fecha_discovery ? new Date(l.fecha_discovery) : null;
    const venta = l.fecha_venta ? new Date(l.fecha_venta) : null;
    return (disc && disc >= now && disc <= nextWeek) || (venta && venta >= now && venta <= nextWeek);
  });

  const propuestas = leads.filter(l => l.propuesta_url || l.estado_actual === 'loom_enviado' || l.estado_actual === 'venta_agendada');

  // Leads per stage for chart
  const stageData = PIPELINE_STAGES.filter(s => s.id !== 'perdido').map(stage => ({
    ...stage,
    count: leads.filter(l => l.estado_actual === stage.id).length,
  }));
  const maxCount = Math.max(...stageData.map(s => s.count), 1);

  // Daily KPI counters
  const today = new Date().toDateString();
  const contactosHoy = leads.filter(l => l.seguido_hoy).length;

  return (
    <div style={{ maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '4px' }}>
          <span className="text-gradient">Dashboard</span>
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <KPICard
          icon={<Users size={22} />}
          label="Pipeline Activo"
          value={activeLeads.length}
          accent="var(--color-accent)"
          sub={`${calientes.length} calientes`}
        />
        <KPICard
          icon={<Phone size={22} />}
          label="Reuniones Esta Semana"
          value={reuniones.length}
          accent="var(--color-accent-light)"
          sub="Próximos 7 días"
        />
        <KPICard
          icon={<Target size={22} />}
          label="Propuestas Enviadas"
          value={propuestas.length}
          accent="var(--color-orange)"
          sub="En proceso"
        />
        <KPICard
          icon={<DollarSign size={22} />}
          label="Ganados"
          value={ganados.length}
          accent="var(--color-green)"
          sub={`$${montoTotal.toLocaleString()} USD`}
        />
      </div>

      {/* Action Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {/* Daily Actions */}
        <div className="card-static">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Flame size={18} style={{ color: 'var(--color-orange)' }} />
            <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Acciones del Día
            </h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <MiniStat label="Contactados hoy" value={contactosHoy} color="var(--color-green)" />
            <MiniStat label="Pendientes hoy" value={sinContactar.length} color="var(--color-yellow)" />
            <MiniStat label="Urgentes (3+ días)" value={urgentes.length} color="var(--color-red)" />
            <MiniStat label="Tareas pendientes" value={pendingTasks.length} color="var(--color-accent)" />
          </div>
          <Link href="/seguimiento" style={{ textDecoration: 'none' }}>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>
              <MessageSquare size={16} /> Ir a Seguimiento Diario <ArrowRight size={14} />
            </button>
          </Link>
        </div>

        {/* Today Events */}
        <div className="card-static">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <CalendarDays size={18} style={{ color: 'var(--color-accent-light)' }} />
            <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Agenda de Hoy
            </h3>
          </div>
          {todayEvents.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', padding: '20px 0' }}>
              No hay eventos programados para hoy
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {todayEvents.slice(0, 4).map(event => (
                <div key={event.id} style={{
                  padding: '10px 14px',
                  background: 'var(--color-bg-hover)',
                  borderRadius: '10px',
                  fontSize: '13px',
                }}>
                  <div style={{ fontWeight: 600 }}>{event.title}</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginTop: '2px' }}>
                    {new Date(event.start_time).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    {event.lead_name && ` · ${event.lead_name}`}
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link href="/calendario" style={{ textDecoration: 'none' }}>
            <button className="btn btn-secondary" style={{ width: '100%', marginTop: '16px' }}>
              <CalendarDays size={16} /> Ver Calendario <ArrowRight size={14} />
            </button>
          </Link>
        </div>

        {/* Urgentes */}
        {urgentes.length > 0 && (
          <div className="card-static" style={{ borderColor: 'var(--color-red)', borderWidth: '1px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <AlertTriangle size={18} style={{ color: 'var(--color-red)' }} />
              <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-red-light)' }}>
                Requieren Atención
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {urgentes.slice(0, 4).map(lead => (
                <div key={lead.id} style={{
                  padding: '10px 14px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  borderRadius: '10px',
                  fontSize: '13px',
                  borderLeft: '3px solid var(--color-red)',
                }}>
                  <div style={{ fontWeight: 600 }}>{lead.business_name}</div>
                  <div style={{ color: 'var(--color-red-light)', fontSize: '12px', marginTop: '2px' }}>
                    {lead.dias_sin_contacto} días sin contacto
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pipeline Chart */}
      <div className="card-static" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <TrendingUp size={18} style={{ color: 'var(--color-accent-light)' }} />
          <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Leads por Etapa
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {stageData.map(stage => (
            <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '140px', fontSize: '12px', color: 'var(--color-text-secondary)', flexShrink: 0, textAlign: 'right' }}>
                {stage.emoji} {stage.label}
              </div>
              <div style={{ flex: 1, height: '24px', background: 'var(--color-bg-hover)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(stage.count / maxCount) * 100}%`,
                  background: stage.color,
                  borderRadius: '6px',
                  transition: 'width 0.5s',
                  minWidth: stage.count > 0 ? '24px' : '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: '8px',
                }} />
              </div>
              <div style={{ width: '30px', fontSize: '14px', fontWeight: 700, textAlign: 'center' }}>
                {stage.count}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, accent, sub }: {
  icon: React.ReactNode; label: string; value: number; accent: string; sub: string;
}) {
  return (
    <div className="card hover-lift" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: '-20px', right: '-20px',
        width: '80px', height: '80px', borderRadius: '50%',
        background: accent, opacity: 0.08,
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: accent,
        }}>
          {icon}
        </div>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
      </div>
      <div className="stat-number" style={{ marginBottom: '4px' }}>{value}</div>
      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{sub}</div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ padding: '12px', background: 'var(--color-bg-hover)', borderRadius: '10px', textAlign: 'center' }}>
      <div style={{ fontSize: '24px', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{label}</div>
    </div>
  );
}
