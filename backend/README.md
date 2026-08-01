# Backend API

NestJS API for Evening Light attendance and payroll.

## Environment

Copy `.env.example` to `.env` and set:

- `DATABASE_URL`: PostgreSQL connection string.
- `PORT`: API port, defaults to `3001`.
- `CORS_ORIGINS`: comma-separated list of allowed frontend origins.

## Commands

```bash
npm install
npx prisma generate
npm run start:dev
npm run build
npm run lint
npm test -- --runInBand
```

## Health Check

`GET /health` returns API status, uptime, and timestamp.
