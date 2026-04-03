---
name: StoreApp Security Patterns
description: Security architecture, libraries in use, and known vulnerability patterns found in StoreApp
type: project
---

## Security libraries already in use
- helmet (applied at app level, crossOriginResourcePolicy set to cross-origin for uploads)
- cors (express-cors)
- bcrypt (12 salt rounds) for passwords
- jsonwebtoken — access token 15m, refresh 7d; separate secrets for each
- express-rate-limit on auth routes (10 req / 15 min)
- zod for request body validation via validate middleware
- better-sqlite3 with parameterized queries throughout (no raw string concatenation found)
- stripe webhook signature verification via constructEvent

## Patterns confirmed safe
- All DB queries use prepared statements with ? placeholders — no SQL injection found
- Refresh token rotation: new token issued on each /refresh call, old one invalidated in DB
- Admin middleware (requireAdmin) does a fresh DB lookup on every request — cannot be bypassed by JWT claims alone
- Prices for checkout come from the DB JOIN in CartModel.getByUserId, not from client payload — server-authoritative pricing
- Stripe webhook uses raw body buffer before express.json() — correct setup

## Vulnerabilities found and fixed (2026-04-02 audit)
1. CORS wildcard (HIGH) — origin callback fell through to `callback(null, true)` for all origins. Fixed with allowlist regex in app.js.
2. Multer extension spoofing (MEDIUM) — fileFilter checked path.extname(file.originalname) which attacker controls. Fixed: now checks file.mimetype and derives stored extension from MIME type in both auth.routes.js and admin.routes.js.
3. Token echoed in verifyEmail response (LOW) — raw verification token returned in JSON. Removed from response.
4. No stock check before Stripe session creation (MEDIUM) — user could checkout items with stock=0. Fixed: pre-flight stock loop added in checkout.controller.js.
5. avatar_url accepts arbitrary URLs (MEDIUM) — no validation allowed storing any external URL. Fixed: restricted to /uploads/ relative paths only.
6. XSS in order notification email (MEDIUM) — customer-controlled strings (product name, shipping address) interpolated unescaped into HTML email. Fixed: escHtml() helper added to email.js.
7. Missing null guard in changePassword / changeEmail (LOW) — double DB lookup could theoretically throw if user was deleted mid-request. Fixed with explicit null check.
8. No max-length guard on newPassword in changePassword (LOW) — bcrypt DoS via very long password was possible. Fixed: 128-char max added.
9. No input validation on admin createProduct / updateProduct (MEDIUM) — price_cents and stock could be negative floats. Fixed: integer + non-negative checks added.

## Areas still worth monitoring
- The /uploads/ directory is served statically with no authentication — by design for product images, but uploaded user avatars are also public.
- No CSRF protection for state-changing endpoints (mitigated in practice because the API is JSON-only with Authorization header, not cookies, but worth noting if cookie auth is ever added).
- localStorage token storage (client/src/api/client.js) — acceptable trade-off for SPA but means tokens are accessible to any JS on the page; document this risk.
