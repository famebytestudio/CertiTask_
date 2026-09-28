# CertiTask — Certification & Task Management Platform

CertiTask is a web application designed to connect **Companies** and **Students** through certification issuance, trainee roster management, and task tracking. 

Built with **Next.js 16**, **React 19**, **Prisma ORM v7**, **Neon PostgreSQL**, and custom **JWT HTTP-Only Cookie Authentication**.

---

## 🚀 Features

- 🏢 **Company Portal (`/company/dashboard`)**:
  - Issue accredited certifications to trainees.
  - Assign trackable tasks with due dates and priority levels.
  - Monitor enterprise compliance metrics and student progress in real-time.
- 🎓 **Student Portal (`/student/dashboard`)**:
  - View verified credential badges and certificates.
  - Track assigned tasks with progress indicators and toggle completion status.
  - Follow visual skill accreditation roadmaps.
- 🔒 **Secure Custom Authentication**:
  - Direct integration with **Neon PostgreSQL** via **Prisma ORM**.
  - Password hashing with `bcryptjs`.
  - Secure session cookies using `jose` (JWT) and Next.js Edge Middleware route protection.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI & Styling**: React 19, Vanilla CSS Design System, Tailwind CSS
- **Database & ORM**: Neon PostgreSQL, Prisma ORM 7
- **Auth & Security**: `bcryptjs` (password hashing), `jose` (JWT tokens in HTTP-only cookies)

---

## 📋 Prerequisites

Ensure you have the following installed on your system:
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher) or **pnpm** / **yarn**

---

## ⚙️ Environment Setup

Create a `.env` (or `.env.local`) file in the root directory of the project:

```env
# Neon PostgreSQL Database Connection String
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=verify-full"

# JWT Secret Key for Session Encryption
JWT_SECRET="replace-with-a-long-random-secret"

# Public URL and password-reset email delivery
APP_URL="https://your-production-domain.example"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="smtp-user"
SMTP_PASS="smtp-password"
EMAIL_FROM="no-reply@your-production-domain.example"

# Admin authentication uses a bcrypt hash generated locally.
SUPER_ADMIN_PASSWORD_HASH="replace-with-bcrypt-password-hash"

# Required for distributed production rate limiting
UPSTASH_REDIS_REST_URL="https://your-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-rest-token"
```

---

## 📥 Installation & Running Locally

### 1. Clone the Repository
```bash
git clone https://github.com/FaizaNaseem80/Certi-task.git
cd certitask
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Sync Database Schema with Neon PostgreSQL
Run Prisma database push to create the required database tables (`User`, `Certificate`, `Task`) in your Neon PostgreSQL database:
```bash
npx prisma db push
```

For production, apply the committed migrations instead:

```bash
npx prisma migrate deploy
```

### 4. Start the Development Server
```bash
npm run dev
```

### 5. Open in Browser
Navigate to [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🔑 Usage Guide

### Creating Accounts & Logging In
1. Visit [http://localhost:3000/auth/signup](http://localhost:3000/auth/signup).
2. Choose your role:
   - **Company**: Select the **Company** tab to create an organization admin account.
   - **Student**: Select the **Student** tab to create a student/learner account.
3. Upon signup or login, you will be automatically redirected to your role's dashboard:
   - **Company Admin** → `/company/dashboard`
   - **Student Learner** → `/student/dashboard`

---

## 🏗️ Production Build

To test or generate the production bundle:

```bash
# Build the application
npm run build

# Start the production server
npm run start
```

---

## 📁 Project Structure

```
certitask/
├── app/
│   ├── api/
│   │   └── auth/           # Signup, Login, Logout, Me API endpoints
│   ├── auth/               # Login, Signup, Forgot/Reset Password pages
│   ├── company/
│   │   └── dashboard/      # Company Enterprise Portal
│   ├── student/
│   │   └── dashboard/      # Student Learner Portal
│   ├── globals.css         # Global Brand Design Tokens & Styles
│   ├── layout.tsx          # Root Layout
│   └── page.tsx            # Home Page (Redirects to /auth/login)
├── lib/
│   ├── auth.ts             # Password hashing, JWT token & cookie utilities
│   └── prisma.ts           # Prisma Client singleton
├── prisma/
│   ├── schema.prisma       # Database schema models (User, Certificate, Task)
│   └── prisma.config.ts    # Prisma v7 configuration
├── proxy.ts                # Next.js 16 Edge Middleware for route protection
└── README.md
```
