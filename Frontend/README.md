# RecruitAI — Frontend

An AI-assisted recruitment platform frontend, built with React, Vite, and Tailwind CSS.
Candidates browse open roles, apply, and complete a two-stage evaluation (video
introduction + aptitude test). Recruiters manage job postings and review a ranked,
scored candidate list.

## Project structure

```
Frontend/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── src/
│   ├── api/
│   │   └── mockApi.js        In-memory data layer (ADMIN, JOBS, STUDENTS, SHORTLISTED_STUDENTS)
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── JobRow.jsx
│   │   ├── StageTracker.jsx
│   │   ├── CandidateRow.jsx
│   │   └── CandidateDrawer.jsx
│   ├── constants/
│   │   └── roles.js
│   ├── pages/
│   │   ├── CareerPortal.jsx
│   │   ├── JobDetail.jsx
│   │   ├── Apply.jsx
│   │   ├── Evaluation.jsx
│   │   ├── AdminLogin.jsx
│   │   ├── AdminDashboard.jsx
│   │   └── JobCreate.jsx
│   ├── utils/
│   │   └── format.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
```

## Getting started

```bash
cd Frontend
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

To build a production bundle:

```bash
npm run build
npm run preview
```

## What's implemented

**Candidate side**
- **Registration and sign-in** — a separate account system from admin, so a
  candidate creates one account and can apply to multiple roles under it
  (email/password, stored as a `STUDENT_ACCOUNTS`-style table — see the note
  below on why this is separate from the STUDENTS table in the ER diagram)
- **My Applications** — once signed in, a candidate sees every application
  they've submitted and its current stage/scores, no need to re-enter details
- Job listing and job detail pages, with loading and error states
- "Apply now" requires being signed in — clicking it while logged out sends
  you to sign-in/registration first, then continues the application
  automatically once you're in
- Application form (skills, achievements, resume) — name/email/phone are
  pulled from the signed-in account instead of being re-typed — validated
  and submitted via `multipart/form-data`
- Evaluation flow: a working camera/microphone recording step using the browser's
  `getUserMedia` + `MediaRecorder` APIs (with a clear message if permission is
  denied), which uploads the recorded clip to the backend, followed by an
  aptitude quiz

**Admin side**
- Login screen with real authentication (token stored and attached to
  subsequent requests), separate from the candidate login
- Dashboard with live stats, loading and error states throughout
- **Jobs** tab: list of postings, "+ New job" form matching the JOBS table fields
  (title, CTC, location, employment type, openings, application window, description,
  evaluation prompt, email template)
- **Candidates** tab: ranked list per job (joined from STUDENTS + SHORTLISTED_STUDENTS,
  sorted by `final_score`), with a detail drawer per candidate

## Design system

- **Typeface**: Fraunces (serif, headings) + Work Sans (body) + IBM Plex Mono
  (scores, IDs, technical labels) — the mono face is what gives the ranked
  candidate list and stat numbers their "data terminal" feel.
- **Color**: a deep indigo primary (`#2C3B8F`) for all primary actions and
  active states, on a warm off-white background, with green/amber/red used
  consistently for status only (open/shortlisted = green, waitlisted = amber,
  rejected/error = red) — so color always means the same thing everywhere.
- **Shape**: rounded corners (8–12px) and soft shadows on cards, buttons, and
  inputs throughout, replacing sharp/flat edges — this is what usually reads
  as "polished SaaS product" rather than "internal tool."

All of this lives in `tailwind.config.js` (color tokens) and `src/index.css`
(button/input base styles) — change a color there and it updates everywhere.


## Connecting to a real backend

The frontend talks to one file only: `src/api/apiClient.js`. A flag in `.env`
controls whether it uses built-in sample data or calls a real server:

```
# .env
VITE_USE_MOCK=true                              # sample data, no backend needed
VITE_API_BASE_URL=http://localhost:5000/api      # used once VITE_USE_MOCK=false
```

