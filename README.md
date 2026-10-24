# Pixaquest
::: {align="center"}
# ✦ MONEY MAZE ✦

### A Puzzle Game About Money, Choices & Strategy

*Think smart. Solve puzzles. Master every move.*

![Status](https://img.shields.io/badge/Genre-Puzzle-7C83FD?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Mobile%20%7C%20Web-5D9C8B?style=for-the-badge)
![Focus](https://img.shields.io/badge/Theme-Money%20%26%20Logic-F4B860?style=for-the-badge)
:::

------------------------------------------------------------------------

## ◈ About the Game

**Money Maze** is a money-themed puzzle game where logic meets strategy.
Work through challenges, make thoughtful choices, and solve each level
one move at a time.

> 🧩 **Your goal:** Solve the puzzle, learn through play, and enjoy the
> challenge.

## ✧ Features

-   🧠 **Brain-teasing puzzles** --- test your logic and problem-solving
    skills.
-   💰 **Money-inspired gameplay** --- explore coins, budgets, and
    money-related challenges in a playful setting.
-   🎁 **In-game rewards** --- collect points, coins, or bonuses where
    available.
-   📺 **Rewarded ads** --- optional ad-based rewards may be available
    in supported versions.
-   📈 **Progress tracking** --- keep track of your levels and
    achievements where supported.
-   ✨ **Simple, engaging experience** --- designed for quick sessions
    or longer puzzle runs.

## 🎮 How to Play

1.  Open a level and review the puzzle.
2.  Think through the available choices.
3.  Make your move and solve the challenge.
4.  Earn any displayed in-game rewards.
5.  Continue to the next puzzle and improve your strategy.

*Features and rewards may vary depending on the version of the game.*

## 🪙 Rewards

The game may include virtual coins, points, hints, badges, or other
in-game rewards.

-   Virtual items are for gameplay unless official rules explicitly say
    otherwise.
-   Virtual coins and points do **not** represent real money and cannot
    be exchanged for cash unless the game clearly provides an authorized
    real-money reward program.
-   Rewarded advertisements, when offered, are subject to the displayed
    conditions.

## 🔐 Privacy & Safety

We value player privacy. Please review the policies provided with the
game to understand how information, advertisements, and rewards are
handled.

-   [Privacy Policy](01_Privacy_Policy_Puzzle_Money_Game.pdf)
-   [Advertising Policy](02_Advertising_Policy_Puzzle_Money_Game.pdf)
-   [Rewards Policy](03_Rewards_Policy_Puzzle_Money_Game.pdf)
-   [Terms & Conditions](04_Terms_and_Conditions_Puzzle_Money_Game.pdf)

> **Please note:** These policy files are templates. Replace
> placeholders and ensure they match the game's real data practices, ad
> providers, reward mechanics, and applicable laws before publishing.

## 🛠️ Project Setup

Add installation or launch instructions here once the project setup is
finalized.

``` text
1. Download or clone the project.
2. Install the required dependencies.
3. Run the game using the project's configured command.
```

*The exact commands depend on the technology stack used by the project.*

## 🗺️ Roadmap

-   [ ] Add more puzzle levels
-   [ ] Improve hints and tutorial flow
-   [ ] Add achievements and progress milestones
-   [ ] Refine accessibility and mobile layouts
-   [ ] Review privacy, advertising, and reward flows before release

## 💌 Feedback & Support

Found a bug or have an idea for a new puzzle?

-   **Email:** \[your-support-email@example.com\]
-   **Developer / Team:** \[Your team name\]

## 📜 License

Add your chosen license here, such as MIT or a proprietary license. Do
not claim an open-source license unless you intend to publish the
project under those terms.

------------------------------------------------------------------------

::: {align="center"}
**Made with ♡ and a little bit of logic**

*Every puzzle is a new opportunity to think differently.*
:::


Static puzzle-rewards site (no build step). Run: `python3 -m http.server 8000` and open http://localhost:8000.

- `app.js` – CONFIG (AdSense IDs, ad frequency), ranks, milestones, coupon store, game flow
- `games.js` – eighteen puzzle games
- `terms.html`, `privacy.html`, `faq.html` – draft legal/FAQ pages (fill the [placeholders], get legal review)

Before real launch: progress/coupons/payouts live in localStorage, so add a backend (auth, server-side
XP validation, coupon inventory, payout review), real ad IDs, a consent banner, and lawyer-reviewed Terms/Privacy.

## Versus (friend duels)
`versus.js` runs rooms over WebRTC using the free PeerJS broker (unpkg + 0.peerjs.com), falling back to same-device tabs. For production reliability host your own PeerJS server or move rooms to the planned backend. `avatar.js` is the character builder; logo assets live in `assets/`.


## 🖥️ Laptop-to-laptop multiplayer

Versus rooms use WebRTC (PeerJS broker + STUN/TURN relay), so two laptops on **different networks** can play each other once both open the same hosted copy of the site.

1. Laptop A: **Versus → Create room**, then share the 5-letter code (or the invite link).
2. Laptop B: open the site, **Versus → Join**, enter the code.

Testing on one Wi-Fi without deploying: run `./serve.sh` on laptop A and open the `http://<ip>:5177` address it prints on both laptops. (A `localhost` invite link only works on the laptop that hosts it, so share the code or the IP address instead.)
