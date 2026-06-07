# AI LMS — 10 Sequential Claude Code Prompts


Build the entire AI Learning Management System (MERN + AI) end-to-end by pasting these prompts into **Claude Code one at a time, in order**. Each prompt produces a **working, runnable, error-free slice** covering backend + frontend + DB for all roles.

---

## How to use this (read first)

1. Create an empty folder, open Claude Code in it, and place `AI_LMS_BUILD_PLAN.md` there too.
2. Paste **Prompt 1**, let it finish, then **run the app and confirm it works** before moving on.
3. After each prompt, commit to git: `git add . && git commit -m "Phase N"`.
4. If anything errors, paste the error back and say *"fix this, then re-run to confirm it works"* before going to the next prompt.
5. Only move to the next prompt once the current slice runs with no console errors.

Each prompt already tells Claude Code to **build backend → frontend → test → fix until clean**, so you get a working app at every step.

---

## Prompt 1 — Project Setup & Foundation

```
Read AI_LMS_BUILD_PLAN.md fully. We are building it in 10 phases. This is Phase 1 (Setup).

Create a monorepo with this exact structure: /client (Vite + React + Tailwind CSS) and /server (Node.js + Express + Mongoose).

Backend:
- Express app with CORS, helmet, morgan, express.json, centralized error-handler middleware, and a /api/health route returning { status: "ok" }.
- MongoDB Atlas connection via Mongoose using MONGO_URI from .env. Log success/failure clearly.
- Config files in /server/src/config. Use the folder structure from section 3 of the plan.
- A .env.example listing all env vars (MONGO_URI, JWT_SECRET, JWT_REFRESH_SECRET, CLIENT_URL, PORT).

Frontend:
- Vite React app with Tailwind configured, React Router v6, axios instance in /client/src/api pointing to the backend, and React Query set up.
- A single Home page that fetches /api/health and displays the status.

Then: install all dependencies, start both servers, and confirm the frontend shows "ok". Fix any errors until both run cleanly with no console warnings. Give me the exact commands to run client and server.
```

---

## Prompt 2 — Authentication & Roles (all 3 roles)

```
Phase 2: Authentication & role-based access, per the User schema and AUTH endpoints in AI_LMS_BUILD_PLAN.md.

Backend:
- User model: name, email (unique), passwordHash, role enum ['admin','instructor','student'], avatar, refreshToken.
- bcrypt password hashing. JWT access token (short-lived) + refresh token (httpOnly cookie).
- Endpoints: register, login, refresh, logout, GET /me.
- Middleware: protect (verify JWT) and authorize(...roles) for role gating.
- Validation with express-validator and clear error messages.

Frontend:
- Auth context + React Query: register, login, logout, persisted session via refresh token on app load.
- Pages: Register, Login. Register lets you pick role (student/instructor); admin is seeded.
- ProtectedRoute and RoleRoute guards. After login, redirect by role to /admin, /instructor, or /student dashboards (empty placeholder pages for now).
- Add a seed script to create one admin user.

Then run everything, register/login as each role, and confirm correct redirects. Fix all errors until the full auth flow works end-to-end with no errors.
```

---

## Prompt 3 — Course Creation (Instructor)

```
Phase 3: Course creation, per the Course/Module/Lesson schema and COURSE/MODULE/LESSON endpoints in the plan.

Backend:
- Models: Course, Module, Lesson exactly per the schema (refs, order fields).
- Instructor-only CRUD for courses, modules, lessons (use authorize('instructor','admin')).
- Cloudinary integration for video upload (config from env); store videoUrl on Lesson. Use multer for upload handling.
- Publish/unpublish course endpoint.

Frontend (instructor dashboard):
- Course list (instructor's own courses) with create/edit/delete.
- Course builder UI: add modules, add lessons (video upload or text), reorder, set price, publish toggle.
- Use React Query mutations with optimistic UI and toasts.

Then run, create a full course with modules + lessons + a video upload, and confirm it persists in MongoDB. Fix all errors until the instructor can build and publish a course with no errors.
```

---

## Prompt 4 — Enrollment, Student Dashboard, Content Player & Progress

```
Phase 4: Student-facing learning flow, per ENROLLMENT & PROGRESS endpoints and the Enrollment/Progress schema.

Backend:
- Enrollment and Progress models.
- Public course browse/search/filter endpoint (only published courses).
- Enroll endpoint (free courses for now; paid handled later).
- Progress endpoints: mark lesson complete, save watched seconds, get course progress %.

Frontend (student dashboard):
- Browse/search courses page with cards and filters.
- Course detail page with curriculum and an Enroll button.
- "My Courses" dashboard listing enrolled courses with progress bars.
- Lesson player page: video/text content, mark-complete, auto-resume last position, sidebar curriculum with completion ticks.

Then run, enroll as a student, watch/complete lessons, and confirm progress updates correctly. Fix all errors until the full student learning flow works with no errors.
```

---

## Prompt 5 — AI Quiz Generation + Attempts + Auto-Grading

```
Phase 5: AI quiz features, per section 6 (AI Integration) and the Quiz/QuizAttempt schema.

Backend:
- Create an isolated AI service in /server/src/services/ai with a single provider wrapper (so the model can be swapped). Use the API key from env.
- POST /api/ai/quiz/generate: takes lesson content, prompts the LLM to return STRICT JSON {questions:[{question,options,correctIndex,explanation}]}. Validate and safely parse before saving.
- Quiz and QuizAttempt models. Endpoint to save a generated/edited quiz to a lesson.
- POST /api/quizzes/:id/attempt: score MCQs automatically; for any open-ended answer call POST /api/ai/grade to get score + feedback as JSON.

Frontend:
- Instructor: "Generate Quiz" button on a lesson → shows AI questions → editable → save.
- Student: take quiz UI, submit, see score + per-question explanations + AI feedback.

Then run, generate a quiz with AI, take it as a student, and confirm scoring + feedback. Validate the AI always returns parseable JSON (add a retry/repair step if not). Fix all errors until AI quiz gen + grading work reliably with no errors.
```

