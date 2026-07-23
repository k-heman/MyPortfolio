import { useState, useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';

import content from '../content/content.json';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import Certificates from './components/Certificates';
import Skills from './components/Skills';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Starfield from './components/Starfield';
import AdminLayout from './admin/AdminLayout';
import AdminLogin from './admin/AdminLogin';
import AdminDashboard from './admin/AdminDashboard';
import ProtectedRoute from './admin/ProtectedRoute';

import Preloader from './components/Preloader';
import { useFirebaseData, type FirebaseData } from './hooks/useFirebaseData';

function Portfolio({ firebaseData }: { firebaseData: FirebaseData }) {
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

  // Merge firebase settings with local content.json
  const homeData = { ...content.home };
  if (firebaseData.settings?.heroTitle) homeData.name = firebaseData.settings.heroTitle;
  if (firebaseData.settings?.heroSubtitle) homeData.titles = firebaseData.settings.heroSubtitle.split(',').map(s => s.trim());
  if (firebaseData.settings?.heroDescription) homeData.tagline = firebaseData.settings.heroDescription;

  const aboutData = { ...content.about };
  if (firebaseData.settings?.aboutHeading) aboutData.title = firebaseData.settings.aboutHeading;
  if (firebaseData.settings?.aboutDescription) aboutData.description = firebaseData.settings.aboutDescription;
  if (firebaseData.settings?.aboutHighlights) aboutData.highlights = firebaseData.settings.aboutHighlights;

  const projectsData = { ...content.projects };
  if (firebaseData.projects.length > 0) projectsData.items = firebaseData.projects as any;

  const skillsData = { ...content.skills };
  if (firebaseData.categories.length > 0) skillsData.categories = firebaseData.categories;
  if (firebaseData.skills.length > 0) skillsData.icons = firebaseData.skills as any;

  return (
    <>
      <Starfield theme={theme} />
      <Header
        navItems={navItems}
        activeSection={activeSection}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <main id="main-content" ref={mainRef}>
        <Hero home={homeData} openToWork={content.global.openToWork} openToWorkText={content.global.openToWorkText} />
        <About about={aboutData} location={content.global.location} />
        <Projects projects={projectsData} />
        <Certificates certificates={firebaseData.certificates} />
        <Skills skills={skillsData} theme={theme} />
        <Contact contact={content.contact} />
      </main>
      <Footer footer={content.footer} navItems={navItems} />
    </>
  );
}

function PortfolioWrapper() {
  const { data, loading, progress, statusText } = useFirebaseData();

  if (loading) {
    return <Preloader progress={progress} statusText={statusText} />;
  }

  return <Portfolio firebaseData={data} />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<PortfolioWrapper />} />
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminLogin />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
