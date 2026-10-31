import raw from "../../config/agent.json";
export type Review = { name: string; quote: string };
export const agent = raw as typeof raw & { reviews: Review[]; socials: Record<string, string> };
export const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export function siteUrl() { return new URL(process.env.NEXT_PUBLIC_SITE_URL||"https://www.pbrealestatepros.com").origin; }
