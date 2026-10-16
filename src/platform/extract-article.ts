import { Readability } from "@mozilla/readability";
import createDOMPurify from "dompurify";

export type ExtractedArticle = {
  title: string;
  byline: string | null;
  content: string;
  images?: Record<string, string>;
};

const advertisement =
  'ins.adsbygoogle, [data-ad], [data-ad-slot], [data-ad-client], [data-advertisement], [aria-label="Advertisement" i], [aria-label="Publicidade" i], .advertisement, .ads, .sponsored, [id^="google_ads_"]';
const advertisingHost = /(^|\.)(doubleclick\.net|googlesyndication\.com|googleadservices\.com|adnxs\.com|amazon-adsystem\.com)$/i;

function imageSource(image: Element, base: string): string | null {
  const source = image.getAttribute("src") || image.getAttribute("data-src") || image.getAttribute("data-original");
  if (!source || source.length > 10000) return null;
  const width = Number(image.getAttribute("width")),
    height = Number(image.getAttribute("height"));
  if ((width > 0 && width <= 2) || (height > 0 && height <= 2)) return null;
  try {
    const url = new URL(source, base);
    if (url.username || url.password || advertisingHost.test(url.hostname)) return null;
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

// Build an inert copy of the composed tree: cloneNode alone omits open shadow roots.
function readableSnapshot(source: Document): Document | null {
  const snapshot = source.implementation.createHTMLDocument(source.title);
  let remainingNodes = 50000;
  let remainingCharacters = 5000000;
  let exceeded = false;
  const copy = (node: Node, depth: number): Node | null => {
    if (--remainingNodes < 0 || depth > 100) {
      exceeded = true;
      return null;
    }
    if (node.nodeType === Node.TEXT_NODE) {
      remainingCharacters -= node.textContent?.length ?? 0;
      if (remainingCharacters < 0) {
        exceeded = true;
        return null;
      }
      return snapshot.createTextNode(node.textContent ?? "");
    }
    if (!(node instanceof Element)) return null;
    if (node.matches(advertisement)) return null;
    if (node.matches("script, style, noscript, template, link, iframe, object, embed, [data-leitor-limpo-host]")) return null;
    if (node instanceof HTMLSlotElement) {
      const fragment = snapshot.createDocumentFragment();
      const assigned = node.assignedNodes({ flatten: true });
      for (const child of assigned.length ? assigned : node.childNodes) {
        const cloned = copy(child, depth + 1);
        if (cloned) fragment.append(cloned);
      }
      return fragment;
    }
    // Custom element names are replaced by ordinary containers in the inert document.
    const cloned = node.localName.includes("-") ? snapshot.createElement("div") : snapshot.importNode(node, false);
    if (node.localName.includes("-")) {
      for (const name of ["class", "id", "role", "lang"]) {
        const value = node.getAttribute(name);
        if (value !== null) cloned.setAttribute(name, value);
      }
    }
    for (const child of (node.shadowRoot ?? node).childNodes) {
      const copied = copy(child, depth + 1);
      if (copied) cloned.append(copied);
    }
    return cloned;
  };
  const body = copy(source.body, 0);
  if (!body || exceeded) return null;
  snapshot.body.replaceWith(body);
  const base = snapshot.createElement("base");
  base.href = source.baseURI;
  snapshot.head.append(base);
  // Preserve editorial metadata without copying executable or navigation elements.
  for (const original of [...source.head.querySelectorAll("meta[name], meta[property]")].slice(0, 100)) {
    const name = original.getAttribute("name") ?? original.getAttribute("property") ?? "";
    const content = original.getAttribute("content");
    if (
      !content ||
      content.length > 10000 ||
      !/^(author|creator|description|title|pub-date|site_name|og:.*|twitter:.*|dc[:.-].*|dcterm[:.-].*|article:.*|parsely-.*|weibo:.*)$/i.test(name.trim())
    )
      continue;
    remainingCharacters -= content.length;
    if (remainingCharacters < 0) return null;
    const meta = snapshot.createElement("meta");
    meta.setAttribute(original.hasAttribute("property") ? "property" : "name", name);
    meta.content = content;
    snapshot.head.append(meta);
  }
  // Readability parses JSON-LD as data; this inert document cannot execute it.
  for (const original of [...source.querySelectorAll('script[type="application/ld+json"]')].slice(0, 10)) {
    const content = original.textContent ?? "";
    if (content.length > 100000) continue;
    remainingCharacters -= content.length;
    if (remainingCharacters < 0) return null;
    const data = snapshot.createElement("script");
    data.type = "application/ld+json";
    data.textContent = content;
    snapshot.head.append(data);
  }
  return snapshot;
}

export function extractArticle(source: Document): ExtractedArticle | null {
  const snapshot = readableSnapshot(source);
  if (!snapshot) return null;
  const parsed = new Readability(snapshot, { charThreshold: 40 }).parse();
  if (!parsed) return null;

  const purifier = createDOMPurify(globalThis);
  const inertContent = document.createElement("template");
  inertContent.innerHTML = parsed.content ?? "";
  inertContent.content.querySelectorAll("[data-reader-image]").forEach((node) => node.removeAttribute("data-reader-image"));
  const images: Record<string, string> = {};
  let imageIndex = 0;
  inertContent.content.querySelectorAll("img").forEach((image) => {
    const imageUrl = imageSource(image, source.baseURI);
    if (!imageUrl) {
      image.remove();
      return;
    }
    const key = String(imageIndex++);
    images[key] = imageUrl;
    image.setAttribute("data-reader-image", key);
  });
  const sanitized = purifier.sanitize(inertContent.innerHTML, {
    FORBID_ATTR: ["style", "src", "srcset", "poster", "background", "action", "formaction"],
    FORBID_TAGS: ["base", "embed", "form", "iframe", "object", "script", "style"],
    RETURN_TRUSTED_TYPE: false,
  });
  const template = document.createElement("template");
  template.innerHTML = sanitized;
  // Readability can accept a control-only fragment such as "; ; ; Continuar lendo".
  if ((template.content.textContent?.match(/[\p{L}\p{N}]/gu)?.length ?? 0) < 80) return null;
  // The reader supplies its own article. Unwrap containers without dropping sibling paragraphs.
  template.content.querySelectorAll("article").forEach((article) => article.replaceWith(...article.childNodes));

  return {
    title: parsed.title || source.title || "Artigo",
    byline: parsed.byline ?? null,
    content: template.innerHTML,
    images,
  };
}
