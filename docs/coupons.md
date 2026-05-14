# Goal
Allow members to view available coupons, claim coupons subject to conditions, and activate/use a claimed coupon with a 30-minute countdown.

# What was changed
- Added CRM API routes (Next.js route handlers):
  - `GET /api/coupons/available` (available coupons + `canClaim` + reason)
  - `POST /api/coupons/claim` (creates a `coupon_claims` row; generates code per rules)
  - `GET /api/coupons/my` (member’s claimed coupons; auto-expires activated coupons past 30 minutes)
  - `POST /api/coupons/activate` (sets `ACTIVATED` + `activation_expires_at = now + 30 min`)
  - `POST /api/coupons/use` (marks `USED`)
- Updated UI page: `apps/crm/app/privilege/coupon/page.tsx`
  - Tabs: “คูปองทั้งหมด” / “คูปองของฉัน”
  - Claim button disabled when claim limit exceeded / outside claim window / insufficient points
  - After claim: prompts to activate immediately
  - Activation modal shows QR (coupon code) + countdown and “บันทึกว่าใช้งานแล้ว”

# Impact
- Coupon code behavior:
  - `FIXED`: all members see the same code.
  - `RANDOM_PER_USER`: system generates a unique-ish code per claim at claim time.
- Point redemption (when `points_required > 0`):
  - Member points are deducted on claim.
  - A `point_logs` row of type `spend` is inserted with `refType = coupon`.

# Test instructions
- Ensure DB has the CMS migration `20260503_add_coupons` applied.
- Start CRM: `pnpm crm:dev`
- Open `Privilege → Coupon`.
- Try claiming:
  - Over claim limit (button should disable with reason).
  - With insufficient points (button should disable with reason).
- Activate a claimed coupon and confirm modal countdown (30 minutes).
- Click “บันทึกว่าใช้งานแล้ว” and verify status changes to `USED`.

# Caveats / warnings
- Random codes are generated once at claim time and persisted in DB.
- If a coupon is `ACTIVATED` and the countdown expires, `/api/coupons/my` will auto-mark it as `EXPIRED`.
- New customer condition:
  - If `coupons.require_new_member_same_day = true`, member must have `members.created_at` on the same calendar day as claim time to be able to claim.
