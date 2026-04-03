---
description: "Genera diagnósticos de venta express (15 min) para prospectos B2B de Adnexum (infraestructura IA). Entrada: datos del negocio/problemas. Salida: Diagnóstico estructurado, costo de no resolver, roadmap y cierre."
---

# Diagnóstico Express - Adnexum

Esta habilidad está diseñada para generar diagnósticos de venta de alto impacto en menos de 15 minutos. Su objetivo es mover al prospecto hacia una llamada de propuesta, destacando profesionalismo y claridad.

## Input Requerido
El usuario debe proporcionar la siguiente información (si falta algo crítico, asume valores conservadores o marca como "A confirmar"):
1.  **Datos**: Nombre del negocio, rubro, ciudad/país.
2.  **Canal**: WhatsApp, Instagram o Facebook.
3.  **Volumen**: Estimado de mensajes/día o semana.
4.  **Problemas**: Dolores actuales (demoras, pérdida de ventas, desorden, etc.).
5.  **Objetivo**: Qué buscan lograr (ventas, eficiencia, orden).
6.  **Stack**: Herramientas actuales (si las hay).

## Reglas de Negocio (CRÍTICAS)
1.  **NO INVENTAR MÉTRICAS**: Si el usuario no da números exactos, usa "Estimado" o "Pendiente por confirmar". No asumas tasas de conversión ni montos exactos de dinero perdido a menos que se puedan inferir lógicamente del volumen dado.
2.  **Tono**: Profesional, directo, B2B. Autoridad en infraestructura de IA. Evita el lenguaje excesivamente "vendedor" o humo. Sé pragmático.
3.  **Longitud**: Máximo 1 página visual. Sé conciso.

## Estructura de Salida Obligatoria

Genera tu respuesta usando estrictamente el siguiente formato Markdown:

### 1. Diagnóstico (3 Bullets)
Resumen directo de la situación actual basado en los problemas y volumen identificados.
*   *Identifica el dolor principal.*
*   *Menciona la ineficiencia operativa detectada.*
*   *Señala el riesgo actual (ej: fuga de leads).*

### 2. Costo de no resolverlo (3 Bullets)
Consecuencias tangibles y dolores futuros si no toman acción.
*   **Operativo**: (Ej: Horas hombre perdidas en tareas repetitivas).
*   **Comercial**: (Ej: Ventas no cerradas por demora en respuesta / Tasa de rebote).
*   **Estratégico**: (Ej: Estancamiento, incapacidad de escalar, desorden de datos).

### 3. Del Punto A al Punto B (Roadmap)
Plan de acción claro en 3 fases:
*   **Fase 1: MVP (7-14 días)**. (Ej: Centralización de canales, respuestas rápidas, primeros bots simples).
*   **Fase 2: Escalado**. (Ej: Automatización de flujo de ventas, seguimiento automático, integración con herramientas).
*   **Fase 3: CRM + Métricas**. (Ej: Dashboards de control, optimización de conversión, CRM dedicado).

### 4. Requisitos Mínimos
Qué necesita poner el cliente de su parte.
*   Accesos administrativos (Meta Business Suite, WhatsApp API).
*   Responsable del proyecto (punto de contacto interno).
*   Catálogo de productos/servicios e información base estructurada.

### 5. Próximo Paso
Call to Action (CTA) para agendar.
*   *Propuesta de valor final corta.*
*   **Pregunta de cierre obligatoria**: (Ej: "¿Te va si lo armamos para esta semana?", "¿Te hace sentido avanzar con la Fase 1?").