---

## Prompt 6 — Assignments & Submissions (with AI-assisted grading)

```
Phase 6: Assignments, per the Assignment/Submission schema and endpoints.

Backend:
- Assignment and Submission models.
- Instructor: create assignment (title, description, dueDate, maxScore).
- Student: submit text or file (Cloudinary) before due date.
- Instructor grade view; an "AI suggest grade" action that calls the AI grade service with a rubric and returns suggested score + feedback the instructor can accept/edit.

Frontend:
- Instructor: create assignments on a course, see submissions list, grade (with AI suggestion button).
- Student: see assignments, submit, view grade + feedback.

Then run, create an assignment, submit as student, grade with AI assist as instructor. Fix all errors until the assignment flow works end-to-end with no errors.
```

---

## Prompt 7 — Discussion Forum + Real-Time Notifications

```
Phase 7: Forum + real-time, per the ForumThread/ForumReply/Notification schema and FORUM endpoints. Add Socket.io.

Backend:
- ForumThread and ForumReply models (per course). Upvotes, mark-reply-as-answer.
- Socket.io server: emit new replies to users viewing that thread, and push Notification events.
- Notification model + GET /api/notifications + mark-as-read.

Frontend:
- Per-course forum: thread list, create thread, thread detail with replies, upvote, instructor can mark an answer.
- Live updates via Socket.io (new replies appear without refresh).
- Notification bell in the navbar with unread count and dropdown, updating in real time.

Then run, open two browsers (student + instructor), post in a thread, and confirm live updates + notifications. Fix all errors until forum + real-time notifications work with no errors.
```

---

## Prompt 8 — Payments (Stripe) + Auto-Enroll + Certificates

```
Phase 8: Payments + certificates, per PAYMENTS and CERTIFICATES endpoints and the Payment/Certificate schema.

Backend:
- Stripe checkout session for paid courses (POST /api/payments/checkout).
- Stripe webhook (POST /api/payments/webhook) that verifies the event, records the Payment, and auto-creates an Enrollment on success.
- Certificate: when a student reaches 100% course progress, generate a PDF certificate (use pdfkit) with a unique certificateId, upload to Cloudinary, and store a Certificate record. Public verify-by-id endpoint.

Frontend:
- Paid course detail shows price + "Buy" button → Stripe checkout → success/cancel pages.
- "My Courses" shows a "Download Certificate" button once a course is 100% complete.

Use Stripe test mode. Then run, buy a course with a test card, confirm auto-enroll via webhook, complete it, and download the certificate. Fix all errors until payments + certificates work with no errors.
```

---

## Prompt 9 — Analytics Dashboards + RAG Course Q&A + Email Reminders

```
Phase 9: Analytics, AI course Q&A (RAG), and email, per ANALYTICS endpoints, the Embedding schema, and section 6.

Backend:
- Analytics: GET /api/analytics/instructor (enrollments, completion rates, avg quiz scores per course) and student progress stats. Admin analytics (totals across platform).
- RAG: on lesson save, chunk content, create embeddings, store in the Embedding collection (MongoDB Atlas Vector Search). POST /api/ai/ask retrieves top chunks for a course and answers the student's question WITH citations.
- Email service (Nodemailer + provider): send reminder emails for upcoming assignment due dates (a scheduled job) and on enrollment.

Frontend:
- Instructor + admin analytics dashboards with Recharts (charts for enrollments, completion, scores).
- Student: "Ask AI about this course" chat widget that streams answers with cited sources.

Then run, view analytics with seeded data, ask the course Q&A and confirm cited answers, and trigger a reminder email. Fix all errors until analytics + RAG + email work with no errors.
```

---

## Prompt 10 — Polish, Seed Data, Deploy & README

```
Phase 10: Production polish and deployment.

- Add loading skeletons, empty states, and friendly error states across all pages. Ensure full mobile responsiveness with Tailwind.
- Global error boundary on the frontend; consistent toast notifications.
- Harden backend: rate limiting on auth + AI routes, input validation everywhere, sanitize, proper 401/403 handling, and meter AI usage per user.
- Write a seed script that creates demo data: 1 admin, 2 instructors, 3 students, 3 courses (with modules, lessons, a quiz, an assignment, forum threads) so the app is demo-ready instantly.
- Add .env.example completeness and a clear README.md with: project overview, feature list, tech stack, architecture diagram, setup instructions, env vars, screenshots placeholders, and a "demo accounts" section.
- Prepare for deployment: frontend on Vercel, backend on Render/Railway. Add build scripts, set CORS to the deployed client URL, and document the exact deploy steps.

Then run the full app one final time across all three roles (admin, instructor, student) and confirm every feature works end-to-end with no errors. Give me a final checklist of what to verify before deploying.
```

---

## After all 10 prompts

You'll have a complete, deployable AI LMS with auth/roles, course creation, the full student learning flow, AI quiz generation + grading, assignments, a real-time forum, payments, certificates, analytics, RAG Q&A, and email reminders — working across all three roles.

**Pro tips for staying error-free:**
- Run and commit after every prompt. Never stack two phases on a broken build.
- If a prompt is large, let Claude Code finish, then say: *"now run it and fix every error until it's clean."*
- Keep API keys in `.env` only; never let them get committed.
- When an AI response fails to parse, ask Claude Code to add a JSON-repair/retry step — this is the most common runtime issue in AI apps.
