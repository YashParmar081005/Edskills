# AI Learning Management System (LMS) — MERN + AI Build Plan

A complete, phase-by-phase plan to build an AI-powered LMS as a MERN web application, structured so you can hand each phase to **Claude Code** and build incrementally.

---

## 1. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React (Vite) + Tailwind CSS | Fast, modern, clean UI |
| State/Data | React Query (TanStack) + Context | Server-state caching + auth state |
| Routing | React Router v6 | Standard SPA routing |
| Backend | Node.js + Express | Your stack |
| Database | MongoDB + Mongoose | Your stack |
| Auth | JWT (access + refresh) + bcrypt | Stateless, role-based |
| AI | OpenAI/Anthropic API + embeddings | Quiz gen, grading, RAG |
| Vector search | MongoDB Atlas Vector Search | Keep everything in Mongo |
| File/video storage | Cloudinary or AWS S3 | Video + document uploads |
| Payments | Stripe (or Razorpay for India) | Paid courses |
| Real-time | Socket.io | Forum, notifications |
| Email | Nodemailer + Resend/SendGrid | Reminders, alerts |
| Deployment | Vercel (frontend) + Render/Railway (backend) | Free tiers, live demo |

---

## 2. High-Level Architecture

```
React SPA  ──HTTPS/JWT──►  Express REST API  ──►  MongoDB Atlas
   │                            │
   │                            ├──►  AI Service Layer (OpenAI/Anthropic)
   │                            ├──►  Vector Search (embeddings)
   │                            ├──►  Cloudinary/S3 (media)
   │                            ├──►  Stripe (payments)
   └──Socket.io◄───────────────┤
                                └──►  Email service (reminders)
```

Keep the **AI logic in its own service module** (`/services/ai/`) so controllers stay clean and you can swap providers.

---

## 3. Repository Structure (monorepo)

```
ai-lms/
├── client/                      # React (Vite)
│   ├── src/
│   │   ├── api/                 # axios instances + endpoint calls
│   │   ├── components/          # shared UI
│   │   ├── features/            # feature folders (auth, courses, quiz...)
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── routes/              # route guards by role
│   │   ├── context/
│   │   └── lib/
│   └── ...
├── server/                      # Express
│   ├── src/
│   │   ├── config/              # db, env, cloudinary, stripe
│   │   ├── models/              # Mongoose schemas
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/          # auth, role, error, upload
│   │   ├── services/
│   │   │   ├── ai/              # quiz gen, grading, RAG, embeddings
│   │   │   ├── payment/
│   │   │   └── email/
│   │   ├── sockets/             # socket.io handlers
│   │   ├── utils/
│   │   └── app.js
│   └── ...
└── README.md
```

---

## 4. Database Schema (MongoDB collections)

Core collections and key fields:

- **User** — name, email, passwordHash, role (`admin` | `instructor` | `student`), avatar, refreshToken, createdAt
- **Course** — title, description, instructor (ref User), thumbnail, price, isPublished, category, tags, totalEnrollments
- **Module** — course (ref), title, order
- **Lesson** — module (ref), title, type (`video` | `text`), videoUrl, content, duration, order, resources[]
- **Enrollment** — student (ref), course (ref), enrolledAt, status
- **Progress** — student (ref), course (ref), lesson (ref), completed (bool), watchedSeconds, completedAt
- **Quiz** — lesson/module (ref), title, questions[] (`{question, options[], correctIndex, explanation}`), aiGenerated (bool)
- **QuizAttempt** — student (ref), quiz (ref), answers[], score, feedback (AI), attemptedAt
- **Assignment** — course (ref), title, description, dueDate, maxScore
- **Submission** — assignment (ref), student (ref), content/fileUrl, aiFeedback, score, gradedAt
- **ForumThread** — course (ref), author (ref), title, body, upvotes
- **ForumReply** — thread (ref), author (ref), body, isAnswer
- **Certificate** — student (ref), course (ref), certificateId, issuedAt, pdfUrl
- **Payment** — student (ref), course (ref), stripeSessionId, amount, status
- **Notification** — user (ref), type, message, read (bool), createdAt
- **Embedding** — course/lesson (ref), chunkText, vector[] (for AI Q&A over course material)

Add indexes on `email`, `course+student` (enrollment), and the vector field for search.

---

## 5. API Design (key endpoints)

```
AUTH
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me

COURSES
GET    /api/courses                 # list/filter/search
POST   /api/courses                 # instructor
GET    /api/courses/:id
PUT    /api/courses/:id
DELETE /api/courses/:id
POST   /api/courses/:id/publish

MODULES & LESSONS
POST   /api/courses/:id/modules
POST   /api/modules/:id/lessons
PUT    /api/lessons/:id

ENROLLMENT & PROGRESS
POST   /api/courses/:id/enroll
GET    /api/enrollments/me
POST   /api/progress                # mark lesson progress
GET    /api/courses/:id/progress

AI
POST   /api/ai/quiz/generate        # from lesson material → quiz
POST   /api/ai/grade                # grade open submission
POST   /api/ai/ask                  # RAG Q&A over course content

QUIZ & ASSIGNMENTS
POST   /api/quizzes/:id/attempt
POST   /api/assignments/:id/submit

FORUM
GET/POST /api/courses/:id/threads
POST   /api/threads/:id/replies

PAYMENTS
POST   /api/payments/checkout       # Stripe session
POST   /api/payments/webhook

CERTIFICATES / ANALYTICS / NOTIFICATIONS
GET    /api/courses/:id/certificate
GET    /api/analytics/instructor
GET    /api/notifications
```

