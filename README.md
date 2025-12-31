# CardFlow - Digital Business Cards Platform

Plataforma SaaS B2B/B2C para gestión de tarjetas de presentación digitales. El sistema soporta múltiples planes de suscripción, gestión empresarial con roles, analytics avanzado, y alta seguridad de datos.

## Stack Tecnológico

- **Framework**: NestJS 10+
- **Lenguaje**: TypeScript (strict mode)
- **Base de datos**: PostgreSQL 15+
- **ORM**: Prisma
- **Cache**: Redis
- **Colas**: BullMQ
- **Autenticación**: Passport.js (JWT + Local)
- **Documentación**: Swagger/OpenAPI
- **Contenedores**: Docker + Docker Compose

## Requisitos

- Node.js 20+
- Docker y Docker Compose
- PostgreSQL 15+ (o usar Docker)
- Redis 7+ (o usar Docker)

## Inicio Rápido

### 1. Clonar y configurar

```bash
git clone <repo-url>
cd card-flow-platform
cp .env.example .env
```

### 2. Iniciar con Docker (Desarrollo)

```bash
# Iniciar todos los servicios
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Ver logs
docker-compose logs -f api
```

### 3. Desarrollo Local (sin Docker para la API)

```bash
# Instalar dependencias
npm install

# Generar cliente Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate:dev

# Seed de datos iniciales
npm run prisma:seed

# Iniciar servidor de desarrollo
npm run start:dev
```

## Estructura del Proyecto

```
src/
├── main.ts                 # Punto de entrada
├── app.module.ts           # Módulo raíz
├── common/                 # Decoradores, Guards, Filtros, Pipes
├── config/                 # Configuración de la aplicación
├── prisma/                 # Servicio de Prisma
├── redis/                  # Servicio de Redis
└── modules/
    ├── auth/               # Autenticación y autorización
    ├── users/              # Gestión de usuarios
    ├── companies/          # Gestión de empresas
    ├── cards/              # Tarjetas digitales
    ├── public-card/        # Endpoints públicos
    └── health/             # Health checks
```

## API Endpoints

La documentación completa de la API está disponible en:
- **Desarrollo**: `http://localhost:3001/docs`

### Principales Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Registro de usuarios |
| POST | `/api/v1/auth/login` | Inicio de sesión |
| GET | `/api/v1/users/profile` | Perfil del usuario |
| GET | `/api/v1/cards` | Listar tarjetas |
| POST | `/api/v1/cards` | Crear tarjeta |
| GET | `/api/v1/public/cards/:slug` | Ver tarjeta pública |

## Variables de Entorno

Ver `.env.example` para la lista completa de variables requeridas.

## Scripts Disponibles

```bash
npm run start:dev     # Desarrollo con hot reload
npm run build         # Compilar para producción
npm run start:prod    # Iniciar en producción
npm run test          # Ejecutar tests
npm run lint          # Linting
npm run format        # Formatear código
npm run prisma:studio # Abrir Prisma Studio
```

## Planes de Suscripción

| Plan | Tarjetas | Empleados | Características |
|------|----------|-----------|-----------------|
| Basic | 1 | - | QR, Link, Stats básicas |
| Pro | 5 | 10 | Analytics, Branding |
| Enterprise | ∞ | ∞ | Dominio personalizado, API |

## Seguridad

- Autenticación JWT con refresh tokens
- 2FA opcional por email
- Rate limiting por IP
- Encriptación AES-256-GCM para datos sensibles
- Hashing bcrypt (12 rounds) para contraseñas
- Headers de seguridad con Helmet
- Validación de inputs con class-validator
- Sanitización XSS

## Licencia

MIT
