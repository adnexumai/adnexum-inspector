# 🔍 Adnexum Inspector - Sistema de Prospección B2B 360°

Sistema automatizado de investigación de negocios para preparar demos y reuniones de ventas con información real y evidencias.

## 🎯 ¿Qué hace?

Cuando le pasas la URL de un negocio, el sistema hace una **investigación completa 360°** y te entrega:

1. **📊 Informe Vendible** → Markdown con problemas detectados, oportunidades y plan de implementación
2. **🎬 Guion Loom** → Script de 60-90 segundos listo para grabar y enviar
3. **📞 Preguntas para Llamada** → 10-12 preguntas personalizadas para la reunión de discovery
4. **📦 Catálogo Excel** → Productos con nombre, precio, descripción, imágenes
5. **💼 Perfil del Negocio** → JSON/Markdown con toda la info del negocio

## 🔬 Fuentes de Investigación

El sistema investiga automáticamente:

| Fuente | Qué Extrae |
|--------|------------|
| **Sitio Web** | Catálogo, precios, contacto, políticas, FAQs |
| **Google Maps** | Rating, cantidad de reseñas, quejas recurrentes, señales de dolor |
| **Redes Sociales** | Seguidores, actividad, engagement, presencia digital |

## 🚀 Instalación

### 1. Instalar dependencias

```bash
cd "C:\Users\Tomas\Downloads\Creacion de habilidades"
pip install -r requirements.txt
```

### 2. Instalar navegador

```bash
python -m playwright install chromium
```

## 💻 Uso

### Comando básico

```bash
python prospector.py --url https://negocio-a-investigar.com
```

### Con carpeta de salida personalizada

```bash
python prospector.py --url https://tienda.com --output ./clientes/cliente_nombre
```

### Ver el navegador (útil para debug)

```bash
python prospector.py --url https://ejemplo.com --no-headless
```

## 📁 Estructura de Salida

Después de ejecutar, se crea una carpeta con todos los entregables:

```
investigaciones/
└── negocio_com_20260125_235530/
    ├── informe_vendible.md        # 📊 Informe con evidencias
    ├── guion_loom.md              # 🎬 Script para grabar Loom
    ├── preguntas_llamada.md       # 📞 Preguntas para discovery
    ├── catalogo_negocio_*.xlsx    # 📦 Productos en Excel
    ├── perfil_negocio_*.json      # 💼 Perfil estructurado
    ├── perfil_negocio_*.md        # 💼 Perfil legible
    └── investigacion_completa.json # 🗂️ Todos los datos en JSON
```

## 📊 Ejemplo de Informe Generado

```markdown
# 📊 Informe de Diagnóstico: Tienda Demo

**Score General:** 55/100

## 🎯 Resumen Ejecutivo
- ⚠️ Tienda Demo tiene áreas críticas que atender (Score: 55/100)
- 🔴 Problema crítico: Tiempo de respuesta lento
- 💰 Mayor oportunidad: Sin WhatsApp Business detectado
- 📊 7 áreas de mejora identificadas → potencial +20-40% conversión

## 🔴 Problemas Detectados

### 1. Rating bajo en Google Maps (3.8⭐)
**Descripción:** El negocio tiene un rating de 3.8/5 con 45 reseñas...
**Evidencia:** Google Maps: 3.8⭐ (45 reseñas)
**💡 Solución Adnexum:** Sistema de seguimiento post-venta y solicitud de reseñas
```

## 🎬 Ejemplo de Guion Loom

```markdown
## 🎯 GANCHO (0:00 - 0:10)
"Hola, soy Tomás de Adnexum. Estuve analizando [Negocio] y encontré algo que creo que te va a interesar..."

## 🔴 PROBLEMA (0:10 - 0:30)
"Vi que los clientes en Google Maps mencionan demoras en la respuesta. 
Esto probablemente significa que están perdiendo consultas que nunca se responden..."

## 💡 SOLUCIÓN (0:45 - 1:05)
"Lo bueno es que esto se puede arreglar. En Adnexum implementamos un bot de WhatsApp 
que responde automáticamente en segundos..."
```

