import { useState } from 'react';
import { useReveal } from '../hooks/useReveal';
import type { Project, Technology } from '../types';

import './Projects.scss';

interface ProjectsData {
  title: string;
  label: string;
  items: Project[];
}

export default function Projects({ projects }: { projects: ProjectsData }) {
  const { ref, visible } = useReveal();
  const [activeTag, setActiveTag] = useState<string>('All');

  // Extract all unique technologies for the filter tabs
  const allTags = ['All', ...Array.from(new Set(projects.items.flatMap((p) => p.technologies.map(t => t.name))))];
  
  const filteredProjects = activeTag === 'All'
    ? projects.items
    : projects.items.filter((p) => p.technologies.some(t => t.name === activeTag));

  return (
    <section id="projects" className="section" aria-labelledby="projects-heading">
      <div className="section__head section__head--centered">
        <p className="section__label">{projects.label}</p>
        <h2 id="projects-heading" className="section__title">{projects.title}</h2>
      </div>

      <div ref={ref} className={`projects__content ${visible ? 'reveal--visible' : 'reveal'}`}>
        <div className="projects__filters" role="tablist">
          {allTags.map((tag) => (
            <button
              key={tag}
              role="tab"
              aria-selected={activeTag === tag}
              className={`projects__filter ${activeTag === tag ? 'projects__filter--active' : ''}`}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="projects__grid" role="tabpanel">
          {filteredProjects.length === 0 ? (
            <p style={{ textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-muted)' }}>
              No projects found for this category.
            </p>
          ) : (
            filteredProjects.map((project, i) => (
              <article className="projects__card" key={project.id || i}>
                <div className="projects__card-inner">
                  <h3 className="projects__card-title">{project.title}</h3>
                  <p className="projects__card-desc">{project.description}</p>
                  
                  <div className="projects__card-tech">
                    {project.technologies.map((tech, j) => (
                      <span className="projects__card-tag" key={j}>{tech.name}</span>
                    ))}
                  </div>

                  <div className="projects__card-links">
                    {project.liveUrl && (
                      <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="projects__card-link" aria-label={`View ${project.title} live`}>
                        <svg viewBox="0 0 24 24" fill="none" width="18" height="18" aria-hidden="true">
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Live Demo
                      </a>
                    )}
                    {project.githubUrl && (
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="projects__card-link" aria-label={`View ${project.title} on GitHub`}>
                        <svg viewBox="0 0 24 24" fill="none" width="18" height="18" aria-hidden="true">
                          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Source
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
