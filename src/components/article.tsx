import Link from "next/link";
import { PaxButton } from "@/components/pax-panel";
import GuideMarkdown from "@/components/guide-markdown";
import { guides, type Article as ArticleData } from "@/lib/articles";

const DISCLAIMER =
  "General educational information, not legal, tax, insurance, or financial advice. Verify property-specific details with qualified professionals.";

export default function Article({ article }: { article: ArticleData }) {
  const related = (article.related ?? [])
    .map((slug) => guides.find((item) => item.slug === slug))
    .filter((item): item is ArticleData => Boolean(item));

  return (
    <article className="article">
      <span className="eyebrow">{article.category}</span>
      <h1>{article.title}</h1>
      <p>{article.excerpt}</p>
      {article.body ? (
        <GuideMarkdown source={article.body} />
      ) : (
        (article.sections ?? []).map(([title, body]) => (
          <section key={title}>
            <h2>{title}</h2>
            <p>{body}</p>
          </section>
        ))
      )}
      <div className="callout">{DISCLAIMER}</div>
      {related.length > 0 && (
        <nav className="article-related" aria-label="Related guides">
          <h2>Related guides</h2>
          <ul>
            {related.map((item) => (
              <li key={item.slug}>
                <Link href={`/guides/${item.slug}`}>{item.title}</Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <div className="article-actions">
        <PaxButton
          className="btn outline"
          message={`Help me understand this guide: ${article.title}. ${article.excerpt}`}
        >
          ✦ Ask Madison about this
        </PaxButton>
        <Link className="btn" href="/contact">
          Talk through your next step
        </Link>
      </div>
    </article>
  );
}