## 🧠 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    prospector.py (Orquestador)                  │
└─────────────────────────────────────┬───────────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
          ▼                           ▼                           ▼
┌─────────────────┐       ┌───────────────────┐       ┌─────────────────┐
│ business_       │       │ google_maps_      │       │ social_         │
│ scraper.py      │       │ scraper.py        │       │ analyzer.py     │
│                 │       │                   │       │                 │
│ • Catálogo      │       │ • Rating          │       │ • Instagram     │
│ • Contacto      │       │ • Reseñas         │       │ • Facebook      │
│ • Políticas     │       │ • Quejas          │       │ • Engagement    │
└────────┬────────┘       └─────────┬─────────┘       └────────┬────────┘
         │                          │                          │
         └──────────────────────────┼──────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │    intelligence_engine.py     │
                    │         "El Cerebro"          │
                    │                               │
                    │ • Cruza datos de todas        │
                    │   las fuentes                 │
                    │ • Detecta problemas           │
                    │ • Identifica oportunidades    │
                    │ • Genera diagnóstico          │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │   prospector_generators.py    │
                    │                               │
                    │ • ReportGenerator             │
                    │ • LoomScriptGenerator         │
                    │ • CallQuestionsGenerator      │
                    └───────────────────────────────┘
                                    │
                                    ▼
                           📁 Carpeta de salida
```

## 📋 Módulos del Sistema

| Módulo | Descripción |
|--------|-------------|
| `prospector.py` | Orquestador principal. Coordina toda la investigación. |
| `business_scraper.py` | Scraper del sitio web del negocio. |
| `google_maps_scraper.py` | Extrae rating, reseñas y señales de dolor desde Maps. |
| `social_analyzer.py` | Analiza presencia en Instagram y Facebook. |
| `intelligence_engine.py` | El "cerebro" que cruza datos y genera diagnóstico. |
| `prospector_generators.py` | Genera informe, guion Loom y preguntas. |
| `selectors_database.py` | Base de datos de selectores CSS por plataforma. |

## 🔧 Configuración

Edita `config.yaml` para personalizar comportamiento:

```yaml
general:
  timeout: 30000      # Timeout en ms
  headless: true      # Navegador sin interfaz
  wait_for_load: 2000 # Espera adicional
```

## 🚨 Limitaciones Conocidas

- **Google Maps**: Puede fallar si hay CAPTCHAs o bloqueos de IP
- **Instagram/Facebook**: Solo extrae datos públicos, no funciona con perfiles privados
- **Scraping web**: Sitios con mucho JavaScript dinámico pueden dar resultados incompletos

## 📈 Workflow de Uso Recomendado

1. **Investigar**: `python prospector.py --url https://prospecto.com`
2. **Revisar**: Abre el informe y valida los hallazgos
3. **Grabar Loom**: Usa el guion generado para grabar un video de 60-90s
4. **Enviar**: Manda el Loom + informe resumido al prospecto
5. **Llamada**: Usa las preguntas para la reunión de discovery
6. **Cerrar**: Presenta solución basada en los dolores confirmados

## 🎯 Casos de Uso

### Prospección Fría
```bash
python prospector.py --url https://negocio-objetivo.com
# Usar el Loom + informe para primer contacto
```

### Preparación de Reunión
```bash
python prospector.py --url https://meeting-tomorrow.com
# Usar preguntas para la llamada de discovery
```

### Análisis Competitivo
```bash
python prospector.py --url https://competidor.com --output ./analisis/competidor1
python prospector.py --url https://otro-competidor.com --output ./analisis/competidor2
# Comparar informes
```

## ✨ Próximas Mejoras (Roadmap)

- [ ] Dashboard web con Streamlit
- [ ] Integración con CRM (HubSpot/Pipedrive)
- [ ] Procesamiento en lotes de múltiples URLs
- [ ] Alertas automáticas de nuevos prospectos
- [ ] Exportación a PDF profesional

---

**Creado para Adnexum** | Sistema de Prospección B2B Automatizado
