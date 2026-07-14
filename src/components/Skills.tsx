import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { useReveal } from '../hooks/useReveal';
import type { Skill, SkillCategory } from '../types';

import './Skills.scss';

const brandColors: Record<string, { dark: string; light: string }> = {
  'devicon:react':        { dark: '#61DAFB', light: '#0891B2' },
  'devicon:javascript':   { dark: '#F7DF1E', light: '#B8860B' },
  'devicon:tailwindcss':  { dark: '#06B6D4', light: '#0E7490' },
  'devicon:html5':        { dark: '#E34F26', light: '#CC3D10' },
  'devicon:css3':         { dark: '#42A5F5', light: '#1565C0' },
  'mdi:responsive':       { dark: '#B388FF', light: '#5C2FC2' },
  'devicon:firebase':     { dark: '#FFCA28', light: '#E09500' },
  'mdi:shield-key-outline': { dark: '#FF7043', light: '#D84315' },
  'devicon:git':          { dark: '#F05032', light: '#D43617' },
  'devicon:github':       { dark: '#C9D1D9', light: '#24292F' },
  'dashicons:rest-api':   { dark: '#4DD0E1', light: '#00838F' },
  'devicon:supabase':     { dark: '#3ECF8E', light: '#1E8C5C' },
  'simple-icons:sqlite':  { dark: '#4FC3F7', light: '#0277BD' },
  'devicon:c':            { dark: '#90CAF9', light: '#3949AB' },
  'mdi:graph-outline':    { dark: '#CE93D8', light: '#7B1FA2' },
  'mdi:speedometer':      { dark: '#4DB6AC', light: '#00695C' },
  'devicon:canva':        { dark: '#00C4CC', light: '#008B8F' },
  'mdi:image-multiple-outline': { dark: '#F48FB1', light: '#C62828' },
  'mdi:palette-swatch-outline': { dark: '#4FC3F7', light: '#0277BD' },
  'mdi:tune-vertical':    { dark: '#FFB74D', light: '#E65100' },
  'devicon:typescript':   { dark: '#3178C6', light: '#235A9B' },
  'devicon:nodejs':       { dark: '#66BB6A', light: '#2E7D32' },
  'devicon:python':       { dark: '#4FC3F7', light: '#2B6CB0' },
  'devicon:nextjs':       { dark: '#C9D1D9', light: '#171717' },
  'devicon:mongodb':      { dark: '#66BB6A', light: '#2E7D32' },
  'devicon:postgresql':   { dark: '#64B5F6', light: '#2C5EA8' },
  'devicon:docker':       { dark: '#42A5F5', light: '#1565C0' },
  'devicon:figma':        { dark: '#F24E1E', light: '#D13A0E' },
  'devicon:sass':         { dark: '#E78DC3', light: '#A0356E' },
  'devicon:redux':        { dark: '#B388FF', light: '#5C2FC2' },
  'devicon:vitejs':       { dark: '#9580FF', light: '#5B44C0' },
  'devicon:vercel':       { dark: '#C9D1D9', light: '#171717' },
};

function getTextColor(iconClass: string, theme: 'dark' | 'light'): string {
  const entry = brandColors[iconClass];
  if (entry) return theme === 'dark' ? entry.dark : entry.light;

  for (const [key, val] of Object.entries(brandColors)) {
    if (iconClass.startsWith(key) || key.startsWith(iconClass)) {
      return theme === 'dark' ? val.dark : val.light;
    }
  }

  return theme === 'dark' ? '#C9D1D9' : '#374151';
}

interface SkillsData {
  title: string;
  label: string;
  tagline: string;
  marquee: string[];
  categories: SkillCategory[];
  icons: Skill[];
}

export default function Skills({ skills, theme }: { skills: SkillsData; theme: 'dark' | 'light' }) {
  const { ref, visible } = useReveal();
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [flippedId, setFlippedId] = useState<string | null>(null);
  useEffect(() => {
    if (skills.categories.length > 0 && !activeCategory) {
      setActiveCategory(skills.categories[0].categoryKey);
    }
  }, [skills.categories, activeCategory]);

  const handleCategoryChange = useCallback((categoryKey: string) => {
    setFlippedId(null);
    setActiveCategory(categoryKey);
  }, []);

  const handleCardClick = useCallback((cardId: string) => {
    setFlippedId((prev) => (prev === cardId ? null : cardId));
  }, []);

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
              onClick={() => handleCategoryChange(cat.categoryKey)}
            >
              {cat.title}
            </button>
          ))}
        </div>

        {/* Skill cards grid */}
        <div className="skills__grid" role="tabpanel">
          {filtered.length === 0 ? (
            <p style={{ textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-muted)' }}>
              No skills found in this category.
            </p>
          ) : (
            filtered.map((skill, i) => {
              const cardId = skill.id || `${skill.class}-${i}`;
              const color = getTextColor(skill.class, theme);
              const isFlipped = flippedId === cardId;
              const level = parseInt(skill.level, 10) || 0;

              return (
                <div
                  className={`skills__card ${isFlipped ? 'skills__card--flipped' : ''}`}
                  key={cardId}
                  style={{ '--brand-color': color } as React.CSSProperties}
                  onClick={() => handleCardClick(cardId)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${skill.name} — click to ${isFlipped ? 'hide' : 'show'} proficiency`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardClick(cardId);
                    }
                  }}
                >
                  {/* ── FRONT ── */}
                  <div className="skills__card-front">
                    <div className="skills__card-icon" aria-hidden="true">
                      <Icon icon={skill.class} />
                    </div>
                    <span className="skills__card-name" style={{ color }}>
                      {skill.name}
                    </span>
                  </div>

                  {/* ── BACK ── */}
                  <div className="skills__card-back">
                    <span className="skills__card-level-label">Proficiency</span>
                    
                    <div className="skills__card-pills-container">
                      {skill.skillTags && (
                        skill.skillTags.split(',').map((tag, tIdx) => (
                          <div key={tIdx} className="skills__card-pill">
                            {tag.trim()}
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="skills__card-bar">
                      <div
                        className="skills__card-bar-fill"
                        style={{
                          width: isFlipped ? `${level}%` : '0%',
                          background: color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </section>
  );
}
