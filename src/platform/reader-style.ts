export const readerStyle = `
  :host { all: initial; display: block; color-scheme: light; font-family: system-ui, sans-serif; }
  .veil {
    --cor-linha: #858585; --cor-divisor: #E3E3E3; --cor-foco: #174EA6;
    --leitura-fundo: #FFFFFF; --leitura-texto: #222222; --leitura-link: #1A4FB4; --leitura-suave: #6B6B6B;
    --fonte-interface: "Segoe UI", system-ui, -apple-system, Arial, sans-serif;
    --espaco-1: 4px; --espaco-2: 8px; --espaco-3: 12px; --espaco-4: 16px; --espaco-5: 24px; --espaco-6: 32px;
    --raio-padrao: 14px; --alvo-toque: 44px; --largura-indice: 260px; --foco: 3px solid var(--cor-foco);
    position: static; min-height: 100dvh; overflow: visible;
    background: var(--leitura-fundo); color: var(--leitura-texto); font-family: var(--fonte-interface);
  }
  .veil[data-theme="sepia"] { --leitura-fundo: #FAF7F0; --leitura-texto: #342D22; --leitura-link: #7A4B12; --leitura-suave: #70624F; --cor-divisor: #E8E2D6; color-scheme: light; }
  .veil[data-theme="dark"] { --leitura-fundo: #292A2D; --leitura-texto: #D4D4D4; --leitura-link: #8AB4F8; --leitura-suave: #AAAAAA; --cor-linha: #858585; --cor-divisor: #3E3E3E; --cor-foco: #8AB4F8; color-scheme: dark; }
  .veil[data-theme="black"] { --leitura-fundo: #000000; --leitura-texto: #E6E6E6; --leitura-link: #8AB4F8; --leitura-suave: #AAAAAA; --cor-divisor: #333333; --cor-foco: #8AB4F8; color-scheme: dark; }
  *, *::before, *::after { box-sizing: border-box; }
  .toolbar { position: sticky; top: 0; z-index: 4; padding: var(--espaco-2) var(--espaco-4); background: var(--leitura-fundo); color: var(--leitura-texto); border-bottom: 1px solid var(--cor-divisor); font: 14px/1.2 var(--fonte-interface); }
  .toolbar-line { display: flex; flex-wrap: nowrap; align-items: center; gap: var(--espaco-2); height: var(--alvo-toque); min-width: 0; }
  .toolbar-controls { display: flex; flex: 1; flex-wrap: nowrap; align-items: center; gap: var(--espaco-2); min-width: 0; }
  .control-group { display: flex; flex: 0 0 auto; flex-wrap: nowrap; align-items: center; gap: var(--espaco-1); }
  .choice-preview { display: flex; align-items: center; flex-wrap: nowrap; }
  button, select { min-width: var(--alvo-toque); min-height: var(--alvo-toque); border: 0; border-radius: var(--raio-padrao); background: transparent; color: var(--leitura-texto); padding: var(--espaco-2); font: 14px var(--fonte-interface); }
  button { display: inline-flex; flex: 0 0 auto; align-items: center; justify-content: center; gap: var(--espaco-2); cursor: pointer; }
  button svg { width: 20px; height: 20px; flex: 0 0 auto; }
  button:hover, button[aria-pressed="true"] { background: color-mix(in srgb, var(--leitura-texto) 10%, transparent); }
  .font-preview button { font-size: 20px; line-height: 1.2; }
  .font-preview button[aria-pressed="true"], .alignment-preview button[aria-pressed="true"] { box-shadow: 0 0 0 1px color-mix(in srgb, var(--leitura-texto) 24%, transparent), 0 1px 4px #00000014; }
  button:focus-visible, select:focus-visible, input:focus-visible, a:focus-visible { outline: var(--foco); outline-offset: 0; }
  .theme-swatch { display: block; width: 20px; height: 20px; border: 1px solid var(--cor-linha); border-radius: 50%; }
  [data-swatch="light"] { background: #FFFFFF; } [data-swatch="sepia"] { background: #FAF7F0; } [data-swatch="dark"] { background: #292A2D; } [data-swatch="black"] { background: #000000; } [data-swatch="auto"] { background: linear-gradient(90deg, #FFFFFF 50%, #292A2D 50%); }
  .theme-preview button[aria-pressed="true"] { box-shadow: 0 0 0 1px color-mix(in srgb, var(--leitura-texto) 24%, transparent), 0 1px 4px #00000014; }
  .choice-current, .control-group .choice-native { display: none; }
  .choice-trigger { display: none; }
  .compact .choice-preview { display: none; }
  .compact .choice-trigger { display: inline-flex; }
  .compact .choice-current { display: inline-flex; align-items: center; font-size: 20px; }
  .compact .choice-trigger { padding: var(--espaco-1); gap: 0; }
  .compact .choice-trigger > svg { width: 12px; height: 12px; }
  .size-group { gap: 0; border-radius: var(--raio-padrao); box-shadow: inset 0 0 0 1px var(--cor-linha); background: color-mix(in srgb, var(--leitura-texto) 4%, transparent); }
  .size-group button { font-size: 20px; }
  .size-heading { display: inline-flex; align-items: center; gap: var(--espaco-2); padding-inline: var(--espaco-1); white-space: nowrap; color: var(--leitura-suave); font-size: 12px; }
  .font-size { color: var(--leitura-texto); font-size: 14px; font-variant-numeric: tabular-nums; }
  .control-group label { display: inline-flex; align-items: center; gap: var(--espaco-1); white-space: nowrap; color: var(--leitura-suave); font-size: 12px; }
  input[type="range"] { width: 72px; min-width: var(--alvo-toque); min-height: var(--alvo-toque); margin: 0; padding-inline: var(--espaco-1); accent-color: var(--leitura-texto); touch-action: pan-y; }
  output { min-width: 28px; color: var(--leitura-texto); font-variant-numeric: tabular-nums; }
  .reading-info { padding: 0 0 var(--espaco-4); display: flex; flex-wrap: wrap; gap: var(--espaco-3); color: var(--leitura-suave); font-size: 12px; }
  .overflow-label { display: none; }
  .overflow-panel, .choice-popover { background: var(--leitura-fundo); color: var(--leitura-texto); border: 1px solid var(--cor-linha); border-radius: var(--raio-padrao); }
  .overflow-panel { position: absolute; top: calc(100% + var(--espaco-2)); right: var(--espaco-2); width: min(420px, calc(100vw - var(--espaco-4))); max-height: calc(100dvh - var(--toolbar-height, 61px) - var(--espaco-4)); overflow: auto; padding: var(--espaco-4); }
  .overflow-content { display: flex; flex-direction: column; align-items: stretch; gap: var(--espaco-4); }
  .overflow-content .control-group { flex-wrap: wrap; min-width: 0; }
  .overflow-content .choice-preview, .overflow-content .choice-trigger { display: none; }
  .overflow-content .choice-native { display: flex; width: 100%; }
  .overflow-content .control-group label { display: flex; flex-wrap: wrap; width: 100%; white-space: normal; font-size: 14px; }
  .overflow-content select { margin-left: auto; border: 1px solid var(--cor-linha); background: var(--leitura-fundo); max-width: 100%; }
  .overflow-content input[type="range"] { flex: 1; width: 100px; }
  .overflow-content .overflow-label { display: inline; }
  .overflow-content .reading-info { border-top: 1px solid var(--cor-divisor); padding-top: var(--espaco-3); }
  .choice-popover { position: fixed; z-index: 6; width: min(280px, calc(100vw - var(--espaco-4))); max-height: calc(100dvh - var(--espaco-4)); overflow: auto; padding: var(--espaco-2); }
  .choice-popover button { display: flex; justify-content: start; width: 100%; }
  .choice-popover button[aria-checked="true"]::after { content: "✓"; margin-left: auto; }
  .reader-tooltip { position: fixed; z-index: 7; max-width: calc(100vw - var(--espaco-4)); padding: var(--espaco-2) var(--espaco-3); border-radius: var(--espaco-1); color: var(--leitura-fundo); background: var(--leitura-texto); font: 12px/1.4 var(--fonte-interface); pointer-events: none; }
  progress { position: absolute; bottom: -1px; left: 0; width: 100%; height: 2px; border: 0; background: transparent; accent-color: var(--leitura-texto); }
  progress::-webkit-progress-bar { background: transparent; } progress::-webkit-progress-value { background: var(--leitura-texto); }
  [hidden] { display: none !important; }
  .reader-layout { display: grid; grid-template-columns: minmax(0, 1fr); align-items: start; min-height: calc(100% - var(--toolbar-height, 120px)); }
  .veil[data-index-open="true"] .reader-layout { grid-template-columns: var(--largura-indice) minmax(0, 1fr); }
  .index { position: sticky; top: var(--toolbar-height, 120px); align-self: start; max-height: calc(100dvh - var(--toolbar-height, 120px)); overflow: auto; padding: var(--espaco-4); border-right: 1px solid var(--cor-divisor); background: var(--leitura-fundo); }
  .index-heading { display: flex; align-items: center; justify-content: space-between; gap: var(--espaco-2); margin-bottom: var(--espaco-2); font: 14px var(--fonte-interface); }
  .index ol { margin: 0; padding: 0; list-style: none; }
  .index ol ol { padding-left: var(--espaco-4); border-left: 1px solid var(--cor-divisor); }
  .index li > a { padding-inline: var(--espaco-2); }
  .index > ol > li > a { font-weight: 600; }
  .index a { display: flex; min-height: var(--alvo-toque); align-items: center; padding-block: var(--espaco-2); color: var(--leitura-link); font: 14px/1.4 var(--fonte-interface); overflow-wrap: anywhere; }
  .reading-content { min-width: 0; padding: var(--espaco-6) clamp(var(--espaco-4), 3vw, 48px) 80px; }
  article { --fonte-leitura: Georgia, "Times New Roman", serif; width: 100%; max-width: 760px; margin: 0 auto; background: var(--leitura-fundo); color: var(--leitura-texto); font: 20px/1.65 var(--fonte-leitura); overflow-wrap: anywhere; column-count: 1; }
  article :where(h1, h2, h3, h4, h5, h6) { color: var(--leitura-texto); font-family: var(--fonte-leitura); line-height: 1.25; scroll-margin-top: calc(var(--toolbar-height, 120px) + var(--espaco-4)); }
  article h1 { font-size: 1.9em; line-height: 1.2; margin: .2em 0 .3em; }
  article h2 { font-size: 1.45em; margin: 2.2em 0 .6em; padding-top: 1em; border-top: 1px solid var(--cor-divisor); }
  article h3 { font-size: 1.15em; margin: 1.8em 0 .4em; }
  article p { margin: 0 0 1em; }
  article :where(ul, ol) { padding-left: 1.3em; }
  article li { margin-bottom: .45em; }
  article blockquote { margin: 1.5em 0; padding: .75em 1em; border-left: 3px solid var(--cor-linha); background: color-mix(in srgb, var(--leitura-texto) 4%, transparent); font-style: italic; }
  article blockquote > :last-child { margin-bottom: 0; }
  article blockquote cite { display: block; margin-top: .75em; font-size: .85em; font-style: normal; color: var(--leitura-suave); }
  article q { font-style: italic; quotes: auto; }
  article :where(h4, h5, h6) { margin: 1.5em 0 .5em; font-size: 1em; }
  article figure { margin: 1.5em 0; }
  article img { display: block; max-width: 100%; height: auto; margin-inline: auto; }
  article figcaption, article caption { color: var(--leitura-suave); font: 14px/1.5 var(--fonte-interface); text-align: start; padding-block: var(--espaco-2); }
  .veil[data-images="false"] article figure:has(img) { margin: 0; }
  .veil[data-images="false"] article figure:has(img) figcaption { display: none; }
  article dt { font-weight: 600; }
  article dd { margin: 0 0 1em 1em; }
  article hr { border: 0; border-top: 1px solid var(--cor-divisor); margin: 2em 0; }
  article code { font-family: ui-monospace, monospace; font-size: .85em; }
  article :where(mark, code) { background: color-mix(in srgb, var(--leitura-texto) 6%, transparent); color: var(--leitura-texto); }
  article a { color: var(--leitura-link); }
  article :where(img, video, iframe) { max-width: 100%; }
  article :where(pre, table) { max-width: 100%; overflow: auto; }
  article pre { white-space: pre-wrap; padding: var(--espaco-4); border: 1px solid var(--cor-divisor); border-radius: var(--espaco-2); }
  article table { display: block; overflow-x: auto; border-collapse: collapse; font-size: .9em; }
  article :where(th, td) { border: 0; border-bottom: 1px solid var(--cor-divisor); padding: var(--espaco-3); }
  article th { background: color-mix(in srgb, var(--leitura-texto) 4%, transparent); }
  @media (max-width: 900px) {
    .veil[data-index-open="true"] .reader-layout { grid-template-columns: minmax(0, 1fr); }
    .index { position: fixed; top: var(--toolbar-height, 120px); bottom: 0; left: 0; z-index: 3; width: min(320px, calc(100% - var(--espaco-6))); max-height: none; border-bottom: 1px solid var(--cor-divisor); }
  }
  @media (max-width: 700px) { .toolbar { padding-inline: var(--espaco-2); } .toolbar-line, .toolbar-controls { gap: var(--espaco-1); } .reading-content { padding-top: var(--espaco-5); padding-inline: var(--espaco-4); } }
  @media print {
    :host { display: block !important; } .veil { position: static; overflow: visible; background: #FFFFFF; color: #000000; }
    .toolbar, .index, .reading-info { display: none !important; } .reader-layout, .veil[data-index-open="true"] .reader-layout { display: block; min-height: 0; }
    .reading-content { padding: 0; } article { max-width: 100% !important; width: 100%; margin: 0; background: #FFFFFF; color: #000000; }
    article :where(h1,h2,h3,h4,h5,h6,a) { color: #000000; } article :where(h1,h2,h3) { break-after: avoid; } article :where(pre,table) { overflow: visible; }
  }
`;
