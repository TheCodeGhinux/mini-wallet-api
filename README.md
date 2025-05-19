A progressive NestJS-based Wallet API for Eazipay, with integrations for MongoDB, Redis, and Paystack.

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Running the App](#running-the-app)
  - [Development](#development)
  - [Production](#production)
- [Swagger Documentation](#swagger-documentation)
- [API Endpoints](#api-endpoints)
- [Features](#features)
- [Middleware Setup for Webhooks](#middleware-setup-for-webhooks)
- [Testing](#testing)
- [Docker](#docker)
- [Contributing](#contributing)
- [License](#license)

## Prerequisites

* Node.js v16+ & npm or yarn
* MongoDB running locally or remotely
* Redis running locally or remotely
* Paystack account (for transfers and webhooks)

## Environment Variables

Create a `.env` file in the project root with the following values:

```dotenv
NODE_ENV=development
PORT=4004

# Application
APP_NAME=Eazipay Wallet

# JWT
JWT_SECRET=thisissecret
JWT_EXPIRES_IN=12h

# MongoDB
DATABASE_URL=

# Redis
REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=

# Paystack (leave blank until configured)
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
PAYSTACK_WEBHOOK_SECRET=
```

> **Tip:** Use a tool like \[dotenv-cli] or Nest's `ConfigModule` with Joi schema validation to ensure required env vars are set.

## Installation

```bash
# Clone the repo
$ git clone <repo_url>
$ cd eazipay-wallet

# Install dependencies
$ npm install
# or
$ yarn install
```

## Running the App

### Development

```bash
# watch mode, restarts on changes
$ npm run start:dev
```

### Production

```bash
# build the project
$ npm run build

# start the server
$ npm run start:prod
```

The server will be available at `http://localhost:${process.env.PORT}`.

## Swagger Documentation

Interactive API docs are available at:

```
http://localhost:${process.env.PORT}/api/docs
```

## API Endpoints

| Method | Endpoint               | Description                                | Auth Required |
| ------ | ---------------------- | ------------------------------------------ | ------------- |
| POST   | `/auth/register`       | User registration                          | No            |
| POST   | `/auth/login`          | User login                                 | No            |
| POST   | `/wallet/fund`         | Add funds to wallet                        | Yes           |
| POST   | `/wallet/transfer`     | Transfer funds to another user             | Yes           |
| GET    | `/wallet/balance`      | Get wallet balance                         | Yes           |
| GET    | `/wallet/transactions` | Get wallet transaction history             | Yes           |
| POST   | `/payments/transfer`   | Initiate external transfer (e.g. Paystack) | Yes           |
| POST   | `/paystack/webhook`    | Receive Paystack webhook notifications     | No            |
| GET    | `/transfer/banks`      | Fetch supported bank list from Paystack    | Yes           |

## Features

1. **Configuration & Environment**

   * Global loading of `config()` values via `@nestjs/config`
   * Typed access to secrets (JWT, Redis, database URLs, etc.) through `ConfigService`
   * Joi schema validation for environment variables (optional)

2. **Database & Persistence**

   * MongoDB integration via `@nestjs/mongoose`
   * Automatic application of `mongoose-paginate-v2` plugin on all models

3. **Authentication & Authorization**

   * JWT issuance & verification using `@nestjs/jwt`
   * Global `AuthGuard` (via `APP_GUARD`) protecting all routes by default

4. **Caching**

   * Global Nest cache backed by Redis (`cache-manager-redis-store`)
   * Support for `@Cacheable()` or direct `CACHE_MANAGER` injections

5. **Rate Limiting**

   * Request throttling via `@nestjs/throttler` (configurable via your `throttle` settings)

6. **Raw Redis & Distributed Locking**

   * `RedisModule` exposes:

     * Low-level `ioredis` client for raw Redis operations
     * Redlock instance for distributed locking

7. **Core Domain Modules**

   * **UserModule**: Registration, profile CRUD, password hashing, login workflows
   * **AuthenticationModule**: Login endpoint, token refresh, logout, JWT guards
   * **WalletsModule**: Create/find wallet, fetch balance, fund wallet, locking & queuing support
   * **TransactionsModule**: Record & retrieve transaction history (debits, credits, reversals)
   * **WebhookModule**: Receive & process external callbacks (e.g. Paystack webhooks)

8. **Health Check & Metrics**

   * `/health` endpoint for app readiness
   * Optional metrics middleware for Prometheus / Grafana integration

## Middleware Setup for Webhooks

To properly verify Paystack webhooks, configure raw-body parsing on the webhook route. In `main.ts` before `app.listen()`:

```ts
import * as express from 'express';

// Paystack webhook needs raw body for HMAC validation
app.use(
  '/paystack/webhook',
  express.raw({ type: 'application/json' }),
);
```

## Testing

```bash
# Run unit tests
$ npm run test

# Run e2e tests
$ npm run test:e2e
```

## Docker

A `Dockerfile` and `docker-compose.yml` are provided for local development:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - '${PORT}:4004'
    env_file: .env
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:6.0
    ports:
      - '27017:27017'

  redis:
    image: redis:7.0
    ports:
      - '6379:6379'
```

## Contributing

## License

MIT
