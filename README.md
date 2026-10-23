# Pixaquest

Static puzzle-rewards site (no build step). Run: `python3 -m http.server 8000` and open http://localhost:8000.

- `app.js` – CONFIG (AdSense IDs, ad frequency), ranks, milestones, coupon store, game flow
- `games.js` – eleven puzzle games
- `terms.html`, `privacy.html`, `faq.html` – draft legal/FAQ pages (fill the [placeholders], get legal review)

Before real launch: progress/coupons/payouts live in localStorage, so add a backend (auth, server-side
XP validation, coupon inventory, payout review), real ad IDs, a consent banner, and lawyer-reviewed Terms/Privacy.
