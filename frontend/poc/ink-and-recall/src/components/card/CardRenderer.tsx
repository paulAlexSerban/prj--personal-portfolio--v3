function sanitize(html: string): string {
  const ALLOWED = new Set(["b", "strong", "i", "em", "u", "code", "br", "img"]);
  const tmp = document.createElement("template");
  tmp.innerHTML = html;
  const walk = (node: Node) => {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === 1) {
        const el = child as HTMLElement;
        if (!ALLOWED.has(el.tagName.toLowerCase())) {
          el.replaceWith(document.createTextNode(el.textContent ?? ""));
          continue;
        }
        for (const attr of Array.from(el.attributes)) {
          if (el.tagName.toLowerCase() === "img" && (attr.name === "src" || attr.name === "alt"))
            continue;
          el.removeAttribute(attr.name);
        }
        walk(el);
      }
    }
  };
  walk(tmp.content);
  return tmp.innerHTML;
}

function renderCloze(text: string, reveal: boolean): string {
  return text.replace(/\{\{c\d+::([^}]+)\}\}/g, (_, inner) =>
    reveal
      ? `<b>${inner}</b>`
      : `<span style="border-bottom:2px solid #0d0d0d;padding:0 0.4em;">[…]</span>`,
  );
}

function renderMath(text: string): string {
  return text.replace(
    /\$([^$]+)\$/g,
    (_, m) => `<i style="font-family:Cambria,Georgia,serif">${m}</i>`,
  );
}

export function CardRenderer({
  html,
  reveal = true,
  dropcap = false,
  className = "",
}: {
  html: string;
  reveal?: boolean;
  dropcap?: boolean;
  className?: string;
}) {
  if (typeof document === "undefined") {
    return <div className={className}>{html.replace(/<[^>]+>/g, "")}</div>;
  }
  let processed = renderCloze(html, reveal);
  processed = renderMath(processed);
  processed = sanitize(processed);
  return (
    <div
      className={`${dropcap ? "dropcap" : ""} ${className}`}
      dangerouslySetInnerHTML={{ __html: processed }}
    />
  );
}
