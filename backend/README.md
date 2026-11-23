# CarePoint backend starter

This is the first backend milestone: Express starts, connects to the existing MySQL database, and verifies the six existing tables using read-only SELECT queries.

**It does not create, alter, update, or delete any database object or record.**

## Setup

1. Extract this folder next to (not inside) your frontend folder.
2. Open the backend folder in VS Code.
3. Install dependencies:

```bash
npm install
```

4. Copy `.env.example` to `.env`.
5. Set `DB_PASSWORD` to your local MySQL password. Do not share or commit `.env`.
6. Start the backend:

```bash
npm run dev
```

## Test

Open these URLs:

- http://localhost:5000/api/health
- http://localhost:5000/api/db-check

The second endpoint should return MySQL version and row counts for the existing six tables.

Expected existing counts from the verification screenshots:
- state: 18
- district: 38
- dispensary: 656
- healthcare_service: 6
- dispensary_service: 670
- dispensary_raw: 656

## Important

- Keep the frontend `.env` in the frontend folder. It contains `VITE_API_BASE_URL=http://localhost:5000/api`.
- Keep this backend `.env` in the backend folder. It contains MySQL connection settings.
- Do not put database credentials in frontend code.
- This starter temporarily uses your local MySQL account for development. Before deployment, create a dedicated least-privilege MySQL account.
- The next milestone is to finalize additive migrations for new application tables, then implement authentication and role-based access in the API.
