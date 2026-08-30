export const TIER_CONFIGS = [
  {
    tier: 1,
    model: "haiku" as const,
    modelId: "claude-haiku-4-5-20251001",
    maxTokens: 2500,
    prompt: `Create a simple, fun mobile browser game using DOM elements (NOT canvas).

Pick ONE game at random — you MUST use the seed below to choose. Different seeds MUST produce different games. Options: reaction timer, whack-a-mole grid, tap speed test, color match quiz, math blitz, emoji memory pairs, number sort race, pattern repeat, odd one out, reflex test, shape tapper, falling word catch, target tap.

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

SCREEN MANAGEMENT — USE THIS EXACT HTML STRUCTURE IN YOUR <body>:

<div id="startScreen" style="position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#1a1a2e;z-index:10;">
  <h1 style="color:#fff;font-size:32px;">GAME TITLE HERE</h1>
  <p style="color:#aaa;font-size:16px;text-align:center;margin:10px 20px;">How to play instructions here</p>
  <button id="startBtn" style="min-width:200px;min-height:60px;font-size:24px;margin-top:20px;border-radius:12px;border:none;background:#22c55e;color:#fff;cursor:pointer;">START GAME</button>
</div>
<div id="gameScreen" style="display:none;position:fixed;inset:0;">
  <canvas id="c"></canvas>
</div>
<div id="gameOverScreen" style="display:none;position:fixed;inset:0;flex-direction:column;align-items:center;justify-content:center;background:#1a1a2e;z-index:10;">
  <h2 style="color:#fff;font-size:28px;">Game Over</h2>
  <p style="color:#aaa;font-size:22px;">Score: <span id="finalScore">0</span></p>
  <button id="replayBtn" style="min-width:200px;min-height:60px;font-size:24px;margin-top:20px;border-radius:12px;border:none;background:#22c55e;color:#fff;cursor:pointer;">PLAY AGAIN</button>
</div>

USE THIS EXACT JS at the start of your <script>:

var startScreen=document.getElementById('startScreen');
var gameScreen=document.getElementById('gameScreen');
var gameOverScreen=document.getElementById('gameOverScreen');
var canvas=document.getElementById('c');
var ctx=canvas.getContext('2d');
function showScreen(s){startScreen.style.display='none';gameScreen.style.display='none';gameOverScreen.style.display='none';s.style.display='flex';}
document.getElementById('startBtn').addEventListener('click',function(){showScreen(gameScreen);canvas.width=window.innerWidth;canvas.height=window.innerHeight;startGame();});
document.getElementById('replayBtn').addEventListener('click',function(){showScreen(gameScreen);canvas.width=window.innerWidth;canvas.height=window.innerHeight;startGame();});

Then define function startGame(){...} with your game loop. On game over call: showScreen(gameOverScreen); document.getElementById('finalScore').textContent=score;
Clear all intervals/timeouts on game over.
Whenever score changes: if(window._reportScore) window._reportScore(score);

STYLE: dark background, vibrant colors, smooth animations.`,
  },
  {
    tier: 3,
    model: "haiku" as const,
    modelId: "claude-haiku-4-5-20251001",
    maxTokens: 6000,
    prompt: `You are an expert game developer. Create an IMPRESSIVE, POLISHED mobile browser game.

Pick ONE game at random — you MUST use the seed below to choose, and different seeds MUST produce completely different games. Options: tower defense, survival wave shooter, platformer, match-3 gem crusher, space combat, maze runner with enemies, breakout with power-ups, asteroid dodge, card battler, arena brawler, roguelike dungeon, bullet hell, racing dodge, gravity flipper, rhythm tap.

OUTPUT FORMAT:
- Output ONLY complete HTML starting with <!DOCTYPE html>. No markdown, no backticks.
- Single file: ALL CSS in <style>, ALL JS in <script>
- <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
- Creative <title> tag

MOBILE CONTROLS — CRITICAL:
- PHONE ONLY. NO keyboard, NO arrow keys, NO WASD, NO mouse hover.
- Touch-based game controls with visible on-screen UI:
  * For movement: virtual joystick OR drag-to-move via touchmove — draw visible controls on canvas
  * For actions: tap on canvas to shoot/interact
  * touchstart/touchmove/touchend with {passive:false} + e.preventDefault()
- Get touch coords: var rect=canvas.getBoundingClientRect(); var x=e.touches[0].clientX-rect.left; var y=e.touches[0].clientY-rect.top;

RENDERING:
- Canvas API: var canvas=document.getElementById('c'); var ctx=canvas.getContext('2d');
- canvas.width=window.innerWidth; canvas.height=window.innerHeight; — update on resize
- requestAnimationFrame 60fps game loop
- All objects within canvas bounds
- HUD at TOP CENTER (score, health, level) — away from thumb controls
- Particle effects, glow effects (ctx.shadowBlur), vibrant palette on dark background

SCREEN MANAGEMENT — USE THIS EXACT HTML STRUCTURE IN YOUR <body>:

<div id="startScreen" style="position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#1a1a2e;z-index:10;">
  <h1 style="color:#fff;font-size:32px;">GAME TITLE HERE</h1>
  <p style="color:#aaa;font-size:16px;text-align:center;margin:10px 20px;">How to play instructions here</p>
  <button id="startBtn" style="min-width:200px;min-height:60px;font-size:24px;margin-top:20px;border-radius:12px;border:none;background:#a855f7;color:#fff;cursor:pointer;">START GAME</button>
</div>
<div id="gameScreen" style="display:none;position:fixed;inset:0;">
  <canvas id="c"></canvas>
</div>
<div id="gameOverScreen" style="display:none;position:fixed;inset:0;flex-direction:column;align-items:center;justify-content:center;background:#1a1a2e;z-index:10;">
  <h2 style="color:#fff;font-size:28px;">Game Over</h2>
  <p style="color:#aaa;font-size:22px;">Score: <span id="finalScore">0</span></p>
  <button id="replayBtn" style="min-width:200px;min-height:60px;font-size:24px;margin-top:20px;border-radius:12px;border:none;background:#a855f7;color:#fff;cursor:pointer;">PLAY AGAIN</button>
</div>

USE THIS EXACT JS at the start of your <script>:

var startScreen=document.getElementById('startScreen');
var gameScreen=document.getElementById('gameScreen');
var gameOverScreen=document.getElementById('gameOverScreen');
var canvas=document.getElementById('c');
var ctx=canvas.getContext('2d');
function showScreen(s){startScreen.style.display='none';gameScreen.style.display='none';gameOverScreen.style.display='none';s.style.display='flex';}
document.getElementById('startBtn').addEventListener('click',function(){showScreen(gameScreen);canvas.width=window.innerWidth;canvas.height=window.innerHeight;startGame();});
document.getElementById('replayBtn').addEventListener('click',function(){showScreen(gameScreen);canvas.width=window.innerWidth;canvas.height=window.innerHeight;startGame();});

Then define function startGame(){...} with your game loop. On game over call: showScreen(gameOverScreen); document.getElementById('finalScore').textContent=score;
Clear all intervals/timeouts on game over.
Multiple enemy types with different behaviors.
Progressive difficulty (enemies get faster/more numerous).
Power-ups that drop from defeated enemies.
Whenever score changes: if(window._reportScore) window._reportScore(score);

Make it IMPRESSIVE — this is the premium tier. Smooth animations, satisfying feedback.`,
  },
];