To switch over once your backend is ready: set `VITE_USE_MOCK=false`, point
`VITE_API_BASE_URL` at the real server, and restart `npm run dev`. No other
file needs to change — every page calls the same functions
(`getJobs`, `getJob`, `submitApplication`, `adminLogin`, etc.) either way.

### Expected backend endpoints

This is the contract `apiClient.js` expects — share it directly with whoever
is building the backend:

| Method | Path | Returns | Notes |
|---|---|---|---|
| GET | `/jobs` | `Job[]` | |
| GET | `/jobs/:job_id` | `Job` | |
| POST | `/jobs` | `Job` | admin auth |
| GET | `/jobs/:job_id/candidates` | `Student[]` | ranked, joined with SHORTLISTED_STUDENTS, admin auth |
| GET | `/students/:student_id` | `Student` | joined with SHORTLISTED_STUDENTS, admin auth |
| POST | `/students` | `Student` | student auth, `multipart/form-data`: skills, achievements, job_id, resume |
| POST | `/students/:student_id/video` | `{ ok: true }` | student auth, `multipart/form-data`: video |
| GET | `/me/applications` | `Student[]` | student auth — every application this account has submitted |
| GET | `/stats` | `{ openJobs, totalStudents, shortlistedCount, finalInterviewCount }` | admin auth |
| POST | `/auth/admin/login` | `{ token, admin }` | body: `{ email, password }` |
| POST | `/auth/student/register` | `{ token, account }` | body: `{ full_name, email, phone, password }` |
| POST | `/auth/student/login` | `{ token, account }` | body: `{ email, password }` |
| GET | `/health` | 200 OK | used for the "backend offline" banner |

Field names match the ER diagram's column names exactly (`job_title`,
`expected_ctc`, `resume_score`, `current_stage`, etc.) so the JSON your
backend returns can usually be the row straight from the database.

**Important schema note for your backend developer:** the original ER
diagram's `STUDENTS` table is one row per *application* (a person applying
to two jobs = two STUDENTS rows), and has no password column — it wasn't
designed for login. Candidate accounts need a separate table, something like:

```
STUDENT_ACCOUNTS
  account_id      PK
  full_name
  email           UNIQUE
  phone
  password_hash
```

with `STUDENTS.account_id` added as a foreign key back to it. Hash
passwords (bcrypt or similar) — never store them in plain text. The mock
data in `apiClient.js` models this same split (`studentAccounts` vs.
`students`) so the frontend behavior already assumes this backend shape.

### Things to agree on with your backend developer

1. **CORS** — the backend must allow requests from the frontend's origin
   (e.g. `http://localhost:5173`) or the browser blocks every request. In
   Express this is one line via the `cors` package.
2. **Auth** — `POST /auth/admin/login` and `POST /auth/student/login` (and
   `/auth/student/register`) should each return a `{ token }`. The frontend
   stores admin and student tokens separately and sends the right one as
   `Authorization: Bearer <token>` depending on which kind of request it is
   (see `src/api/config.js`).
3. **File uploads** — resumes and evaluation videos are sent as
   `multipart/form-data`, not JSON. The backend needs a file-upload
   middleware (e.g. `multer` in Express) on those two routes.
4. **Error format** — if a request fails, the frontend looks for a JSON
   body like `{ "message": "..." }` to show the person a real error
   instead of a generic one.

### What happens if the backend isn't running

With `VITE_USE_MOCK=false`, the app pings `/health` on load. If that fails,
a banner appears at the top of the page instead of the app silently
breaking. Every page also shows its own loading and error states — a slow
or failed request never looks like a frozen or broken screen.



The one unresolved question from the product spec is exactly how a student gets
marked "shortlisted" — by percentile, by a fixed score threshold, or by rank. This
build follows the rank-based approach (`getRankedStudents` sorts by `final_score`
and assigns rank client-side), since that's what the admin dashboard needs to render
either way. If the actual business rule changes, only that one function needs updating.
