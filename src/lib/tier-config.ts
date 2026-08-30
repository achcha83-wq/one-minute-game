export const TIER_CONFIGS = [
  {
    tier: 1,
    model: "haiku" as const,
    modelId: "claude-haiku-4-5-20251001",
    maxTokens: 4000,
    prompt: `Create a simple, fun mobile browser game. Pick ONE at random using the seed: tap speed test, whack-a-mole, balloon pop, color match, emoji catch, math blitz.

Rules:
- Output ONLY complete HTML starting with <!DOCTYPE html>. No markdown.
- Single file: CSS in <style>, JS in <script>
- MOBILE ONLY: NO keyboard, NO arrow keys, NO mouse hover.
- Use addEventListener('click') for ALL buttons and interactive elements (works on mobile).
- Also add touchstart/touchend for game canvas controls.
- Add this CSS to the page: * { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
- Use viewport meta tag: <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
- Full screen (100vw x 100vh), overflow:hidden, dark background
- Large tap targets (min 48px), score counter
- Start screen with big clickable START button, Game Over with Play Again button
- requestAnimationFrame, vibrant colors, <title> tag
- Whenever the score changes, call: if(window._reportScore) window._reportScore(score);
- Must be COMPLETE and playable on a phone.`,
  },
  {
    tier: 2,
    model: "sonnet" as const,
    modelId: "claude-sonnet-4-6",
    maxTokens: 8000,
    prompt: `You are a game developer. Create a FUN, PLAYABLE browser game. Pick ONE random concept using the seed: snake, breakout, memory cards, space invaders, bubble shooter, tower stacker, dodge falling objects, shooting gallery, simon says.

CRITICAL REQUIREMENTS:
- Output ONLY complete HTML starting with <!DOCTYPE html>. No markdown, no backticks.
- Single file: ALL CSS in <style>, ALL JS in <script>
- MOBILE PHONE ONLY — NO keyboard, NO arrow keys, NO mouse hover exist.
- Use addEventListener('click') for ALL buttons (START, PLAY AGAIN, menu items).
- For game controls: tap to shoot/select, swipe/drag to move. Use touchstart/touchmove/touchend with {passive:false} + preventDefault().
- Add this CSS: * { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
- For movement games: visible on-screen joystick or D-pad via touch drag
- Viewport: <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
- Full viewport (100vw x 100vh), overflow:hidden, dark background
- Canvas API rendering, requestAnimationFrame for 60fps
- Scoring system, Start screen + Game Over with Play Again
- Vibrant colors, smooth animations, creative <title>
- Whenever the score changes, call: if(window._reportScore) window._reportScore(score);
- Must be COMPLETE and FULLY FUNCTIONAL on a phone.`,
  },
  {
    tier: 3,
    model: "sonnet" as const,
    modelId: "claude-sonnet-4-6",
    maxTokens: 16000,
    prompt: `You are an expert game developer. Create an IMPRESSIVE, POLISHED browser game. Pick ONE random concept using the seed: roguelike dungeon crawler, tower defense, RPG battle, physics puzzle, survival waves, bullet hell, platformer, maze runner, tetris-style, rhythm game, match-3.

CRITICAL REQUIREMENTS:
- Output ONLY complete HTML starting with <!DOCTYPE html>. No markdown, no backticks.
- Single file: ALL CSS in <style>, ALL JS in <script>
- MOBILE PHONE ONLY — NO keyboard, NO arrow keys, NO WASD, NO mouse hover.
- Use addEventListener('click') for ALL buttons (START, PLAY AGAIN, menu items, pause).
- For game controls: 100% touch-based with visible on-screen virtual controls:
  * D-pad or virtual joystick on canvas for movement (touchmove drag)
  * Action buttons (attack/jump/shoot) as large tappable circles on right side
  * touchstart/touchmove/touchend with {passive:false} + preventDefault()
  * Multi-touch support (move AND act simultaneously)
- Add this CSS: * { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
- Viewport: <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
- Full viewport (100vw x 100vh), overflow:hidden
- Canvas API rendering, requestAnimationFrame 60fps
- Complex scoring, upgrades or progression
- Multiple states: menu, playing, paused, game over
- HUD at TOP CENTER (away from controls), multiple enemy types
- Web Audio API oscillators (AudioContext on first touch), particle effects
- Power-ups, vibrant palette on dark background, glow effects, creative <title>
- Whenever the score changes, call: if(window._reportScore) window._reportScore(score);
- Must be COMPLETE and FULLY FUNCTIONAL on a phone.`,
  },
];
