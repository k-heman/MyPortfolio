import { useState } from 'react';
import { useReveal } from '../hooks/useReveal';

import './Skills.scss';

interface SkillCategory {
  title: string;
  icon: string;
  categoryKey: string;
}

interface SkillIcon {
  name: string;
  class: string;
  level: string;
  category: string;
}

interface SkillsData {
  title: string;
  label: string;
  tagline: string;
  marquee: string[];
  categories: SkillCategory[];
  icons: SkillIcon[];
}

export default function Skills({ skills }: { skills: SkillsData }) {
  const { ref, visible } = useReveal();
  const [activeCategory, setActiveCategory] = useState(skills.categories[0]?.categoryKey || '');

  const filtered = skills.icons.filter((icon) => icon.category === activeCategory);

  return (
    <section id="skills" className="section" aria-labelledby="skills-heading">
      <div className="section__head section__head--centered">
        <p className="section__label">{skills.label}</p>
        <h2 id="skills-heading" className="section__title">{skills.title}</h2>
        <p className="section__sub" style={{ margin: '18px auto 0' }}>{skills.tagline}</p>
      </div>

      {/* Marquee */}
      <div className="skills__marquee" aria-hidden="true">
        <div className="skills__marquee-track">
          {[...skills.marquee, ...skills.marquee].map((text, i) => (
            <span className="skills__marquee-item" key={i}>{text}</span>
          ))}
        </div>
      </div>

      <div ref={ref} className={`skills__content ${visible ? 'reveal--visible' : 'reveal'}`}>
        {/* Category tabs */}
        <div className="skills__tabs" role="tablist">
          {skills.categories.map((cat) => (
            <button
              key={cat.categoryKey}
              role="tab"
              aria-selected={activeCategory === cat.categoryKey}
              className={`skills__tab ${activeCategory === cat.categoryKey ? 'skills__tab--active' : ''}`}
              onClick={() => setActiveCategory(cat.categoryKey)}
            >
              {cat.title}
            </button>
          ))}
        </div>

        {/* Skill icons grid */}
        <div className="skills__grid" role="tabpanel">
          {filtered.map((skill, i) => (
            <div className="skills__item" key={i}>
              <div className="skills__item-icon" aria-hidden="true">
                {skill.name.charAt(0)}
              </div>
              <span className="skills__item-name">{skill.name}</span>
              <div className="skills__item-bar">
                <div
                  className="skills__item-fill"
                  style={{ width: `${skill.level}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
