export function injectMobileFixes(html: string): string {
  const mobileCss = `<style>*{touch-action:manipulation;-webkit-tap-highlight-color:transparent}button,a,[onclick],[role="button"]{cursor:pointer}</style>`;
  const scoreReporter = `<script>(function(){var _hs=0;window._reportScore=function(s){s=Math.floor(s);if(s>_hs){_hs=s;window.parent.postMessage({type:"game-score",score:s},"*");}};var _origSetInterval=window.setInterval;window.setInterval=function(fn,ms){return _origSetInterval(fn,ms);};})()</script>`;

  if (html.includes("</head>")) {
    return html.replace("</head>", mobileCss + scoreReporter + "</head>");
  }
  return mobileCss + scoreReporter + html;
}

export function extractTitle(html: string): string {
  const m = html.match(/<title>(.*?)<\/title>/i);
  return m ? m[1] : "Mystery Game";
}

export function cleanHtml(raw: string): string {
  let html = raw.replace(/^[\s\S]*?(<!DOCTYPE)/i, "$1");
  html = html.replace(/```\s*$/, "").trim();
  return html;
}
