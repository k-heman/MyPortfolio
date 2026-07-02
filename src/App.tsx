import { useState, useEffect, useRef } from 'react';

import content from '../content/content.json';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import Skills from './components/Skills';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Starfield from './components/Starfield';

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  const [activeSection, setActiveSection] = useState('home');
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  useEffect(() => {
    const sections = document.querySelectorAll('section[id]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const navItems = content.global.navItems.map((item) => ({
    ...item,
    href: item.href === '/' ? '#home' : `#${item.href.replace('/', '')}`,
  }));

  return (
    <>
      <Starfield theme={theme} />
      <Header
        navItems={navItems}
        activeSection={activeSection}
        theme={theme}
        toggleTheme={toggleTheme}
        label={content.header.home.label}
      />
      <main id="main-content" ref={mainRef}>
        <Hero home={content.home} openToWork={content.global.openToWork} openToWorkText={content.global.openToWorkText} />
        <About about={content.about} location={content.global.location} />
        <Projects projects={content.projects} />
        <Skills skills={content.skills} />
        <Contact contact={content.contact} />
      </main>
      <Footer footer={content.footer} navItems={navItems} />
    </>
  );
}

export default App;
