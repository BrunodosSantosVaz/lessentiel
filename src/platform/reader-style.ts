export const readerStyle = `
  :host { all: initial; color-scheme: light; font-family: system-ui, sans-serif; }
  .veil {
    --cor-texto: #17332E; --cor-suave: #50635F; --cor-primaria: #075E54; --cor-linha: #65736E; --cor-foco: #174EA6;
    --leitura-fundo: #FFFFFF; --leitura-texto: #1A1A1A; --leitura-link: #075E54; --leitura-suave: #50635F;
    --fonte-interface: system-ui, sans-serif; --espaco-1: 4px; --espaco-2: 8px; --espaco-3: 12px;
    --espaco-4: 16px; --espaco-5: 24px; --espaco-6: 32px; --raio-padrao: 14px; --alvo-toque: 44px;
    --foco: 3px solid var(--cor-foco); position: fixed; inset: 0; z-index: 2147483647; overflow: auto;
    background: var(--leitura-fundo); color: var(--leitura-texto); font-family: var(--fonte-interface);
  }
  .veil[data-theme="sepia"] { --leitura-fundo: #F4ECD8; --leitura-texto: #342D22; --leitura-link: #075E54; color-scheme: light; }
  .veil[data-theme="dark"] { --leitura-fundo: #1E1F22; --leitura-texto: #D4D4D4; --leitura-link: #8AB4F8; --leitura-suave: #B8C1BD; --cor-foco: #8AB4F8; color-scheme: dark; }
  .veil[data-theme="black"] { --leitura-fundo: #000000; --leitura-texto: #E6E6E6; --leitura-link: #8AB4F8; --leitura-suave: #B8C1BD; --cor-foco: #8AB4F8; color-scheme: dark; }
  *, *::before, *::after { box-sizing: border-box; }
  .toolbar { position: sticky; top: 0; z-index: 2; padding: var(--espaco-2) var(--espaco-5) 0; background: var(--leitura-fundo); border-bottom: 1px solid var(--cor-linha); color: var(--leitura-texto); font: 14px/1.2 var(--fonte-interface); }
  .controls { display: flex; flex-wrap: wrap; align-items: end; gap: var(--espaco-2) var(--espaco-4); padding-bottom: var(--espaco-1); }
  .group { display: flex; flex-direction: column; align-items: start; min-width: 0; gap: var(--espaco-1); }
  .group-title, .group label { color: var(--leitura-suave); font: 12px/1.2 var(--fonte-interface); }
  .group label { display: flex; flex-direction: column; align-items: start; gap: var(--espaco-1); }
  .button-row { display: flex; align-items: center; gap: var(--espaco-1); }
  button, select, input { accent-color: var(--leitura-link); }
  button, select { min-width: var(--alvo-toque); min-height: var(--alvo-toque); padding: var(--espaco-2) var(--espaco-3); border: 1px solid var(--cor-linha); border-radius: var(--raio-padrao); background: transparent; color: var(--leitura-texto); font: 14px var(--fonte-interface); }
  button { cursor: pointer; }
  button:hover { border-color: var(--leitura-texto); }
  button[aria-pressed="true"] { background: var(--leitura-texto); color: var(--leitura-fundo); border-color: var(--leitura-texto); }
  button:focus-visible, select:focus-visible, input:focus-visible, a:focus-visible { outline: var(--foco); outline-offset: 2px; }
  select { max-width: 200px; background: var(--leitura-fundo); }
  input[type="range"] { width: 104px; min-width: var(--alvo-toque); min-height: var(--alvo-toque); margin: 0; padding: 0 var(--espaco-1); touch-action: pan-y; }
  .font-size { min-width: 28px; color: var(--leitura-suave); font: 12px var(--fonte-interface); text-align: center; font-variant-numeric: tabular-nums; }
  .close-reader { margin-left: auto; }
  .utility-row, .reading-info, .reader-tools { display: flex; flex-wrap: wrap; align-items: center; gap: var(--espaco-2) var(--espaco-4); }
  .utility-row { justify-content: space-between; padding-bottom: var(--espaco-1); }
  .reading-info { gap: var(--espaco-3); color: var(--leitura-suave); font: 12px/1.4 var(--fonte-interface); }
  .reader-brand { color: var(--leitura-texto); font-size: 12px; font-weight: 600; }
  .reader-tools { gap: var(--espaco-2); }
  .reader-tools label { display: inline-flex; align-items: center; gap: var(--espaco-1); color: var(--leitura-suave); font: 12px var(--fonte-interface); }
  .reader-tools button { border-color: transparent; }
  .reader-tools button:hover, .reader-tools button:focus-visible { border-color: var(--cor-linha); }
  progress { display: block; width: calc(100% + 2 * var(--espaco-5)); height: 2px; margin-inline: calc(-1 * var(--espaco-5)); border: 0; background: transparent; accent-color: var(--leitura-texto); }
  progress::-webkit-progress-bar { background: transparent; }
  progress::-webkit-progress-value { background: var(--leitura-texto); }
  .index { max-height: 40vh; overflow: auto; padding: var(--espaco-2) 0; border-top: 1px solid var(--cor-linha); }
  [hidden] { display: none !important; }
  .index ol { display: flex; flex-wrap: wrap; gap: var(--espaco-1) var(--espaco-4); margin: 0; padding-left: var(--espaco-5); }
  .index a { display: flex; min-height: var(--alvo-toque); align-items: center; color: var(--leitura-link); font: 14px/1.4 var(--fonte-interface); }
  article { --fonte-leitura: "Literata", Georgia, serif; max-width: 760px; margin: var(--espaco-6) auto 80px; padding: 0 var(--espaco-5); background: var(--leitura-fundo); color: var(--leitura-texto); font: 20px/1.65 var(--fonte-leitura); overflow-wrap: anywhere; }
  article :where(h1, h2, h3, h4, h5, h6) { color: var(--leitura-texto); font-family: var(--fonte-leitura); line-height: 1.25; scroll-margin-top: var(--toolbar-height, 150px); }
  article h1 { font-size: 1.9em; margin: 0 0 .6em; }
  article h2 { font-size: 1.45em; margin: 1.8em 0 .6em; }
  article p { margin: 0 0 1em; }
  article :where(ul, ol) { padding-left: 1.5em; }
  article li { margin-bottom: .4em; }
  article blockquote { margin: 1.2em 0; padding-left: 1em; border-left: 2px solid var(--cor-linha); }
  article a { color: var(--leitura-link); }
  article :where(img, video, iframe) { max-width: 100%; }
  article :where(pre, table) { max-width: 100%; overflow: auto; }
  article pre { white-space: pre-wrap; }
  article table { border-collapse: collapse; }
  article :where(th, td) { border: 1px solid var(--cor-linha); padding: var(--espaco-2); }
  @media (max-width: 700px) {
    .toolbar { padding-inline: var(--espaco-4); }
    .controls { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--espaco-2) var(--espaco-3); }
    .theme-group { grid-column: 1 / -1; }
    .theme-group button { padding-inline: var(--espaco-2); }
    .group label, .group select { max-width: 100%; width: 100%; }
    .group input[type="range"] { width: 100%; }
    .close-reader { justify-self: end; }
    .utility-row { gap: var(--espaco-1); }
    .reading-info { width: 100%; }
    .reader-tools { width: 100%; gap: var(--espaco-1); }
    .reader-tools label { flex: 1; font-size: 0; }
    .reader-tools input[type="range"] { width: 100%; }
    progress { width: calc(100% + 2 * var(--espaco-4)); margin-inline: calc(-1 * var(--espaco-4)); }
    article { margin-top: var(--espaco-5); padding-inline: var(--espaco-4); }
  }
`;
