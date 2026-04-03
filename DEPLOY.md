# 🚀 Guía de Despliegue - Adnexum Inspector

## Arquitectura de Producción

```
┌─────────────────┐         ┌─────────────────┐
│    VERCEL       │         │  RAILWAY/RENDER │
│   (Frontend)    │  ───►   │   (Backend API) │
│   Next.js       │         │   FastAPI       │
└─────────────────┘         └─────────────────┘
```

- **Frontend**: Vercel (gratis) - Interfaz web
- **Backend**: Railway o Render (necesita Docker para Playwright)

---

## Opción 1: Deploy Manual

### Paso 1: Subir código a GitHub

```bash
cd "C:\Users\Tomas\Downloads\Creacion de habilidades"

# Inicializar repositorio
git init
git add .
git commit -m "Initial commit - Adnexum Inspector v1.0"

# Crear repo en GitHub y conectar
git remote add origin https://github.com/TU_USUARIO/adnexum-inspector.git
git branch -M main
git push -u origin main
```

### Paso 2: Deploy del Backend en Railway

1. Ve a [railway.app](https://railway.app)
2. Clic en "New Project" → "Deploy from GitHub repo"
3. Selecciona tu repositorio `adnexum-inspector`
4. Railway detectará el `Dockerfile` automáticamente
5. Espera el deploy (puede tardar 5-10 min por Playwright)
6. Una vez desplegado, copia la URL (ej: `https://adnexum-api.railway.app`)

**Variables de entorno en Railway:**
- No requiere variables obligatorias

### Paso 3: Deploy del Frontend en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Clic en "Add New Project" → Importar desde GitHub
3. Selecciona el repositorio
4. **Importante**: Configura el "Root Directory" como `frontend`
5. Agrega la variable de entorno:
   - `NEXT_PUBLIC_API_URL` = `https://tu-api.railway.app` (la URL del Paso 2)
6. Clic en "Deploy"

### Paso 4: Verificar

1. Abre la URL de Vercel (ej: `https://adnexum-inspector.vercel.app`)
2. Ingresa una URL de prueba
3. Verifica que la investigación funcione

---

## Opción 2: Deploy con Render (Alternativa a Railway)

### Backend en Render

1. Ve a [render.com](https://render.com)
2. New → Web Service → Connect GitHub
3. Selecciona el repositorio
4. Configuración:
   - **Name**: `adnexum-api`
   - **Root Directory**: Dejar vacío
   - **Runtime**: Docker
   - **Instance Type**: Starter ($7/mes) o Free (con limitaciones)
5. Deploy

**Nota**: Render Free tiene cold starts de ~30 segundos

---

## Opción 3: Self-Hosted (VPS)

Si prefieres hostear en tu propio servidor:

### Requisitos
- Ubuntu 22.04 o similar
- Docker instalado
- Puerto 8000 abierto

### Pasos

```bash
# Clonar repositorio
git clone https://github.com/TU_USUARIO/adnexum-inspector.git
cd adnexum-inspector

# Build y run con Docker Compose
docker-compose up -d --build

# Verificar
curl http://localhost:8000/
```

Para producción, usa nginx como reverse proxy:

```nginx
server {
    listen 80;
    server_name api.adnexum.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Variables de Entorno

### Backend (Railway/Render)
| Variable | Descripción | Valor |
|----------|-------------|-------|
| `PORT` | Puerto (Railway lo setea auto) | `8000` |

### Frontend (Vercel)
| Variable | Descripción | Valor |
|----------|-------------|-------|
| `NEXT_PUBLIC_API_URL` | URL del backend | `https://tu-api.railway.app` |

---

## Troubleshooting

### Error: "Playwright browsers not installed"
El Dockerfile ya incluye la instalación. Si falla, asegúrate de que el Dockerfile tenga:
```dockerfile
RUN pip install playwright && playwright install chromium
```

### Error: "Connection refused" en Vercel
- Verifica que `NEXT_PUBLIC_API_URL` esté configurado correctamente
- Asegúrate de que el backend esté corriendo

### Timeout en Railway
Railway tiene límite de 5 mins por request. Si la investigación tarda más:
- Usa el endpoint `/api/investigate` con polling (ya implementado)

### CORS errors
El backend ya tiene CORS configurado para aceptar cualquier origen. Si necesitas restringir:
```python
allow_origins=["https://tu-frontend.vercel.app"]
```

---

## Costos Estimados

| Servicio | Plan | Costo |
|----------|------|-------|
| Vercel | Free | $0/mes |
| Railway | Hobby | ~$5/mes |
| Render | Starter | $7/mes |

**Total mínimo**: ~$5-7/mes para backend funcional

---

## Comandos Útiles

```bash
# Ver logs en Railway
railway logs

# Redeploy en Vercel
vercel --prod

# Test local del backend
python api.py

# Test local del frontend
cd frontend && npm run dev
```

---

## Checklist de Deploy

- [ ] Código subido a GitHub
- [ ] Backend desplegado (Railway/Render)
- [ ] Backend health check funciona (`/` retorna ok)
- [ ] Frontend desplegado en Vercel
- [ ] Variable `NEXT_PUBLIC_API_URL` configurada
- [ ] Test de investigación exitoso
- [ ] Dominio personalizado (opcional)

---

**¿Problemas?** Revisa los logs del backend en Railway/Render para más detalles.
