import { Readability } from "@mozilla/readability";
import createDOMPurify from "dompurify";

export type ExtractedArticle = {
  title: string;
  byline: string | null;
  content: string;
};

export function extractArticle(source: Document): ExtractedArticle | null {
  const parsed = new Readability(source.cloneNode(true) as Document, { charThreshold: 40 }).parse();
  if (!parsed) return null;

  const purifier = createDOMPurify(globalThis);
  const sanitized = purifier.sanitize(parsed.content ?? "", {
    FORBID_ATTR: ["style", "src", "srcset", "poster", "background", "action", "formaction"],
    FORBID_TAGS: ["base", "embed", "form", "iframe", "object", "script", "style"],
    RETURN_TRUSTED_TYPE: false,
  });
  const template = document.createElement("template");
  template.innerHTML = sanitized;
  const contentRoot = template.content.querySelector("article");

  return {
    title: parsed.title || source.title || "Artigo",
    byline: parsed.byline ?? null,
    content: contentRoot?.innerHTML ?? template.innerHTML,
  };
}
