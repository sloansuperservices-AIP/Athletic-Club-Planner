# Mid TN Volleyball Ops Dashboard

Full-stack club operations platform for managing 20–30 coaches and 250+ athletes across multiple volleyball teams.

**Tech stack:** Next.js 14 App Router · TypeScript · Tailwind CSS · shadcn/ui · Prisma ORM · PostgreSQL · NextAuth v5 · Gemini AI

---

## Features

- **Command Center** — Urgency-sorted tournament countdown, open job alerts, quick-action grid
- **Tournament HQ** — Readiness grid (7 columns), checklist editing with audit trail, roster issue flags
- **Team Pages** — Roster compliance view, schedule, WorkPlay credits per team
- **WorkPlay / DIBs** — Volunteer job board with fairness engine (max 2 claims/week, 24h cooldown)
- **Knowledge Base** — Searchable articles + AI chat powered by Gemini
- **Comms** — Announcements feed with team targeting and pinned posts
- **Sponsors** — Sponsor pipeline with tier management and deliverable tracking
- **Admin Panel** — User role management, manual credit adjustments, paginated audit log
- **RBAC** — Five roles: ADMIN · COACH · TEAM_MANAGER · PARENT · ATHLETE

---

## Local Setup

### 1. Prerequisites

- Node.js 20+
- Docker (for local Postgres) _or_ an existing Postgres 14+ instance

### 2. Start a local Postgres database

```bash
docker run --name midtnvball-db \
  -e POSTGRES_USER=midtn \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=midtnvball \
  -p 5432:5432 \
  -d postgres:16
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:
- Set `DATABASE_URL` to match your Postgres credentials
- Generate `AUTH_SECRET` with `openssl rand -base64 32`
- (Optional) Add `GEMINI_API_KEY` for AI chat in the Knowledge Base

### 4. Install dependencies

```bash
npm install
```

### 5. Push schema + seed

```bash
npx prisma db push
npx prisma db seed
```

### 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Credentials

| Role  | Email                      | Password    |
|-------|----------------------------|-------------|
| Admin | admin@midtnvball.com       | admin123!   |
| Coach | coach@midtnvball.com       | coach123!   |
| Parent| parent@midtnvball.com      | parent123!  |

---

## Project Structure

```
app/
  (auth)/login/          # Login page (no sidebar)
  dashboard/
    page.tsx             # Command Center
    tournaments/         # Tournament HQ
    teams/               # Team pages
    workplay/            # Job board + credits
    knowledge/           # Knowledge base + AI chat
    comms/               # Announcements
    sponsors/            # Sponsor management
    admin/               # Admin panel (ADMIN only)
components/
  nav/Sidebar.tsx        # Role-filtered navigation
  ui/                    # shadcn/ui primitives
  tables/ReadinessTable  # Interactive tournament readiness grid
  workplay/              # Job board + leaderboard
  knowledge/             # Article list + AI chat
  comms/CommsPanel       # Announcement feed
lib/
  auth.ts                # NextAuth v5 config
  rbac.ts                # Role hierarchy + permissions
  readiness.ts           # Readiness score calculator
  dibsRules.ts           # DIBs fairness engine
  auditLog.ts            # Audit trail writer
  rosterValidation.ts    # Roster compliance checker
prisma/
  schema.prisma          # Full data model
  seed.ts                # Demo data seeder
```

---

## DIBs Fairness Rules

| Rule                  | Value |
|-----------------------|-------|
| Max claims per week   | 2     |
| Cooldown between claims | 24 hours |
| Admin bypass          | Yes   |
| Credit per completion | 1 flat |

---

## Readiness Score Weights

| Column       | Weight |
|--------------|--------|
| Registration | 25%    |
| Roster       | 20%    |
| Hotel        | 15%    |
| Calendar     | 15%    |
| WorkPlay     | 10%    |
| Rideshare    | 10%    |
| Sponsor      | 5%     |
