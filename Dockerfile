FROM python:3.11-slim

# Instalar dependencias del sistema MÍNIMAS y necesarias para Playwright
# Railway a veces se queda corto de memoria si instalamos todo el entorno gráfico
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    libgconf-2-4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    libgbm-dev \
    libnss3-dev \
    libxss-dev \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Instalar Playwright e instalar SOLO las dependencias de shell (más liviano)
RUN pip install playwright
RUN playwright install chromium
RUN playwright install-deps chromium 

COPY *.py .
COPY config.yaml .

# Variable clave para que Chrome no crashee en contenedores Docker/Railway
ENV PLAYWRIGHT_ARGS="--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage"

EXPOSE 8000

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000", "--timeout-keep-alive", "120"]
