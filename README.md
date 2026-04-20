# StockGuard - Release 1.0

StockGuard is an Inventory Shortage Risk Analysis System built with the MERN stack.
The app helps teams track inventory usage, identify shortage risk early, and support
operational planning through dashboards and reports.

## Release 1.0 Scope

Core features implemented:
- Inventory usage logging with validation and confirmation feedback
- Inventory risk alerts (Safe, At Risk, Critical)
- Inventory summary dashboard for business oversight
- User account management (create/edit/delete users)
- Report generation and analytics views

Non-core features implemented:
- Report export (CSV/PDF)
- System settings and system monitoring

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB + Mongoose

## Project Structure

- `frontend/`: React client application
- `backend/`: Express API and data models

## Prerequisites

- Node.js (18+ recommended)
- npm
- MongoDB running locally or remote URI

## Documentation on GitHub

- **This README** — quick orientation and **developer** setup (clone, install, run, test).
- **[docs/USER_MANUAL.md](docs/USER_MANUAL.md)** — **end-user** guide (draft outline for Appendix C; add screenshots and steps).
- **[docs/ADMIN_MANUAL.md](docs/ADMIN_MANUAL.md)** — **deployment and administration** (draft outline for your final report admin section).

Design documents and the formal **Word/PDF final report** (with appendices) usually follow your course template; you can paste or export from these `docs/` files when assembling Appendix A/C.

**Optional on GitHub:** `LICENSE`, `CONTRIBUTING.md`, or `docs/REPORT.pdf` if your instructor asks for them.

## Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`. You can start from the template:

```bash
# Mac / Linux
cp .env.example .env
# Windows (Command Prompt / PowerShell)
#   copy .env.example .env
# then edit .env for your machine
```

Default values (see `backend/.env.example`):

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/inventorydb
```

Run backend:

```bash
npm run dev
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend uses `VITE_API_URL` if provided (see `frontend/.env.example`); otherwise defaults to `http://localhost:5000`.

## Testing (Release 1.0)

Backend unit/API tests:

```bash
cd backend
npm test
```

Current automated tests cover key auth flows used in Release 1.0:
- Login validation
- Password setup checks
- Initial password setup validation
- Forgot password validation
- Password-setup-required login path

## Production Code Notes

- Source files use consistent naming and formatting conventions.
- API routes and controller entry points include concise JSDoc comments.
- Legacy commented-out code has been removed from application source files.
- Error handling returns user-safe messages while preserving stable UI behavior.

## Demo Data Workflow (Release 1.0)

Use demo data for presentation, then clear it before final release submission.

```bash
cd backend

# 1) Prepare deterministic demo accounts + inventory + usage logs
npm run seed:demo

# 2) Run your acceptance-test demo video
# (show before/after DB state per story while testing)

# 3) Clean demo data before final release push
npm run demo:clear
```

Notes:
- `seed:demo` creates role-specific demo users and realistic inventory/usage records.
- `demo:clear` removes demo users and clears inventory + usage logs.
- Keep `.env` local and do not commit secrets.

## Build

```bash
cd frontend
npm run build
```

## Team

- Kayla Ernest-Jones
- Jasleen Kaur
- Basil Peter Kunnath
- Micheal Oloriegbe
- Bibek Lama
- Vision Baral
- Ruisheng Wang
