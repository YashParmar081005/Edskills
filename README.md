# AI Learning Management System (AI LMS)

A full-stack **AI-powered Learning Management System** built with the MERN stack
(MongoDB, Express, React, Node.js). This repository is being built incrementally,
phase by phase, following [`AI_LMS_BUILD_PLAN.md`](./AI_LMS_BUILD_PLAN.md) and
[`AI_LMS_10_PROMPTS.md`](./AI_LMS_10_PROMPTS.md).

> **Current status: Phase 4 — Enrollment, Student Dashboard & Progress ✅**
> Students browse/search published courses, enroll, learn in a video/text player
> with auto-resume + completion tracking, and watch progress bars fill across
> their courses. Builds on Phases 1–3 (auth/roles, course creation) with the
> same glassy blue/sky-blue light/dark UI.

---

## Tech Stack

| Layer        | Choice                                            |
| ------------ | ------------------------------------------------- |
| Frontend     | React (Vite) + Tailwind CSS (glassmorphism)       |
| UI/Theme     | Light/Dark toggle, lucide-react icons, react-hot-toast |
| State/Data   | TanStack React Query + Context                    |
| Routing      | React Router v6 (role-based guards)               |
| Backend      | Node.js + Express                                 |
| Database     | MongoDB Atlas + Mongoose                          |
| Auth         | JWT access + refresh (httpOnly cookie) + bcrypt   |
| HTTP client  | axios (auto-refresh interceptor)                  |

---

## Repository Structure

```
ai-lms/
├── client/                 # React (Vite + Tailwind)
│   └── src/
│       ├── api/            # axios instance + endpoint calls
│       ├── components/     # shared UI
│       ├── features/       # feature folders (auth, courses, quiz...)
│       ├── hooks/
│       ├── pages/
│       ├── routes/         # route guards by role
│       ├── context/
│       └── lib/
├── server/                 # Express API
│   └── src/
│       ├── config/         # db, env (cloudinary, stripe later)
│       ├── models/         # Mongoose schemas
│       ├── controllers/
│       ├── routes/
│       ├── middleware/     # auth, role, error, upload
│       ├── services/       # ai, payment, email
│       ├── sockets/        # socket.io handlers
│       ├── utils/
│       └── app.js
└── README.md
```

---

## Prerequisites

- **Node.js** >= 18 (tested on Node 22)
- A **MongoDB** connection string (MongoDB Atlas free tier works great)

---

## Getting Started

### 1. Configure environment variables

**Server** — copy the example and fill in your values:

```bash
cd server
cp .env.example .env
```

Then edit `server/.env` and set at least `MONGO_URI`.

**Client** — (optional) copy the example if you want to override the API URL:

```bash
cd client
cp .env.example .env
```

### 2. Install dependencies

From the repo root you can install everything at once:

```bash
npm run install:all
```

Or install each workspace individually:

```bash
npm install
npm --prefix server install
npm --prefix client install
```

### 3. Run the app

**Run both servers together** (from the repo root):

```bash
npm run dev
```

**Or run them separately** in two terminals:

```bash
# Terminal 1 — backend (http://localhost:5500)
cd server
npm run dev

# Terminal 2 — frontend (http://localhost:4321)
cd client
npm run dev
```

Open the frontend at **http://localhost:4321**. The Home page calls
`GET /api/health` on the backend and should display **`status: ok`**.

You can also hit the backend health endpoint directly:

```bash
curl http://localhost:5500/api/health
# → {"status":"ok", ...}
```

> **Note on ports:** the backend defaults to **5500** and the frontend to
> **4321** (the more common `5000`/`5173` were occupied on the dev machine).
> Change them via `server/.env` (`PORT`, `CLIENT_URL`) and `client/vite.config.js`
> if you prefer different ports — just keep them in sync.

### 4. Seed the admin account

Create the admin user (idempotent — safe to re-run):

```bash
cd server
npm run seed
```

---

## Demo / Seed Accounts

| Role           | Email                | Password      | How to get it                     |
| -------------- | -------------------- | ------------- | --------------------------------- |
| **Admin**      | `admin@ailms.dev`    | `Admin@12345` | Created by `npm run seed`         |
| **Instructor** | _your choice_        | _your choice_ | Register → pick **Instructor**    |
| **Student**    | _your choice_        | _your choice_ | Register → pick **Student**       |

After login you're redirected by role to `/admin`, `/instructor`, or `/student`.
Admin accounts can only be created via the seed script (not public sign-up).

---

## Authentication Overview (Phase 2)

