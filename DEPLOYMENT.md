# Publish CertiTask on Vercel

## Project settings

Import the repository into Vercel using the **Next.js** framework preset and **Node.js 22.x**. Select the directory containing this application's `package.json` as the Root Directory. If you import the outer workspace, that directory is `CertiTask_`; if this app is the repository root, leave Root Directory unchanged.

Use `npm ci` as the Install Command. The committed `vercel.json` selects `npm run build:vercel`. Keep Fluid Compute enabled. Choose a function region close to the Neon database.

The deployment build checks configuration, generates Prisma Client, applies committed migrations on production deployments, and builds Next.js. Preview deployments do not apply migrations. Give previews a separate database branch and sandbox payment credentials; apply committed migrations to that preview database with `npm run db:migrate` before exercising its workflows.

## Production environment variables

Enter these in Vercel → Project → Settings → Environment Variables, scoped to **Production**. Values from your local `.env` are not uploaded automatically. Never add secrets to `NEXT_PUBLIC_*` variables.

| Variable | Value / purpose |
| --- | --- |
| `DATABASE_URL` | Neon pooled PostgreSQL connection, with `sslmode=verify-full` |
| `DIRECT_URL` | Optional unpooled connection for migrations; otherwise `DATABASE_URL` is used |
| `JWT_SECRET` | Random secret with at least 32 characters; keep stable across deployments |
| `APP_URL` | Canonical HTTPS origin, such as `https://your-project.vercel.app`, with no path/query |
| `SUPER_ADMIN_EMAIL` | Administrator login email |
| `SUPER_ADMIN_PASSWORD_HASH` | bcrypt hash of the administrator password |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Working SMTP service for email codes, resets, invitations, certificates, and receipts |
| `EMAIL_FROM` | Sender address permitted by your SMTP provider |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Upstash REST credentials for distributed rate limits |
| `CRON_SECRET` | Random secret with at least 32 characters |
| `SAFEPAY_ENV` | `production` |
| `SAFEPAY_BASE_URL` | Leave unset; the provider selects `https://api.getsafepay.com` for production |
| `SAFEPAY_PUBLIC_KEY`, `SAFEPAY_SECRET_KEY` | Live merchant keys, not sandbox keys |
| `SAFEPAY_WEBHOOK_SECRET` | Live webhook's shared signing secret |

In the Vercel UI, paste the bcrypt hash with ordinary `$` characters. In local Next.js `.env` files only, escape each `$` as `\$` because Next expands environment references.

Optional variables and their defaults are documented in `.env.example`: certificate signing key/signatory, ID hashing pepper, prices in whole USD cents, and lifetime free quota. Keep certificate signing and ID hashing keys stable so existing credentials and identity uniqueness checks continue to work.

The local production check, without printing secret values, is:

```sh
npm run check:env -- --production
```

At the workspace review, local configuration still needed an HTTPS `APP_URL`, Upstash REST credentials, and live Safepay environment/endpoint settings. The private `.env` was left unchanged. The configured database had all six committed migrations applied.

## Payments and scheduled jobs

Create the live Safepay webhook for `https://YOUR_DOMAIN/api/safepay/webhook` and set its secret in Vercel. This endpoint verifies the raw-body HMAC signature, then fetches the tracker from Safepay; a redirect or webhook body alone cannot activate a plan. Browser API mutations still require a matching origin.

The two daily jobs are declared in `vercel.json`:

- `/api/cron/daily` at 03:00 UTC (08:00 Asia/Karachi): expire invitations and plans, close overdue projects, prune old authentication tokens, and send reminders.
- `/api/cron/purge-documents` at 04:00 UTC (09:00 Asia/Karachi): delete decided verification documents after 90 days and unattached documents after seven days.

Vercel sends the `Authorization: Bearer CRON_SECRET` header. Each route rejects missing or invalid authorization. The schedules use daily frequency supported on Hobby; execution within the scheduled hour is not guaranteed. See [Vercel cron documentation](https://vercel.com/docs/cron-jobs/usage-and-pricing).

Verification uploads are capped at **4 MB** per file, leaving room for multipart headers under [Vercel's 4.5 MB function payload limit](https://vercel.com/docs/functions/limitations). Profile photos are capped at **2 MB**. Files persist in PostgreSQL rather than a function's temporary filesystem. Verification files require owner/admin access; only avatar-prefixed files attached to public profiles are exposed publicly.

The app reuses its Prisma/pg pool across requests and attaches it to Vercel's pool lifecycle. Email and certificate tasks use Next.js `after` so the invocation remains alive after responding. Delivery is best effort, without a durable retry queue; certificates and receipts remain available in the dashboard if SMTP delivery fails.

## Validate before launch

```sh
npm ci
npx prisma generate
npm run check
npm run build
```

The regression suite covers origin protection, webhook signatures, token tampering, role separation, payment replay after refunds, concurrent payment confirmation, last-free-request contention, plan quotas, environment readiness, and file signatures. These tests use synthetic data and mocked payment/database operations and send no email or charge.

The production dependency audit (`npm audit --omit=dev`) reports zero vulnerabilities after the dependency updates. The full audit still reports five advisories in the development-only ESLint → fast-glob → micromatch → braces chain; the latest braces release remains affected. Do not run `npm audit fix --force`, which proposes downgrading the Next.js lint configuration to a different major version. Recheck for an upstream patch when updating dependencies.

After deploying, exercise these workflows using accounts you control:

1. Client and talent signup → email code → login/logout → password reset.
2. Upload ID documents → submit verification → approve/reject from the admin portal.
3. Publish a client project → talent solo/team application → selection → deliverable submission → approval.
4. Verify the issued certificate publicly and download its PDF; check revocation/dispute behavior.
5. Exercise paid-plan checkout in preview with sandbox keys, then validate live merchant configuration before accepting customers.
6. Check role-specific receipt/billing return links, photo uploads, profile editing, and scheduled job logs.

No live payment, SMTP delivery, or browser-based identity review was performed during automated validation. Deploying the code and running these provider-connected checks is the final launch step.
