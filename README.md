# Kunduz Study Hub

Kunduz Study Hub is a modern learning management frontend for one teacher and their students. It includes groups, materials, homework, tests, ratings, chat, notifications, profile settings, and online lessons.

The project is built as a React + TypeScript + Vite application and connects to separate backend services:

- Django/DRF API for auth, groups, materials, homework, tests, ratings, notifications, and profiles.
- FastAPI chat service for realtime group chat.
- Jitsi Meet for online lessons.

## Features

- Teacher dashboard with groups, students, materials, homework, tests, and ratings.
- Student dashboard with joined groups, materials, homework submission, tests, and group rating.
- Group invite/join flow with teacher approval.
- File upload support for materials and homework.
- Homework submission review flow: teacher can check a student's work, add a score, and leave a comment.
- Chat rooms per group with messages, attachments, member list, and room images.
- Browser notifications backed by `/notifications/`.
- Online lessons per group using Jitsi Meet.
- Three interface languages: Kyrgyz, Russian, and English.
- Dark/light theme support.

## Tech Stack

- React 19
- TypeScript
- Vite
- React Router
- TanStack Query
- Zustand
- Axios
- Tailwind CSS
- Lucide React icons
- Sonner toasts

## Project Structure

```txt
src/
  app/              App providers
  core/             API clients, config, shared core setup
  layouts/          Teacher and student layouts
  modules/          Feature modules
    auth/
    chat/
    groups/
    homeworks/
    live/
    materials/
    notifications/
    profile/
    ratings/
    settings/
    student/
    tests/
  router/           App routes and route guards
  shared/           UI components, i18n, utilities
```

## Environment Variables

Create `.env` in the project root:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_CHAT_API_URL=http://localhost:8001
```

Production example:

```env
VITE_API_BASE_URL=https://api.example.com/api
VITE_CHAT_API_URL=https://chat.example.com
```

## Local Setup

Install dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

Open:

```txt
http://localhost:5173
```

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Important Note About WSL

If `npm run build` fails with:

```txt
WSL 1 is not supported.
Could not determine Node.js install directory
```

the issue is the local WSL 1 + Windows Node environment, not necessarily the project code. Use WSL 2, Git Bash/PowerShell on Windows, or install Node inside Linux properly.

## Backend API Expected

The frontend expects the Django API to support these main routes:

```txt
POST /login/
POST /register/
POST /logout/
POST /token/refresh/

GET  /groups/
POST /groups/
GET  /groups/:id/
PATCH /groups/:id/
DELETE /groups/:id/

GET  /groups/:id/students/
GET  /groups/:id/requests/
PATCH /students/:id/approve/
PATCH /students/:id/reject/

GET  /groups/:id/materials/
POST /materials/
GET  /materials/:id/
PATCH /materials/:id/
DELETE /materials/:id/

GET  /groups/:id/homeworks/
POST /homeworks/
GET  /homeworks/:id/
PATCH /homeworks/:id/
DELETE /homeworks/:id/
GET  /homeworks/:id/answers/list/
POST /homeworks/:id/reviews/
PATCH /reviews/:id/

GET  /groups/:id/tests/
POST /tests/
GET  /tests/:id/
PATCH /tests/:id/
DELETE /tests/:id/
GET  /tests/:id/results/

GET  /leaderboard/
GET  /groups/:id/leaderboard/

GET   /notifications/
PATCH /notifications/:id/read/
PATCH /notifications/read-all/

POST /users/bulk/
```

Student routes expected:

```txt
GET  /student/groups/
GET  /student/groups/:id/materials/
GET  /student/groups/:id/homeworks/
GET  /student/groups/:id/tests/
POST /student/homeworks/:id/answer/
POST /student/tests/:id/submit/
GET  /student/groups/:id/leaderboard/
GET  /student/leaderboard/
```

## Online Lessons Backend Upgrade

The current frontend can open a Jitsi room by group id without backend state. For a real "teacher started a lesson" flow, add a `LiveLesson` model and these endpoints:

```txt
POST  /groups/:group_id/live-lessons/start/
GET   /groups/:group_id/live-lessons/active/
GET   /student/groups/:group_id/live-lessons/active/
PATCH /live-lessons/:lesson_id/end/
```

Recommended model:

```py
class LiveLesson(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='live_lessons')
    teacher = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255, default='Online lesson')
    room_name = models.CharField(max_length=255, unique=True)
    status = models.CharField(
        max_length=20,
        choices=[('live', 'Live'), ('ended', 'Ended')],
        default='live',
    )
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
```

When the teacher starts a lesson, the backend should create a live lesson and notify active students in the group.

## Chat Backend

The chat module expects a separate chat API from `VITE_CHAT_API_URL`.

It should support:

- rooms list
- room detail
- members
- messages
- message sending
- attachments
- optional room image

The frontend also calls Django `/users/bulk/` to replace fallback names like `User #17` with real username/full name/avatar.

## Roles

Teacher:

- Creates and manages groups.
- Approves students.
- Uploads materials.
- Creates homework and tests.
- Reviews homework submissions.
- Views student rating.
- Starts online lessons.

Student:

- Joins groups by invite link/code.
- Opens materials.
- Submits homework.
- Takes tests.
- Views own group rating.
- Joins online lessons.

## Scripts

```bash
npm run dev      # start local dev server
npm run build    # typecheck and build
npm run lint     # run ESLint
npm run preview  # preview production build
```

## Deployment

Build the frontend:

```bash
npm run build
```

Deploy the generated `dist/` folder to your hosting provider. Make sure production environment variables point to the deployed Django API and chat API.
