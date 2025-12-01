# Usar la imagen base de Node.js en Alpine
FROM node:20.18.0-alpine3.20

# Establecer la zona horaria
ENV TZ=America/Guayaquil
RUN apk add --no-cache tzdata && \
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto de la aplicación
COPY . .

# # Generar el código del cliente de Prisma
# RUN npx prisma generate

# Construir la aplicación
RUN npm run build

# Comando para ejecutar la aplicación
CMD ["npm", "run", "start:prod"]
