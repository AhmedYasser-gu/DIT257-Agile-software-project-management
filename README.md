# 🥗 No Leftovers — Team 3 AGR

[![Frontend CI](https://github.com/DIT257-Agile-Software/DIT257-Agile-software-project-management/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/DIT257-Agile-Software/DIT257-Agile-software-project-management/actions/workflows/frontend-ci.yml)
[![Backend CI](https://github.com/DIT257-Agile-Software/DIT257-Agile-software-project-management/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/DIT257-Agile-Software/DIT257-Agile-software-project-management/actions/workflows/backend-ci.yml)

_Academic project for DIT257 Agile Software Project Management @ University of Gothenburg / Chalmers_

A full-stack food donation platform that connects restaurants and stores with NGOs and individuals to reduce food waste -> aligned with **UN SDG #2: Zero Hunger**.

---

## 📦 Tech Stack

| Layer       | Technology                                                |
| ----------- | --------------------------------------------------------- |
| 🖥️ Frontend | [Next.js](https://nextjs.org), TypeScript, TailwindCSS    |
| 🔐 Auth     | [Clerk.dev](https://clerk.dev/) (JWT + user auth)         |
| ☁️ Backend  | [Convex](https://convex.dev/) (serverless DB + functions) |
| 🎨 Styling  | TailwindCSS with custom theme                             |
| 🌐 Hosting  | TBD (Frontend), Convex Cloud (Backend)                    |

---

## 📁 Project Structure

```

DIT257-Agile-software-project-management/
│
├── frontend/ # Next.js frontend app
│ ├── src/
│ │ ├── app/ # All route files (e.g., login, donate)
│ │ ├── components/ # UI components (Button, Card, etc.)
│ │ ├── constants/ # Shared constants
│ │ ├── helpers/ # Utility functions
│ │ └── types/ # TypeScript types
│ ├── .env # Frontend environment variables
│ ├── tailwind.config.js # Tailwind theme configuration
│ └── next.config.ts # Next.js config
│
├── backend/ # Convex backend
│ ├── convex/
│ │ ├── functions/ # Convex queries & mutations
│ │ └── schema.ts # Database schema
│ ├── .env.local # Local Convex deployment
│ └── .env # Deployment-level variables

```

---

## 🔧 Setup Instructions

### 🔑 Pre-requisites

- Make sure you have npm/node installed
- Sync your github account with your IDE (git config --list to see if your account is integerated with your terminal)
- Installed git >= 2.0.0

### ✅ 1. Ask for Access

Before starting, ask **Hampus R** or **Joakim** to:

- Invite you to the Convex backend project
- Share `.env` values for both `frontend` and `backend`
- Invite you to the Clerk domain (for auth)

---

### 📥 2. Clone and Install Dependencies

```bash
git clone https://github.com/AhmedYasser-gu/DIT257-Agile-software-project-management.git
cd DIT257-Agile-software-project-management

cd frontend && npm install
cd ../backend && npm install
```

---

### 🔐 3. Configure Environment Variables

#### 📦 `frontend/.env`

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

> Optionally copy from `.env.example` to your `.env` if provided.

#### 📦 `backend/.env` & `backend/.env.local`

```env
CONVEX_DEPLOYMENT=dev:your-deployment-id
CONVEX_URL=https://your-project.convex.cloud
CLERK_JWT_ISSUER_DOMAIN=https://your-clerk-subdomain.clerk.accounts.dev
CLERK_SECRET_KEY=sk_test_...
```

---

### ▶️ 4. Run the App

#### 🟢 Start Backend

```bash
cd backend
npx convex dev
```

- Log in to your Convex account
- Choose **"Configure existing"** when prompted
- You may need to set these manually if not already:

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-clerk-subdomain.clerk.accounts.dev
npx convex env set CLERK_SECRET_KEY sk_test_...
```

Check your dev environment:
👉 [https://dashboard.convex.dev/](https://dashboard.convex.dev/)

---

#### 🟢 Start Frontend

```bash
cd frontend
npm run dev
```

Open your browser:
👉 [http://localhost:3000](http://localhost:3000)

---

## 🧪 Development Notes

- Frontend uses [Next.js App Router](https://nextjs.org/docs/app/building-your-application/routing) with `/app` directory
- Custom Tailwind theme defined in `tailwind.config.js`
- All components styled via Tailwind utility classes
- Clerk is used for authentication + JWTs (users, roles)
- Convex is used as the backend (schema, mutations, queries)

## 💬 Developer Guidelines

✔️ Use consistent spacing, naming, and formatting
✔️ Commit meaningful messages
✔️ Don’t push your `.env` files
✔️ Use reusable components under `src/components`
✔️ Use Tailwind utility classes over custom CSS
✔️ All routes and pages go under `src/app/` (App Router)

---

## 🧪 Testing & Coverage

We use [**Vitest**](https://vitest.dev) for frontend unit testing.

```bash
cd frontend
npm run test

- > Run with coverage report to get %
npm run test:coverage


```

---

We use [**Vitest**](https://vitest.dev) to test Convex backend queries and mutations.

```bash
cd backend
npm run test

- > Run with coverage report to get %
npm run test:coverage
```

## ✅ Definition of Done

Each PR should:

- [x] Meet acceptance criteria according to our agreements in Trello
- [x] Pass local testing / working as intended
- [x] Follow shared design & structure
- [x] Be reviewed and approved
- [x] Be ready for demo if needed
- [x] Update and move Trello card to `Done`

---

## 📚 Helpful Links

- [Next.js Docs](https://nextjs.org/docs)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Convex Docs](https://docs.convex.dev)
- [Clerk Docs](https://clerk.dev/docs)
- [Convex CLI Guide](https://docs.convex.dev/cli)

---

## 🧪 Deployment

| Part     | Platform     | Deployment Type                   |
| -------- | ------------ | --------------------------------- |
| Frontend | TBD          | (TBD)                             |
| Backend  | Convex Cloud | Via `npx convex dev` or dashboard |

---

## 👥 Team 3

- Ahmed Yasser - [GitHub](https://github.com/AhmedYasser-gu)
- Joakim Tuovinen
- Hampus Ramsten - [GitHub](https://github.com/Zvampen04)
- Rasmus Blomén
- Loke Sandén
- Hampus Johansson
