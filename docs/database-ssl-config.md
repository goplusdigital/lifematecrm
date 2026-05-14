## Goal
- Fix CRM database connections when the Postgres server does not support SSL.
- Keep SSL available for hosted databases that require it.

## What was changed
- Updated `apps/crm/lib/db.ts` so the shared `pg` pool no longer enables SSL unconditionally.
- CRM now enables SSL only when:
  - `CRM_DATABASE_SSL`, `DATABASE_SSL`, or `PGSSLMODE` explicitly requests SSL.
  - `DATABASE_URL` / `SUPABASE_POSTGRES_URL` has `sslmode` that is not `disable`.
  - The database host looks like Supabase (`supabase.co`).

## Impact
- Local or Docker Postgres URLs without SSL now work for CRM APIs such as `/api/otp/request`.
- Hosted SSL databases still work when configured with `sslmode=require` or an SSL env flag.

## Test instructions
- For local Postgres, set `DATABASE_URL` without `sslmode=require`, then request `/api/otp/request`.
- Expected: no `The server does not support SSL connections` error.
- For hosted SSL Postgres, set `DATABASE_URL` with `sslmode=require` or `DATABASE_SSL=true`, then run CRM build/start and test an API route that queries DB.

## Caveats or warnings
- If a hosted database requires SSL but the URL does not include `sslmode=require`, set `DATABASE_SSL=true` or `CRM_DATABASE_SSL=true`.
- If a local database rejects SSL, set `PGSSLMODE=disable` or remove SSL flags from the URL.
