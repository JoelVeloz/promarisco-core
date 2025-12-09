# Promarisco Backend

API REST para gestión de usuarios, reportes y integración con Wailon.

## Requisitos

- Node.js 22+
- MongoDB
- Variables de entorno configuradas

## Variables de Entorno

```env
PORT=3000
DATABASE_URL=mongodb://...
FRONTEND_CLIENT_URL=http://...
AUTH_SECRET=...
BASE_URL=http://...
WAILON_TOKEN=...
```

## Instalación

```bash
npm install
npx prisma generate
```

## Desarrollo

```bash
npm run start:dev
```

## Producción

```bash
npm run build
npm run start:prod
```

## Docker

```bash
docker-compose up -d
```

## API

Documentación disponible en `/api` cuando el servidor está corriendo.

## Módulos

- **Auth**: Autenticación con Better Auth
- **Users**: CRUD de usuarios
- **Reports**: Reportes de geocercas y eventos
- **Wailon**: Integración con Wailon para reportes de tracking
