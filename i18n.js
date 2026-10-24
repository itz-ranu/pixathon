/* Tiny i18n layer. English lives here (and is the fallback for any missing key);
   every other language is a lazy-loaded file: lang/<code>.js calls I18N.add('<code>', {...}).
   Static markup: data-i18n="key" (text) and data-i18n-attr="attr:key;attr2:key2". Placeholders look like {name}. */
(function () {
  const LANGS = [['en', 'English'], ['es', 'Español'], ['fr', 'Français'], ['de', 'Deutsch'], ['pt', 'Português'], ['ru', 'Русский'], ['hi', 'हिन्दी'], ['ar', 'العربية'], ['zh', '简体中文'], ['ja', '日本語']];
  const RTL = ['ar'], LK = 'pixaquest.lang';
  const D = { en: {
    'meta.title': 'Pixaquest – Solve Puzzles, Rank Up, Earn Rewards',
    'meta.desc': 'Brain-sharpening puzzle games. Build a streak, climb the ranks, unlock coupons and cash milestones. Free to play.',
    'skip': 'Skip to content',
    'nav.main': 'Main', 'nav.play': 'Play', 'nav.versus': 'Versus', 'nav.rewards': 'Rewards', 'nav.redeem': 'Redeem', 'nav.ranks': 'Ranks', 'nav.account': 'Account',
    'chip.coins': 'Coins', 'chip.level': 'Level', 'chip.lv': 'Lv',
    'theme.toggle': 'Switch theme', 'lang.title': 'Language', 'lang.d': 'Choose the language for menus, puzzles and rewards.',
    'xp.progress': 'XP progress', 'play': 'Play', 'play.puzzles': 'Puzzles', 'play.lead': 'Pick any. Every win earns XP and coins.', 'play.filter': 'Filter puzzles', 'play.daily': 'Daily progress',
    'vs.kicker': 'Multiplayer', 'vs.title': 'Duel your friends', 'vs.intro': 'Create a room on one laptop, share the code, and race on the same puzzle from another. Win rounds, climb the room leaderboard, earn bonus XP and coins.',
    'vs.create.t': 'Create a room', 'vs.create.d': 'You become the host. Pick the game, add friends, remove anyone, and start when ready.', 'vs.create.b': 'Create room',
    'vs.join.t': 'Join a room', 'vs.join.d': 'Got a code or an invite link? Enter the code here.', 'vs.join.ph': 'ROOM CODE', 'vs.join.aria': 'Room code', 'vs.join.b': 'Join',
    'vs.modes': 'Modes', 'vs.duel': 'Duel', 'vs.duel.d': 'One game, same puzzle for everyone. Highest score wins.', 'vs.trials': 'Trials', 'vs.trials.d': 'Three random games back to back. Points add up, best total wins.',
    'vs.note': 'Up to 6 players per room. Power-ups are disabled so every match is fair. Rooms close when the host leaves.',
    'rw.title': 'Milestone rewards', 'rw.lead': 'Reach the level to unlock. Coupons go to your wallet on the Redeem page. Cash rewards are reviewed before payout.',
    'rd.title': 'Redeem', 'rd.lead': 'Coupons are worth credits. Spend a coupon on any reward you want. Leftover credit becomes coins.',
    'rd.promo': 'Have a code?', 'rd.promo.ph': 'Enter code', 'rd.promo.aria': 'Promo code', 'rd.apply': 'Apply', 'rd.wallet': 'My coupons',
    'rd.choose': 'Choose a reward', 'rd.choose.d': 'Pick a reward, then pay with any coupon that covers it.', 'rd.packs': 'Turn coins into coupons', 'rd.packs.d': 'Bigger packs give bonus credit.',
    'rk.week': 'This week', 'rk.lead': 'Resets every Monday. Sample players shown until live ranks launch.', 'rk.ladder': 'Rank ladder',
    'foot.rewards': 'Rewards are subject to the Terms.', 'foot.legal': 'Legal', 'foot.terms': 'Terms', 'foot.privacy': 'Privacy', 'foot.cookies': 'Cookies', 'foot.faq': 'FAQ', 'foot.contact': 'Contact', 'foot.cookieset': 'Cookie settings',
    'game.quit': 'Quit game',
    'u.level': 'Level {n}', 'u.xp': '{n} XP', 'u.cr': '{n} cr', 'u.credits': '{n} credits', 'u.coins': '{n} coins', 'u.min': '{n} min', 'u.sec': '{n} sec',
    'hero.xp': '{a} / {b} XP to level {n}', 'hero.next': 'Next reward: {name} at level {n}', 'hero.allclaimed': 'All rewards claimed', 'hero.first': 'Solve your first puzzle', 'hero.togo': '{n} XP to level {l}',
    'hero.daily': 'Daily: {name}', 'hero.boost': '2× XP boost active for your next win', 'hero.dailydone': 'Daily bonus done. Keep climbing.', 'hero.dailytip': 'Win it for double XP and coins',
    'card.daily': 'Daily · 2×', 'card.best': 'Best {n}', 'card.new': 'New',
    'bonus.streak': '{n}-day streak', 'bonus.start': 'Start a streak', 'bonus.risk': 'Play today to keep it', 'bonus.daily': 'Daily bonus', 'bonus.claimed': 'Bonus claimed. Back tomorrow', 'bonus.claim': 'Claim {n} coins',
    'spin.used': 'Lucky spin used. Back tomorrow', 'spin.btn': 'Lucky spin', 'spin.tomorrow': 'Come back tomorrow', 'spin.kicker': 'Daily reward', 'spin.title': 'Lucky spin', 'spin.go': 'Spin',
    'spin.coins': 'You won {n} coins', 'spin.coupon': 'You won a {n}-credit coupon', 'spin.boost': 'Next win pays 2× XP', 'wheel.coupon': 'Coupon',
    'quest.title': "Today's quests", 'quest.reset': 'Resets at midnight', 'quest.done': 'Done', 'quest.claim': 'Claim {n}', 'quest.play': 'Play 3 puzzles', 'quest.win': 'Win 2 puzzles', 'quest.xp': 'Earn 150 XP',
    'rw.next': 'Next reward', 'rw.xpto': '{n} XP to level {l}', 'rw.all': 'Every milestone claimed', 'rw.all.d': 'You did it all. More rewards are coming.', 'rw.claimed': 'Claimed', 'rw.ready': 'Ready to claim', 'rw.togo': '{n} XP to go', 'rw.claim': 'Claim',
    'mile.coins': '{n} bonus coins', 'mile.coupon': '{n}-credit coupon', 'mile.cash': '${n} cash reward',
    'rd.redeemed': 'Redeemed', 'rd.redeem': 'Redeem', 'rd.empty': 'No coupons yet', 'rd.empty.d': 'Reach level 3 or turn coins into a coupon below.', 'rd.get': 'Get', 'rd.pack': 'Coupon pack',
    'cat.c1': 'ShopNova 15% off', 'cat.c2': 'FoodieGo free delivery', 'cat.c3': 'StreamBox 1 month free', 'cat.c4': 'Mobile top-up', 'cat.c5': 'PayPal cash $2', 'cat.c6': 'Gift card $5', 'cat.c7': 'Donate to charity',
    'cat.n.code': 'Instant code', 'cat.n.review': 'Reviewed within 7 days', 'cat.n.email': 'Emailed within 7 days', 'cat.n.instant': 'Instant',
    'rk.you': '(you)', 'rk.lvplus': 'Level {n}+',
    'rank.1': 'Rookie', 'rank.3': 'Thinker', 'rank.5': 'Sharp Mind', 'rank.8': 'Strategist', 'rank.12': 'Brainiac', 'rank.18': 'Genius', 'rank.25': 'Mastermind', 'rank.35': 'Grandmaster', 'rank.50': 'Legend',
    'acct.edit': 'Edit character', 'acct.name': 'Display name', 'acct.overview': 'Overview', 'acct.character': 'Character', 'acct.achievements': 'Achievements', 'acct.activity': 'Activity', 'acct.settings': 'Settings',
    'acct.best': 'Best scores', 'acct.activity.empty': 'Nothing yet. Claimed rewards and redemptions show up here.',
    'ach.count': '{a} of {b} unlocked', 'ach.toast': 'Achievement: {n} (+20 coins)',
    'ach.first.t': 'First win', 'ach.first.d': 'Win any puzzle', 'ach.s3.t': 'On a roll', 'ach.s3.d': '3-day streak', 'ach.s7.t': 'Unstoppable', 'ach.s7.d': '7-day streak',
    'ach.l5.t': 'Sharp mind', 'ach.l5.d': 'Reach level 5', 'ach.l10.t': 'Brainiac', 'ach.l10.d': 'Reach level 10', 'ach.all.t': 'Explorer', 'ach.all.d': 'Try every puzzle',
    'ach.perf.t': 'Flawless', 'ach.perf.d': 'Earn 3 stars five times', 'ach.q.t': 'Quest runner', 'ach.q.d': 'Finish 10 quests', 'ach.coin.t': 'Saver', 'ach.coin.d': 'Hold 500 coins',
    'stat.level': 'Level', 'stat.xp': 'Total XP', 'stat.coins': 'Coins', 'stat.solved': 'Puzzles solved', 'stat.streak': 'Day streak', 'stat.bonuses': 'Bonuses claimed',
    'theme.title': 'Appearance', 'theme.d': 'Match your device or pick a side.', 'theme.system': 'System', 'theme.light': 'Light', 'theme.dark': 'Dark',
    'set.play': 'Gameplay', 'set.sound': 'Sound', 'set.sound.d': 'Game and reward sounds', 'set.haptics': 'Vibration', 'set.haptics.d': 'Feedback on phones', 'set.diff': 'Difficulty', 'set.diff.d': 'Default for new rounds',
    'set.more': 'More', 'set.invite': 'Invite a friend', 'set.reset': 'Reset progress', 'set.reset.d': 'Erase XP, coins and rewards on this device.', 'set.reset.b': 'Reset',
    'set.reset.confirm': 'Erase all progress, coins and rewards on this device?', 'set.reset.done': 'Progress reset',
    'share.invite': 'I am training my brain and earning rewards on Pixaquest. Try it!', 'share.solved': 'I solved {game} on Pixaquest and earned {n} XP. Can you beat me?', 'share.played': 'I played {game} on Pixaquest and earned {n} XP. Can you beat me?',
    'cp.added': 'Coupon added to your wallet', 'cp.worth': 'Worth {v}. Spend it on any reward you like.', 'cp.choose': 'Choose a reward', 'cp.later': 'Later', 'cp.welcome': 'Welcome coupon', 'cp.lucky': 'Lucky coupon',
    'st.wallet': 'Added to wallet', 'st.coupons': 'Added to coupons', 'st.pending': 'Pending review', 'st.done': 'Done', 'st.donated': 'Donated, thank you',
    'toast.coins': '+{n} coins', 'toast.copied': 'Link copied', 'toast.level': 'Level {n}!',
    'cash.kicker': 'Cash reward', 'cash.d': 'Where should we send it? Payouts are reviewed within 7 days.', 'cash.method': 'Payout method', 'cash.bank': 'Bank transfer', 'cash.ph': 'Email, UPI ID or account details', 'cash.aria': 'Payout details', 'cash.go': 'Request payout', 'cash.toast': 'Payout requested. Pending review',
    'claim.to': '{n} to {m}',
    'rdm.choose': 'Choose your reward', 'rdm.left': 'Leftover credit turns into coins.', 'rdm.pay': 'Pay with a coupon. Leftover credit turns into coins.', 'rdm.none': 'You have no coupon big enough yet.',
    'rdm.review': 'Reviewed within 7 days. We will use these details only to deliver it.', 'rdm.confirm': 'Confirm', 'rdm.ph.topup': 'Mobile number', 'rdm.ph.gift': 'Email for the gift card', 'rdm.ph.cash': 'PayPal email or UPI ID',
    'rdm.done': 'Redeemed', 'rdm.code': 'Your code', 'rdm.deliver': 'We will review and deliver it within 7 days.', 'rdm.thanks': 'Thank you!', 'rdm.leftover': '+{n} coins from leftover credit.',
    'cancel': 'Cancel', 'done': 'Done', 'close': 'Close', 'continue': 'Continue',
    'promo.bad': 'That code is not valid', 'promo.used': 'Code already used',
    'combo': 'Combo ×{n}', 'game.nocoins': 'Not enough coins', 'game.quit.label': 'Quit',
    'pre.best': 'Your best: {n}', 'pre.nobest': 'No score yet. Set one!', 'pre.start': 'Start', 'pre.notnow': 'Not now',
    'lu.kicker': 'Level up', 'lu.unlocked': 'Reward unlocked: {name}', 'lu.keep': 'Keep going. Your next reward is closer.',
    'res.solved': 'Puzzle solved', 'res.over': 'Round over', 'res.newbest': 'New best', 'res.stars': '{n} of 3 stars', 'res.xp': 'XP earned', 'res.daily': '(daily 2×)', 'res.diff': 'Difficulty', 'res.boost': '2× boost',
    'res.perfect': 'Perfect bonus', 'res.coins': 'Coins', 'res.streak': 'Streak', 'res.next': 'Next level', 'res.lvl': 'Level {n} reached: {name}', 'res.again': 'Play again', 'res.double': 'Watch ad to double rewards',
    'res.share': 'Share result', 'res.claim': 'Claim reward', 'res.back': 'Back to puzzles',
    'ad.space': 'Ad space', 'ad.rewarded': 'Rewarded ad', 'ad.sponsored': 'Sponsored', 'ad.double': 'Watch to double your rewards', 'ad.back': 'Back in a moment', 'ad.plays': 'Your ad plays here', 'ad.claim': 'Claim bonus', 'ad.skip': 'Skip ad',
    'ob.shuffle': 'Shuffle character', 'ob.welcome': 'Welcome', 'ob.title': 'Train your brain. Earn rewards.', 'ob.1': 'Solve puzzles to earn XP and coins.', 'ob.2': 'Level up to unlock coupons and cash rewards.', 'ob.3': 'Spend coupons on the reward you want.',
    'ob.name': 'Pick a display name', 'ob.go': 'Start with 25 free coins',
    'consent.aria': 'Cookie consent', 'consent.text': 'We use cookies to run the site and to show ads. You can accept personalised ads or keep them non-personalised. See our {link}.', 'consent.link': 'Cookie policy',
    'consent.yes': 'Accept', 'consent.no': 'Keep non-personalised', 'consent.saved': 'Preferences saved', 'consent.np': 'Non-personalised ads only',
    'diff.easy': 'Easy', 'diff.normal': 'Normal', 'diff.hard': 'Hard',
    'tag.All': 'All', 'tag.Memory': 'Memory', 'tag.Logic': 'Logic', 'tag.Language': 'Language', 'tag.Speed': 'Speed', 'tag.Focus': 'Focus',
    /* games */
    'g.memory.n': 'Memory Match', 'g.memory.d': 'Find every pair. Chain matches for combos.', 'g.memory.h': 'Cards flash briefly, then hide. Flip two at a time and match every pair. Chain matches for combo points. Peek costs 10 coins.',
    'g.slide.n': 'Slide Master', 'g.slide.d': 'Slide tiles into order. Plan ahead.', 'g.slide.h': 'Tap a tile next to the gap, or use arrow keys. Put the tiles in order. Hard mode is a 4×4 board. Fewer moves earn more XP.',
    'g.words.n': 'Word Scramble', 'g.words.d': 'Unscramble 5 words before time runs out.', 'g.words.h': 'Tap letters (or type) to spell each English word. You have 2 skips. Solve at least 3 to win. Power-ups can reveal a letter or add time.',
    'g.math.n': 'Math Sprint', 'g.math.d': 'Answer as many sums as you can.', 'g.math.h': 'Type the answer. It submits itself when correct. Every 5 in a row adds 2 seconds. Get 8 right to win.',
    'g.pattern.n': 'Pattern Echo', 'g.pattern.d': 'Repeat the growing light-and-sound pattern.', 'g.pattern.h': 'Watch the pads light up, then repeat the order. It speeds up as it grows. Reach round 5 to win. Keys 1–4 work.',
    'g.lights.n': 'Lights Out', 'g.lights.d': 'Switch off every light on the grid.', 'g.lights.h': 'Tapping a light flips it and the four next to it. Turn every light off in as few taps as you can. Hint shows a cell to tap.',
    'g.merge.n': 'Merge', 'g.merge.d': 'Merge tiles to hit the goal tile.', 'g.merge.h': 'Swipe or use arrow keys. Equal tiles merge. Reach the goal tile (128, 256 or 512) before the board fills. Undo is available.',
    'g.sudoku.n': 'Mini Sudoku', 'g.sudoku.d': 'A quick 4×4 number grid.', 'g.sudoku.h': 'Pick an empty cell, then a number. Every row, column and 2×2 box must contain 1 to 4 once. Hint fills a cell for you.',
    'g.stroop.n': 'Color Clash', 'g.stroop.d': 'Name the color, ignore the word.', 'g.stroop.h': 'A color name appears in a different ink color. Tap the button for the INK color. Watch for pink rule rounds: then tap the WORD instead. 3 mistakes end the round.',
    'g.odd.n': 'Odd Tile', 'g.odd.d': 'Spot the tile with a different shade.', 'g.odd.h': 'One tile has a slightly different shade. Tap it. The grid grows and the difference shrinks. 3 mistakes end the round.',
    'g.sweep.n': 'Mine Sweep', 'g.sweep.d': 'Clear the field without hitting a mine.', 'g.sweep.h': 'Tap to reveal a cell. Numbers show how many mines touch it. Long-press or Flag mode marks mines. Clear every safe cell to win. Your first tap is always safe.',
    'g.code.n': 'Code Breaker', 'g.code.d': 'Crack the hidden 4-color code.', 'g.code.h': 'Pick 4 colors and press Check. A filled peg means right color and spot. A hollow peg means right color, wrong spot. Crack it before you run out of tries.',
    'g.rush.n': 'Target Rush', 'g.rush.d': 'Hit targets before they vanish.', 'g.rush.h': 'Targets pop up and shrink. Tap them before the ring closes. Gold targets are worth 3 and add time. Avoid the red bombs. Run out of lives and the round ends.',
    'g.recall.n': 'Number Recall', 'g.recall.d': 'Memorize a number, then type it.', 'g.recall.h': 'A number flashes briefly. Type it back from memory. Each success adds one digit.',
    'g.wave.n': 'Wavelength', 'g.wave.d': 'Place the clue on the spectrum.', 'g.wave.h': 'A spectrum runs between two opposites. You get a word. Drag the dial to where you think it belongs, then lock in. Closer is more points. 5 rounds, hint shows a zone.',
    'g.snake.n': 'Snake', 'g.snake.d': 'Eat, grow, and don\'t crash.', 'g.snake.h': 'Steer with arrow keys, WASD, swipes or the buttons. Eat apples to grow. Gold apples give bonus points and time. Hitting a wall or yourself ends the run.',
    'g.wordle.n': 'Word Guess', 'g.wordle.d': 'Find the hidden 5-letter word.', 'g.wordle.h': 'Type a 5-letter word and press Enter. Green: right letter, right spot. Yellow: right letter, wrong spot. Grey: not in the word. Fewer guesses earn more.',
    'g.tictac.n': 'Tic-Tac-Toe', 'g.tictac.d': 'Beat the computer in 3 rounds.', 'g.tictac.h': 'Get three in a row before the computer does. Best of 3 rounds, and you swap who starts. Win 2 rounds to win the match.',
    'wv.lock': 'Lock in', 'wv.hint': 'Drag the dial, then lock in.', 'wv.bull': 'Bullseye!', 'wv.miss': 'Miss', 'wv.off': 'Off by {n}', 'wv.lbl': '{n}/20 points',
    'snk.gold': 'GOLD!', 'snk.lbl': '{n} apples', 'snk.hint': 'Eat {n} apples to win. Gold apples are worth 2 and add time.',
    'wd.enter': 'Enter', 'wd.short': 'Need 5 letters', 'wd.lbl': 'Solved in {n}', 'wd.lost': 'Word not found', 'wd.was': 'The word was {w}', 'wd.letter': 'Letter {n} is {c}',
    'ttt.w': 'Wins', 'ttt.l': 'Losses', 'ttt.you': 'Your turn (✕)', 'ttt.ai': 'Computer thinking…', 'ttt.won': 'You win this round!', 'ttt.lost': 'Computer wins this round', 'ttt.draw': 'Draw', 'ttt.lbl': '{w}W {d}D {l}L', 'ttt.hint': 'Three in a row wins. Hint shows the best move.',
    'g.flap.n': 'Flap', 'g.flap.d': 'Tap to fly through the gaps.', 'g.flap.h': 'Tap, click or press Space to flap. Fly through the gaps between pipes without touching anything. Clear the goal number of pipes to win.',
    'g.dino.n': 'Dino Dash', 'g.dino.d': 'Jump the cacti, run as far as you can.', 'g.dino.h': 'Tap, click or press Space to jump. The dino speeds up as you go. Reach the goal distance without hitting a cactus.',
    'g.mole.n': 'Whack-a-Mole', 'g.mole.d': 'Whack moles, dodge bombs.', 'g.mole.h': 'Tap the moles as they pop up. Skip the bombs: hitting one costs points. Chain hits for a combo bonus. You have 30 seconds.',
    'g.stack.n': 'Stack Tower', 'g.stack.d': 'Time your taps to build high.', 'g.stack.h': 'A block slides back and forth. Tap to drop it on the tower. Any overhang gets cut off, so the tower narrows. Land it dead center for a perfect and keep your width.',
    'g.react.n': 'Reaction Test', 'g.react.d': 'Tap the instant it turns green.', 'g.react.h': 'Wait for the box to turn green, then tap as fast as you can. Tapping too early restarts the round. 5 rounds, beat the target average.',
    'flp.hint': 'Tap or press Space to flap. Clear {n} pipes to win.', 'flp.lbl': '{n} pipes',
    'dino.hint': 'Tap or press Space to jump. Run {n} m to win.', 'dino.lbl': '{n} m',
    'mole.hint': 'Whack {n} moles. Avoid the bombs.', 'mole.lbl': '{n} moles',
    'stk.hint': 'Tap or press Space to drop. Stack {n} blocks to win.', 'stk.lbl': '{n} blocks', 'stk.perfect': 'PERFECT!',
    'rx.start': 'Tap to start', 'rx.wait': 'Wait for green…', 'rx.go': 'TAP NOW!', 'rx.early': 'Too early! Tap to retry', 'rx.res': '{n} ms. Tap for next', 'rx.hint': 'Average under {n} ms to win.', 'rx.lbl': '{n} ms avg',
    'g.slice.n': 'Fruit Slice', 'g.slice.d': 'Swipe to slice fruit, skip bombs.', 'g.slice.h': 'Swipe across the fruit to slice it. Slicing several in one swipe scores extra. Hitting a bomb costs a life. Slice the goal amount in 45 seconds.',
    'g.brick.n': 'Brick Breaker', 'g.brick.d': 'Bounce the ball, smash every brick.', 'g.brick.h': 'Move your paddle with the mouse, finger or arrow keys. Tap or press Space to launch. Break every brick before you lose all 3 lives. Chain hits for a combo.',
    'g.blocks.n': 'Block Drop', 'g.blocks.d': 'Stack falling blocks, clear lines.', 'g.blocks.h': 'Move and rotate falling blocks to fill complete rows. Full rows clear. Clear the goal number of lines before the stack reaches the top.',
    'slc.hint': 'Swipe to slice. Slice {n} fruit to win.', 'slc.lbl': '{n} sliced', 'slc.multi': 'MULTI!',
    'brk.hint': 'Move to aim, tap or Space to launch.', 'brk.lbl': '{n} bricks',
    'blk.hint': 'Arrows or buttons: move, rotate, drop. Clear {n} lines.', 'blk.lbl': '{n} lines', 'blk.next': 'NEXT', 'hud.lines': 'Lines', 'pw.clear': 'Clear 4 rows',
    'hud.moves': 'Moves', 'hud.pairs': 'Pairs', 'hud.word': 'Word', 'hud.solved': 'Solved', 'hud.skips': 'Skips', 'hud.correct': 'Correct', 'hud.streak': 'Streak', 'hud.round': 'Round', 'hud.lights': 'Lights',
    'hud.score': 'Score', 'hud.best': 'Best', 'hud.goal': 'Goal', 'hud.lives': 'Lives', 'hud.digits': 'Digits', 'hud.mines': 'Mines', 'hud.try': 'Try', 'hud.hits': 'Hits',
    'hud.memorize': 'Memorize…', 'hud.mem2': 'Memorize', 'hud.watch': 'Watch…', 'hud.yourturn': 'Your turn', 'hud.typeit': 'Type it',
    'pop.match': 'Match', 'pop.word': '+1 word',
    'pw.peek': 'Peek', 'pw.hint': 'Hint', 'pw.reveal': 'Reveal letter', 'pw.secs': '+{n} seconds', 'pw.replay': 'Replay', 'pw.undo': 'Undo', 'pw.spot': 'Spot it', 'pw.again': 'Show again', 'pw.safe': 'Safe cell', 'pw.spot2': 'Reveal a spot', 'pw.life': '+1 life',
    'lbl.moves': '{n} moves', 'lbl.movesTime': '{m} moves · {s}s', 'lbl.words': '{n}/5 words', 'lbl.mathEnd': '{n} correct · best streak {b}', 'lbl.round': 'Reached round {n}', 'lbl.mergeWin': '{g} in {n} moves',
    'lbl.besttile': 'Best tile {n}', 'lbl.sudokuEnd': '{s}s · {m} moves', 'lbl.correct': '{n} correct', 'lbl.found': '{n} found', 'lbl.digits': '{n} digits', 'lbl.mine': 'Hit a mine',
    'lbl.cracked': 'Cracked in {n}', 'lbl.notcracked': 'Code not cracked', 'lbl.hits': '{n} hits',
    'hint.slide': 'Tap a tile or use arrow keys. Fewer moves = more XP.', 'hint.words': 'Tap letters or type on your keyboard', 'hint.math': 'Type the answer. It submits itself when correct. Enter clears a wrong guess. Every 5 streak adds 2 seconds.',
    'hint.pattern': 'Tap the pads or press 1–4.', 'hint.lights': 'Tapping a light flips it and its neighbours. Turn them all off.', 'hint.merge': 'Swipe or use arrow keys. Merge equal tiles to reach {n}.',
    'hint.sudoku': 'Fill the grid so every row, column and 2×2 box has 1–4 once. Keys 1–4 work.', 'hint.stroop': 'Tap the COLOR of the text, not the word.', 'hint.odd': 'Tap the tile with a slightly different shade. Every 5 in a row adds 3 seconds.',
    'hint.sweep': 'Tap to reveal. Long-press, right-click or Flag mode to mark mines. First tap is always safe.', 'hint.code': 'Find the hidden 4 colors (no repeats). Filled peg: right color, right spot. Hollow peg: right color, wrong spot.',
    'hint.rush': 'Tap targets before the ring closes. Gold = bonus, red bombs = avoid. Hit {n} to win.',
    'rush.gold': 'GOLD +3', 'rush.bomb': 'BOMB!', 'stroop.word': 'Pink rule! Tap the WORD, not the color', 'combo.5': 'Nice!', 'combo.10': 'ON FIRE!', 'combo.15': 'UNSTOPPABLE!', 'combo.20': 'LEGENDARY!',
    'w.clear': 'Clear', 'w.skip': 'Skip', 'check': 'Check', 'sdk.erase': 'Erase', 'sw.flagoff': 'Flag mode: off', 'sw.flagon': 'Flag mode: on', 'code.spot': 'Spot {n}:',
    'col.red': 'RED', 'col.green': 'GREEN', 'col.blue': 'BLUE', 'col.yellow': 'YELLOW', 'col.pink': 'PINK',
    /* character */
    'av.random': 'Randomize', 'av.skin': 'Skin', 'av.hair': 'Hair', 'av.haircolor': 'Hair colour', 'av.eyes': 'Eyes', 'av.mouth': 'Mouth', 'av.pattern': 'Shirt pattern', 'av.shirt': 'Shirt colour', 'av.extras': 'Extras', 'av.bg': 'Background',
    'av.locked': 'Unlocks at level {n}', 'av.label': 'Character',
    'av.o.bald': 'Bald', 'av.o.short': 'Short', 'av.o.sidepart': 'Side part', 'av.o.long': 'Long', 'av.o.bun': 'Bun', 'av.o.curly': 'Curly', 'av.o.mohawk': 'Mohawk', 'av.o.pigtails': 'Pigtails',
    'av.o.dots': 'Dots', 'av.o.wide': 'Wide', 'av.o.happy': 'Happy', 'av.o.sleepy': 'Sleepy', 'av.o.cool': 'Cool', 'av.o.smile': 'Smile', 'av.o.grin': 'Grin', 'av.o.smirk': 'Smirk', 'av.o.calm': 'Calm', 'av.o.tongue': 'Tongue',
    'av.o.solid': 'Solid', 'av.o.stripes': 'Stripes', 'av.o.zigzag': 'Zigzag', 'av.o.checks': 'Checks', 'av.o.none': 'None', 'av.o.glasses': 'Glasses', 'av.o.shades': 'Shades', 'av.o.cap': 'Cap',
    'av.o.headphones': 'Headphones', 'av.o.headband': 'Headband', 'av.o.crown': 'Crown', 'av.o.star': 'Star',
    /* versus */
    'v.joined': '{n} joined', 'v.need2': 'You need at least 2 players', 'v.left': '{n} left', 'v.finished': 'Finished', 'v.waitothers': 'Score {s}. Waiting for the others to finish…', 'v.hide': 'Hide', 'v.dnf': 'Did not finish',
    'v.waithost': 'Waiting for host', 'v.waitnext': 'Waiting for host to start next round', 'v.newmatch': 'New match', 'v.nextround': 'Next round', 'v.roundof': 'Round {a} of {b}', 'v.final': 'Final', 'v.wins': '{n} wins',
    'v.results': 'Results', 'v.earned': 'You earned +{xp} XP and +{c} coins', 'v.backlobby': 'Back to lobby', 'v.kicked': 'The host removed you from the room', 'v.closed': 'The host closed the room', 'v.full': 'That room is full',
    'v.creating': 'Creating room…', 'v.offline': 'Online server unreachable: room works across tabs on this device only', 'v.entercode': 'Enter a room code', 'v.leavefirst': 'Leave your current room first', 'v.joining': 'Joining…',
    'v.notfound': 'Could not find that room. Check the code or ask for a new link.', 'v.disc': 'Disconnected from the room', 'v.removed': '{n} was removed', 'v.copied': 'Invite link copied', 'v.sharetext': "Join my Pixaquest room {c} and let's duel!",
    'v.playing': 'Playing', 'v.host': 'Host', 'v.you': 'You', 'v.playing2': 'Playing…', 'v.ready': 'Ready', 'v.remove': 'Remove', 'v.waitfriend': 'Waiting for a friend…', 'v.sharelink': 'Share the invite link',
    'v.settings': 'Match settings', 'v.mode': 'Mode', 'v.1game': '1 game', 'v.3games': '3 games', 'v.game': 'Game', 'v.games': 'Games', 'v.reroll': 'Reroll',
    'v.rules': 'Everyone gets the same puzzle. Power-ups are off. Higher score wins; points are shared by rank.', 'v.rules3': 'Everyone gets the same puzzle. Power-ups are off. Higher score wins; points are shared by rank across 3 rounds.',
    'v.inprogress': 'Match in progress…', 'v.waitplayers': 'Waiting for players', 'v.start': 'Start match', 'v.waitstart': 'Waiting for host to start', 'v.lobby': 'Room lobby', 'v.localroom': 'Local room (this device)', 'v.onlineroom': 'Online room',
    'v.players': '{a}/{b} players', 'v.room': 'Room', 'v.copy': 'Copy link', 'v.share': 'Share', 'v.min': 'Minimise', 'v.closeroom': 'Close room', 'v.leave': 'Leave room', 'v.inroom': 'You are in a room', 'v.nplayers': '{n} player(s)',
    'v.relaying': 'Direct link blocked. Connecting through the relay…', 'v.neterr': 'Could not reach the connection server. Check your internet and try again.', 'v.localwarn': 'This page is running on localhost, so the link only opens on this laptop. Your friend should open the same website on their laptop, go to Versus and type the room code.',
    'v.openlobby': 'Open lobby', 'v.invite': 'Invitation', 'v.joinq': 'Join room {c}?', 'v.invited': 'A friend invited you to a Pixaquest duel as {n}.', 'v.joinroom': 'Join room',
  } };
  let lang = 'en', cur = D.en;

  function t(k, v) {
    let s = cur[k]; if (s == null) s = D.en[k]; if (s == null) return k;
    return v ? s.replace(/\{(\w+)\}/g, (m, n) => (v[n] != null ? v[n] : m)) : s;
  }
  const n = (x) => { try { return Number(x).toLocaleString(lang); } catch { return String(x); } };
  const load = (l) => (D[l] ? Promise.resolve() : new Promise((res) => {
    const s = document.createElement('script'); s.src = 'lang/' + l + '.js'; s.onload = s.onerror = () => res(); document.head.append(s);
  }));
  function apply(root = document) {
    root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    root.querySelectorAll('[data-i18n-attr]').forEach((el) => el.dataset.i18nAttr.split(';').forEach((p) => { const [a, k] = p.split(':'); el.setAttribute(a, t(k)); }));
    if (root === document) {
      document.title = t('meta.title');
      const m = document.querySelector('meta[name="description"]'); if (m) m.content = t('meta.desc');
    }
  }
  const stored = () => { try { return localStorage.getItem(LK); } catch { return null; } };
  const detect = () => {
    const l = stored(); if (l && LANGS.some((x) => x[0] === l)) return l;
    for (const c of navigator.languages || [navigator.language || 'en']) { const b = String(c).slice(0, 2).toLowerCase(); if (LANGS.some((x) => x[0] === b)) return b; }
    return 'en';
  };
  async function set(l, persist) {
    if (!LANGS.some((x) => x[0] === l)) l = 'en';
    await load(l); if (!D[l]) l = 'en';
    lang = l; cur = D[l];
    if (persist) { try { localStorage.setItem(LK, l); } catch {} }
    const h = document.documentElement; h.lang = l; h.dir = RTL.includes(l) ? 'rtl' : 'ltr';
    apply();
    if (I18N.onchange) I18N.onchange(l);
  }
  const I18N = window.I18N = {
    LANGS, t, n, apply, set, onchange: null,
    get lang() { return lang; },
    add(l, dict) { D[l] = dict; },
  };
  I18N.ready = set(detect(), false);
})();
