# JL Barber Shop PWA
**Propósito:** Es una aplicación web progresiva (PWA) de gestión y fidelización diseñada para una barbería. Combina un portal de cara al cliente (accesible vía código QR) para rastrear sus cortes, y un panel de administración avanzado (Dashboard) para que el barbero controle ingresos y apruebe visitas.

## 🛠️ Stack Tecnológico
* **Frontend:** Next.js 15 (App Router), React, TypeScript.
* **Estilos y UI:** Tailwind CSS, Shadcn UI (componentes base), Framer Motion (animaciones complejas y transiciones de página).
* **Backend y Base de Datos:** Supabase (PostgreSQL, endpoints directos usando `@supabase/supabase-js`). Se usa *Row Level Security* (RLS) y *Remote Procedure Calls* (RPC) para la lógica de conteo.
* **Hosting:** Vercel.

## 🩸 Estética y Diseño (Design System)
* **Temática:** Inspirado en *Freddy Krueger*.
* **Paleta de Colores:** Fondo muy oscuro (`#060606`), Rojo Sangre (`#8B0000`), Verde Sucio (`#3D5A1F`).
* **Tipografía:** *Bebas Neue* para títulos (display agresivo) y *Outfit* / *Inter* para el texto del cuerpo.
* **Estilo Visual:** *Dark Glassmorphism* (tarjetas translúcidas con sombras), animaciones fluidas y transiciones "de terror" (como el fundido a rojo oscuro al loguearse).

## 👥 Funcionalidades: Lado del Cliente (Frontend)
1. **Landing (Check-in):** Una pantalla minimalista donde el cliente ingresa su Nombre y Teléfono. Tras una animación inmersiva estilo película de terror (tijeras y fundido en sangre), entra a su perfil.
2. **Sistema de Fidelización (JL Pass):** Un perfil propio que muestra cuántos cortes lleva acumulados mediante una "barra de progreso de sangre". Al llegar a cierta meta (ej. 6 cortes), desbloquean un descuento.
3. **Registro de Visita:** El cliente envía una "solicitud" de que se acaba de cortar el pelo.

## ✂️ Funcionalidades: Lado del Barbero (Dashboard Administrativo)
El Dashboard (`/dashboard`) está protegido y se divide en pestañas:
1. **Métricas (Dashboard):** Gráficos de barras semanales, ingresos de hoy y del mes, proyección mensual y una cola de "Aprobaciones" (para aceptar o rechazar las visitas enviadas por los clientes). También destaca clientes "VIP" (a 1 corte del premio).
2. **CRM de Clientes:** Listado de todos los clientes. Permite agregar notas privadas (ej: *"Fade alto, tijera arriba"*), modificar notas y contactarlos por WhatsApp con un clic.
3. **Ranking (Hall of Fame):** Un podio al estilo *gamification* con los 3 mejores clientes históricos, seguido del top 10 general.
4. **QR Builder:** QR gigante permanente apuntando a la web raíz para impresión en el mostrador.
5. **Configuración:** Configurador de negocio para cambiar el precio actual del corte, la meta de cortes necesarios para el premio, y el porcentaje de descuento a aplicar.

## Base de Datos
La base de datos se estructura en tres tablas principales:
- `sucursales`: Contiene las configuraciones globales como precio del corte, meta de recompensas, % de descuento.
- `clientes`: Contiene teléfono, nombre, notas de estilo y cortes acumulados asociados a una sucursal.
- `cortes_historico`: Tracker exhaustivo de todas las transacciones generadas por los clientes que pasan por estado `pending` -> `approved` o `rejected`.
