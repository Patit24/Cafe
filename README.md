# Evening Light Payroll Attendance

Production-oriented attendance and payroll system for kitchen staff.

## Apps

- `backend`: NestJS API with Prisma/PostgreSQL.
- `admin`: Next.js dashboard for employees, attendance, shifts, leaves, payroll, and reports.
- `mobile`: Expo attendance app for employee check-in flow.
- `database/schema.sql`: SQL schema reference for manual database setup.

## Local Setup

1. Install dependencies in each app:

```bash
cd backend && npm install
cd ../admin && npm install
cd ../mobile && npm install
```

2. Copy env examples:

```bash
cp backend/.env.example backend/.env
cp admin/.env.example admin/.env.local
cp mobile/.env.example mobile/.env
```

3. Configure `DATABASE_URL`, `NEXT_PUBLIC_API_URL`, `EXPO_PUBLIC_API_URL`, Firebase values, and `CORS_ORIGINS`.

4. Generate Prisma client after schema changes:

```bash
cd backend
npx prisma generate
```

5. Run the apps:

```bash
cd backend && npm run start:dev
cd admin && npm run dev
cd mobile && npm run start
```

## Production Checks

```bash
cd backend && npm run build && npm run lint && npm test -- --runInBand
cd admin && npm run build && npm run lint
cd mobile && npm run lint
```

## Deployment Notes

- Backend requires PostgreSQL and must expose `/health`.
- Set `CORS_ORIGINS` to the deployed admin and mobile web origins. Use comma-separated origins.
- Admin production builds require `NEXT_PUBLIC_API_URL` and Firebase public config values.
- Mobile builds require `EXPO_PUBLIC_API_URL` pointing to the deployed backend. Do not use `localhost` for physical devices.
- Apply Prisma schema updates with a migration workflow before deploying to a live database.

## Remaining Hardening

- Add authentication/authorization for admin and backend write endpoints.
- Replace simulated face embedding/liveness with a verified biometric provider before relying on it for security decisions.
- Add end-to-end tests for check-in, break, checkout, shift CRUD, and payroll generation.
