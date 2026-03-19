# uVoice Navigator — API

API backend enterprise para a plataforma de gestão de interações BCB e processamento de áudios uVoice Navigator.

Construída com **NestJS**, **TypeScript**, **Prisma ORM** e **PostgreSQL**, seguindo princípios de Clean Architecture, DDD e SOLID.

---

## Índice

- [Stack tecnológica](#stack-tecnológica)
- [Arquitectura](#arquitectura)
- [Estrutura do projecto](#estrutura-do-projecto)
- [Modelos de dados](#modelos-de-dados)
- [Endpoints da API](#endpoints-da-api)
- [Autenticação e segurança](#autenticação-e-segurança)
- [FBAC — Controlo de acesso](#fbac--controlo-de-acesso)
- [CronJobs](#cronjobs)
- [Observabilidade](#observabilidade)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Inicialização](#inicialização)
- [Scripts disponíveis](#scripts-disponíveis)
- [Deployment](#deployment)

---

## Stack tecnológica

| Categoria             | Tecnologia                              |
|-----------------------|-----------------------------------------|
| Framework             | NestJS 10 + TypeScript 5                |
| ORM                   | Prisma 5                                |
| Base de dados         | PostgreSQL                              |
| Autenticação          | JWT (access + refresh tokens) + Passport|
| Hashing               | bcrypt (12 rounds)                      |
| Filas / Jobs          | BullMQ + Redis                          |
| Agendamento           | @nestjs/schedule (node-cron)            |
| Documentação          | Swagger / OpenAPI 3                     |
| Email                 | Nodemailer                              |
| Logging               | Winston + nest-winston                  |
| Segurança             | Helmet, Throttler, CORS                 |
| Validação             | class-validator + class-transformer     |
| Health check          | @nestjs/terminus                        |
| Cache                 | cache-manager + ioredis                 |

---

## Arquitectura

O projecto segue **Clean Architecture** com **Domain Driven Design**:

```
Presentation Layer   → Controllers (HTTP handlers)
Application Layer    → Services (casos de uso)
Domain Layer         → Entities + DTOs (regras de negócio)
Infrastructure Layer → Repositories + PrismaService + Jobs
```

Princípios aplicados:
- **Modular Architecture** — cada domínio é um módulo NestJS independente
- **Repository Pattern** — abstracção da camada de acesso a dados
- **Service Layer** — lógica de negócio separada dos controllers
- **SOLID** — injecção de dependências via IoC container do NestJS
- **DTO Validation** — todos os inputs validados com class-validator

---

## Estrutura do projecto

```
api/
├── prisma/
│   ├── schema.prisma          # Definição dos modelos de dados
│   └── seed.ts                # Dados iniciais (roles, permissões, utilizadores)
├── src/
│   ├── main.ts                # Bootstrap da aplicação
│   ├── app.module.ts          # Módulo raiz
│   ├── modules/
│   │   ├── auth/              # Autenticação JWT
│   │   │   ├── strategies/    # JWT + JWT-Refresh strategies
│   │   │   ├── guards/        # JwtAuthGuard, JwtRefreshGuard
│   │   │   └── dto/           # LoginDto, RefreshTokenDto
│   │   ├── users/             # Gestão de utilizadores
│   │   │   ├── entities/      # UserEntity
│   │   │   ├── dto/           # CreateUserDto, UpdateUserDto
│   │   │   └── users.repository.ts
│   │   ├── roles/             # Gestão de roles (FBAC)
│   │   │   ├── entities/      # RoleEntity
│   │   │   └── dto/           # CreateRoleDto, AssignPermissionDto
│   │   ├── permissions/       # Gestão de permissões
│   │   │   ├── entities/      # PermissionEntity
│   │   │   └── dto/           # CreatePermissionDto
│   │   ├── interactions/      # Interações BCB (44 campos)
│   │   │   ├── entities/      # InteractionEntity
│   │   │   ├── dto/           # QueryInteractionsDto, CreateInteractionDto
│   │   │   └── interactions.repository.ts
│   │   ├── audios/            # Ficheiros de áudio
│   │   │   ├── entities/      # AudioEntity
│   │   │   ├── dto/           # QueryAudiosDto, CreateAudioDto
│   │   │   └── audios.repository.ts
│   │   ├── alerts/            # Alertas por email
│   │   │   ├── entities/      # AlertEntity
│   │   │   └── dto/           # CreateAlertDto, UpdateAlertDto
│   │   ├── dashboard/         # Estatísticas e métricas
│   │   ├── jobs/              # CronJobs e processadores BullMQ
│   │   │   └── processors/    # EmailAlertProcessor, AudioProcessingProcessor
│   │   └── health/            # Health check endpoint
│   ├── common/
│   │   ├── decorators/        # @CurrentUser, @Public, @Roles, @Permissions
│   │   ├── filters/           # HttpExceptionFilter (erros padronizados)
│   │   ├── guards/            # RolesGuard
│   │   ├── interceptors/      # LoggingInterceptor, TransformInterceptor
│   │   ├── pipes/             # ValidationPipe global
│   │   └── pagination/        # PaginationDto, PaginatedResult
│   ├── config/
│   │   ├── app.config.ts      # Configuração geral da app
│   │   ├── database.config.ts # PostgreSQL / Prisma
│   │   ├── jwt.config.ts      # JWT secrets e expiração
│   │   ├── redis.config.ts    # Redis / BullMQ
│   │   └── smtp.config.ts     # SMTP para envio de emails
│   └── database/
│       └── prisma.service.ts  # PrismaClient com OnModuleInit
├── logs/                      # Ficheiros de log (gerados em runtime)
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
├── .env.example
└── .gitignore
```

---

## Modelos de dados

### Diagrama de entidades

```
┌──────────┐     ┌──────────┐     ┌─────────────┐
│   User   │────<│ UserRole │>────│    Role     │
│──────────│     └──────────┘     │─────────────│
│ id       │                      │ id          │
│ name     │                      │ name        │
│ email    │     ┌─────────────┐  │ description │
│ password │     │RolePermission│  └──────┬──────┘
│ refresh  │     │─────────────│         │
│ isActive │     │ roleId      │  ┌───────┴──────┐
│ deletedAt│     │ permissionId│  │  Permission  │
└──────────┘     └─────────────┘  │──────────────│
                                  │ id           │
                                  │ name         │
                                  │ resource     │
                                  │ action       │
                                  └──────────────┘

┌─────────────────┐   ┌───────────┐   ┌────────────┐
│  Interaction    │   │   Audio   │   │ EmailAlert │
│─────────────────│   │───────────│   │────────────│
│ id              │   │ id        │   │ id         │
│ recordType      │   │ filename  │   │ recipientEmail│
│ callId          │   │ source    │   │ schedule   │
│ date            │   │ agentName │   │ enabled    │
│ agentName/Id    │   │ phone     │   │ lastSent   │
│ campaign/skill  │   │ duration  │   └────────────┘
│ customer*       │   │ wasabiUrl │
│ talkTime        │   │ fileSize  │   ┌────────────┐
│ handleTime      │   │ status    │   │  AuditLog  │
│ holdTime/ivr    │   └───────────┘   │────────────│
│ disposition*    │                   │ userId     │
│ bcb/ivr fields  │                   │ action     │
│ business* fields│                   │ resource   │
│ evaluated       │                   │ metadata   │
│ status          │                   │ ipAddress  │
└─────────────────┘                   └────────────┘
```

### Detalhes dos modelos

| Modelo          | Campos | Índices | Descrição |
|-----------------|--------|---------|-----------|
| `User`          | 10     | email (único) | Utilizadores com soft delete |
| `Role`          | 5      | name (único) | Papéis para FBAC |
| `Permission`    | 5      | resource+action (único) | Permissões granulares |
| `UserRole`      | 3      | PK composta | Relação N:N utilizador-papel |
| `RolePermission`| 3      | PK composta | Relação N:N papel-permissão |
| `Interaction`   | 44     | date, agentId, campaign, recordType, status, phone | Interações BCB completas |
| `Audio`         | 11     | status, source, agentName, uploadedAt | Ficheiros de áudio |
| `EmailAlert`    | 7      | —       | Configuração de alertas por cron |
| `AuditLog`      | 10     | userId, resource, createdAt | Auditoria de operações |

---

## Endpoints da API

Base URL: `http://localhost:3000/api/v1`
Swagger UI: `http://localhost:3000/api/docs`

### Autenticação — `/auth`

| Método | Endpoint          | Acesso  | Descrição                            |
|--------|-------------------|---------|--------------------------------------|
| POST   | `/auth/login`     | Público | Login com email/senha                |
| POST   | `/auth/refresh`   | Público | Renovar access token via refresh token|
| POST   | `/auth/logout`    | JWT     | Invalidar refresh token              |
| GET    | `/auth/me`        | JWT     | Dados do utilizador autenticado      |

**Login — Request:**
```json
{ "email": "admin@uvoice.com", "password": "Admin@123456" }
```
**Login — Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
  "user": { "id": "...", "name": "Administrador", "email": "...", "roles": ["admin"] }
}
```

---

### Interações BCB — `/interactions`

| Método | Endpoint                        | Roles               | Descrição                    |
|--------|---------------------------------|---------------------|------------------------------|
| GET    | `/interactions`                 | admin, supervisor, operator | Lista paginada com filtros |
| GET    | `/interactions/statistics`      | admin, supervisor   | Totais e taxa de abandono    |
| GET    | `/interactions/:id`             | Todos               | Detalhe de uma interação     |
| POST   | `/interactions`                 | admin, supervisor   | Criar interação              |
| PUT    | `/interactions/:id`             | admin, supervisor   | Actualizar interação         |
| DELETE | `/interactions/:id`             | admin               | Eliminar interação           |

**Query params `GET /interactions`:**

| Parâmetro    | Tipo    | Descrição                                    |
|--------------|---------|----------------------------------------------|
| `page`       | number  | Página (padrão: 1)                           |
| `limit`      | number  | Itens por página (10/20/50/100, padrão: 10)  |
| `search`     | string  | Busca livre (nome, telefone, agente, etc.)   |
| `recordType` | string  | `inbound` ou `outbound`                      |
| `agentName`  | string  | Filtro por nome do agente                    |
| `campaign`   | string  | Filtro por campanha                          |
| `dateFrom`   | string  | Data inicial (ISO 8601)                      |
| `dateTo`     | string  | Data final (ISO 8601)                        |
| `orderBy`    | string  | Campo de ordenação (padrão: `date`)          |
| `orderDir`   | string  | `asc` ou `desc` (padrão: `desc`)             |

---

### Áudios — `/audios`

| Método | Endpoint                  | Roles             | Descrição                  |
|--------|---------------------------|-------------------|----------------------------|
| GET    | `/audios`                 | Todos             | Lista paginada com filtros |
| GET    | `/audios/dashboard-stats` | admin, supervisor | Estatísticas do dashboard  |
| GET    | `/audios/:id`             | Todos             | Detalhe de um áudio        |
| POST   | `/audios`                 | admin, supervisor | Registar novo áudio        |
| PUT    | `/audios/:id`             | admin, supervisor | Actualizar status          |
| DELETE | `/audios/:id`             | admin             | Eliminar registo           |

**Query params `GET /audios`:**

| Parâmetro      | Tipo   | Descrição                         |
|----------------|--------|-----------------------------------|
| `page`         | number | Página                            |
| `limit`        | number | Itens por página                  |
| `search`       | string | Busca livre                       |
| `agentName`    | string | Filtro por agente                 |
| `customerPhone`| string | Filtro por telefone               |
| `source`       | string | `GO_CONTACT` ou `FIVE9`           |
| `dateFrom`     | string | Data inicial                      |
| `dateTo`       | string | Data final                        |

---

### Alertas Email — `/alerts`

| Método | Endpoint              | Roles           | Descrição                     |
|--------|-----------------------|-----------------|-------------------------------|
| GET    | `/alerts`             | admin, supervisor | Lista todos os alertas       |
| POST   | `/alerts`             | admin           | Criar novo alerta             |
| PUT    | `/alerts/:id`         | admin           | Actualizar (activar/desactivar)|
| DELETE | `/alerts/:id`         | admin           | Eliminar alerta               |
| POST   | `/alerts/:id/test`    | admin           | Enviar email de teste imediato|

---

### Dashboard — `/dashboard`

| Método | Endpoint                     | Descrição                              |
|--------|------------------------------|----------------------------------------|
| GET    | `/dashboard/stats?period=7d` | KPIs gerais (period: 7d/14d/30d/90d)  |
| GET    | `/dashboard/trends?period=7d`| Tendência diária (inbound/outbound)    |
| GET    | `/dashboard/hourly`          | Volume por hora do dia                 |
| GET    | `/dashboard/agents`          | Top agentes por volume                 |
| GET    | `/dashboard/sources`         | Distribuição GO CONTACT vs FIVE9       |

---

### Utilizadores — `/users` (admin)

| Método | Endpoint       | Descrição                        |
|--------|----------------|----------------------------------|
| GET    | `/users`       | Lista paginada de utilizadores   |
| POST   | `/users`       | Criar utilizador                 |
| GET    | `/users/:id`   | Detalhe de utilizador            |
| PUT    | `/users/:id`   | Actualizar utilizador            |
| DELETE | `/users/:id`   | Soft delete                      |

---

### Roles & Permissões — `/roles`, `/permissions`

| Método | Endpoint                          | Descrição                       |
|--------|-----------------------------------|---------------------------------|
| GET    | `/roles`                          | Listar roles                    |
| POST   | `/roles`                          | Criar role                      |
| GET    | `/roles/:id`                      | Detalhe da role                 |
| PUT    | `/roles/:id`                      | Actualizar role                 |
| DELETE | `/roles/:id`                      | Eliminar role                   |
| POST   | `/roles/:id/permissions`          | Atribuir permissão à role       |
| DELETE | `/roles/:id/permissions/:permId`  | Remover permissão da role       |
| GET    | `/permissions`                    | Listar todas as permissões      |
| POST   | `/permissions`                    | Criar permissão                 |

---

### Health Check — `/health`

| Método | Endpoint  | Descrição                            |
|--------|-----------|--------------------------------------|
| GET    | `/health` | Status da DB e memória da aplicação  |

**Response:**
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "memory_heap": { "status": "up" }
  }
}
```

---

### Formato padrão de resposta

**Sucesso (lista paginada):**
```json
{
  "data": [...],
  "meta": {
    "total": 200,
    "page": 1,
    "limit": 10,
    "totalPages": 20,
    "hasNextPage": true,
    "hasPrevPage": false,
    "timestamp": "2026-03-16T10:00:00.000Z",
    "version": "1.0"
  }
}
```

**Erro padronizado:**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2026-03-16T10:00:00.000Z",
  "path": "/api/v1/interactions"
}
```

---

## Autenticação e segurança

### Fluxo JWT

```
1. POST /auth/login
   → Valida credenciais (bcrypt compare)
   → Gera accessToken (15 min) + refreshToken (7 dias)
   → Guarda refreshToken hasheado (bcrypt) no DB

2. Requests autenticados
   → Header: Authorization: Bearer <accessToken>
   → JwtStrategy valida e injeta user no request

3. POST /auth/refresh
   → Recebe refreshToken
   → Valida hash no DB
   → Gera novo par de tokens (rotação)

4. POST /auth/logout
   → Remove refreshToken do DB
```

### Mecanismos de segurança

| Mecanismo       | Configuração                                    |
|-----------------|-------------------------------------------------|
| Helmet          | Headers HTTP de segurança                       |
| CORS            | Apenas permite origem do frontend               |
| Rate Limiting   | 100 req/min geral, 5 req/min em `/auth`         |
| ValidationPipe  | `whitelist: true`, `transform: true` — strip extra fields |
| bcrypt          | 12 rounds para passwords e refresh tokens       |
| Soft Delete     | Utilizadores nunca são apagados fisicamente     |
| Audit Log       | Operações críticas registadas com IP + UserAgent|

---

## FBAC — Controlo de acesso

**Function Based Access Control** implementado com roles e permissões granulares.

### Roles padrão (seed)

| Role        | Descrição                                   |
|-------------|---------------------------------------------|
| `admin`     | Acesso total a todos os recursos            |
| `supervisor`| Leitura e escrita em interações, áudios e alertas |
| `operator`  | Apenas leitura em interações e áudios       |

### Permissões disponíveis (formato `resource:action`)

```
interactions:read     interactions:write    interactions:delete
audios:read           audios:write          audios:delete
alerts:read           alerts:manage         alerts:delete
dashboard:read
users:read            users:write           users:delete
roles:read            roles:write           roles:delete
permissions:read      permissions:write
audit:read
health:read
```

### Utilização nos controllers

```typescript
@Get()
@Roles('admin', 'supervisor')
@Permissions('interactions:read')
findAll(@Query() query: QueryInteractionsDto) { ... }
```

- `@Roles()` — verifica se o utilizador possui uma das roles indicadas
- `@Permissions()` — verifica permissão específica via `RolesGuard`
- `@Public()` — marca rota como pública (sem autenticação)
- `JwtAuthGuard` está registado globalmente como `APP_GUARD`

---

## CronJobs

Geridos via `@nestjs/schedule` e processadores BullMQ:

| Job                   | Cron              | Descrição                                         |
|-----------------------|-------------------|---------------------------------------------------|
| `EmailAlertJob`       | `* * * * *` (1 min) | Verifica alertas activos e envia relatórios por email |
| `AudioProcessingJob`  | `*/5 * * * *` (5 min) | Processa áudios com status `pending`           |
| `AuditCleanupJob`     | `0 2 * * *` (2h diário) | Remove audit logs com mais de 90 dias        |
| `DashboardCacheJob`   | `0 * * * *` (1h) | Pré-computa e cacheia estatísticas do dashboard   |

### Fluxo do EmailAlertJob

```
1. Busca todos os EmailAlert com enabled: true
2. Para cada alerta, avalia se o cron schedule corresponde ao momento actual
3. Gera relatório com estatísticas do período
4. Envia email via Nodemailer (SMTP configurado)
5. Actualiza lastSent no banco de dados
```

---

## Observabilidade

### Logging (Winston)

Dois transportes configurados:

| Transport  | Ficheiro                | Nível   | Formato                        |
|------------|-------------------------|---------|-------------------------------|
| Console    | stdout                  | debug   | Colorido com timestamp         |
| File       | `logs/error.log`        | error   | JSON estruturado               |
| File       | `logs/combined.log`     | info    | JSON estruturado               |

Cada request/response é logado pelo `LoggingInterceptor` com:
- Método HTTP, URL, status code
- Duração em ms
- User ID (se autenticado)
- IP do cliente

### Health Check

`GET /api/v1/health` verifica:
- Conectividade com a base de dados PostgreSQL
- Uso de memória heap da aplicação

---

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha os valores:

```bash
cp .env.example .env
```

| Variável               | Padrão                     | Descrição                         |
|------------------------|----------------------------|-----------------------------------|
| `NODE_ENV`             | `development`              | Ambiente da aplicação             |
| `PORT`                 | `3000`                     | Porta do servidor HTTP            |
| `FRONTEND_URL`         | `http://localhost:5173`    | Origem permitida pelo CORS        |
| `DATABASE_URL`         | —                          | Connection string PostgreSQL      |
| `JWT_SECRET`           | —                          | Chave secreta do access token (min 32 chars) |
| `JWT_EXPIRES_IN`       | `15m`                      | Validade do access token          |
| `JWT_REFRESH_SECRET`   | —                          | Chave secreta do refresh token    |
| `JWT_REFRESH_EXPIRES_IN`| `7d`                      | Validade do refresh token         |
| `REDIS_HOST`           | `localhost`                | Host do Redis                     |
| `REDIS_PORT`           | `6379`                     | Porta do Redis                    |
| `REDIS_PASSWORD`       | —                          | Password do Redis (opcional)      |
| `SMTP_HOST`            | `smtp.gmail.com`           | Host do servidor SMTP             |
| `SMTP_PORT`            | `587`                      | Porta SMTP                        |
| `SMTP_USER`            | —                          | Utilizador SMTP                   |
| `SMTP_PASS`            | —                          | Password SMTP (app password)      |
| `SMTP_FROM_EMAIL`      | —                          | Endereço de envio                 |
| `THROTTLE_TTL`         | `60000`                    | Janela de rate limiting (ms)      |
| `THROTTLE_LIMIT`       | `100`                      | Max requests por janela           |
| `THROTTLE_AUTH_LIMIT`  | `5`                        | Max requests auth por janela      |
| `WASABI_ACCESS_KEY`    | —                          | Chave de acesso Wasabi S3         |
| `WASABI_SECRET_KEY`    | —                          | Chave secreta Wasabi S3           |
| `WASABI_BUCKET`        | `uvoice-audio-files`       | Nome do bucket                    |
| `LOG_LEVEL`            | `debug`                    | Nível de logging                  |
| `BCRYPT_ROUNDS`        | `12`                       | Rounds do bcrypt                  |
| `CACHE_TTL`            | `3600`                     | TTL do cache em segundos          |
| `DASHBOARD_CACHE_TTL`  | `300`                      | TTL do cache do dashboard (5 min) |

---

## Inicialização

### Pré-requisitos

- Node.js >= 18
- PostgreSQL >= 14
- Redis >= 6

### Passos

```bash
# 1. Instalar dependências
cd api
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com as suas credenciais

# 3. Criar a base de dados e executar migrations
npx prisma migrate dev --name init

# 4. Popular com dados iniciais
npm run prisma:seed

# 5. Iniciar em modo desenvolvimento
npm run start:dev
```

A API estará disponível em:
- **API:** `http://localhost:3000/api/v1`
- **Swagger:** `http://localhost:3000/api/docs`

### Utilizadores padrão (após seed)

| Email                       | Password       | Role       |
|-----------------------------|----------------|------------|
| `admin@uvoice.com`          | `Admin@123456` | admin      |
| `supervisor@uvoice.com`     | `Super@123456` | supervisor |

---

## Scripts disponíveis

```bash
npm run start:dev          # Servidor com hot-reload
npm run start:debug        # Servidor com debugger
npm run start:prod         # Servidor de produção (dist/)
npm run build              # Compilar TypeScript

npm run prisma:generate    # Gerar Prisma Client
npm run prisma:migrate     # Executar migrations (dev)
npm run prisma:migrate:prod# Executar migrations (produção)
npm run prisma:seed        # Popular dados iniciais
npm run prisma:studio      # Abrir Prisma Studio (GUI)

npm run test               # Testes unitários
npm run test:watch         # Testes em modo watch
npm run test:cov           # Testes com cobertura
npm run test:e2e           # Testes end-to-end

npm run lint               # Linting com ESLint
npm run format             # Formatação com Prettier
```

---

## Deployment

### Build de produção

```bash
npm run build
NODE_ENV=production npm run start:prod
```

### Docker (recomendado)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npx prisma generate

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["node", "dist/main"]
```

### Checklist de produção

- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` e `JWT_REFRESH_SECRET` com pelo menos 64 caracteres aleatórios
- [ ] `BCRYPT_ROUNDS=12` (ou superior)
- [ ] PostgreSQL com SSL habilitado na `DATABASE_URL`
- [ ] Redis com autenticação configurada
- [ ] CORS restrito ao domínio do frontend em produção
- [ ] Logs persistidos em volume externo
- [ ] `prisma migrate deploy` (não `migrate dev`) em produção
- [ ] Health check configurado no load balancer: `GET /api/v1/health`
- [ ] Rate limiting ajustado conforme carga esperada

---

## Ligação com o frontend

Configure a variável no frontend:

```bash
# frontend/.env
VITE_API_URL=http://localhost:3000/api/v1
```

O frontend consome:

| Frontend | API |
|----------|-----|
| `LoginPage` | `POST /auth/login` |
| `DashboardPage` | `GET /dashboard/stats`, `/trends`, `/hourly`, `/agents`, `/sources` |
| `InteractionsPage` | `GET /interactions`, `GET /interactions/statistics` |
| `AudiosPage` | `GET /audios`, `GET /audios/dashboard-stats` |
| `AlertsPage` | `GET/POST/PUT/DELETE /alerts`, `POST /alerts/:id/test` |
| `SettingsPage` | (configuração local — sem endpoint) |