---

## 6. AI Integration Approach

Keep three clear AI capabilities:

1. **Quiz generation** — send lesson text → prompt the LLM to return **strict JSON** (`{questions:[...]}`), validate, save. Force JSON in the system prompt and parse safely.
2. **Auto-grading & feedback** — for open-text answers, send rubric + student answer → get score + constructive feedback as JSON.
3. **RAG course Q&A** — chunk lesson content → create embeddings → store vectors → on a student question, retrieve top chunks → feed to LLM with citations.

Tips: stream responses for chat-style features, meter usage per user, and always validate/parse AI JSON before trusting it.

---

## 7. Phase-by-Phase Build Roadmap

Build in this order — each phase is a working slice you can demo. This maps to your 12 sections.

### Phase 0 — Setup (½ week)
- Init monorepo, Vite React + Tailwind, Express server, MongoDB Atlas connection, env config, base folder structure, ESLint/Prettier.
- **Deliverable:** "Hello world" frontend talking to a `/api/health` endpoint.

### Phase 1 — Auth & Roles (Section 1)
- User model, register/login, JWT access + refresh, bcrypt, role middleware, protected routes, React auth context + route guards.
- **Deliverable:** Sign up / log in as 3 roles, role-based redirects.

### Phase 2 — Course Creation (Section 2)
- Course/Module/Lesson models, instructor CRUD, video upload to Cloudinary, course builder UI.
- **Deliverable:** Instructor builds a full course with lessons.

### Phase 3 — Enrollment & Student Dashboard (Section 3)
- Enrollment model, browse/search courses, enroll, student dashboard listing enrolled courses.

### Phase 4 — Content Player & Progress (Section 4)
- Video/text lesson player, mark-complete, progress bar, resume where left off.

### Phase 5 — AI Quiz Generator (Section 5)
- AI service for quiz generation from lesson material, instructor review/edit, save quiz.
- **Deliverable:** Click "Generate Quiz" → AI returns questions.

### Phase 6 — AI Auto-Grading & Feedback (Section 6)
- Quiz attempts + scoring; AI grading for open-ended answers with feedback.

### Phase 7 — Assignments & Submissions (Section 7)
- Assignment model, file/text submission, instructor grade view + AI-assisted grading.

### Phase 8 — Discussion Forum / Q&A (Section 8)
- Threads + replies per course, upvotes, mark-as-answer, real-time via Socket.io.

### Phase 9 — Certificates (Section 9)
- Auto-issue PDF certificate on 100% completion (generate with a PDF lib), verifiable certificate ID.

### Phase 10 — Payments (Section 10)
- Stripe checkout for paid courses, webhook to confirm + auto-enroll, payment history.

### Phase 11 — Analytics (Section 11)
- Instructor dashboard (enrollments, completion rates, quiz scores), student progress charts (Recharts).

### Phase 12 — Notifications & Reminders (Section 12)
- In-app notifications (Socket.io), email reminders (Nodemailer) for due assignments / new content.

### Phase 13 — Polish & Deploy
- Loading/empty/error states, responsive design, seed demo data, deploy frontend (Vercel) + backend (Render), write a strong README with screenshots + demo GIF + live link.

---

## 8. How to Build This With Claude Code

This plan is designed to be fed to Claude Code one phase at a time. Recommended workflow:

1. **Start each session with context.** Point Claude Code at this file: *"Read AI_LMS_BUILD_PLAN.md. We're on Phase 2. Build the Course/Module/Lesson models and instructor CRUD per the schema and API design."*
2. **One phase per branch.** Keep each phase in its own git branch/commit so the history tells the build story (great for interviews).
3. **Ask for the schema/route first, then the UI.** Backend slice → test with a REST call → then the React feature. Avoids rework.
4. **Have it write tests for critical paths** — auth, payments, AI JSON parsing.
5. **Keep the AI service isolated.** Tell Claude Code to put all LLM calls in `/services/ai/` with a single provider wrapper so you can swap models.
6. **Commit the prompts that worked.** A `PROMPTS.md` with your best AI prompts is itself a portfolio artifact.

### Suggested first prompt to Claude Code
> "Set up the monorepo from AI_LMS_BUILD_PLAN.md Phase 0: Vite + React + Tailwind in `/client`, Express + Mongoose in `/server`, MongoDB Atlas connection via env, a `/api/health` route, and a frontend page that fetches and displays its status. Use the folder structure in section 3."

---

## 9. Timeline Estimate

| Pace | Duration |
|---|---|
| Full-time | ~6–8 weeks |
| Part-time (evenings) | ~12–16 weeks |

Build phases 0–4 first as a **functional MVP** (you can demo a real course + learning flow). Phases 5–8 are the AI/standout layer. Phases 9–13 round it into a complete product.

---

## 10. Resume Framing

Once built, describe it as:

> *Built a full-stack AI-powered Learning Management System (MERN) with role-based access for admins, instructors, and students. Implemented AI quiz generation and auto-grading using LLMs with structured JSON outputs, RAG-based course Q&A with vector search, Stripe payments, real-time discussion forums (Socket.io), and progress analytics. Deployed on Vercel + Render.*

That single line covers auth, AI, payments, real-time, and deployment — exactly what full-stack interviewers look for.
