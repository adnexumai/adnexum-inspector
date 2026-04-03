---
description: "Diseña dashboards de métricas para clientes de Adnexum. Input: Fuente de datos (Sheets/Supabase) y columnas. Output: KPIs, fórmulas/queries y estructura de visualización."
---

# Dashboard Métricas - Adnexum

Esta habilidad transforma datos crudos de conversaciones en dashboards de negocio accionables. Genera las especificaciones técnicas (SQL o Fórmulas) para implementar los 5 KPIs Core.

## Input Requerido
1.  **Fuente de Datos**: ¿Google Sheets o Supabase (SQL)?
2.  **Columnas Disponibles**: Qué datos tenemos hoy (ej: `fecha`, `monto`, `estado`).
3.  **Objetivo**: ¿Qué decisión se quiere tomar? (Ventas, Soporte, Eficiencia).

## Los 5 KPIs Core (Regla de Negocio)
Siempre intenta calcular estos 5 indicadores fundamentales. Si faltan datos, solicítalos.

1.  **Conversión Total**: % de leads que compran.
2.  **Tiempo de Respuesta**: Velocidad de atención.
3.  **Volumen de Ventas**: Dinero total facturado.
4.  **Distribución de Estados**: Dónde se traban los leads.
5.  **Ticket Promedio**: Valor medio de cada venta.

## Estructura de Salida Obligatoria

### 1. Definición de Métricas
Tabla simple con: KPI | Definición | Por qué importa.

### 2. Estructura de Datos (Schema Check)
Valida si las columnas actuales alcanzan.
*   *Faltante Crítico*: Sugiere columnas necesarias (ej: si quieren tiempos, necesitas `created_at` y `first_response_at`).

### 3. Implementación Técnica (El Código)
Genera el código según la fuente seleccionada.

#### Opción A: Google Sheets (Fórmulas)
Provee las fórmulas listas para copiar.
*   **Conversión**: `=COUNTIF(Status, "Ganado") / COUNTA(ID)`
*   **Ventas Mes**: `=SUMIFS(Monto, Fecha, ">="&DATE(2024,1,1))`

#### Opción B: Supabase (SQL)
Provee las queries para los gráficos.
*   **Ventas por Semanas**:
    ```sql
    SELECT date_trunc('week', created_at) as semana, SUM(amount)
    FROM orders
    GROUP BY 1 ORDER BY 1 DESC;
    ```

### 4. Propuesta Visual
Qué gráficos usar en el dashboard (Looker Studio / Retool / Sheets).
*   *Ventas*: Gráfico de Barras Verticales.
*   *Conversión*: Medidor (Gauge) o Tarjeta simple (Scorecard).
*   *Estados*: Funnel o Sankey chart.

### 5. Checklist de Instrumentación
Qué debe hacer el bot (n8n) para alimentar esto:
*   [ ] Guardar timestamp de cada cambio de estado.
*   [ ] Normalizar montos (número, sin símbolos de moneda).
*   [ ] Estandarizar nombres de estados (no "Vendido" y "vendido").
