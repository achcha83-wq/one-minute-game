export const TIER_CONFIGS = [
  {
    tier: 1,
    model: "haiku" as const,
    modelId: "claude-haiku-4-5-20251001",
    maxTokens: 4000,
    prompt: `Create a simple, fun mobile browser game using DOM elements (NOT canvas).

Pick ONE game at random — you MUST use the seed below to choose. Different seeds MUST produce different games. Options: reaction timer, whack-a-mole grid, tap speed test, color match quiz, math blitz, emoji memory pairs, number sort race, pattern repeat, odd one out, reflex test, shape tapper, rapid fire trivia, falling word catch, target tap.

EXACT STRUCTURE REQUIRED:
1. A start screen: title + 1-2 lines explaining HOW TO PLAY (e.g. "Tap the emoji before they disappear!") + big START button
2. Gameplay: game elements appear as <div>s inside a container, player taps them
3. Game over: final score + PLAY AGAIN button

OUTPUT RULES:
- Output ONLY complete HTML starting with <!DOCTYPE html>. No markdown, no backticks, no explanation.
- Single file with <style> and <script> tags
- <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
- <title> with the game name

MOBILE INTERACTION — THIS IS CRITICAL:
- Use addEventListener('click') on EVERY interactive element. This is a phone — no keyboard, no hover.
- Buttons: min 200px wide, 60px tall, font-size 24px
- Game elements (things to tap): min 50px, position:absolute inside a position:relative container
- Spawn positions: left = Math.random() * (container.offsetWidth - size), top = Math.random() * (container.offsetHeight - size)
- NEVER use coordinates that go outside the container

GAME LOOP — THIS IS CRITICAL:
- On START click: hide start screen, show game screen, start a setInterval that spawns elements
- Spawned elements: styled <div>s with emoji or text, position:absolute, addEventListener('click') to score + remove
- Auto-remove elements after 2-3 seconds if not tapped
- 30 second game timer, then show game over
- On game over: clearInterval all timers, show score
- Whenever score changes: if(window._reportScore) window._reportScore(score);

STYLE: dark background (#1a1a2e), vibrant colored elements, full viewport (100vw x 100vh).`,
  },
  {
    tier: 2,
    model: "sonnet" as const,
    modelId: "claude-sonnet-4-6",
    maxTokens: 8000,
    prompt: `You are a game developer. Create a FUN, FULLY PLAYABLE mobile browser game.

Pick ONE game at random — you MUST use the seed below to choose, and different seeds MUST produce completely different games. Options: snake, breakout, memory cards, space invaders, bubble shooter, tower stacker, dodge falling objects, shooting gallery, simon says, asteroid dodge, pong, tetris, fruit ninja swipe, connect dots, pipe puzzle, maze escape, gem crusher, block breaker, target practice, rhythm tap.

OUTPUT FORMAT:
- Output ONLY complete HTML starting with <!DOCTYPE html>. No markdown, no backticks.
- Single file: ALL CSS in <style>, ALL JS in <script>
- <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
- Creative <title> tag

MOBILE CONTROLS — CRITICAL:
- This runs on a PHONE. NO keyboard, NO arrow keys, NO mouse hover.
- Buttons (START, PLAY AGAIN): use addEventListener('click'), min 200px wide, 60px tall
- Game controls: tap to shoot/select, drag/swipe to move
- Touch events: canvas.addEventListener('touchstart', fn, {passive:false}) — call e.preventDefault()
- Get touch position: var rect=canvas.getBoundingClientRect(); var x=e.touches[0].clientX-rect.left; var y=e.touches[0].clientY-rect.top;
- For movement: visible on-screen D-pad or drag-to-move via touchmove
- NEVER reference keyboard or mouse-only events

RENDERING:
- Use Canvas API: var canvas=document.getElementById('c'); var ctx=canvas.getContext('2d');
- Canvas size: canvas.width=window.innerWidth; canvas.height=window.innerHeight; — recalc on resize
- requestAnimationFrame game loop at 60fps
- All game objects must stay within canvas bounds (0 to canvas.width, 0 to canvas.height)

GAME FLOW:
- Start screen with title + brief HOW TO PLAY instructions (1-2 lines explaining controls) + START button
- Gameplay → game over with score + PLAY AGAIN
- Clear all intervals/timeouts on game over
- Whenever score changes: if(window._reportScore) window._reportScore(score);

STYLE: dark background, vibrant colors, smooth animations.`,
  },
  {
    tier: 3,
    model: "sonnet" as const,
    modelId: "claude-sonnet-4-6",
    maxTokens: 5000,
    prompt: `Create a polished mobile browser game. Single HTML file, canvas-based, touch-only (NO keyboard).

Pick ONE at random using the seed below. Different seeds = different games. Options: tower defense, wave shooter, platformer, match-3, space combat, maze runner, breakout variant, asteroid dodge, card battler, arena brawler.

RULES:
- Output ONLY <!DOCTYPE html>. No markdown, no backticks.
- <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
- <title> with game name
- Canvas: var canvas=document.getElementById('c'); var ctx=canvas.getContext('2d');
- canvas.width=window.innerWidth; canvas.height=window.innerHeight; resize on window resize
- requestAnimationFrame game loop
- Touch: canvas.addEventListener('touchstart',fn,{passive:false}); e.preventDefault(); var rect=canvas.getBoundingClientRect(); var x=e.touches[0].clientX-rect.left;
- On-screen controls: virtual joystick or tap-to-act, 60px+ touch targets
- States: menu (title + brief HOW TO PLAY instructions + START button) → playing → game over (score + PLAY AGAIN)
- Multiple enemy types, progressive difficulty, power-ups
- HUD at top center (score, health). Dark background, vibrant colors, glow effects.
- Whenever score changes: if(window._reportScore) window._reportScore(score);
- Keep code CONCISE — no comments, short variable names, no unnecessary whitespace.`,
  },
];
