---
name: Adnexum — Presentación + Loom desde Transcripción
description: Genera presentaciones para clientes y guiones de Loom a partir de transcripciones de llamadas (discovery/venta), usando documentos de contexto desde NotebookLM (Oferta, Ventas, Procesos, Casos, Objeciones).
---

# Adnexum — Presentación + Loom desde Transcripción

## Objetivo
Cuando el usuario pegue una transcripción de llamada (discovery o venta), generar:
1. Una **PRESENTACIÓN** para el cliente
2. Un **GUIÓN de LOOM** que explique el paso de Punto A a Punto B

Todo usando como contexto los documentos del Notebook de NotebookLM (Oferta, Ventas, Procesos, Casos, Objeciones, etc.).

## Entradas Requeridas

El usuario proporcionará:

1. **Transcripción completa** (texto)
2. **Nombre del cliente + rubro** (si no lo proporciona, inferirlo del texto)
3. **(Opcional)** Link o notas extra

## Reglas Críticas

- ❌ **NO inventes datos duros**. Si faltan números (leads, conversiones, tickets, etc.), pedirlos en "FALTANTES" o proponer rangos claramente marcados como **SUPUESTOS**.
- ✅ Todo debe ser **súper accionable**, en lenguaje de negocio, sin jerga técnica.
- 🎯 Enfócate en: dolor actual, costo de no hacer nada, objetivo deseado, plan en fases, ROI probable, próximos pasos.
- 💬 Estilo: **consultivo, directo, convincente**. No marketing humo.

## Proceso de Trabajo

### 1. Extracción de Información

Extrae de la transcripción:

- Contexto del negocio
- Problemas actuales (Punto A)
- Objetivo deseado (Punto B)
- Objeciones y miedos
- Urgencia / deadline
- Stakeholders y decisión

### 2. Historia de Transformación

Traduce la información a una "Historia de transformación":

- **Hoy**: qué pasa y por qué duele
- **Riesgo**: qué se pierde si no se actúa
- **Nuevo sistema**: cómo se arregla
- **Resultado**: qué cambia y cómo se mide

### 3. Mapeo de Solución

Mapea la solución usando los documentos del Notebook de NotebookLM:

- Qué módulos / componentes aplican (ej: atención 24/7, calificación, seguimiento, CRM, métricas, handoff humano, etc.)
- Qué NO aplica (para no sobre-vender)

### 4. Construcción de Entregables

Arma:
- Una presentación (10–12 slides) + speaker notes
- Un guión para Loom (6–10 minutos) siguiendo la presentación

## Entregables (Formato Exacto)

### A) RESUMEN EJECUTIVO

Máximo 10 líneas:

- 1 línea: **Punto A**
- 1 línea: **Punto B**
- 3–5 bullets: **Dolores principales**
- 3–5 bullets: **Resultados esperados**
- 1 línea: **Próximo paso** (reunión / decisión)

### B) PRESENTACIÓN (10–12 slides)

Para cada slide, proporcionar:

```
Slide X: [Título]
• Bullet 1
• Bullet 2
• Bullet 3
[...]

Nota del orador: [2–5 frases para guiar la explicación]
```

#### Estructura Recomendada de Slides:

1. **Contexto del negocio** (lo que hacen)
2. **Punto A**: síntomas + fricción operativa
3. **Costo de no hacer nada** (tiempo, dinero, oportunidades)
4. **Punto B**: cómo se ve el éxito (definición clara)
5. **Qué está frenando el crecimiento hoy** (cuellos de botella)
6. **Solución propuesta**: el sistema (vista general)
7. **Fase 1 (MVP)**: qué se implementa primero y por qué
8. **Fase 2 (Optimización)**: mejoras + automatizaciones clave
9. **Métricas y tablero**: cómo medimos impacto
10. **Cronograma + responsabilidades** (cliente vs nosotros)
11. **Inversión y ROI** (si hay datos; si no, supuestos + faltantes)
12. **Próximos pasos** (decisión + agenda + checklist)

### C) GUIÓN DE LOOM (6–10 minutos)

Estructura temporal:

- **Hook** (20–30 seg): "Esto es lo que entendí de tu situación…"
- **Punto A** (1–2 min): dolor + ejemplos concretos de la llamada
- **Costo de no hacer nada** (1 min): pérdidas y riesgo
- **Punto B** (1 min): visión de éxito
- **Plan en fases** (2–4 min): Fase 1 y Fase 2
- **Métricas** (30–60 seg): qué vamos a medir
- **CTA final** (20–40 seg): próxima reunión / ok para avanzar

### D) FALTANTES

Lista de preguntas que necesitas para cerrar propuesta con precisión.

Incluir:
- Volumen de leads
- Canales
- Tasa de respuesta
- Conversión
- Ticket promedio
- Capacidad operativa
- Herramientas actuales
- Responsables
- Plazos

## Validación Final

Antes de terminar, revisar que:

- ✅ No hay números inventados sin etiqueta de **SUPUESTO**
- ✅ Se menciona explícitamente **Punto A** y **Punto B**
- ✅ Hay **próximos pasos claros**

## Uso de NotebookLM

Para acceder al contexto necesario:

1. **Primero**, identifica el Notebook ID que contiene los documentos de Adnexum (Oferta, Ventas, Procesos, Casos, Objeciones)
2. **Consulta** los documentos relevantes usando `mcp_notebooklm_notebook_query` con queries específicas como:
   - "¿Cuáles son los módulos y componentes de nuestra solución?"
   - "¿Qué casos de éxito tenemos similares a [rubro del cliente]?"
   - "¿Cuáles son las objeciones comunes y cómo las manejamos?"
   - "¿Cuál es nuestra estructura de fases de implementación?"
3. **Integra** esa información en los entregables sin inventar datos

## Ejemplo de Workflow

1. Usuario proporciona transcripción
2. Leer y analizar la transcripción completa
3. Consultar NotebookLM para obtener contexto de Adnexum
4. Extraer Punto A, Punto B, dolores, objetivos
5. Generar RESUMEN EJECUTIVO
6. Generar PRESENTACIÓN (10-12 slides con notas)
7. Generar GUIÓN DE LOOM
8. Generar lista de FALTANTES
9. Validar que todo cumpla las reglas críticas
10. Presentar todos los entregables al usuario

## Notas Importantes

- Mantén un tono **consultivo y directo**
- Usa **ejemplos concretos** de la llamada
- Marca claramente los **SUPUESTOS** vs datos reales
- Asegúrate de que todo sea **accionable**
- El objetivo es **generar confianza** y **claridad** para el cliente
