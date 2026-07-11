# HireFlowAI — Backend-1

> **Express.js** backend handling Authentication, Database Operations, and Queue Management.

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| **Node.js + Express.js** | HTTP server & routing |
| **Drizzle ORM** | Type-safe database ORM |
| **Supabase (PostgreSQL)** | Cloud database |
| **BullMQ + Redis** | Job queue (resume processing) |
| **JWT** | Authentication tokens |
| **bcrypt** | Password hashing |
| **Morgan** | HTTP request logging |
| **Multer** | Resume file handling (in-memory) |

---

## Quick Start

### 1. Install Dependencies
```bash
cd Backend-1
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Fill in your Supabase DATABASE_URL, JWT_SECRET, REDIS_URL, INTERNAL_API_KEY
```

### 3. Create Database Tables
```bash
# Option A: Push schema directly (recommended for development)
npm run db:push

# Option B: Generate + run migrations (recommended for production)
npm run db:generate
npm run db:migrate
```

### 4. Seed the Database
```bash
npm run db:seed
# Creates 4 default roles + Super Admin account
# Default Super Admin: superadmin@hireflowai.com / Admin@123
```

### 5. Start Development Server
```bash
npm run dev
# Server starts at http://localhost:5000
```

---

## API Endpoints

### Auth — User (Candidates)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/auth/user/register` | Register new candidate |
| POST | `/api/v1/auth/user/login` | Login candidate |
| POST | `/api/v1/auth/user/logout` | Logout (clears cookie) |
| GET | `/api/v1/auth/user/me` | Get current user profile |

### Auth — Admin
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/auth/admin/login` | Login admin |
| POST | `/api/v1/auth/admin/logout` | Logout admin |
| GET | `/api/v1/auth/admin/me` | Get current admin profile + role |

### Jobs (Admin only)
| Method | Route | Access |
|--------|-------|--------|
| GET | `/api/v1/jobs` | All admin roles |
| GET | `/api/v1/jobs/:id` | All admin roles |
| POST | `/api/v1/jobs` | Super Admin, HR Manager, Hiring Manager |
| PUT | `/api/v1/jobs/:id` | Super Admin, HR Manager, Hiring Manager |
| DELETE | `/api/v1/jobs/:id` | Super Admin, HR Manager, Hiring Manager |
| PATCH | `/api/v1/jobs/:id/stop-shortlisting` | Super Admin, HR Manager, Hiring Manager |

### Students
| Method | Route | Access |
|--------|-------|--------|
| POST | `/api/v1/students/apply/:jobId` | **Public** — candidates apply here |
| GET | `/api/v1/students` | All admin roles |
| GET | `/api/v1/students/job/:jobId` | All admin roles |
| GET | `/api/v1/students/:id` | All admin roles |

### Shortlisted
| Method | Route | Access |
|--------|-------|--------|
| GET | `/api/v1/shortlisted` | All admin roles |
| GET | `/api/v1/shortlisted/job/:jobId` | All admin roles |
| GET | `/api/v1/shortlisted/:id` | All admin roles |
| POST | `/api/v1/shortlisted/result` | **Internal** — Backend-2 only (API key) |

---

## Role Permissions

| Role | Key | CRUD Jobs | View |
|------|-----|-----------|------|
| Super Admin | R001 | ✅ | ✅ |
| HR Manager | R002 | ✅ | ✅ |
| Hiring Manager | R003 | ✅ | ✅ |
| Viewer | R004 | ❌ | ✅ |

---

## Queue Architecture

```
Candidate applies → Backend-1 stores student → Pushes job to BullMQ (Redis)
                                                        ↓
                                               Backend-2 consumes job
                                               → Parses resume (AI)
                                               → Calculates ATS score
                                                        ↓
                                     Backend-2 POSTs result to Backend-1
                                     POST /api/v1/shortlisted/result
                                     Header: X-Internal-Api-Key
                                                        ↓
                                     Backend-1 updates student record
                                     → If score ≥ cutoff: status = Shortlisted
                                     → Creates shortlisted_students record
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret (min 32 chars) |
| `JWT_EXPIRES_IN` | Token expiry (default: 24h) |
| `REDIS_URL` | Redis connection URL |
| `INTERNAL_API_KEY` | Shared secret with Backend-2 |
| `CLIENT_URL` | Frontend URL for CORS |
| `BACKEND2_URL` | Backend-2 service URL |
| `SEED_ADMIN_EMAIL` | Default Super Admin email |
| `SEED_ADMIN_PASSWORD` | Default Super Admin password |

---

## Folder Structure

```
Backend-1/
├── src/
│   ├── config/          # env, db, redis
│   ├── db/
│   │   ├── schema/      # Drizzle table definitions
│   │   └── seed.js      # Database seeder
│   ├── middleware/      # auth, authorize, errorHandler, upload
│   ├── routes/          # Express route definitions
│   ├── controllers/     # Request/response handling
│   ├── services/        # Business logic + DB queries
│   ├── queues/          # BullMQ producer
│   └── app.js           # Express app setup
├── drizzle/             # Generated migrations (auto)
├── server.js            # Entry point
├── drizzle.config.js    # Drizzle Kit config
└── .env.example         # Environment template
```
