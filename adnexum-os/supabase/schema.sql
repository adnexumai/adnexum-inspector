-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ROLES ENUM
-- ROLES ENUM
-- We use a DO block to create the type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'tecnico', 'cliente');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- USERS TABLE (Extends auth.users)
create table public.user_roles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  role app_role default 'tecnico',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

-- LEADS TABLE
create table public.leads (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Business Info
  business_name text not null,
  owner_name text,
  business_phone text,
  owner_phone text,
  email text,
  instagram text,
  website text,
  
  -- Classification
  rubro text,
  ciudad text,
  tipo_cliente text check (tipo_cliente in ('mayorista', 'minorista', 'local_servicio', 'industrial', 'saas', 'ecommerce')),
  fuente text check (fuente in ('instagram', 'ads', 'referido', 'manual', 'google', 'whois', 'whatsapp', 'linkedin')),
  
  -- Pipeline Status
  estado_actual text default 'nuevo_lead',
  nivel_interes text check (nivel_interes in ('frio', 'tibio', 'caliente')),
  potencial_venta text check (potencial_venta in ('bajo', 'medio', 'alto')),
  valor_estimado_usd numeric default 0,
  monto_propuesta numeric default 0,
  
  -- Metrics
  fecha_ultima_interaccion timestamp with time zone,
  fecha_proximo_followup date,
  contador_seguimientos integer default 0,
  dias_sin_contacto integer default 0,
  seguido_hoy boolean default false,
  seguimiento_activo boolean default true,
  follow_up_interval_days integer default 3,
  
  -- Process
  micro_discovery_completado boolean default false,
  fecha_discovery timestamp with time zone,
  fecha_venta timestamp with time zone,
  
  -- Documents & Notes
  loom_url text,
  propuesta_url text,
  propuesta_pdf_url text,
  notas_negocio_url text,
  notas text,
  sop_links text,
  tipo_negocio text
);

-- LEAD STAGE HISTORY
create table public.lead_stage_history (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references public.leads not null,
  user_id uuid references auth.users not null,
  previous_stage text,
  new_stage text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- LEAD INTERACTIONS
create table public.lead_interactions (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references public.leads not null,
  user_id uuid references auth.users not null,
  tipo_interaccion text,
  descripcion text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TASKS TABLE
create table public.tasks (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references public.leads,
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  due_date date,
  completed boolean default false,
  completed_at timestamp with time zone,
  stage_related text,
  priority text check (priority in ('baja', 'media', 'alta', 'urgente')) default 'media',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CALENDAR EVENTS TABLE
create table public.calendar_events (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references public.leads,
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  event_type text check (event_type in ('discovery', 'venta', 'followup', 'task', 'otro')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- MESSAGE TEMPLATES TABLE
create table public.message_templates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  stage text,
  title text not null,
  content text not null,
  template_type text check (template_type in ('whatsapp', 'email', 'loom_script')),
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- WEBHOOK CONFIG
create table public.webhook_config (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  url text not null,
  events text[],
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- GAMIFICATION LEVELS (Static reference table)
create table public.gamification_levels (
  level integer primary key,
  title text not null,
  xp_required integer not null,
  emoji text
);

insert into public.gamification_levels (level, title, xp_required, emoji) values
(1, 'Novato', 0, '🌱'),
(2, 'Aprendiz', 100, '📘'),
(3, 'Prospector', 300, '🔍'),
(4, 'Vendedor', 600, '💼'),
(5, 'Estratega', 1000, '🎯'),
(6, 'Experto', 1500, '🏆'),
(7, 'Maestro', 2200, '👑'),
(8, 'Leyenda', 3000, '⚡'),
(9, 'Élite', 4000, '💎'),
(10, 'Jefe Final', 5000, '🔱');


-- ENABLE RLS
alter table public.leads enable row level security;
alter table public.lead_stage_history enable row level security;
alter table public.lead_interactions enable row level security;
alter table public.tasks enable row level security;
alter table public.calendar_events enable row level security;
alter table public.message_templates enable row level security;
alter table public.webhook_config enable row level security;

-- POLICIES (Simple: Users can only see/edit their own data)
create policy "Users can crud their own leads" on public.leads for all using (auth.uid() = user_id);
create policy "Users can crud their own history" on public.lead_stage_history for all using (auth.uid() = user_id);
create policy "Users can crud their own interactions" on public.lead_interactions for all using (auth.uid() = user_id);
create policy "Users can crud their own tasks" on public.tasks for all using (auth.uid() = user_id);
create policy "Users can crud their own events" on public.calendar_events for all using (auth.uid() = user_id);
create policy "Users can crud their own templates" on public.message_templates for all using (auth.uid() = user_id);
create policy "Users can crud their own webhooks" on public.webhook_config for all using (auth.uid() = user_id);

-- FUNCTION: mark_follow_up
create or replace function mark_follow_up(p_lead_id uuid)
returns jsonb as $$
declare
  v_lead public.leads%rowtype;
  v_next_followup date;
  v_count integer;
begin
  select * into v_lead from public.leads where id = p_lead_id;
  
  if v_lead.id is null then
    return jsonb_build_object('success', false, 'error', 'Lead not found');
  end if;

  v_count := coalesce(v_lead.contador_seguimientos, 0) + 1;
  v_next_followup := current_date + coalesce(v_lead.follow_up_interval_days, 3);
  
  update public.leads set
    contador_seguimientos = v_count,
    fecha_ultima_interaccion = now(),
    fecha_proximo_followup = v_next_followup,
    seguido_hoy = true,
    dias_sin_contacto = 0,
    updated_at = now()
  where id = p_lead_id;
  
  insert into public.lead_interactions (lead_id, user_id, tipo_interaccion, descripcion)
  values (p_lead_id, v_lead.user_id, 'whatsapp_contact', 'Contacto #' || v_count);
  
  return jsonb_build_object(
    'success', true,
    'next_followup', v_next_followup,
    'follow_up_count', v_count
  );
end;
$$ language plpgsql security definer;

-- FUNCTION: daily_reset (CRON JOB candidate)
create or replace function daily_reset()
returns void as $$
begin
  -- Reset daily follow-up flag
  update public.leads set seguido_hoy = false;
  
  -- Recalculate days without contact
  update public.leads set dias_sin_contacto = extract(day from (now() - fecha_ultima_interaccion));
end;
$$ language plpgsql security definer;

-- CRON JOB SCHEDULING (Requires pg_cron extension)
-- Enable the extension in Supabase Dashboard -> Database -> Extensions if not already enabled
create extension if not exists "pg_cron";

-- Schedule daily_reset to run every day at midnight UTC
-- Remove existing job if exists to avoid duplicates (safely)
DO $$
BEGIN
    PERFORM cron.unschedule('daily-reset-job');
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

select cron.schedule(
  'daily-reset-job', -- name of the cron job
  '0 0 * * *',       -- every day at 00:00
  $$ select daily_reset() $$
);
