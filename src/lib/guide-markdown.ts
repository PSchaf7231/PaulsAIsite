export type Inline =
  | { t: "text"; v: string }
  | { t: "bold"; v: string }
  | { t: "link"; href: string; v: string };

export type Block = { t: "h2" | "p"; inlines: Inline[] };

const PHONE = /(\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4})/;

function safeHref(href: string): string | null {
  if (href.startsWith("/guides/") || href.startsWith("/blog/") || href.startsWith("/contact") || href.startsWith("/listings") || href.startsWith("/communities") || href.startsWith("/about")) {
    return href;
  }
  if (href.startsWith("tel:+") && /^tel:\+[0-9]+$/.test(href)) return href;
  if (href === "https://www.pbrealestatepros.com" || href.startsWith("https://www.pbrealestatepros.com/")) return href;
  return null;
}

export function parseInlines(text: string): Inline[] {
  const out: Inline[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) pushText(out, text.slice(last, m.index));
    if (m[1] != null && m[2] != null) {
      const href = safeHref(m[2]);
      if (href) out.push({ t: "link", href, v: m[1] });
      else pushText(out, m[1]);
    } else if (m[3] != null) {
      out.push({ t: "bold", v: m[3] });
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) pushText(out, text.slice(last));
  return out;
}

function pushText(out: Inline[], value: string) {
  const parts = value.split(PHONE);
  for (const part of parts) {
    if (!part) continue;
    if (PHONE.test(part)) {
      const digits = part.replace(/\D/g, "");
      if (digits.length === 10) {
        out.push({ t: "link", href: `tel:+1${digits}`, v: part });
        continue;
      }
    }
    out.push({ t: "text", v: part });
  }
}

export function parseGuideMarkdown(source: string): Block[] {
  const chunks = source.trim().split(/\n\s*\n/);
  const blocks: Block[] = [];
  for (const chunk of chunks) {
    const lines = chunk.replace(/\r\n/g, "\n").trim();
    if (!lines || lines === "---") continue;
    if (lines.startsWith("# ")) continue;
    if (lines.startsWith("### ")) {
      blocks.push({ t: "h2", inlines: parseInlines(lines.slice(4).replace(/\n/g, " ")) });
      continue;
    }
    if (lines.startsWith("## ")) {
      blocks.push({ t: "h2", inlines: parseInlines(lines.slice(3).replace(/\n/g, " ")) });
      continue;
    }
    blocks.push({ t: "p", inlines: parseInlines(lines.replace(/\n/g, " ")) });
  }
  return blocks;
}
