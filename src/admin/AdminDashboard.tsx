import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, getDocs, doc, setDoc, getDoc, query, orderBy, deleteDoc } from 'firebase/firestore';
import { Icon } from '@iconify/react';

import { auth, db } from '../config/firebase';
import CertificatesManager from './CertificatesManager';
import contentData from '../../content/content.json';

import type { User } from 'firebase/auth';
import type { Project, Skill, Technology, ContactMessage, SiteContent, SkillCategory, AboutHighlight } from '../types';

import './AdminDashboard.scss';

type ActiveTab = 'dashboard' | 'projects' | 'skills' | 'messages' | 'settings' | 'categories' | 'certificates';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  
  // UI Feedback state
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Firestore lists
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  
  // Stats
  const [projectCount, setProjectCount] = useState<number | string>('—');
  const [skillCount, setSkillCount] = useState<number | string>('—');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Editing states
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);

  // Add/Edit Category state
  const [newCategoryName, setNewCategoryName] = useState('');

  // Settings state
  const [settings, setSettings] = useState<SiteContent>({
    heroTitle: contentData.home.name,
    heroSubtitle: contentData.home.titles.join(', '),
    heroDescription: contentData.home.tagline,
    aboutHeading: contentData.about.title,
    aboutDescription: contentData.about.description,
    aboutHighlights: contentData.about.highlights.map(h => ({ icon: h.icon, title: h.title, sub: h.sub })),
    heroBadge: {
      text: contentData.global.openToWorkText || "🚀 Building Real-World Software • Open to Freelance Projects • AI Enthusiast",
      enabled: contentData.global.openToWork ?? true,
    }
  });

  // Project form state
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectTechStack, setProjectTechStack] = useState('');
  const [projectImageUrl, setProjectImageUrl] = useState('');
  const [projectLiveUrl, setProjectLiveUrl] = useState('');
  const [projectGithubUrl, setProjectGithubUrl] = useState('');

  // Skill form state
  const [skillName, setSkillName] = useState('');
  const [skillClass, setSkillClass] = useState('');
  const [skillCategory, setSkillCategory] = useState('');
  const [skillLevel, setSkillLevel] = useState('50');
  const [skillTags, setSkillTags] = useState('');

  const handleSkillNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSkillName(val);
    setSkillClass(`logos:${val.toLowerCase().replace(/\s+/g, '-')}`);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Fetch initial stats, projects, skills, categories, and auto-seed if necessary
  const loadInitialData = async () => {
    try {
      const pSnap = await getDocs(collection(db, 'projects'));
      const fetchedProjects = pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[];
      setProjects(fetchedProjects);
      setProjectCount(pSnap.size);
      
      const sSnap = await getDocs(collection(db, 'skills'));
      const fetchedSkills = sSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Skill[];
      setSkills(fetchedSkills);
      setSkillCount(sSnap.size);

      const cSnap = await getDocs(collection(db, 'categories'));
      const fetchedCats = cSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SkillCategory[];
      setCategories(fetchedCats);

      // Auto-seed check
      if (sSnap.empty && cSnap.empty) {
        console.log("Database is empty. Seeding defaults from content.json...");
        
        // Seed categories
        const newCats = [];
        for (const cat of contentData.skills.categories) {
          const docRef = await addDoc(collection(db, 'categories'), {
            title: cat.title,
            categoryKey: cat.categoryKey,
            icon: cat.icon
          });
          newCats.push({ id: docRef.id, title: cat.title, categoryKey: cat.categoryKey, icon: cat.icon });
        }
        setCategories(newCats);

        // Seed skills
        const seededSkills: Skill[] = [];
        for (const skill of contentData.skills.icons) {
          const docRef = await addDoc(collection(db, 'skills'), {
            name: skill.name,
            category: skill.category,
            level: skill.level,
            class: skill.class
          });
          seededSkills.push({ id: docRef.id, name: skill.name, category: skill.category, level: skill.level, class: skill.class });
        }
        setSkills(seededSkills);
        setSkillCount(contentData.skills.icons.length);
        showFeedback('Database automatically seeded with default data!', 'success');
      }

    } catch (err) {
      console.error('Error initializing data:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Make sure Add Skill category defaults to the first available category if it exists
  useEffect(() => {
    if (categories.length > 0 && !skillCategory) {
      setSkillCategory(categories[0].categoryKey);
    }
  }, [categories, skillCategory]);

  // Fetch messages if activeTab is messages
  useEffect(() => {
    if (activeTab === 'messages') {
      fetchMessages();
    }
  }, [activeTab]);

  const fetchMessages = async () => {
    setIsLoadingMessages(true);
    try {
      const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedMessages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ContactMessage[];
      setMessages(fetchedMessages);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Fetch settings if settings tab is active
  useEffect(() => {
    if (activeTab === 'settings') {
      const fetchSettings = async () => {
        try {
          const docRef = doc(db, 'settings', 'global');
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data() as SiteContent;
            setSettings({
              ...settings,
              ...data,
              // Backup defaults if highlights/heroBadge didn't exist in document yet
              aboutHighlights: data.aboutHighlights || settings.aboutHighlights,
              heroBadge: data.heroBadge || settings.heroBadge,
            });
          } else {
            await setDoc(docRef, settings, { merge: true });
          }
        } catch (err) {
          console.error("Error fetching settings:", err);
        }
      };
      fetchSettings();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/');
  };

  const showFeedback = (message: string, type: 'success' | 'error') => {
    setFeedbackMessage(message);
    setFeedbackType(type);
    setTimeout(() => {
      setFeedbackType('');
    }, 4000);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setIsSubmitting(true);
    try {
      const categoryKey = newCategoryName.trim();
      const newCat = {
        title: categoryKey,
        categoryKey: categoryKey.toLowerCase().replace(/\s+/g, '-'),
        icon: 'mdi:code-tags' // Default fallback icon
      };
      const docRef = await addDoc(collection(db, 'categories'), newCat);
      setCategories([...categories, { id: docRef.id, ...newCat }]);
      setNewCategoryName('');
      showFeedback('Category added successfully!', 'success');
    } catch (err) {
      console.error("Error adding category:", err);
      showFeedback('Failed to add category.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      setCategories(categories.filter(c => c.id !== id));
      showFeedback('Category deleted.', 'success');
    } catch (err) {
      console.error("Error deleting category:", err);
      showFeedback('Failed to delete category.', 'error');
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const technologies: Technology[] = projectTechStack
        .split(',')
        .map(tech => tech.trim())
        .filter(tech => tech.length > 0)
        .map(tech => ({ name: tech, class: `icon-${tech.toLowerCase().replace(/\s+/g, '-')}` }));

      if (editingProject) {
        // Edit mode
        const updatedProject: Project = {
          id: editingProject.id,
          title: projectTitle,
          description: projectDescription,
          technologies,
          url: projectLiveUrl,
          liveUrl: projectLiveUrl,
          githubUrl: projectGithubUrl,
          imageUrl: projectImageUrl,
          startDate: editingProject.startDate || new Date().getFullYear().toString(),
        };

        await setDoc(doc(db, 'projects', editingProject.id!), updatedProject);
        setProjects(projects.map(p => p.id === editingProject.id ? updatedProject : p));
        showFeedback('Project updated successfully!', 'success');
        setEditingProject(null);
      } else {
        // Create mode
        const newProject: Omit<Project, 'id'> = {
          title: projectTitle,
          description: projectDescription,
          technologies,
          url: projectLiveUrl,
          liveUrl: projectLiveUrl,
          githubUrl: projectGithubUrl,
          imageUrl: projectImageUrl,
          startDate: new Date().getFullYear().toString(),
        };

        const docRef = await addDoc(collection(db, 'projects'), newProject);
        setProjects([...projects, { id: docRef.id, ...newProject }]);
        showFeedback('Project added successfully!', 'success');
        setProjectCount(prev => typeof prev === 'number' ? prev + 1 : prev);
      }

      // Reset fields
      setProjectTitle(''); setProjectDescription(''); setProjectTechStack(''); setProjectImageUrl(''); setProjectLiveUrl(''); setProjectGithubUrl('');
    } catch (err) {
      console.error("Error saving project: ", err);
      showFeedback('Failed to save project.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProjectClick = (project: Project) => {
    setEditingProject(project);
    setProjectTitle(project.title);
    setProjectDescription(project.description);
    setProjectTechStack(project.technologies.map(t => t.name).join(', '));
    setProjectImageUrl(project.imageUrl || '');
    setProjectLiveUrl(project.liveUrl || '');
    setProjectGithubUrl(project.githubUrl || '');
    
    // Scroll down to form
    const formElement = document.getElementById('project-form');
    formElement?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await deleteDoc(doc(db, 'projects', id));
      setProjects(projects.filter(p => p.id !== id));
      setProjectCount(prev => typeof prev === 'number' ? prev - 1 : prev);
      showFeedback('Project deleted.', 'success');
      if (editingProject?.id === id) {
        setEditingProject(null);
        setProjectTitle(''); setProjectDescription(''); setProjectTechStack(''); setProjectImageUrl(''); setProjectLiveUrl(''); setProjectGithubUrl('');
      }
    } catch (err) {
      console.error("Error deleting project: ", err);
      showFeedback('Failed to delete project.', 'error');
    }
  };

  const handleCancelProjectEdit = () => {
    setEditingProject(null);
    setProjectTitle(''); setProjectDescription(''); setProjectTechStack(''); setProjectImageUrl(''); setProjectLiveUrl(''); setProjectGithubUrl('');
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingSkill) {
        // Edit mode
        const updatedSkill: Skill = {
          id: editingSkill.id,
          name: skillName,
          category: skillCategory,
          level: skillLevel,
          class: skillClass || `logos:${skillName.toLowerCase().replace(/\s+/g, '-')}`,
          skillTags: skillTags,
        };

        await setDoc(doc(db, 'skills', editingSkill.id!), updatedSkill);
        setSkills(skills.map(s => s.id === editingSkill.id ? updatedSkill : s));
        showFeedback('Skill updated successfully!', 'success');
        setEditingSkill(null);
      } else {
        // Create mode
        const newSkill: Omit<Skill, 'id'> = {
          name: skillName,
          category: skillCategory,
          level: skillLevel,
          class: skillClass || `logos:${skillName.toLowerCase().replace(/\s+/g, '-')}`,
          skillTags: skillTags,
        };
        const docRef = await addDoc(collection(db, 'skills'), newSkill);
        setSkills([...skills, { id: docRef.id, ...newSkill }]);
        showFeedback('Skill added successfully!', 'success');
        setSkillCount(prev => typeof prev === 'number' ? prev + 1 : prev);
      }

      setSkillName(''); 
      setSkillClass('');
      if (categories.length > 0) setSkillCategory(categories[0].categoryKey);
      setSkillLevel('50');
      setSkillTags('');
    } catch (err) {
      console.error("Error saving skill: ", err);
      showFeedback('Failed to save skill.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSkillClick = (skill: Skill) => {
    setEditingSkill(skill);
    setSkillName(skill.name);
    setSkillClass(skill.class || `logos:${skill.name.toLowerCase().replace(/\s+/g, '-')}`);
    setSkillCategory(skill.category);
    setSkillLevel(skill.level);
    setSkillTags(skill.skillTags || '');

    // Scroll down to form
    const formElement = document.getElementById('skill-form');
    formElement?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteSkill = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this skill?")) return;
    try {
      await deleteDoc(doc(db, 'skills', id));
      setSkills(skills.filter(s => s.id !== id));
      setSkillCount(prev => typeof prev === 'number' ? prev - 1 : prev);
      showFeedback('Skill deleted.', 'success');
      if (editingSkill?.id === id) {
        setEditingSkill(null);
        setSkillName(''); setSkillClass(''); setSkillLevel('50'); setSkillTags('');
      }
    } catch (err) {
      console.error("Error deleting skill: ", err);
      showFeedback('Failed to delete skill.', 'error');
    }
  };

  const handleCancelSkillEdit = () => {
    setEditingSkill(null);
    setSkillName(''); 
    setSkillClass('');
    if (categories.length > 0) setSkillCategory(categories[0].categoryKey);
    setSkillLevel('50');
    setSkillTags('');
  };

  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      await deleteDoc(doc(db, 'messages', id));
      setMessages(messages.filter(msg => msg.id !== id));
      showFeedback('Message deleted.', 'success');
    } catch (err) {
      console.error("Error deleting message:", err);
      showFeedback('Failed to delete message.', 'error');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), settings, { merge: true });
      showFeedback('Settings saved successfully!', 'success');
    } catch (err) {
      console.error("Error saving settings:", err);
      showFeedback('Failed to save settings.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'A';
  const userEmail = user?.email || 'admin@portfolio';

  const statCards = [
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ),
      label: 'Projects',
      value: projectCount,
      sub: 'In Firestore',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
      label: 'Skills',
      value: skillCount,
      sub: 'In Firestore',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      ),
      label: 'Messages',
      value: messages.length || '—',
      sub: 'In Inbox',
    },
  ];

  return (
    <div className="admin-dashboard">
      <aside className="admin-dashboard__sidebar">
        <div className="admin-dashboard__sidebar-top">
          <a href="/" className="admin-dashboard__logo">
            <img src="/hemanlogo.png" alt="HK Logo" className="admin-dashboard__logo-img" />
          </a>
          <span className="admin-dashboard__logo-label">Admin</span>
        </div>

        <nav className="admin-dashboard__nav">
          <button 
            type="button"
            className={`admin-dashboard__nav-item ${activeTab === 'dashboard' ? 'admin-dashboard__nav-item--active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Dashboard
          </button>
          <button 
            type="button"
            className={`admin-dashboard__nav-item ${activeTab === 'projects' ? 'admin-dashboard__nav-item--active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            Projects
          </button>
          <button 
            type="button"
            className={`admin-dashboard__nav-item ${activeTab === 'skills' ? 'admin-dashboard__nav-item--active' : ''}`}
            onClick={() => setActiveTab('skills')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Skills
          </button>
          <button 
            type="button"
            className={`admin-dashboard__nav-item ${activeTab === 'categories' ? 'admin-dashboard__nav-item--active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            Categories
          </button>
          <button 
            type="button"
            className={`admin-dashboard__nav-item ${activeTab === 'certificates' ? 'admin-dashboard__nav-item--active' : ''}`}
            onClick={() => setActiveTab('certificates')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="7" />
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
            </svg>
            Certificates
          </button>
          <button 
            type="button"
            className={`admin-dashboard__nav-item ${activeTab === 'messages' ? 'admin-dashboard__nav-item--active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Messages
          </button>
          <button 
            type="button"
            className={`admin-dashboard__nav-item ${activeTab === 'settings' ? 'admin-dashboard__nav-item--active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Site Settings
          </button>
        </nav>

        <div className="admin-dashboard__sidebar-bottom">
          <div className="admin-dashboard__user">
            <div className="admin-dashboard__avatar">{userInitial}</div>
            <div className="admin-dashboard__user-info">
              <span className="admin-dashboard__user-name">Admin</span>
              <span className="admin-dashboard__user-email">{userEmail}</span>
            </div>
          </div>
          <button type="button" className="admin-dashboard__signout" onClick={handleSignOut}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      <div className="admin-dashboard__main">
        <header className="admin-dashboard__header">
          <div>
            <h1 className="admin-dashboard__title">
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'projects' && 'Manage Projects'}
              {activeTab === 'skills' && 'Manage Skills'}
              {activeTab === 'categories' && 'Manage Categories'}
              {activeTab === 'certificates' && 'Certificates'}
              {activeTab === 'messages' && 'Messages'}
              {activeTab === 'settings' && 'Site Settings'}
            </h1>
            <p className="admin-dashboard__title-sub">
              {activeTab === 'dashboard' && "Welcome back — here's your portfolio overview"}
              {activeTab === 'projects' && "Edit, delete or create project entries in Firestore"}
              {activeTab === 'skills' && "Edit, delete or create skill entries in Firestore"}
              {activeTab === 'categories' && "Manage skill categories"}
              {activeTab === 'certificates' && "Manage your professional certifications and credentials"}
              {activeTab === 'messages' && "Read and delete messages submitted through the contact form"}
              {activeTab === 'settings' && "Manage dynamic global content and highlight cards"}
            </p>
          </div>
          <button type="button" className="admin-dashboard__header-signout" onClick={handleSignOut}>
            Logout
          </button>
        </header>

        <section className="admin-dashboard__content">
          <div className={`admin-dashboard__toast ${feedbackType ? `admin-dashboard__toast--show admin-dashboard__toast--${feedbackType}` : ''}`}>
            {feedbackType === 'success' && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            )}
            {feedbackType === 'error' && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            <span>{feedbackMessage}</span>
          </div>

          {activeTab === 'dashboard' && (
            <>
              <div className="admin-dashboard__stats">
                {statCards.map((card) => (
                  <div key={card.label} className="admin-dashboard__stat-card">
                    <div className="admin-dashboard__stat-icon">{card.icon}</div>
                    <div className="admin-dashboard__stat-body">
                      <span className="admin-dashboard__stat-value">{card.value}</span>
                      <span className="admin-dashboard__stat-label">{card.label}</span>
                    </div>
                    <span className="admin-dashboard__stat-sub">{card.sub}</span>
                  </div>
                ))}
              </div>
              <div className="admin-dashboard__welcome">
                <div className="admin-dashboard__welcome-accent" aria-hidden="true" />
                <div className="admin-dashboard__welcome-body">
                  <div className="admin-dashboard__welcome-icon" aria-hidden="true">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                  </div>
                  <h2 className="admin-dashboard__welcome-title">Command Center Ready</h2>
                  <p className="admin-dashboard__welcome-text">
                    Use the sidebar tabs to edit your about highlights, update projects or skills, delete messages, and configure settings.
                  </p>
                  <div className="admin-dashboard__welcome-tags">
                    <span className="admin-dashboard__tag admin-dashboard__tag--ok">
                      <span className="admin-dashboard__tag-dot" />
                      Firebase Connected
                    </span>
                    <span className="admin-dashboard__tag">Auth Active</span>
                    <span className="admin-dashboard__tag">Firestore Ready</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'categories' && (
            <div className="admin-dashboard__form-card">
              <div className="admin-dashboard__form-accent" />
              <form onSubmit={handleAddCategory} className="admin-dashboard__form" style={{ marginBottom: '32px' }}>
                <h3 className="admin-dashboard__form-section-title">Add Category</h3>
                <div className="admin-dashboard__form-group">
                  <label htmlFor="newCategoryName">Category Name</label>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <input 
                      id="newCategoryName" 
                      type="text" 
                      value={newCategoryName} 
                      onChange={(e) => setNewCategoryName(e.target.value)} 
                      placeholder="e.g. Mobile Development" 
                      style={{ flex: 1 }}
                    />
                    <button type="submit" className="admin-dashboard__submit-btn" disabled={isSubmitting} style={{ width: 'auto', marginTop: 0 }}>
                      Add
                    </button>
                  </div>
                </div>
              </form>

              <h3 className="admin-dashboard__form-section-title">Existing Categories</h3>
              {categories.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No categories found.</p>
              ) : (
                <div className="admin-dashboard__list">
                  {categories.map(cat => (
                    <div key={cat.id} className="admin-dashboard__list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', marginBottom: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{cat.title}</span>
                      <button 
                        type="button" 
                        onClick={() => cat.id && handleDeleteCategory(cat.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--status-error)', cursor: 'pointer', padding: '8px', borderRadius: '4px' }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'certificates' && <CertificatesManager />}

          {activeTab === 'messages' && (
            <div className="admin-dashboard__messages">
              {isLoadingMessages ? (
                <div className="admin-dashboard__loading">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="admin-dashboard__empty">No messages yet.</div>
              ) : (
                <div className="admin-dashboard__messages-grid">
                  {messages.map(msg => (
                    <div key={msg.id} className="admin-dashboard__message-card" style={{ position: 'relative' }}>
                      <button 
                        type="button" 
                        onClick={() => msg.id && handleDeleteMessage(msg.id)}
                        style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--status-error)', cursor: 'pointer', padding: '6px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        aria-label="Delete message"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                      <div className="admin-dashboard__message-header" style={{ paddingRight: '36px' }}>
                        <div className="admin-dashboard__message-author">
                          <span className="admin-dashboard__message-name">{msg.name}</span>
                          <span className="admin-dashboard__message-email">{msg.email}</span>
                        </div>
                        <span className="admin-dashboard__message-date">
                          {msg.createdAt?.toDate ? new Date(msg.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                        </span>
                      </div>
                      <p className="admin-dashboard__message-body">{msg.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="admin-dashboard__form-card">
              <div className="admin-dashboard__form-accent" />
              <form onSubmit={handleSaveSettings} className="admin-dashboard__form">
                <h3 className="admin-dashboard__form-section-title">Hero Section</h3>
                <div className="admin-dashboard__form-group">
                  <label htmlFor="heroTitle">Hero Title</label>
                  <input
                    id="heroTitle"
                    type="text"
                    required
                    value={settings.heroTitle}
                    onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                  />
                </div>
                <div className="admin-dashboard__form-group">
                  <label htmlFor="heroSubtitle">Hero Subtitles <span>(comma separated)</span></label>
                  <input
                    id="heroSubtitle"
                    type="text"
                    required
                    value={settings.heroSubtitle}
                    onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                  />
                </div>
                <div className="admin-dashboard__form-group">
                  <label htmlFor="heroDescription">Hero Tagline/Description</label>
                  <textarea
                    id="heroDescription"
                    required
                    rows={4}
                    value={settings.heroDescription}
                    onChange={(e) => setSettings({ ...settings, heroDescription: e.target.value })}
                  />
                </div>

                <h3 className="admin-dashboard__form-section-title">Hero Badge</h3>
                <div className="admin-dashboard__form-group">
                  <label htmlFor="heroBadgeText">Hero Badge Text</label>
                  <textarea
                    id="heroBadgeText"
                    rows={3}
                    required
                    value={settings.heroBadge?.text ?? ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        heroBadge: {
                          text: e.target.value,
                          enabled: settings.heroBadge?.enabled ?? true,
                        },
                      })
                    }
                    placeholder="🚀 Building Real-World Software • Open to Freelance Projects • AI Enthusiast"
                  />
                </div>
                <div className="admin-dashboard__form-group">
                  <label htmlFor="heroBadgeEnabled" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input
                      id="heroBadgeEnabled"
                      type="checkbox"
                      checked={settings.heroBadge?.enabled ?? true}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          heroBadge: {
                            text: settings.heroBadge?.text ?? '',
                            enabled: e.target.checked,
                          },
                        })
                      }
                      style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                    />
                    <span>Enable Badge (Display pill-shaped badge in Hero section)</span>
                  </label>
                </div>
                
                <h3 className="admin-dashboard__form-section-title">About Section</h3>
                <div className="admin-dashboard__form-group">
                  <label htmlFor="aboutHeading">About Heading</label>
                  <input
                    id="aboutHeading"
                    type="text"
                    required
                    value={settings.aboutHeading}
                    onChange={(e) => setSettings({ ...settings, aboutHeading: e.target.value })}
                  />
                </div>
                <div className="admin-dashboard__form-group">
                  <label htmlFor="aboutDescription">About Description <span>(HTML supported)</span></label>
                  <textarea
                    id="aboutDescription"
                    required
                    rows={6}
                    value={settings.aboutDescription}
                    onChange={(e) => setSettings({ ...settings, aboutDescription: e.target.value })}
                  />
                </div>

                <h3 className="admin-dashboard__form-section-title">About Section Highlights</h3>
                {settings.aboutHighlights?.map((highlight, index) => (
                  <div key={index} className="admin-dashboard__highlight-editor" style={{ marginBottom: '20px', borderLeft: '3px solid var(--accent-primary)', paddingLeft: '16px' }}>
                    <h4 style={{ fontSize: 'var(--fs-body-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Highlight Card #{index + 1}</h4>
                    <div className="admin-dashboard__form-group">
                      <label htmlFor={`highlight-icon-${index}`}>Card Icon Class</label>
                      <input
                        id={`highlight-icon-${index}`}
                        type="text"
                        required
                        value={highlight.icon}
                        onChange={(e) => {
                          const updated = [...(settings.aboutHighlights || [])];
                          updated[index] = { ...updated[index], icon: e.target.value };
                          setSettings({ ...settings, aboutHighlights: updated });
                        }}
                      />
                    </div>
                    <div className="admin-dashboard__form-group">
                      <label htmlFor={`highlight-title-${index}`}>Card Title</label>
                      <input
                        id={`highlight-title-${index}`}
                        type="text"
                        required
                        value={highlight.title}
                        onChange={(e) => {
                          const updated = [...(settings.aboutHighlights || [])];
                          updated[index] = { ...updated[index], title: e.target.value };
                          setSettings({ ...settings, aboutHighlights: updated });
                        }}
                      />
                    </div>
                    <div className="admin-dashboard__form-group">
                      <label htmlFor={`highlight-sub-${index}`}>Card Description</label>
                      <textarea
                        id={`highlight-sub-${index}`}
                        required
                        rows={2}
                        value={highlight.sub}
                        onChange={(e) => {
                          const updated = [...(settings.aboutHighlights || [])];
                          updated[index] = { ...updated[index], sub: e.target.value };
                          setSettings({ ...settings, aboutHighlights: updated });
                        }}
                      />
                    </div>
                  </div>
                ))}

                <button type="submit" className="admin-dashboard__submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? <span className="admin-dashboard__spinner" /> : 'Save Settings'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="admin-dashboard__manage-section">
              {/* Existing Projects List */}
              <div className="admin-dashboard__list-card" style={{ marginBottom: '32px', padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)' }}>
                <h3 className="admin-dashboard__form-section-title" style={{ marginTop: 0 }}>Existing Projects</h3>
                {projects.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No projects found in database.</p>
                ) : (
                  <div className="admin-dashboard__list" style={{ display: 'grid', gap: '12px' }}>
                    {projects.map(project => (
                      <div key={project.id} className="admin-dashboard__list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--card-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{project.title}</span>
                          <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>{project.technologies.map(t => t.name).join(', ')}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            type="button" 
                            className="btn btn--secondary" 
                            style={{ padding: '6px 12px', fontSize: 'var(--fs-2xs)', minHeight: 'auto' }}
                            onClick={() => handleEditProjectClick(project)}
                          >
                            Edit
                          </button>
                          <button 
                            type="button" 
                            className="btn" 
                            style={{ padding: '6px 12px', fontSize: 'var(--fs-2xs)', minHeight: 'auto', background: 'var(--status-error-bg)', color: 'var(--status-error)', border: '1px solid var(--status-error)' }}
                            onClick={() => project.id && handleDeleteProject(project.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add/Edit Project Form */}
              <div id="project-form" className="admin-dashboard__form-card">
                <div className="admin-dashboard__form-accent" />
                <form onSubmit={handleAddProject} className="admin-dashboard__form">
                  <h3 className="admin-dashboard__form-section-title" style={{ marginTop: 0 }}>
                    {editingProject ? `Edit Project: ${editingProject.title}` : 'Add Project'}
                  </h3>
                  <div className="admin-dashboard__form-group">
                    <label htmlFor="projectTitle">Title</label>
                    <input id="projectTitle" type="text" required value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="e.g. E-Commerce Platform" />
                  </div>
                  <div className="admin-dashboard__form-group">
                    <label htmlFor="projectDescription">Description</label>
                    <textarea id="projectDescription" required rows={4} value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} placeholder="Describe your project..." />
                  </div>
                  <div className="admin-dashboard__form-group">
                    <label htmlFor="projectTechStack">Tech Stack <span>(comma separated)</span></label>
                    <input id="projectTechStack" type="text" required value={projectTechStack} onChange={(e) => setProjectTechStack(e.target.value)} placeholder="e.g. React, Node.js, Firebase" />
                  </div>
                  <div className="admin-dashboard__form-group">
                    <label htmlFor="projectImageUrl">Project Image URL (Cloudinary) <span>(optional)</span></label>
                    <input id="projectImageUrl" type="url" value={projectImageUrl} onChange={(e) => setProjectImageUrl(e.target.value)} placeholder="https://res.cloudinary.com/..." />
                  </div>
                  <div className="admin-dashboard__form-row">
                    <div className="admin-dashboard__form-group">
                      <label htmlFor="projectLiveUrl">Live URL <span>(optional)</span></label>
                      <input id="projectLiveUrl" type="url" value={projectLiveUrl} onChange={(e) => setProjectLiveUrl(e.target.value)} placeholder="https://my-project.com" />
                    </div>
                    <div className="admin-dashboard__form-group">
                      <label htmlFor="projectGithubUrl">GitHub URL <span>(optional)</span></label>
                      <input id="projectGithubUrl" type="url" value={projectGithubUrl} onChange={(e) => setProjectGithubUrl(e.target.value)} placeholder="https://github.com/myusername/project" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="submit" className="admin-dashboard__submit-btn" disabled={isSubmitting} style={{ flex: 1 }}>
                      {isSubmitting ? <span className="admin-dashboard__spinner" /> : (editingProject ? 'Save Changes' : 'Add Project')}
                    </button>
                    {editingProject && (
                      <button type="button" className="btn btn--secondary" onClick={handleCancelProjectEdit} style={{ marginTop: '16px', minHeight: 'auto', padding: '12px' }}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="admin-dashboard__manage-section">
              {/* Existing Skills List */}
              <div className="admin-dashboard__list-card" style={{ marginBottom: '32px', padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)' }}>
                <h3 className="admin-dashboard__form-section-title" style={{ marginTop: 0 }}>Existing Skills</h3>
                {skills.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No skills found in database.</p>
                ) : (
                  <div className="admin-dashboard__list" style={{ display: 'grid', gap: '12px' }}>
                    {skills.map(skill => (
                      <div key={skill.id} className="admin-dashboard__list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--card-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{skill.name}</span>
                          <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>Category: {skill.category} | Level: {skill.level}%</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            type="button" 
                            className="btn btn--secondary" 
                            style={{ padding: '6px 12px', fontSize: 'var(--fs-2xs)', minHeight: 'auto' }}
                            onClick={() => handleEditSkillClick(skill)}
                          >
                            Edit
                          </button>
                          <button 
                            type="button" 
                            className="btn" 
                            style={{ padding: '6px 12px', fontSize: 'var(--fs-2xs)', minHeight: 'auto', background: 'var(--status-error-bg)', color: 'var(--status-error)', border: '1px solid var(--status-error)' }}
                            onClick={() => skill.id && handleDeleteSkill(skill.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add/Edit Skill Form */}
              <div id="skill-form" className="admin-dashboard__form-card">
                <div className="admin-dashboard__form-accent" />
                <form onSubmit={handleAddSkill} className="admin-dashboard__form">
                  <h3 className="admin-dashboard__form-section-title" style={{ marginTop: 0 }}>
                    {editingSkill ? `Edit Skill: ${editingSkill.name}` : 'Add Skill'}
                  </h3>
                  <div className="admin-dashboard__form-group">
                    <label htmlFor="skillName">Skill Name</label>
                    <input id="skillName" type="text" required value={skillName} onChange={handleSkillNameChange} placeholder="e.g. React" />
                  </div>
                  <div className="admin-dashboard__form-group">
                    <label htmlFor="skillClass">Logo (Iconify ID)</label>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <input id="skillClass" type="text" required value={skillClass} onChange={(e) => setSkillClass(e.target.value)} placeholder="e.g. logos:react" style={{ flex: 1 }} />
                      <div style={{ padding: '8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'grid', placeItems: 'center', minWidth: '42px', minHeight: '42px' }}>
                        {skillClass ? <Icon icon={skillClass} width="24" height="24" /> : <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>No Icon</span>}
                      </div>
                    </div>
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>Suggested automatically. You can find more icons at <a href="https://icon-sets.iconify.design/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)' }}>Iconify</a>.</small>
                  </div>
                  <div className="admin-dashboard__form-group">
                    <label htmlFor="skillCategory">Category</label>
                    <div className="admin-dashboard__select-wrapper">
                      <select id="skillCategory" value={skillCategory} onChange={(e) => setSkillCategory(e.target.value)} required>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.categoryKey}>{cat.title}</option>
                        ))}
                        {categories.length === 0 && <option value="">No categories available</option>}
                      </select>
                    </div>
                  </div>
                  <div className="admin-dashboard__form-group">
                    <label htmlFor="skillLevel">Proficiency Level: <span className="admin-dashboard__slider-val">{skillLevel}%</span></label>
                    <input id="skillLevel" type="range" min="1" max="100" value={skillLevel} onChange={(e) => setSkillLevel(e.target.value)} className="admin-dashboard__slider" />
                  </div>
                  <div className="admin-dashboard__form-group">
                    <label htmlFor="skillTags">Skill Tags <span>(comma-separated, e.g., Hooks, API Integration, State Management)</span></label>
                    <input id="skillTags" type="text" value={skillTags} onChange={(e) => setSkillTags(e.target.value)} placeholder="e.g., Hooks, API Integration, State Management" />
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="submit" className="admin-dashboard__submit-btn" disabled={isSubmitting || categories.length === 0} style={{ flex: 1 }}>
                      {isSubmitting ? <span className="admin-dashboard__spinner" /> : (editingSkill ? 'Save Changes' : 'Add Skill')}
                    </button>
                    {editingSkill && (
                      <button type="button" className="btn btn--secondary" onClick={handleCancelSkillEdit} style={{ marginTop: '16px', minHeight: 'auto', padding: '12px' }}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
