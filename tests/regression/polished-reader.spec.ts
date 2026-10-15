import { chromium, expect, test } from "@playwright/test";
import { resolve } from "node:path";

async function open(width = 2200) {
  const path = resolve(".output/chrome-mv3");
  const context = await chromium.launchPersistentContext("", {
    channel: "chromium",
    headless: true,
    viewport: { width, height: 900 },
    args: [`--disable-extensions-except=${path}`, `--load-extension=${path}`],
  });
  const url = "https://reading.test/toolbar";
  await context.route(/^https?:\/\//, (route) =>
    route.fulfill({
      contentType: "text/html; charset=utf-8",
      body: `<!doctype html><title>Leitura tranquila</title><nav>Página original</nav><article><h1>Leitura tranquila</h1><p>${"Conteúdo fictício para testar os controles de leitura com segurança. ".repeat(24)}</p><h2>Próxima seção</h2>${`<p>${"Uma apresentação simples deixa espaço para as ideias. ".repeat(20)}</p>`.repeat(15)}</article>`,
    }),
  );
  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker"));
  const page = await context.newPage();
  await page.goto(url);
  const activate = () =>
    worker.evaluate(async (url) => {
      const api = (globalThis as any).chrome;
      const tab = (await api.tabs.query({})).find((t: any) => t.url === url);
      await api.scripting.executeScript({ target: { tabId: tab.id }, files: ["content-scripts/reader.js"] });
    }, url);
  await activate();
  await expect(page.locator("[data-leitor-limpo-host] article")).toBeVisible();
  return { context, page, activate, worker };
}


test("#36 RN-0005 não recolhe controles enquanto a apresentação normal cabe", async () => {
  const {context,page}=await open();
  try {
    await expect(page.locator(".toolbar-controls .compact")).toHaveCount(0);
    await expect(page.getByRole("button",{name:"Mais opções de leitura",exact:true})).toBeHidden();
    await expect(page.locator(".overflow-content .control-group")).toHaveCount(0);
    await page.setViewportSize({width:360,height:900});
    await expect(page.getByRole("button",{name:"Mais opções de leitura",exact:true})).toBeVisible();
    await page.setViewportSize({width:2200,height:900});
    await expect(page.getByRole("button",{name:"Mais opções de leitura",exact:true})).toBeHidden();
  } finally {await context.close();}
});

test("#36 RN-0002 fontes de prévia e artigo são renderizadas pelos arquivos reais", async () => {
  const {context,page}=await open();
  try {
    const cdp=await context.newCDPSession(page);await cdp.send("DOM.enable");await cdp.send("CSS.enable");
    const actual=new Set<string>();
    for(const family of ["Literata","Atkinson Hyperlegible Next","Lexend"]){
      const preview=page.getByRole("button",{name:`Fonte ${family}`,exact:true});await preview.click();
      const {root}=await cdp.send("DOM.getDocument",{depth:-1,pierce:true});
      const nodes:any[]=[];const walk=(node:any)=>{nodes.push(node);for(const child of [...(node.children??[]),...(node.shadowRoots??[])])walk(child);};walk(root);
      const node=nodes.find(n=>n.nodeName==="BUTTON"&&n.attributes?.includes(`Fonte ${family}`));
      const fonts=await cdp.send("CSS.getPlatformFontsForNode",{nodeId:node.nodeId});
      expect(fonts.fonts.some(f=>f.isCustomFont&&f.glyphCount>0)).toBe(true);
      actual.add(fonts.fonts.map(f=>f.familyName).join(","));
      const article=nodes.find(n=>n.nodeName==="ARTICLE");
      const rendered=await cdp.send("CSS.getPlatformFontsForNode",{nodeId:article.children.find((n:any)=>n.nodeName==="H1").nodeId});
      expect(rendered.fonts.some(f=>f.isCustomFont&&f.glyphCount>0)).toBe(true);
    }
    expect(actual.size).toBe(3);
  } finally {await context.close();}
});

