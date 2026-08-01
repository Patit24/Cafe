# Admin Dashboard

Next.js dashboard for managing employees, shifts, attendance, leave, payroll, and reports.

## Environment

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_API_URL`: deployed NestJS API URL.
- `NEXT_PUBLIC_FIREBASE_*`: Firebase public web app configuration.

Production builds intentionally fail when required public env values are missing.

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
```
