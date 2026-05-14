# Goal
Fix production redirects that incorrectly send users to `0.0.0.0:3000` when `apps/crm` is running behind `nginx` `proxy_pass` and Docker.

# What was changed
- Added `apps/crm/lib/publicUrl.ts` to build redirect URLs from `x-forwarded-host` / `x-forwarded-proto` (falling back to `host` / `req.nextUrl`).
- Updated redirect construction in:
  - `apps/crm/proxy.ts`
  - `apps/crm/app/api/logout/route.ts`

# Impact
- Redirects now preserve the public hostname + scheme in production (e.g. `https://crm.example.com/...`) instead of the internal container address.

# Test instructions
1. Ensure nginx forwards headers:
   - `X-Forwarded-Host`
   - `X-Forwarded-Proto`
2. Hit a route that triggers middleware redirect (e.g. with/without token) and confirm `Location` points to the public domain.
3. Optional curl check (adjust host):
   - `curl -I -H 'Host: crm.example.com' -H 'X-Forwarded-Host: crm.example.com' -H 'X-Forwarded-Proto: https' http://<container-ip>:3000/privilege`

# Caveats or warnings
- If nginx does not send `X-Forwarded-Host` / `X-Forwarded-Proto`, redirects may still reflect the internal host. Prefer setting both headers explicitly in your nginx config.

