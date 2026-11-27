import { describe, expect, it } from "vitest";
import { parseGuideMarkdown, parseInlines } from "../src/lib/guide-markdown";

describe("parseGuideMarkdown", () => {
  it("turns ### headings into h2 blocks and keeps paragraphs", () => {
    const blocks = parseGuideMarkdown("### When to look\n\nCome down in person.\n\nMore detail here.");
    expect(blocks.map((b) => b.t)).toEqual(["h2", "p", "p"]);
  });

  it("renders bold and safe tel and internal links, and drops javascript hrefs", () => {
    const parts = parseInlines("Call **Paul** at [(561) 255-7285](tel:+15612557285) or see [costs](/guides/what-it-costs-to-live-in-palm-beach-county) and [bad](javascript:alert).");
    expect(parts).toEqual([
      { t: "text", v: "Call " },
      { t: "bold", v: "Paul" },
      { t: "text", v: " at " },
      { t: "link", href: "tel:+15612557285", v: "(561) 255-7285" },
      { t: "text", v: " or see " },
      { t: "link", href: "/guides/what-it-costs-to-live-in-palm-beach-county", v: "costs" },
      { t: "text", v: " and " },
      { t: "text", v: "bad" },
      { t: "text", v: "." },
    ]);
  });

  it("auto-links a bare phone number", () => {
    const parts = parseInlines("Call (561) 255-7285 today.");
    expect(parts).toContainEqual({ t: "link", href: "tel:+15612557285", v: "(561) 255-7285" });
  });
});
