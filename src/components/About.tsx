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
  openToWorkText: string;
  descriptionHeader: string;
  description: string;
  image: { url: string; size: { width: number; height: number } };
  cv: { download: string };
  cta: any;
  highlights: Highlight[];
}

export default function About({
  about,
  location,
}: {
  about: AboutData;
  location: string;
}) {
  const { ref, visible } = useReveal();

  return (
    <section id="about" className="section" aria-labelledby="about-heading">
      <div className="section__head section__head--centered">
        <p className="section__label">Background</p>
        <h2 id="about-heading" className="section__title">
          {about.title}
        </h2>
      </div>

      <div ref={ref} className={`about__grid ${visible ? 'reveal--visible' : 'reveal'}`}>
        <div className="about__text-block">
          <div className="about__description" dangerouslySetInnerHTML={{ __html: about.description }} />
          <div className="about__location">
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18" aria-hidden="true">
              <path
                d="M12 21c-4-4-8-9.5-8-13a8 8 0 1116 0c0 3.5-4 9-8 13z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="2" />
            </svg>
            Based in {location}
          </div>
        </div>

        <div className="about__cards">
          {about.highlights.map((highlight, index) => (
            <div className="about__card" key={index}>
              <h3 className="about__card-title">{highlight.title}</h3>
              <p className="about__card-sub">{highlight.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
