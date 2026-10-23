# Pixaton

Static puzzle-rewards site (no build step). Run: `python3 -m http.server 8000` and open http://localhost:8000.

- `app.js` – CONFIG (AdSense IDs, ad frequency), ranks, milestones, coupon store, game flow
- `games.js` – six puzzle games (Memory, Slide, Word Scramble, Math Sprint, Pattern Echo, Lights Out)

Before real launch: progress/coupons/payouts live in localStorage, so add a backend (auth, server-side
XP validation, coupon inventory, payout review), real ad IDs, a consent banner, and lawyer-reviewed Terms/Privacy.
