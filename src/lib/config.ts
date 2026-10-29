import raw from "../../config/agent.json";
export type Review = { name: string; quote: string };
export const agent = raw as typeof raw & { reviews: Review[]; socials: Record<string, string> };
export const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export function siteUrl() { return process.env.SITE_URL || "http://localhost:3000"; }
