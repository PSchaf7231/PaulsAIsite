import Link from "next/link";
import { parseGuideMarkdown, type Inline } from "@/lib/guide-markdown";

function Inlines({ parts }: { parts: Inline[] }) {
  return (
    <>
      {parts.map((part, i) => {
        if (part.t === "text") return <span key={i}>{part.v}</span>;
        if (part.t === "bold") return <strong key={i}>{part.v}</strong>;
        if (part.href.startsWith("/")) {
          return (
            <Link key={i} href={part.href}>
              {part.v}
            </Link>
          );
        }
        return (
          <a key={i} href={part.href}>
            {part.v}
          </a>
        );
      })}
    </>
  );
}

export default function GuideMarkdown({ source }: { source: string }) {
  const blocks = parseGuideMarkdown(source);
  return (
    <div className="article-body">
      {blocks.map((block, i) =>
        block.t === "h2" ? (
          <h2 key={i}>
            <Inlines parts={block.inlines} />
          </h2>
        ) : (
          <p key={i}>
            <Inlines parts={block.inlines} />
          </p>
        ),
      )}
    </div>
  );
}
