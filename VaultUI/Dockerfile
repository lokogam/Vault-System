# Usar Node.js 20 (compatible con Vite 7)
FROM node:20-alpine

# Instalar dependencias del sistema
RUN apk add --no-cache git

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Crear usuario no root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Cambiar propietario del directorio
RUN chown -R nextjs:nodejs /app
USER nextjs

# Exponer puerto
EXPOSE 5173

# Comando por defecto para desarrollo
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
