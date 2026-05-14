## Goal
- Grant **Welcome Points** automatically when a customer completes **brand-new signup** in CRM.
- Welcome points should be controlled by CMS configuration (amount + active window) and must be **idempotent** (no double grants).

## What was changed
- CRM registration endpoint [apps/crm/app/api/register/route.ts](apps/crm/app/api/register/route.ts)
  - When registration completes, CRM tries to grant welcome points if the member was created inside the configured campaign window and does not already have the deterministic `signup_welcome:<member_code>` transaction.
  - Reads config from the `settings` table (CMS) key `WELCOME_POINT_SIGNUP`.
  - Grants points by inserting a `point_logs` record with deterministic `txId` and increments `members.member_point` only if that insert succeeds.
  - Existing campaign-window members can be granted later through the same idempotent transaction if they reach the registration endpoint without an existing welcome-point log.
  - Wraps the welcome-point grant in a DB savepoint so signup can still commit if the settings/points path fails.
  - If settings/points table is unavailable or misconfigured, registration still succeeds (welcome points is skipped).
- Added config parser/helper [apps/crm/lib/welcomePoints.ts](apps/crm/lib/welcomePoints.ts)

## Impact
- New signups may receive additional points and a `point_logs` record of type `earn` with `refType = signup_welcome`.
- Repeated registration attempts (same phone/member) will not create duplicate welcome point grants.

## Test instructions
- In CMS Web Settings, create/update key `WELCOME_POINT_SIGNUP` with JSON example:
```json
{
  "enabled": true,
  "points": 10,
  "startAt": "2026-04-01T00:00:00+07:00",
  "endAt": "2026-05-31T23:59:59+07:00",
  "expiresInDays": 365
}
```
- Ensure current time is within the configured `startAt`/`endAt` window.
- Signup in CRM with a phone number that does not exist in `members`:
  - Expect `members.member_point` increases by `points`.
  - Expect a `point_logs` row exists with:
    - `"txId" = "signup_welcome:<member_code>"`
    - `"refType" = "signup_welcome"`
    - `"refId" = "<member_code>"`
    - `amount = points`, `"remainingAmount" = points`
- Repeat the signup call (or double-submit):
  - Expect **no additional** `point_logs` row and **no additional** point increment.
- Set `enabled=false` or move current time outside the window:
  - Signup still succeeds, but no points are granted.

## Backfill existing campaign members
- If members were created after the campaign started but before this feature was deployed, they may not have `signup_welcome` rows yet.
- Confirm the configured campaign window and points before running any backfill.

```sql
WITH config AS (
  SELECT
    10::int AS points,
    TIMESTAMPTZ '2026-04-01 00:00:00+07' AS start_at,
    TIMESTAMPTZ '2026-05-31 23:59:59+07' AS end_at,
    365::int AS expires_in_days
),
eligible AS (
  SELECT
    m.member_code,
    c.points,
    NOW() + (c.expires_in_days || ' days')::interval AS expires_at
  FROM members m
  CROSS JOIN config c
  WHERE m.created_at >= c.start_at
    AND m.created_at <= c.end_at
    AND NOT EXISTS (
      SELECT 1
      FROM point_logs pl
      WHERE pl."txId" = 'signup_welcome:' || m.member_code
    )
),
inserted_logs AS (
  INSERT INTO point_logs ("txId", type, amount, "remainingAmount", "expiresAt", "refType", "refId", reason, "memberCode", balance)
  SELECT
    'signup_welcome:' || member_code,
    'earn',
    points,
    points,
    expires_at,
    'signup_welcome',
    member_code,
    'welcome_backfill',
    member_code,
    0
  FROM eligible
  ON CONFLICT ("txId") DO NOTHING
  RETURNING "txId", "memberCode", amount
),
updated_members AS (
  UPDATE members m
  SET member_point = member_point + il.amount,
      updated_at = NOW()
  FROM inserted_logs il
  WHERE m.member_code = il."memberCode"
  RETURNING m.member_code, m.member_point, il."txId"
)
UPDATE point_logs pl
SET balance = um.member_point
FROM updated_members um
WHERE pl."txId" = um."txId";
```

## Caveats / warnings
- `point_logs` columns are camelCase in Postgres (e.g. `"memberCode"`, `"refType"`, `"txId"`). Queries must use quoted identifiers.
- If `WELCOME_POINT_SIGNUP` is missing or JSON is invalid, the system will silently skip granting welcome points.
- The backfill SQL changes customer balances. Run it only after confirming the intended point amount and campaign dates.
