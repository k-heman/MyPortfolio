/* =============================================================
   Firestore Data Interfaces
   Maps to Firestore collections: "projects" and "skills"
   ============================================================= */

/** A single technology tag on a project card. */
export interface Technology {
  class: string;
  name: string;
}

/**
 * A project document stored in Firestore's `projects` collection.
 * Fields mirror the existing content.json shape so the UI renders
 * identically whether data comes from JSON or Firestore.
 */
export interface Project {
  id?: string;
  title: string;
  startDate: string;
  description: string;
  technologies: Technology[];
  url: string;
  liveUrl?: string;
  githubUrl?: string;
  thumbnail?: string;
  imageUrl?: string;
}

/**
 * A skill document stored in Firestore's `skills` collection.
 * Each document represents a single skill with its proficiency.
 */
export interface Skill {
  id?: string;
  name: string;
  class: string;
  level: string;
  category: string;
  skillTags?: string;
}

/** A skill category tab used for filtering the skills grid. */
export interface SkillCategory {
  id?: string;
  title: string;
  icon: string;
  categoryKey: string;
}

/** Section-level metadata passed alongside project items. */
export interface ProjectsSection {
  title: string;
  label: string;
  items: Project[];
  ctaText: string;
}

/** Section-level metadata passed alongside skill items. */
export interface SkillsSection {
  title: string;
  label: string;
  tagline: string;
  marquee: string[];
  categories: SkillCategory[];
  icons: Skill[];
}

/**
 * A contact message document stored in Firestore's `messages` collection.
 */
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: any; // Using any for Firebase Timestamp flexibility
}

export interface AboutHighlight {
  icon: string;
  title: string;
  sub: string;
}

export interface HeroBadge {
  text: string;
  enabled: boolean;
}

/**
 * Global site content stored in Firestore's `settings/global` document.
 */
export interface SiteContent {
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  aboutHeading: string;
  aboutDescription: string;
  aboutHighlights?: AboutHighlight[];
  heroBadge?: HeroBadge;
}

/**
 * Certificate item for Admin Panel management UI.
 */
export interface Certificate {
  id?: string;
  title: string;
  imageUrl: string;
  displayOrder: number;
  status: 'Published' | 'Draft' | 'published' | 'draft';
  createdAt?: string | number | any;
  updatedAt?: string | number | any;
}




