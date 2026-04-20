# StockGuard — Administrative & Deployment Manual (Draft)

*For instructors and deployers: install, configure, operate, and maintain the system. Copy into your **final report** admin / deployment section as required.*

## 1. Overview

- **Components:** React (Vite) frontend, Express API, MongoDB
- **Repository layout:** `frontend/`, `backend/`, `docs/`

## 2. Prerequisites

- Node.js _(version you support, e.g. 18+)_
- npm
- MongoDB _(local instance or Atlas URI)_

## 3. Obtaining the Code

```bash
git clone <YOUR_REPO_URL>
cd <project-folder>
```

## 4. Backend Installation and Configuration

1. `cd backend`
2. `npm install`
3. Copy environment template: `cp .env.example .env` _(Windows: `copy .env.example .env`)_
4. Edit **`backend/.env`**:
   - `PORT` — default API port _(e.g. 5000)_
   - `MONGO_URI` — MongoDB connection string

## 5. Database

- **Database name:** _(match `MONGO_URI`, e.g. `inventorydb`)_
- **First run:** API creates collections / settings as needed _(note any seed scripts below)_
- **Demo data (optional):**
  - Seed: `cd backend && npm run seed:demo`
  - Clear: `cd backend && npm run demo:clear`
- **Backup / restore:** _(your institution’s guidance or generic MongoDB export commands — TODO)_

## 6. Starting the API

```bash
cd backend
npm run dev
# production-style:
# npm start
```

- **Health check:** _(e.g. `GET /api/health` — URL pattern)_

## 7. Frontend Installation and Configuration

1. `cd frontend`
2. `npm install`
3. Optional: copy `frontend/.env.example` to `.env` and set **`VITE_API_URL`** if the API is not at `http://localhost:5000`

## 8. Starting the Web Client

```bash
cd frontend
npm run dev
```

- **Default dev URL:** _(e.g. `http://localhost:5173`)_

## 9. Production Build (Frontend)

```bash
cd frontend
npm run build
```

- Output: `frontend/dist/` — serve with your static host or reverse proxy _(TODO: your chosen host)_

## 10. Security and Secrets

- **Never commit** `.env` files or real passwords
- **JWT / auth:** _(describe if you add tokens later; currently session is browser-based per your README — adjust)_
- **Who has admin access:** _(how admin users are created — seed vs first user)_

## 11. Operational Tasks

| Task | How |
|------|-----|
| Restart after config change | _(steps)_ |
| Recalculate all inventory risk | Dashboard **Refresh Data** or `POST /api/inventory/recalculate-risk` _(document if you expose it)_ |
| Update system / risk settings | _(where in UI)_ |

## 12. Testing (for maintainers)

```bash
cd backend
npm test
```

- **What is covered:** _(list suites — e.g. auth routes — update as tests grow)_

## 13. Troubleshooting (Administrators)

| Symptom | Checks |
|---------|--------|
| API will not start | MongoDB running; `MONGO_URI` correct; port free |
| Frontend cannot reach API | `VITE_API_URL`; CORS; firewall |
| Empty or stale inventory | Run seed or verify DB; use risk recalculate endpoint / Refresh Data |

## 14. Maintenance and Updates

- **Updating dependencies:** `npm update` / lockfile policy _(TODO)_
- **Logs:** _(where server logs live if applicable)_

---

**TODO for your team:** Fill URLs, ports, exact commands you verified on Windows, and any **course-specific** hosting notes.
