import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "The Team",
  "Meet the Palm Beach Real Estate Pros team, led by Paul Schafranick.",
  "/about",
);

const team: { name: string; title: string; assistant?: boolean; photo: string; crop: string }[] = [
  { name: "Paul Schafranick", title: "Founder | Realtor®", photo: "/images/team/1-paul-schafranick.jpg", crop: "paul" },
  { name: "Hobson", title: "Real Estate Concierge", assistant: true, photo: "/images/team/2-hobson.jpg", crop: "hobson" },
  { name: "Madison", title: "Client Care", assistant: true, photo: "/images/team/3-madison.png", crop: "madison" },
  { name: "Pax", title: "AI Strategist", photo: "/images/team/4-pax.png", crop: "pax" },
  { name: "A$AP", title: "Director of Operations", photo: "/images/team/5-asap.jpg", crop: "asap" },
  { name: "Chief of Staff", title: "Operations & Deal Flow", photo: "/images/team/6-chief-of-staff.jpg", crop: "chief" },
];

export default function TeamPage() {
  return (
    <section className="container section team-page">
      <div className="team-heading">
        <span className="eyebrow">PALM BEACH REAL ESTATE PROS</span>
        <h1>The Team</h1>
      </div>
      <div className="team-grid">
        {team.map(person => (
          <article className="agent-card team-card" key={person.name}>
            <div className={`team-portrait portrait-${person.crop}`}>
              {person.photo ? <img src={person.photo} alt={person.name} width={640} height={720} loading="lazy" /> : null}
            </div>
            <div className="team-card-copy">
              <h2>{person.name}</h2>
              <p className="team-title">{person.title}</p>
              {person.assistant ? <p className="team-assistant">AI assistant.</p> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
