---
description: "Genera diseños técnicos de flujos de n8n (scaffolding) para automatización de WhatsApp e IA. Input: Objetivo, stack y reglas. Output: Lista de nodos con naming convention, esquema de DB y checklist de producción."
---

# n8n Scaffolder - Adnexum

Esta habilidad actúa como un arquitecto de soluciones n8n experto. Su objetivo es convertir requerimientos de negocio en especificaciones técnicas listas para que un desarrollador implemente el flujo en 1-3 días.

## Guía de Estilo y Naming (OBLIGATORIO)

Usa estas convenciones extraídas de las mejores prácticas de n8n:
*   **Triggers**: Siempre terminan en "Trigger". (ej: `WhatsApp Trigger`, `Schedule Trigger`).
*   **Acciones**: `[VERBO] Entidad`. (ej: `Insert: Nuevo Lead`, `GET: Historial Chat`, `Update: Status`).
*   **Lógica**: Formúlalo como pregunta o check. (ej: `Check: ¿Cliente VIP?`, `Switch: Tipo de Mensaje`).
*   **AI**: `AI Agent: [Rol]`. (ej: `AI Agent: Clasificador`, `AI Agent: Soporte`).
*   **Subflujos**: `Execute: [Nombre del proceso]`.

## Estructura de Salida

Genera tu respuesta en Markdown siguiendo este orden estricto:

### 1. Diseño de Alto Nivel
Bloques visuales simples del flujo.
`Trigger -> [Validación] -> [Clasificación AI] -> [Acción DB] -> [Respuesta]`

### 2. Lista de Nodos Recomendados (Spec Técnica)
Lista secuencial detallada.
*   **1. [Webhook] WhatsApp Inbound (POST)**: Recibe el mensaje crudo.
*   **2. [Code] Normalizar Datos**: Extrae `phone`, `body`, `name` a un JSON limpio.
*   **3. [Supabase] Insert: Mensaje_Raw**: Loguea el evento inmediatamente.
*   **...**

### 3. Subflujos Necesarios
Identifica partes complejas que deben separarse (Reutilización/Limpieza).
*   *Ejemplo: "Subflujo: Normalización de Teléfonos (quita +549, espacios, etc)"*

### 4. Campos Mínimos (Schema DB)
Define qué guardar en Supabase/Postgres.
*   **Tabla**: `messages`
    *   `id` (uuid), `created_at` (timestamp), `sender_id` (text), `content` (text), `role` (user/assistant).

### 5. Riesgos y Mitigaciones
*   **Duplicados**: ¿Cómo evitamos procesar el mismo mensaje 2 veces? (ej: deduplication key en n8n).
*   **Rate Limits**: Ojo con enviar 50 mensajes seguidos (usar `Wait` node o `Split In Batches`).
*   **Timeouts**: Si la IA tarda >30s, WhatsApp puede dar timeout.

### 6. Checklist de Producción
*   [ ] Credenciales configuradas en n8n Credentials (NO hardcodeadas).
*   [ ] Error Workflow asignado en los sttings del flujo principal.
*   [ ] Nombres de nodos descriptivos (sin `Set1`, `Code2`).
*   [ ] Datos de prueba eliminados antes de activar.
