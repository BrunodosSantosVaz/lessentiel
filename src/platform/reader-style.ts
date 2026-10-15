export const readerStyle = `
  :host { all: initial; color-scheme: light; font-family: system-ui, sans-serif; }
  .veil {
    --cor-linha: #858585; --cor-divisor: #E3E3E3; --cor-foco: #174EA6;
    --leitura-fundo: #FFFFFF; --leitura-texto: #222222; --leitura-link: #1A4FB4; --leitura-suave: #6B6B6B;
    --fonte-interface: "Segoe UI", system-ui, -apple-system, Arial, sans-serif;
    --espaco-1: 4px; --espaco-2: 8px; --espaco-3: 12px; --espaco-4: 16px; --espaco-5: 24px; --espaco-6: 32px;
    --raio-padrao: 14px; --alvo-toque: 44px; --largura-indice: 260px; --foco: 3px solid var(--cor-foco);
    position: fixed; inset: 0; z-index: 2147483647; overflow: auto;
    background: var(--leitura-fundo); color: var(--leitura-texto); font-family: var(--fonte-interface);
  }
  .veil[data-theme="sepia"] { --leitura-fundo: #F4ECD8; --leitura-texto: #342D22; --leitura-link: #7A4B12; --leitura-suave: #70624F; --cor-divisor: #E0D4B8; color-scheme: light; }
  .veil[data-theme="dark"] { --leitura-fundo: #1E1F22; --leitura-texto: #D4D4D4; --leitura-link: #8AB4F8; --leitura-suave: #AAAAAA; --cor-linha: #858585; --cor-divisor: #3E3E3E; --cor-foco: #8AB4F8; color-scheme: dark; }
  .veil[data-theme="black"] { --leitura-fundo: #000000; --leitura-texto: #E6E6E6; --leitura-link: #8AB4F8; --leitura-suave: #AAAAAA; --cor-divisor: #333333; --cor-foco: #8AB4F8; color-scheme: dark; }
  *, *::before, *::after { box-sizing: border-box; }
  .toolbar { position: sticky; top: 0; z-index: 4; padding: var(--espaco-2) clamp(var(--espaco-4), 3vw, 48px) 0; background: var(--leitura-fundo); border-bottom: 1px solid var(--cor-divisor); color: var(--leitura-texto); font: 14px/1 var(--fonte-interface); }
  .controls { display: flex; flex-wrap: wrap; align-items: center; gap: var(--espaco-1) var(--espaco-4); padding-bottom: var(--espaco-1); }
  .group, .group label { display: flex; flex-direction: row; align-items: center; min-width: 0; gap: var(--espaco-2); }
  .group-title, .group label { color: var(--leitura-suave); font: 12px/1.2 var(--fonte-interface); }
  .group-title, .group label { white-space: nowrap; }
  .button-row { display: flex; align-items: center; gap: var(--espaco-1); }
  button, select, input { accent-color: var(--leitura-texto); }
  button, select { min-width: var(--alvo-toque); min-height: var(--alvo-toque); padding: var(--espaco-2) var(--espaco-3); border: 1px solid var(--cor-linha); border-radius: var(--raio-padrao); background: transparent; color: var(--leitura-texto); font: 14px var(--fonte-interface); }
  .theme-group button { padding-inline: var(--espaco-2); }
  button { cursor: pointer; }
  button:hover { border-color: var(--leitura-texto); }
  button[aria-pressed="true"] { background: var(--leitura-texto); color: var(--leitura-fundo); border-color: var(--leitura-texto); }
  button:focus-visible, select:focus-visible, input:focus-visible, a:focus-visible { outline: var(--foco); outline-offset: 2px; }
  select { max-width: 140px; background: var(--leitura-fundo); }
  input[type="range"] { width: 88px; min-width: var(--alvo-toque); min-height: var(--alvo-toque); margin: 0; padding: 0 var(--espaco-1); touch-action: pan-y; }
  .font-size, .width-value { color: var(--leitura-suave); font: 12px var(--fonte-interface); text-align: center; font-variant-numeric: tabular-nums; }
  .font-size { min-width: 24px; }
  .width-value { min-width: 44px; }
  .close-reader { margin-left: auto; }
  .utility-row, .reading-info, .reader-tools { display: flex; flex-wrap: wrap; align-items: center; gap: var(--espaco-2) var(--espaco-5); }
  .utility-row { justify-content: space-between; padding-bottom: var(--espaco-1); }
  .reading-info { gap: var(--espaco-3); color: var(--leitura-suave); font: 12px/1.4 var(--fonte-interface); }
  .reader-brand { color: var(--leitura-texto); font-size: 12px; font-weight: 600; }
  .reader-tools { gap: var(--espaco-2); }
  .reader-tools label { display: inline-flex; align-items: center; gap: var(--espaco-1); color: var(--leitura-suave); font: 12px var(--fonte-interface); }
  .reader-tools button { border-color: transparent; }
  .reader-tools button:hover, .reader-tools button:focus-visible { border-color: var(--cor-linha); }
  progress { display: block; width: calc(100% + 2 * clamp(var(--espaco-4), 3vw, 48px)); height: 2px; margin-inline: calc(-1 * clamp(var(--espaco-4), 3vw, 48px)); border: 0; background: transparent; accent-color: var(--leitura-texto); }
  progress::-webkit-progress-bar { background: transparent; }
  progress::-webkit-progress-value { background: var(--leitura-texto); }
  [hidden] { display: none !important; }
  .reader-layout { display: grid; grid-template-columns: minmax(0, 1fr); align-items: start; min-height: calc(100% - var(--toolbar-height, 120px)); }
  .veil[data-index-open="true"] .reader-layout { grid-template-columns: var(--largura-indice) minmax(0, 1fr); }
  .index { position: sticky; top: var(--toolbar-height, 120px); align-self: start; max-height: calc(100dvh - var(--toolbar-height, 120px)); overflow: auto; padding: var(--espaco-4); border-right: 1px solid var(--cor-divisor); background: var(--leitura-fundo); }
  .index-heading { display: flex; align-items: center; justify-content: space-between; gap: var(--espaco-2); margin-bottom: var(--espaco-2); font: 14px var(--fonte-interface); }
  .index ol { margin: 0; padding-left: var(--espaco-5); }
  .index a { display: flex; min-height: var(--alvo-toque); align-items: center; padding-block: var(--espaco-2); color: var(--leitura-link); font: 14px/1.4 var(--fonte-interface); overflow-wrap: anywhere; }
  .reading-content { min-width: 0; padding: var(--espaco-6) clamp(var(--espaco-4), 3vw, 48px) 80px; }
  article { --fonte-leitura: Georgia, "Times New Roman", serif; width: 100%; max-width: 760px; margin: 0 auto; background: var(--leitura-fundo); color: var(--leitura-texto); font: 20px/1.65 var(--fonte-leitura); overflow-wrap: anywhere; }
  article :where(h1, h2, h3, h4, h5, h6) { color: var(--leitura-texto); font-family: var(--fonte-leitura); line-height: 1.25; scroll-margin-top: calc(var(--toolbar-height, 120px) + var(--espaco-4)); }
  article h1 { font-size: 1.9em; line-height: 1.2; margin: .2em 0 .3em; }
  article h2 { font-size: 1.45em; margin: 2.2em 0 .6em; padding-top: 1em; border-top: 1px solid var(--cor-divisor); }
  article h3 { font-size: 1.15em; margin: 1.8em 0 .4em; }
  article p { margin: 0 0 1em; }
  article :where(ul, ol) { padding-left: 1.3em; }
  article li { margin-bottom: .45em; }
  article blockquote { margin: 1.2em 0; padding-left: 1em; border-left: 3px solid var(--cor-linha); }
  article a { color: var(--leitura-link); }
  article :where(img, video, iframe) { max-width: 100%; }
  article :where(pre, table) { max-width: 100%; overflow: auto; }
  article pre { white-space: pre-wrap; }
  article table { border-collapse: collapse; }
  article :where(th, td) { border: 1px solid var(--cor-linha); padding: var(--espaco-2); }
  @media (max-width: 900px) {
    .veil[data-index-open="true"] .reader-layout { grid-template-columns: minmax(0, 1fr); }
    .index { position: fixed; top: var(--toolbar-height, 120px); bottom: 0; left: 0; z-index: 3; width: min(320px, calc(100% - var(--espaco-6))); max-height: none; border-bottom: 1px solid var(--cor-divisor); }
  }
  @media (max-width: 700px) {
    .toolbar { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--espaco-1) var(--espaco-3); padding-inline: var(--espaco-4); }
    .controls, .utility-row { display: contents; }
    .group label { flex-direction: column; align-items: start; gap: var(--espaco-1); max-width: 100%; width: 100%; }
    .theme-group { grid-column: 1 / -1; flex-direction: column; align-items: start; gap: var(--espaco-1); }
    .theme-group button { padding-inline: var(--espaco-2); }
    .group select { width: 100%; max-width: 100%; }
    .group input[type="range"] { width: 100%; }
    .group:has(.width-value) label { position: relative; }
    .width-value { position: absolute; right: 0; top: 0; }
    .size-label { align-self: start; }
    .controls > .group:has(.size-label) { flex-direction: column; align-items: start; gap: var(--espaco-1); }
    .alignment-group { grid-column: 1; grid-row: 4; }
    .close-reader { grid-column: 2; grid-row: 4; justify-self: end; align-self: end; }
    .reading-info, .reader-tools { grid-column: 1 / -1; }
    .reader-tools { gap: var(--espaco-1); }
    .reader-tools label { flex: 1; font-size: 0; }
    .reader-tools input[type="range"] { width: 100%; }
    progress { grid-column: 1 / -1; width: calc(100% + 2 * var(--espaco-4)); margin-inline: calc(-1 * var(--espaco-4)); }
    .reading-content { padding-top: var(--espaco-5); padding-inline: var(--espaco-4); }
  }
`;
