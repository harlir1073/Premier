# Voyager Backoffice — Travel Agency Management System

A web-based back-office system for managing clients/agents, suppliers (hotels, airlines,
transfers, cruises), offline reservations, payments, payment requests, reports, alerts,
and user/role-based access control.

## Stack

- **Database**: PostgreSQL (designed for Google Cloud SQL, but works with any Postgres)
- **Backend**: Node.js + Express, JWT auth, role-based permissions
- **Frontend**: React (Vite) + Tailwind CSS

## Project structure

```
backoffice-system/
├── backend/        Express API
│   ├── migrations/ SQL schema + seed data (run once)
│   └── src/
└── frontend/       React app (Vite)
```

## 1. Database setup

1. Create a PostgreSQL database (locally, or on Cloud SQL):
   ```
   createdb backoffice
   ```
2. Copy `backend/.env.example` to `backend/.env` and fill in your DB credentials.
3. Run the migration (creates all tables + seed roles/permissions + a default admin user):
   ```
   cd backend
   npm install
   npm run migrate
   ```

### Default login
- Email: `admin@example.com`
- Password: `Admin123!`

**Change this password immediately after first login** (via the Users page once you're
signed in, or directly in the database).

## 2. Backend

```
cd backend
npm install
npm run dev      # starts on http://localhost:4000
```

## 3. Frontend

```
cd frontend
npm install
npm run dev      # starts on http://localhost:5173
```

The Vite dev server proxies `/api` requests to `http://localhost:4000`, so the frontend
and backend run side-by-side during development.

## Roles included

| Role       | Access |
|------------|--------|
| Admin      | Full access to everything |
| Accountant | Clients/agents, suppliers, reservations, payments, payment requests, reports (view/create/edit/approve) |
| Booker     | Create/edit reservations, view-only on clients/agents and suppliers |
| Viewer     | Read-only access across all modules |

Permissions are stored in the `role_permissions` table and can be adjusted directly in
the database, or extended with a UI later.

## What's included so far

- Login + JWT authentication
- Role-based UI (sidebar links and action buttons appear/disappear based on permissions)
- Dashboard with outstanding balances and alerts
- Clients/Agents and Suppliers master data (list + create)
- Reservations: list, create (with multiple product lines), and detail view with
  per-line agent/supplier pricing and payment status
- Mark payments received/paid directly from a reservation
- Payment requests: bundle unpaid agent items into a request, track status
- Reports: outstanding agent payments, outstanding supplier payments, profit summary
- Notifications/alerts table + a scheduled job (`src/jobs/alerts.job.js`) that flags
  upcoming/overdue payments — run it via cron or Cloud Scheduler

## Next steps / things to refine after first visual pass

- Edit/delete flows for clients, agents, suppliers, and reservation line items
- Pagination on list pages
- PDF generation for payment requests
- Filtering payment requests by date range
- User management: edit role/password from the UI
- Audit log viewer
