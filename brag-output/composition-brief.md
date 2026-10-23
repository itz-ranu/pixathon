# Hyperframes Composition Brief: Cariberry

## Output
- Composition: `brag-output/composition/` · Render: `brag-output/brag.mp4` · 1920x1080 · 23s

## Source Material
- Files read: README.md, windows-app/src/shared/data.js (theme tokens), windows-app/src/renderer/panel/panel.css, panel renders from `Cariberry.app --render-panel/--render-species`
- Real visuals used: panel PNGs (Home, Focus, Closet, Settings), species sprites, outfit sprites (all cropped from the app's own renders, in `composition/assets/img/`)
- Verbatim copy: "Start 25 min focus", "Pick your bestie", "Close Reels tabs for me · One warning first", "Gentle Cozy / Sassy Bestie / Drill Sergeant", "The World's Cutest Desktop Companion & Study Bestie", "100% On-Device", "Mix & Match 8 Slots", "She'll sit beside you with a book, and bring boba on your break."

## Grounding
Invented lines are framing only ("Your desktop just got a bestie.", "Dress her up.", "Pick her vibe"). Every product claim traces to the README or the app UI.

## Audio
- Music `assets/music/bed.mp3` (vol-1, trimmed, fade baked), cues from the bundled preset; subtle audio-reactive glow via `assets/audio-data.js` (bass/mid per frame at 30fps).
- SFX from the bundled CC0 set, copied into `assets/sfx/`; timestamps chosen after the animation existed.

## Requirements
Run `npx hyperframes check` before render; keep text readable; stay within 15–25s; local render only.
