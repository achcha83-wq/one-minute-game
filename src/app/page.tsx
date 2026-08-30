"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const TIERS = [
  {
    minutes: 1,
    target: 60,
    label: "1 MIN",
    sub: "Quick & scrappy",
    color: "#22c55e",
    prompt: `You are a game developer. Create a FUN, PLAYABLE browser game. Pick ONE random concept from this list — use the random seed to choose unpredictably, do NOT always pick the first: clicker game, reaction speed test, dodge falling objects, whack-a-mole, color matching, balloon popping, catch falling items, memory sequence simon says, shooting gallery, quick math challenge, emoji catcher, color flood fill.

CRITICAL REQUIREMENTS:
- Output ONLY the complete HTML. Start with <!DOCTYPE html>. No explanation, no markdown, no backticks before or after the HTML.
- Single self-contained HTML file with ALL CSS in <style> and ALL JS in <script>
- MUST work on mobile touch screens — use touch events (touchstart, touchmove, touchend) alongside mouse events
- Use viewport meta tag: <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
- Make the game fill the entire viewport (100vw x 100vh), no scrolling
- Use large tap targets (min 48px) for mobile
- Include a visible score counter
- Vibrant colors on dark background
- requestAnimationFrame for animation
- Game over state with large Play Again button
- Show brief instructions on start screen with a large START button
- Give the game a creative title in the <title> tag
- IMPORTANT: The game must be COMPLETE and FULLY FUNCTIONAL. Do not leave any TODO or placeholder code.`,
  },
  {
    minutes: 2,
    target: 120,
    label: "2 MIN",
    sub: "More depth",
    color: "#f97316",
    prompt: `You are a skilled game developer. Create a POLISHED, ENGAGING browser game. Pick ONE random concept — use the random seed to choose unpredictably, do NOT always pick the first: snake with power-ups, breakout brick breaker, memory card matching, space invaders, platformer, maze runner, tetris-inspired, bubble shooter, tower stacker, asteroid shooter, pong with twists, flappy bird style, connect-the-dots puzzle, color sorting.

CRITICAL REQUIREMENTS:
- Output ONLY the complete HTML. Start with <!DOCTYPE html>. No explanation, no markdown, no backticks before or after.
- Single self-contained HTML file with ALL CSS in <style> and ALL JS in <script>
- MUST work on mobile — use BOTH touch events AND mouse/keyboard. For mobile: add on-screen virtual buttons/joystick or use tap/swipe gestures
- Use viewport meta tag: <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
- Fill entire viewport (100vw x 100vh), prevent scrolling with overflow:hidden on body
- Scoring system with best score tracking in memory
- Increasing difficulty or levels
- Vibrant colors, gradients, smooth animations on dark background
- Use Canvas API for rendering
- Start screen with title + instructions + big START button. Game over screen with score + PLAY AGAIN button.
- requestAnimationFrame for 60fps
- Sound effects using Web Audio API oscillators (no external files)
- Visual feedback on key events (flash, shake)
- Give the game a creative title in the <title> tag
- IMPORTANT: The game must be COMPLETE and FULLY FUNCTIONAL. Every feature must work.`,
  },
  {
    minutes: 3,
    target: 180,
    label: "3 MIN",
    sub: "Go all out",
    color: "#a855f7",
    prompt: `You are an expert game developer. Create an IMPRESSIVE, POLISHED browser game. Pick ONE random concept — use the random seed to choose unpredictably: roguelike dungeon crawler, tower defense, RPG battle arena, physics puzzle, survival waves, top-down racing, bullet hell shooter, deck builder card game, procedural adventure, rhythm action game, puzzle platformer, match-3 with twists.

CRITICAL REQUIREMENTS:
- Output ONLY the complete HTML. Start with <!DOCTYPE html>. No explanation, no markdown, no backticks before or after.
- Single self-contained HTML file with ALL CSS in <style> and ALL JS in <script>
- MUST work on mobile — use BOTH touch AND mouse/keyboard. Add on-screen virtual controls (d-pad, action buttons) for mobile
- Use viewport meta tag: <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
- Fill entire viewport (100vw x 100vh), prevent all scrolling
- Canvas API for all rendering
- Complex scoring, upgrades or progression
- Multiple game states: menu, playing, paused, game over
- HUD with score/level/health
- Multiple enemy types with different behaviors
- requestAnimationFrame at 60fps
- Sound effects via Web Audio API oscillators
- Particle effects for explosions/impacts
- Power-ups or special abilities
- Vibrant palette on dark background, glow effects
- Give the game a creative title in the <title> tag
- IMPORTANT: The game must be COMPLETE and FULLY FUNCTIONAL. Do not cut corners or leave stubs.`,
  },
];

