import { useReveal } from '../hooks/useReveal';

import './About.scss';

interface Highlight {
  icon: string;
  title: string;
  sub: string;
}

interface AboutData {
  title: string;
  label: string;
  description: string;
  cta: {
    primary: { text: string; url: string; ariaLabel: string };
    secondary: { text: string; url: string; ariaLabel: string };
  };
  highlights: Highlight[];
}

const iconMap: Record<string, string> = {
  'mdi:react': '⚛️',
  'mdi:robot-outline': '🤖',
  'mdi:account-group': '👥',
  'mdi:lightbulb-on-outline': '💡',
};

export default function About({ about, location }: { about: AboutData; location: string }) {
  const { ref, visible } = useReveal();

  const isExternal = about.cta.primary.url.startsWith('http');

  return (
    <section id="about" className="section" aria-labelledby="about-heading">
      <div className="section__head">
        <p className="section__label">{about.label}</p>
        <h2 id="about-heading" className="section__title">{about.title}</h2>
      </div>

      <div ref={ref} className={`about ${visible ? 'reveal--visible' : 'reveal'}`}>
        <div className="about__grid">
          <div className="about__text">
            <div className="about__location">
              <span aria-hidden="true">📍</span> {location}
            </div>
            <div className="about__bio" dangerouslySetInnerHTML={{ __html: about.description }} />
            <div className="about__ctas">
              <a
                href={about.cta.primary.url}
                className="btn btn--primary"
                aria-label={about.cta.primary.ariaLabel}
                {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {about.cta.primary.text}
              </a>
              <a
                href={about.cta.secondary.url.replace('/', '#')}
                className="btn btn--secondary"
                aria-label={about.cta.secondary.ariaLabel}
              >
                {about.cta.secondary.text}
              </a>
            </div>
          </div>

          <div className="about__highlights">
            {about.highlights.map((h, i) => (
              <div className="about__card" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                <span className="about__card-icon" aria-hidden="true">
                  {iconMap[h.icon] || '🔧'}
                </span>
                <h3 className="about__card-title">{h.title}</h3>
                <p className="about__card-sub">{h.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
