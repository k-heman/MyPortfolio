import { useEffect, useState } from 'react';
import { useCountUp } from '../hooks/useCountUp';

import './Hero.scss';

interface StatItem {
  value: number;
  suffix: string;
  label: string;
}

interface HomeData {
  title: string;
  name: string;
  titles: string[];
  tagline: string;
  cta: {
    primary: { text: string; url: string; ariaLabel: string };
    secondary: { text: string; url: string; ariaLabel: string };
  };
  stats: StatItem[];
}

function StatCounter({ stat }: { stat: StatItem }) {
  const { ref, count } = useCountUp(stat.value, 2000);
  return (
    <div className="hero__stat">
      <span className="hero__stat-value" ref={ref}>
        {count}
        {stat.suffix}
      </span>
      <span className="hero__stat-label">{stat.label}</span>
    </div>
  );
}

function TypeWriter({ titles }: { titles: string[] }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!titles || titles.length === 0) return;
    const current = titles[index] || '';
    const speed = deleting ? 40 : 80;

    if (!deleting && text === current) {
      const timer = setTimeout(() => setDeleting(true), 2000);
      return () => clearTimeout(timer);
    }

    if (deleting && text === '') {
      setDeleting(false);
      setIndex((i) => (i + 1) % titles.length);
      return;
    }

    const timer = setTimeout(() => {
      setText(deleting ? current.slice(0, text.length - 1) : current.slice(0, text.length + 1));
    }, speed);

    return () => clearTimeout(timer);
  }, [text, deleting, index, titles]);

  return (
    <span className="hero__typewriter">
      {text}
      <span className="hero__cursor" aria-hidden="true">|</span>
    </span>
  );
}

export default function Hero({
  home,
  openToWork,
  openToWorkText,
}: {
  home: HomeData;
  openToWork: boolean;
  openToWorkText: string;
}) {
  const { cta, stats, name, titles, tagline } = home;

  return (
    <section id="home" className="hero" aria-labelledby="home-heading">
      <div className="hero__bg" aria-hidden="true">
        <div className="hero__orb hero__orb--1" />
        <div className="hero__orb hero__orb--2" />
        <div className="hero__orb hero__orb--3" />
      </div>

      <div className="hero__inner">
        <div className="hero__content">
          <img
            src="/hemanlogo.png"
            alt="Heman K logo"
            className="hero__logo"
            width="80"
            height="80"
          />

          {openToWork && (
            <div className="hero__badge">
              <span className="hero__badge-dot" aria-hidden="true" />
              {openToWorkText}
            </div>
          )}

          <p className="hero__greeting">
            <span className="hero__greeting-slash" aria-hidden="true">{'//'}</span>{' '}
            hello, I&rsquo;m
          </p>

          <h1 id="home-heading" className="hero__name">{name}</h1>

          <div className="hero__role">
            <TypeWriter titles={titles} />
          </div>

          <p className="hero__tagline">{tagline}</p>

          <div className="hero__ctas">
            <a href={cta.primary.url.replace('/', '#')} className="btn btn--primary" aria-label={cta.primary.ariaLabel}>
              {cta.primary.text}
            </a>
            <a href={cta.secondary.url.replace('/', '#')} className="btn btn--secondary" aria-label={cta.secondary.ariaLabel}>
              {cta.secondary.text}
            </a>
          </div>
        </div>

        <div className="hero__portrait-wrapper">
          <div className="hero__portrait-glow" aria-hidden="true" />
          <div className="hero__portrait-card">
            <img src="/assets/myimage.jpeg" alt="Professional Portrait" className="hero__portrait-img" />
          </div>
        </div>
      </div>

      <div className="hero__scroll-cue" aria-hidden="true">
        Scroll
        <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  );
}