const MESSAGES = [
  ["Rolling the dice...", "Wiring up the fun...", "Applying pixel dust...", "Almost ready..."],
  ["Brainstorming chaos...", "Sculpting levels...", "Adding juice...", "Tuning difficulty...", "Polishing pixels...", "Nearly done..."],
  ["Imagining worlds...", "Spawning enemies...", "Building arenas...", "Adding particles...", "Composing sounds...", "Balancing gameplay...", "Stress testing fun...", "Final polish..."],
];

type AppState = "idle" | "generating" | "holding" | "ready" | "error";

export default function Page() {
  const [state, setState] = useState<AppState>("idle");
  const [tierIdx, setTierIdx] = useState<number | null>(null);
  const [gameHtml, setGameHtml] = useState("");
  const [gameName, setGameName] = useState("");
  const [gameId, setGameId] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [loadMsg, setLoadMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgIdx = useRef(0);
  const startT = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const buffered = useRef<{ html: string; name: string; id: string } | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (abortRef.current) abortRef.current.abort();
  }, []);

  const generate = useCallback(async (idx: number) => {
    const tier = TIERS[idx];
    const msgs = MESSAGES[idx];
    const target = tier.target;

    setTierIdx(idx);
    setState("generating");
    setElapsed(0);
    setGameHtml("");
    setGameName("");
    setGameId("");
    setErrMsg("");
    setCopied(false);
    setFullscreen(false);
    msgIdx.current = 0;
    setLoadMsg(msgs[0]);
    buffered.current = null;

    startT.current = Date.now();

    timerRef.current = setInterval(() => {
      const s = Math.floor((Date.now() - startT.current) / 1000);
      setElapsed(s);

      const iv = Math.max(Math.floor(target / msgs.length), 4);
      const ni = Math.min(Math.floor(s / iv), msgs.length - 1);
      if (ni !== msgIdx.current) {
        msgIdx.current = ni;
        setLoadMsg(msgs[ni]);
      }

      if (s >= target && buffered.current) {
        clearInterval(timerRef.current!);
        timerRef.current = null;
        setGameHtml(buffered.current.html);
        setGameName(buffered.current.name);
        setGameId(buffered.current.id);
        setElapsed(target);
        setState("ready");
      }
    }, 250);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const seed = Math.random().toString(36).slice(2, 10) + "-" + Date.now().toString(36);
      const res = await fetch("/api/generate-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({ prompt: tier.prompt, seed, tier: idx + 1 }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);

      if (data.html && data.id) {
        const now = Math.floor((Date.now() - startT.current) / 1000);
        if (now >= target) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          setElapsed(target);
          setGameHtml(data.html);
          setGameName(data.name || "Mystery Game");
          setGameId(data.id);
          setState("ready");
        } else {
          buffered.current = { html: data.html, name: data.name || "Mystery Game", id: data.id };
          setState("holding");
        }
      } else {
        throw new Error(data.error || "Empty response");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        if (timerRef.current) clearInterval(timerRef.current);
        setState("idle");
        return;
      }
      if (timerRef.current) clearInterval(timerRef.current);
      setErrMsg(err instanceof Error ? err.message : "Something went wrong");
      setState("error");
    }
  }, []);

  const cancel = () => {
    if (abortRef.current) abortRef.current.abort();
    if (timerRef.current) clearInterval(timerRef.current);
    setState("idle");
  };

  const shareGame = async () => {
    const url = `${window.location.origin}/game/${gameId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: gameName, text: `Play "${gameName}" — built by AI`, url });
        return;
      } catch { /* user cancelled, fall through to clipboard */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard failed silently */ }
  };

  const playFullPage = () => {
    window.open(`/game/${gameId}`, "_blank");
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const tc = tierIdx !== null ? TIERS[tierIdx].color : "#e4e4f0";
  const target = tierIdx !== null ? TIERS[tierIdx].target : 60;
  const progress = Math.min(elapsed / target, 1);

  // Fullscreen game view
  if (fullscreen && state === "ready") {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "#000", display: "flex", flexDirection: "column",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "8px 16px", background: "rgba(17,17,17,0.95)", flexShrink: 0,
          borderBottom: "1px solid #222",
        }}>
          <span style={{ color: "#e4e4f0", fontSize: 14, fontWeight: 600 }}>{gameName}</span>
          <button onClick={() => setFullscreen(false)} style={{
            background: "none", border: "1px solid #444", color: "#ccc",
            padding: "8px 18px", borderRadius: 8, fontSize: 13, cursor: "pointer",
          }}>Exit</button>
        </div>
        <iframe srcDoc={gameHtml} sandbox="allow-scripts" title={gameName}
          style={{ flex: 1, width: "100%", border: "none", background: "#000" }} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100dvh", background: "#0b0b1a", color: "#e4e4f0",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "20px 16px", WebkitTapHighlightColor: "transparent",
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* IDLE */}
        {state === "idle" && <>
          <div style={{ textAlign: "center", marginBottom: 36, paddingTop: 16 }}>
            <div style={{
              fontSize: 11, letterSpacing: 4, textTransform: "uppercase",
              color: "#6b6b8d", marginBottom: 12, fontFamily: "monospace",
            }}>One Minute Game</div>
            <h1 style={{
              fontSize: 28, fontWeight: 700, lineHeight: 1.15,
              margin: "0 0 10px 0",
            }}>Press a button.<br />Get a game.</h1>
            <p style={{ fontSize: 14, color: "#6b6b8d", lineHeight: 1.5, margin: 0 }}>
              No prompts. No input. Pick how long<br />the AI thinks — then play what comes out.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {TIERS.map((t, i) => (
              <button key={i} onClick={() => generate(i)} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "20px 22px", background: "#151530", border: "1px solid #2a2a4a",
                borderRadius: 16, cursor: "pointer", color: "#e4e4f0",
                WebkitTapHighlightColor: "transparent", outline: "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 12,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, fontWeight: 800, color: "#0b0b1a",
                    background: t.color, flexShrink: 0, fontFamily: "monospace",
                  }}>{i + 1}</div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 17, fontWeight: 600 }}>{t.label}</div>
                    <div style={{ fontSize: 13, color: "#6b6b8d", marginTop: 2 }}>{t.sub}</div>
                  </div>
                </div>
                <span style={{ fontSize: 20, color: "#6b6b8d" }}>→</span>
              </button>
            ))}
          </div>

          <div style={{ marginTop: 32, textAlign: "center", fontSize: 11, color: "#3a3a5a" }}>
            Powered by Claude · Every game is unique
          </div>
        </>}

        {/* GENERATING / HOLDING */}
        {(state === "generating" || state === "holding") && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            paddingTop: 60, textAlign: "center",
          }}>
            {/* Circular progress ring */}
            <div style={{ position: "relative", width: 180, height: 180, marginBottom: 20 }}>
              <svg width="180" height="180" viewBox="0 0 180 180"
                style={{ transform: "rotate(-90deg)" }}>
                <circle cx="90" cy="90" r="82" fill="none" stroke="#1a1a3a" strokeWidth="6" />
                <circle cx="90" cy="90" r="82" fill="none" stroke={tc} strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 82}`}
                  strokeDashoffset={`${2 * Math.PI * 82 * (1 - progress)}`}
                  style={{ transition: "stroke-dashoffset 0.3s ease" }} />
              </svg>
              <div style={{
                position: "absolute", inset: 0, display: "flex",
                flexDirection: "column", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{
                  fontSize: 42, fontWeight: 700, fontFamily: "monospace",
                  color: tc, letterSpacing: 2,
                }}>{fmt(elapsed)}</div>
                <div style={{ fontSize: 11, color: "#6b6b8d", fontFamily: "monospace" }}>
                  / {fmt(target)}
                </div>
              </div>
            </div>

            <div style={{
              fontSize: 14, marginBottom: 8, minHeight: 22,
              color: state === "holding" ? tc : "#6b6b8d",
              fontWeight: state === "holding" ? 600 : 400,
            }}>
              {state === "holding" ? "Game ready — revealing at the clock..." : loadMsg}
            </div>

            <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: "50%", background: tc,
                  animation: `rgm-pulse 1.4s ease infinite ${i * 0.2}s`,
                }} />
              ))}
            </div>

            <button onClick={cancel} style={{
              background: "none", border: "1px solid #2a2a4a", color: "#6b6b8d",
              padding: "12px 24px", borderRadius: 10, cursor: "pointer", fontSize: 14,
            }}>Cancel</button>
          </div>
        )}

        {/* READY */}
        {state === "ready" && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", width: "100%",
          }}>
            <div style={{
              fontSize: 20, fontWeight: 700, marginTop: 8, marginBottom: 4, textAlign: "center",
            }}>{gameName}</div>
            <div style={{
              fontSize: 12, color: "#6b6b8d", marginBottom: 14,
              fontFamily: "monospace", textAlign: "center",
            }}>Built in {fmt(elapsed)} · Tier {(tierIdx ?? 0) + 1}</div>

            <div style={{
              width: "100%", height: "60dvh", borderRadius: 14, overflow: "hidden",
              border: "1px solid #2a2a4a", background: "#000", marginBottom: 14,
              position: "relative",
            }}>
              <button onClick={() => setFullscreen(true)} style={{
                position: "absolute", top: 8, right: 8, zIndex: 10,
                background: "rgba(0,0,0,0.8)", border: "1px solid #555", color: "#fff",
                padding: "10px 16px", borderRadius: 10, fontSize: 13,
                cursor: "pointer", fontWeight: 600, backdropFilter: "blur(4px)",
              }}>⛶ Fullscreen</button>
              <iframe srcDoc={gameHtml} sandbox="allow-scripts" title={gameName}
                style={{ width: "100%", height: "100%", border: "none" }} />
            </div>

            <div style={{ display: "flex", gap: 10, width: "100%" }}>
              <button onClick={playFullPage} style={{
                flex: 1, padding: 16, borderRadius: 14, border: "none",
                fontSize: 15, fontWeight: 600, cursor: "pointer",
                color: "#0b0b1a", background: tc,
              }}>Play</button>
              <button onClick={shareGame} style={{
                flex: 1, padding: 16, borderRadius: 14, border: "1px solid #2a2a4a",
                background: "#151530", fontSize: 15, fontWeight: 600,
                cursor: "pointer", color: copied ? "#22c55e" : "#e4e4f0",
                transition: "color 0.2s",
              }}>{copied ? "Link Copied!" : "Share"}</button>
              <button onClick={() => { setState("idle"); setFullscreen(false); }} style={{
                padding: "16px 20px", borderRadius: 14, border: "1px solid #2a2a4a",
                background: "#151530", fontSize: 15, fontWeight: 600,
                cursor: "pointer", color: "#6b6b8d",
              }}>+</button>
            </div>
          </div>
        )}

        {/* ERROR */}
        {state === "error" && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            paddingTop: 60, textAlign: "center",
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
            <h2 style={{ margin: "0 0 8px 0", fontSize: 18, fontWeight: 700 }}>
              Generation failed
            </h2>
            <p style={{
              fontSize: 13, color: "#6b6b8d", margin: "0 0 24px 0",
              maxWidth: 280, lineHeight: 1.5,
            }}>{errMsg}</p>
            <button onClick={() => setState("idle")} style={{
              background: tc, border: "none", color: "#0b0b1a",
              padding: "14px 28px", borderRadius: 12, fontSize: 15,
              fontWeight: 600, cursor: "pointer",
            }}>Try Again</button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes rgm-pulse {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
