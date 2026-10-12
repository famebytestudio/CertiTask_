# CertiTask

CertiTask connects clients with talent through real projects, team applications, deliverable review, and publicly verifiable certificates.

Built with Next.js App Router, React, TypeScript, Prisma 7, PostgreSQL/Neon, HTTP-only JWT sessions backed by database sessions, SMTP email, and Upstash rate limiting.

## Features

- **Clients:** individual/organization profiles, email and identity verification, draft/published projects, team application selection, submission feedback, certificate issuance and revocation, project analytics and plan entitlements.
- **Talent:** editable profiles and photos, skills/education/portfolio/resume links, solo and team applications, invitations, deliverable submission and resubmission, held certificates released after identity verification, certificate PDF downloads and sharing.
- **Plans:** prepaid 30-day plan options for both roles remain visible for comparison. Online purchasing is temporarily disabled; existing subscription and payment history remains readable.
- **Administration:** identity review, account suspension/session revocation, project and certificate moderation, payment review, contact messages, search, and audit history.
- **Operations:** private document storage and retention, daily maintenance, distributed production rate limits, origin protection, security headers, environment checks, CI, and regression tests.
- **Project chat:** a private two-party room is created atomically when a client selects an application. Messages support realtime catch-up, cursor history, unread/read state, replies, edits, soft deletion, reactions, search, mute/block/report controls, and private attachments. Closed/completed projects retain a read-only history.

The current routes are `/client/dashboard` and `/talent/dashboard`. Older company/student URLs redirect to their current equivalents. Certificates prove an issuer-approved project outcome; they are not a claim of external institutional accreditation.

## Local setup

Use Node.js 22.x and npm. From this application's directory:

```sh
npm ci
```

Copy `.env.example` to `.env` and configure the database, a long random `JWT_SECRET`, and email credentials. The template explains all variables. Never commit `.env`.

```sh
npm run check:env
npm run db:migrate
npm run dev
```

Visit `http://localhost:3000`. Create a client or talent account at `/auth/signup`. Email confirmation uses a six-digit code. Identity verification requires document upload and an administrator decision, rather than a simulated verification button.

The administrator email and bcrypt password hash are configured using `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD_HASH`; access the portal at `/admin/login`. Escape dollar signs in local `.env` hashes as described in `.env.example`; paste ordinary unescaped hashes in Vercel settings.

## Validation

```sh
npx prisma generate
npm run check
npm run build
```

`check` runs ESLint, TypeScript, and the regression tests. `build` generates Prisma Client and builds Next.js without applying database migrations. Tests use synthetic data and mocked database/provider operations.

## Vercel

Follow [DEPLOYMENT.md](./DEPLOYMENT.md) for root-directory settings, production variables, migration behavior, webhook setup, daily schedules, and launch validation. `vercel.json` selects the deployment build and cron schedules.

```sh
npm run check:env -- --production
```

The production deployment build fails with named configuration errors if required launch settings are missing. Preview deployments should use a separate database. Database schema changes are committed as migrations; do not use `prisma db push` as the production deployment process.

## Main directories

| Directory | Purpose |
| --- | --- |
| `app/` | Public pages, auth, role dashboards, admin, billing, and API routes |
| `components/` | Client/talent/admin dashboard components, verification, checkout, profile photos |
| `lib/` | Authentication, queries, billing, certificates/PDF, storage, validation, notifications, email |
| `prisma/` | Schema and committed migrations |
| `scripts/` | Environment check, Vercel build, and development seed |
| `tests/` | Security, billing concurrency, plan, and deployment regression tests |

`PROFILE_FEATURES.md` and `IMPLEMENTATION_SUMMARY.md` preserve earlier project ideas. Their original company/student naming and simulated CNIC workflow have been superseded by the current client/talent verification implementation.

## Project chat architecture

Apply `20261012120000_project_chat` before testing chat. `npm run seed` creates a selected client/talent pair and a sample conversation; sign in as `projects@acmestudio.pk` or `ayesha.khan@example.com` with `Password123!`.

All REST and event-stream reads derive room membership from the authenticated HTTP-only session. Clients cannot grant themselves access with a room ID. Sends carry a client-generated idempotency ID and are limited to eight messages per ten seconds through the existing Upstash-backed limiter. The authenticated `/api/chats/stream` endpoint provides SSE catch-up and the UI reconnects with exponential backoff.

Attachments are limited to 10 MB, identified from magic bytes, kept in the existing private storage backend, and served only after a fresh membership check. JPEG EXIF/application metadata and PNG metadata chunks are removed. `lib/chat-files.ts` exposes a `VirusScanner` interface; its current implementation is an explicit no-op integration placeholder and must be replaced with ClamAV or a managed scanner before accepting untrusted production uploads. The storage interface can likewise be replaced with S3/R2 signed URLs without changing chat authorization.

`CHAT_CONTACT_POLICY` may be `off`, `warn`, or `block`. Muted rooms suppress message notifications. Administrative transcript access is only available through the audited `/api/admin/chats/:id` route. Chat history is deliberately retained when a project ends; changing that retention policy requires a separate product/privacy decision.