- **JWT access token** (short-lived, 15m) kept in memory on the client and sent
  as a `Bearer` header.
- **Refresh token** (7d) stored in an **httpOnly cookie** scoped to `/api/auth`;
  used to silently restore the session on reload and rotate the access token.
- **Passwords** hashed with bcrypt; `passwordHash` is never returned by the API.
- **Route guards:** `GuestRoute` (login/register), `RoleRoute` (per-role
  dashboards). The axios response interceptor auto-refreshes on a `401`.

---

## Course Creation (Phase 3)

Instructors (and admins) manage courses at **`/instructor/courses`**:

- **Course list** — create, edit details (title, description, category, price,
  tags, thumbnail), delete, and see module/lesson counts + publish status.
- **Course builder** (`/instructor/courses/:id`) — add/rename/reorder **modules**,
  add/edit/reorder/delete **lessons** (video or text), and **publish/unpublish**.
- **Lessons** are `video` (Cloudinary upload with progress, or a pasted URL) or
  `text`. Ownership is enforced — instructors only see/edit their own courses.

> **Video & thumbnail upload needs Cloudinary keys.** Add `CLOUDINARY_CLOUD_NAME`,
> `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` to `server/.env`
> (free account at https://console.cloudinary.com/). Without them, file upload
> returns a friendly error — **text lessons and pasted video URLs still work**.

API: `GET/POST /api/courses`, `GET /api/courses/mine`, `GET/PUT/DELETE /api/courses/:id`,
`POST /api/courses/:id/publish`, `POST /api/courses/:id/modules`,
`PUT/DELETE /api/modules/:id`, `POST /api/modules/:id/lessons`,
`PUT/DELETE /api/lessons/:id`, reorder endpoints, and `POST /api/upload/{video,thumbnail}`.

---

## Student Learning Flow (Phase 4)

- **Browse** (`/courses`) — search, category filter, and sort across published
  courses (only published courses are public).
- **Course detail** (`/courses/:id`) — overview + curriculum outline (lesson
  content is locked until enrolled) with a free **Enroll** button.
- **My Learning** (`/student/my-courses`) — enrolled courses with progress bars.
- **Lesson player** (`/learn/:courseId/:lessonId`) — video or text content, a
  curriculum sidebar with completion ticks, **mark complete**, and **auto-resume**
  (saved watched-seconds; videos auto-complete on finish). Course % updates live,
  and an enrollment flips to `completed` at 100%.

API: `GET /api/courses` (public browse), `POST /api/courses/:id/enroll`,
`GET /api/courses/:id/learn` (enrolled-only full content + progress),
`GET /api/enrollments/me`, `POST /api/progress`, `GET /api/courses/:id/progress`.

---

## Environment Variables

See [`server/.env.example`](./server/.env.example) for the full list.

| Variable                | Description                                           |
| ----------------------- | ----------------------------------------------------- |
| `PORT`                  | Backend port (default `5500`)                         |
| `MONGO_URI`             | MongoDB Atlas connection string                       |
| `CLIENT_URL`            | Allowed CORS origin (default `http://localhost:4321`) |
| `JWT_SECRET`            | Access-token signing secret                           |
| `JWT_REFRESH_SECRET`    | Refresh-token signing secret                          |
| `ACCESS_TOKEN_EXPIRES`  | Access-token lifetime (default `15m`)                 |
| `REFRESH_TOKEN_EXPIRES` | Refresh-token lifetime (default `7d`)                 |
| `ADMIN_NAME/EMAIL/PASSWORD` | Seed admin credentials (`npm run seed`)           |
| `CLOUDINARY_CLOUD_NAME`  | Cloudinary cloud name (Phase 3 uploads)               |
| `CLOUDINARY_API_KEY`     | Cloudinary API key                                    |
| `CLOUDINARY_API_SECRET`  | Cloudinary API secret                                 |

---

## Roadmap

**Phases 1–4 of 10 complete.** Upcoming phases (see `AI_LMS_10_PROMPTS.md`):

1. ~~Project Setup & Foundation~~ ✅
2. ~~Authentication & Roles (admin / instructor / student)~~ ✅
3. ~~Course Creation (Instructor)~~ ✅
4. ~~Enrollment, Student Dashboard, Content Player & Progress~~ ✅
5. AI Quiz Generation + Attempts + Auto-Grading
6. Assignments & Submissions (AI-assisted grading)
7. Discussion Forum + Real-Time Notifications
8. Payments (Stripe) + Certificates
9. Analytics + RAG Course Q&A + Email Reminders
10. Polish, Seed Data, Deploy & README
