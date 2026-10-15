import { chromium, expect, test, type BrowserContext, type Page } from '@playwright/test';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

declare global {
  interface Window {
    __conteudoExecutado?: number;
    __handlerExecutado?: number;
  }
}

const extensionPath = process.env.MLA_EXTENSION_DIR ?? resolve('.output/chrome-mv3');
const articleUrl = 'https://example.test/article';
const articleHtml = `<!doctype html><html lang="pt-BR"><head><title>Artigo de teste</title></head><body>
  <nav>Menu removível</nav><main><article><h1>Leitura de teste</h1><p>Texto principal para validar a leitura local.</p>
  <h2>Segunda seção</h2><ul><li>Item preservado</li></ul><table><thead><tr><th>Campo</th></tr></thead><tbody><tr><td>Valor</td></tr></tbody></table>
  <script>window.__conteudoExecutado = (window.__conteudoExecutado ?? 0) + 1</script>
  <button onclick="window.__handlerExecutado = (window.__handlerExecutado ?? 0) + 1">Ação hostil</button>
  <a href="javascript:window.__linkExecutado=true">Link hostil</a></article></main>
  <aside>Publicidade removível</aside></body></html>`;

async function openExtension(): Promise<{ context: BrowserContext; page: Page; extensionId: string; remoteRequests: string[] }> {
  expect(existsSync(extensionPath), 'Build the extension before running acceptance tests').toBe(true);
  const context = await chromium.launchPersistentContext('', {
    headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
  const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
  const extensionId = new URL(worker.url()).host;
  const page = await context.newPage();
  const remoteRequests: string[] = [];
  await context.route(/^https?:\/\//, route => {
    const url = route.request().url();
    if (url === articleUrl) return route.fulfill({ status: 200, contentType: 'text/html', body: articleHtml });
    remoteRequests.push(url);
    return route.abort();
  });
  await page.goto(articleUrl);
  return { context, page, extensionId, remoteRequests };
}

async function activate(page: Page) {
  await page.keyboard.press('Alt+Shift+R');
  await expect(page.getByRole('article')).toBeVisible();
}

test.fail('RN-0001 CA-01 ativa e preserva a estrutura do artigo #18', async () => { // pendente da tarefa #18
  const { context, page, extensionId } = await openExtension();
  try {
    await activate(page);
    await expect(page.getByRole('heading', { name: 'Leitura de teste' })).toBeVisible();
    await expect(page.getByRole('listitem', { name: 'Item preservado' })).toBeVisible();
    await expect(page.getByRole('table')).toContainText('Valor');
    await expect(page.getByText('Publicidade removível')).toHaveCount(0);
  } finally { await context.close(); }
});

test.fail('RN-0001 CA-02 neutraliza conteúdo hostil #18', async () => { // pendente da tarefa #18
  const { context, page, remoteRequests } = await openExtension();
  try {
    await expect.poll(() => page.evaluate(() => window.__conteudoExecutado)).toBe(1);
    await activate(page);
    const beforeHostileClick = await page.evaluate(() => window.__handlerExecutado ?? 0);
    await page.getByRole('article').getByRole('button', { name: 'Ação hostil' }).click();
    const unsafeNodes = await page.getByRole('article').evaluate(article => ({
      scripts: article.shadowRoot?.querySelectorAll('script').length ?? 0,
      handlers: [...(article.shadowRoot?.querySelectorAll('*') ?? [])].filter(element => [...element.attributes].some(attribute => /^on/i.test(attribute.name))).length,
      javascriptLinks: [...(article.shadowRoot?.querySelectorAll('a') ?? [])].filter(link => link.protocol === 'javascript:').length,
    }));
    expect(unsafeNodes).toEqual({ scripts: 0, handlers: 0, javascriptLinks: 0 });
    await expect.poll(() => page.evaluate(() => window.__conteudoExecutado)).toBe(1);
    expect(await page.evaluate(() => window.__handlerExecutado ?? 0)).toBe(beforeHostileClick);
    expect(remoteRequests).toEqual([]);
  } finally { await context.close(); }
});

test.fail('RN-0002 CA-03 aplica e persiste controles locais #19', async () => { // pendente da tarefa #19
  const { context, page, extensionId } = await openExtension();
  try {
    await activate(page);
    await page.getByRole('button', { name: 'Tema sépia' }).click();
    await page.getByRole('button', { name: 'Aumentar fonte' }).click();
    await expect(page.getByRole('article')).toHaveAttribute('data-theme', 'sepia');
    await expect(page.getByRole('article')).toHaveCSS('font-size', '21px');
    await page.reload();
    await activate(page);
    await expect(page.getByRole('article')).toHaveAttribute('data-theme', 'sepia');
  } finally { await context.close(); }
});

test.fail('RN-0002 CA-04 navega pelo índice e mostra o tempo restante #19', async () => { // pendente da tarefa #19
  const { context, page, extensionId } = await openExtension();
  try {
    await activate(page);
    await page.getByRole('button', { name: 'Índice' }).click();
    await page.getByRole('link', { name: 'Segunda seção' }).click();
    await expect(page).toHaveURL(/#segunda-secao/);
    await expect(page.getByText(/min de leitura/)).toBeVisible();
  } finally { await context.close(); }
});

test.fail('RN-0002 CA-05 inicia, pausa e ajusta a rolagem automática #19', async () => { // pendente da tarefa #19
  const { context, page, extensionId } = await openExtension();
  try {
    await activate(page);
    await page.getByRole('button', { name: 'Iniciar rolagem' }).click();
    await expect(page.getByRole('button', { name: 'Pausar rolagem' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Pausar rolagem' }).click();
    await expect(page.getByRole('button', { name: 'Iniciar rolagem' })).toHaveAttribute('aria-pressed', 'false');
  } finally { await context.close(); }
});

test.fail('RN-0003 CA-06 abre PDF local com texto selecionável #20', async () => { // pendente da tarefa #20
  const { context, page, extensionId } = await openExtension();
  try {
    await page.goto(`chrome-extension://${extensionId}/pdf.html`);
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Abrir PDF local' }).click();
    await (await chooser).setFiles(resolve('tests/fixtures/sample.pdf'));
    await expect(page.getByRole('article')).toContainText('PDF de teste');
  } finally { await context.close(); }
});

test.fail('RN-0003 CA-07 pede permissão específica para ativação automática #20', async () => { // pendente da tarefa #20
  const { context, page, extensionId } = await openExtension();
  try {
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await page.getByRole('textbox', { name: 'Site' }).fill('https://example.test/*');
    await page.getByRole('button', { name: 'Adicionar site automático' }).click();
    await expect(page.getByText('https://example.test/*')).toBeVisible();
    expect(await context.pages()[0].evaluate(() => location.hostname)).toBe('example.test');
  } finally { await context.close(); }
});

test.fail('RN-0004 CA-08 apresenta a interface nos três idiomas #20', async () => { // pendente da tarefa #20
  const { context, page, extensionId } = await openExtension();
  try {
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    const language = page.getByRole('combobox', { name: 'Idioma' });
    for (const [value, label] of [['pt-BR', 'Preferências'], ['en', 'Settings'], ['es', 'Preferencias']]) {
      await language.selectOption(value);
      await expect(page.getByRole('heading', { name: label })).toBeVisible();
    }
  } finally { await context.close(); }
});

test.fail('RN-0004 CA-09 carrega como extensão local sem backend #20', async () => { // pendente da tarefa #20
  const { context, page, extensionId, remoteRequests } = await openExtension();
  try {
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await expect(page.getByRole('heading', { name: 'Leitor Limpo' })).toBeVisible();
    await page.getByRole('button', { name: 'Salvar preferências' }).click();
    expect(remoteRequests).toEqual([]);
  } finally { await context.close(); }
});
