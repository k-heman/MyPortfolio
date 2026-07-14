import { useState, useEffect } from 'react';
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
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Extract all unique technologies for the filter tabs
  const allTags = ['All', ...Array.from(new Set(projects.items.flatMap((p) => p.technologies.map(t => t.name))))];
  
  const filteredProjects = activeTag === 'All'
    ? projects.items
    : projects.items.filter((p) => p.technologies.some(t => t.name === activeTag));

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedProject) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedProject]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedProject) {
        setSelectedProject(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProject]);

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
                {/* Visual Thumbnail */}
                {project.imageUrl ? (
                  <div className="projects__card-image-wrap">
                    <img src={project.imageUrl} alt={project.title} className="projects__card-image" loading="lazy" />
                  </div>
                ) : (
                  <div className="projects__card-image-wrap projects__card-image-wrap--placeholder">
                    <span className="projects__card-image-placeholder-text">{project.title.charAt(0)}</span>
                  </div>
                )}
                
                <div className="projects__card-inner">
                  <h3 className="projects__card-title">{project.title}</h3>
                  
                  {/* Read More Button replaces the full paragraph */}
                  <button 
                    className="projects__card-read-more" 
                    onClick={() => setSelectedProject(project)}
                    aria-label={`Read more about ${project.title}`}
                  >
                    Read More
                  </button>
                  
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

      {/* Description Modal */}
      {selectedProject && (
        <div 
          className="projects__modal-overlay" 
          onClick={() => setSelectedProject(null)} 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="modal-title"
        >
          <div 
            className="projects__modal-content" 
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the box
          >
            <button 
              className="projects__modal-close" 
              onClick={() => setSelectedProject(null)}
              aria-label="Close modal"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {selectedProject.imageUrl && (
              <div className="projects__modal-image-wrap">
                <img src={selectedProject.imageUrl} alt={selectedProject.title} className="projects__modal-image" loading="lazy" />
              </div>
            )}
            
            <div className="projects__modal-body">
              <h3 id="modal-title" className="projects__modal-title">{selectedProject.title}</h3>
              
              <div className="projects__modal-tech">
                {selectedProject.technologies.map((tech, j) => (
                  <span className="projects__modal-tag" key={j}>{tech.name}</span>
                ))}
              </div>

              <div className="projects__modal-desc">
                {selectedProject.description.split('\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>

              <div className="projects__modal-links">
                {selectedProject.liveUrl && (
                  <a href={selectedProject.liveUrl} target="_blank" rel="noopener noreferrer" className="btn" aria-label={`View ${selectedProject.title} live`}>
                     Live Demo
                  </a>
                )}
                {selectedProject.githubUrl && (
                  <a href={selectedProject.githubUrl} target="_blank" rel="noopener noreferrer" className="btn btn--secondary" aria-label={`View ${selectedProject.title} on GitHub`}>
                     Source Code
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
