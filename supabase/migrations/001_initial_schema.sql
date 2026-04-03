-- ========================================
-- Adnexum OS — Initial Database Schema
-- Run this in your Supabase SQL Editor
-- ========================================

-- ========================================
-- ENUMS
-- ========================================
CREATE TYPE lead_estado AS ENUM (
  'Nuevo', 'Interesado', 'Llamada Agendada', 'Propuesta', 'Ganado', 'Perdido'
);

CREATE TYPE lead_temperatura AS ENUM (
  '🔥 Caliente', '🌡 Tibio', '🧊 Frío'
);

CREATE TYPE project_status AS ENUM (
  'Onboarding', 'Desarrollo', 'QA', 'Go-Live', 'Mantenimiento'
);

CREATE TYPE project_developer AS ENUM (
  'Tomás', 'Erwin'
);

CREATE TYPE task_estado AS ENUM (
  'Inbox', 'Próximo', 'En Progreso', 'Esperando', 'Hecho'
);

CREATE TYPE task_prioridad AS ENUM (
  'Alta', 'Media', 'Baja'
);

-- ========================================
-- TABLES
-- ========================================

-- Leads (CRM)
CREATE TABLE leads (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at    timestamptz DEFAULT now(),
  prospecto     text NOT NULL,
  contacto      text,
  whatsapp      text,
  email         text,
  estado        lead_estado DEFAULT 'Nuevo',
  temperatura   lead_temperatura DEFAULT '🧊 Frío',
  ticket_estimado numeric(12,2) DEFAULT 0,
  servicio_interes text,
  ultimo_contacto timestamptz,
  proximo_paso   text
);

-- Projects (Delivery)
CREATE TABLE projects (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lead_id         uuid REFERENCES leads(id) ON DELETE SET NULL,
  nombre          text NOT NULL,
  created_at      timestamptz DEFAULT now(),
  status_delivery project_status DEFAULT 'Onboarding',
  developer       project_developer,
  fecha_entrega   date,
  links_clave     jsonb DEFAULT '[]'::jsonb
);

-- Tasks (GTD)
CREATE TABLE tasks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  titulo      text NOT NULL,
  notas       text,
  created_at  timestamptz DEFAULT now(),
  estado      task_estado DEFAULT 'Inbox',
  prioridad   task_prioridad DEFAULT 'Media',
  lead_id     uuid REFERENCES leads(id) ON DELETE SET NULL,
  project_id  uuid REFERENCES projects(id) ON DELETE SET NULL,
  due_date    date
);

-- ========================================
-- INDEXES
-- ========================================
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_estado ON leads(estado);
CREATE INDEX idx_leads_temperatura ON leads(temperatura);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_lead_id ON projects(lead_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_estado ON tasks(estado);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_lead_id ON tasks(lead_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- LEADS
CREATE POLICY "Users can view own leads"
  ON leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own leads"
  ON leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own leads"
  ON leads FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own leads"
  ON leads FOR DELETE USING (auth.uid() = user_id);

-- PROJECTS
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE USING (auth.uid() = user_id);

-- TASKS
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE USING (auth.uid() = user_id);
