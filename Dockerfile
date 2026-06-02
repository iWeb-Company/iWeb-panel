FROM node:20-alpine

WORKDIR /app

# Instalar dependencias del sistema y el cliente CLI de Docker
RUN apk add --no-cache libc6-compat docker-cli

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml* ./

# Instalar dependencias de producción
RUN pnpm install --frozen-lockfile

# Copiar el resto del código
COPY . .

# Construir Next.js para producción
ENV NODE_ENV=production
RUN pnpm build

# Exponer el puerto 3000
EXPOSE 3000

# Arrancar la aplicación Next.js en el puerto 3000
CMD ["pnpm", "start", "--port", "3000"]