test("#36 RN-0002 leitura usa rolagem do navegador e restaura página e posição", async () => {
  const {context,page}=await open();
  try {
    await page.getByRole("button",{name:"Fechar",exact:true}).click();
    await page.locator("html").evaluate(el=>{el.style.setProperty("overflow","scroll","important");el.style.setProperty("height","100%","important");});
    await page.locator("body").evaluate(el=>{el.style.setProperty("display","block","important");});
    await page.evaluate(()=>window.scrollTo(0,500));
    const state=await page.evaluate(()=>({html:document.documentElement.getAttribute("style"),body:document.body.getAttribute("style"),y:window.scrollY}));
    const worker=context.serviceWorkers()[0];await worker.evaluate(async()=>{const api=(globalThis as any).chrome;const tab=(await api.tabs.query({})).find((t:any)=>t.url?.startsWith("https://reading.test/"));await api.scripting.executeScript({target:{tabId:tab.id},files:["content-scripts/reader.js"]});});
    await expect(page.locator(".veil")).toHaveCSS("position","static");
    await expect(page.locator("body")).toHaveCSS("display","none");
    await page.mouse.wheel(0,600);await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBeGreaterThan(0);
    await expect.poll(()=>page.locator(".toolbar").evaluate(el=>el.getBoundingClientRect().top)).toBe(0);
    await page.getByRole("button",{name:"Fechar",exact:true}).click();
    expect(await page.evaluate(()=>({html:document.documentElement.getAttribute("style"),body:document.body.getAttribute("style"),y:window.scrollY}))).toEqual(state);
  } finally {await context.close();}
});

test("#36 RN-0002 seleção tem sombra discreta e temas suaves", async () => {
  const {context,page}=await open();
  try {
    const sepia=page.getByRole("button",{name:"Tema Sépia",exact:true});await sepia.click();
    await expect(page.locator(".veil")).toHaveCSS("background-color","rgb(250, 247, 240)");
    await expect(sepia.locator(".theme-swatch")).toHaveCSS("outline-style","none");
    expect(await sepia.evaluate(el=>getComputedStyle(el).boxShadow)).not.toBe("none");
    await page.getByRole("button",{name:"Tema Escuro",exact:true}).click();
    await expect(page.locator(".veil")).toHaveCSS("background-color","rgb(41, 42, 45)");
  } finally {await context.close();}
});

test("#36 RN-0004 popup e preferências têm fluxo único e estado de arquivos locais",async()=>{
 const {context,worker}=await open();try{
 const id=new URL(worker.url()).host;const popup=await context.newPage();await popup.goto(`chrome-extension://${id}/popup.html`);
 await expect(popup.getByRole("link",{name:"Abrir PDF local",exact:true})).toHaveCount(0);
 await expect(popup.getByRole("link",{name:"Preferências",exact:true})).toBeVisible();
 await popup.goto(`chrome-extension://${id}/options.html`);
 await expect(popup.getByRole("checkbox",{name:"Abrir arquivos locais automaticamente",exact:true})).toBeVisible();
 await expect(popup.locator("#file-access-status")).not.toHaveText("");
 await popup.setViewportSize({width:360,height:900});expect(await popup.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }finally{await context.close();}
});

async function openLocal(file:string){
 const path=resolve(".output/chrome-mv3");const context=await chromium.launchPersistentContext("",{channel:"chromium",headless:true,args:[`--disable-extensions-except=${path}`,`--load-extension=${path}`,"--allow-file-access-from-files"]});
 const worker=context.serviceWorkers()[0]??await context.waitForEvent("serviceworker");const id=new URL(worker.url()).host;
 const settings=await context.newPage();await settings.goto(`chrome://extensions/?id=${id}`);
 const toggle=settings.locator("#allow-file-access").locator("cr-toggle");if(await toggle.count()&&await toggle.getAttribute("checked")===null)await toggle.click();
 const page=await context.newPage();await page.goto(new URL(`file://${resolve(file)}`).href);return{context,page,worker};
}
test("#36 RN-0001 HTML local entra no leitor sem ativação manual",async()=>{
 const {context,page}=await openLocal("tests/fixtures/local-reading.html");try{await expect(page.getByRole("article")).toContainText("Leitura de arquivo local");await expect(page.locator("[data-leitor-limpo-host]")).toHaveCount(1);}finally{await context.close();}
});
test("#36 RN-0003 PDF da aba é detectado e retorna ao original sem ciclo",async()=>{
 const {context,page}=await openLocal("tests/fixtures/sample.pdf");try{await expect(page.getByRole("article")).toContainText("PDF de teste");await page.getByRole("button",{name:"Fechar",exact:true}).click();await expect(page).toHaveURL(/file:.*sample\.pdf$/);await expect(page.locator("[data-leitor-limpo-host]")).toHaveCount(0);}finally{await context.close();}
});
