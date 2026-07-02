import { useState } from 'react';
import { useReveal } from '../hooks/useReveal';

interface Technology {
  class: string;
  name: string;
}

interface Project {
  title: string;
  startDate: string;
  description: string;
  technologies: Technology[];
  url: string;
}

interface ProjectsData {
  title: string;
  label: string;
  items: Project[];
  ctaText: string;
}

const styles = {
  grid: (visible: boolean): React.CSSProperties => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '24px',
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(32px)',
    transition: 'opacity 0.7s cubic-bezier(0.4,0,0.2,1), transform 0.7s cubic-bezier(0.4,0,0.2,1)',
  }),
  card: {
    padding: '32px',
    background: 'var(--card-bg)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-xl)',
    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
    display: 'flex',
    flexDirection: 'column' as const,
    cursor: 'default',
  },
  cardHover: {
    transform: 'translateY(-6px)',
    borderColor: 'color-mix(in oklab, var(--accent-primary) 35%, transparent)',
    boxShadow: '0 20px 60px color-mix(in oklab, var(--accent-primary) 10%, transparent)',
  },
  cardHeader: {
    marginBottom: '16px',
  },
  year: {
    display: 'inline-block',
    fontSize: 'var(--fs-2xs)',
    fontWeight: 600,
    color: 'var(--accent-primary)',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    padding: '3px 10px',
    background: 'color-mix(in oklab, var(--accent-primary) 10%, transparent)',
    borderRadius: 'var(--radius-pill)',
    marginBottom: '12px',
  },
  cardTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--fs-h3)',
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.5px',
  },
  desc: (expanded: boolean): React.CSSProperties => ({
    fontSize: 'var(--fs-body-sm)',
    color: 'var(--text-secondary)',
    lineHeight: 'var(--lh-loose)',
    flexGrow: 1,
    display: '-webkit-box',
    WebkitLineClamp: expanded ? 'unset' : 4,
    WebkitBoxOrient: 'vertical' as const,
    overflow: expanded ? 'visible' : 'hidden',
  }),
  toggle: {
    fontSize: 'var(--fs-xs)',
    color: 'var(--accent-primary)',
    fontWeight: 600,
    marginTop: '8px',
    padding: 0,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  techRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid var(--border-color)',
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 12px',
    fontSize: 'var(--fs-2xs)',
    fontWeight: 500,
    background: 'color-mix(in oklab, var(--bg-tertiary) 60%, transparent)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-pill)',
    transition: 'all 0.2s',
  },
  link: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '16px',
    fontSize: 'var(--fs-body-sm)',
    fontWeight: 600,
    color: 'var(--accent-primary)',
    textDecoration: 'none',
    transition: 'gap 0.2s',
  },
};

export default function Projects({ projects }: { projects: ProjectsData }) {
  const { ref, visible } = useReveal();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <section id="projects" className="section" aria-labelledby="projects-heading">
      <div className="section__head">
        <p className="section__label">{projects.label}</p>
        <h2 id="projects-heading" className="section__title">{projects.title}</h2>
        <p className="section__sub">
          A curated cross-section of client platforms, automated tools, and projects built from
          scratch and shipped to production.
        </p>
      </div>

      <div ref={ref} style={styles.grid(visible)}>
        {projects.items.map((project, i) => (
          <article
            key={i}
            style={{
              ...styles.card,
              ...(hoveredCard === i ? styles.cardHover : {}),
            }}
            onMouseEnter={() => setHoveredCard(i)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div style={styles.cardHeader}>
              <span style={styles.year}>{project.startDate}</span>
              <h3 style={styles.cardTitle}>{project.title}</h3>
            </div>

            <p style={styles.desc(expanded === i)}>{project.description}</p>

            {project.description.length > 200 && (
              <button
                style={styles.toggle}
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                {expanded === i ? 'Show less' : 'Read more'}
              </button>
            )}

            <div style={styles.techRow}>
              {project.technologies.map((tech, j) => (
                <span key={j} style={styles.chip}>
                  {tech.name}
                </span>
              ))}
            </div>

            {project.url && (
              <a
                href={project.url}
                style={styles.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Project →
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
