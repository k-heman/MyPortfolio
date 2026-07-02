import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Project, Skill, SkillCategory, SiteContent } from '../types';

export interface FirebaseData {
  settings: SiteContent | null;
  projects: Project[];
  categories: SkillCategory[];
  skills: Skill[];
}

export function useFirebaseData() {
  const [data, setData] = useState<FirebaseData>({
    settings: null,
    projects: [],
    categories: [],
    skills: []
  });
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing system boot...');

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      try {
        // Step 1: Settings
        if (!cancelled) {
          setStatusText('Establishing secure connection to global settings...');
          setProgress(10);
        }
        const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
        const settingsData = settingsDoc.exists() ? settingsDoc.data() as SiteContent : null;

        // Step 2: Projects
        if (!cancelled) {
          setStatusText('Fetching project clusters...');
          setProgress(40);
        }
        const projectsSnap = await getDocs(collection(db, 'projects'));
        
        // Ensure the ID is attached
        const projectsData = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Project[];

        // Step 3: Categories
        if (!cancelled) {
          setStatusText('Resolving category schemas...');
          setProgress(70);
        }
        const categoriesSnap = await getDocs(collection(db, 'categories'));
        const categoriesData = categoriesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as SkillCategory[];

        // Step 4: Skills
        if (!cancelled) {
          setStatusText('Mounting skill nodes...');
          setProgress(90);
        }
        const skillsSnap = await getDocs(collection(db, 'skills'));
        const skillsData = skillsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Skill[];

        if (!cancelled) {
          setData({
            settings: settingsData,
            projects: projectsData,
            categories: categoriesData,
            skills: skillsData,
          });
          setStatusText('Boot sequence complete. Launching UI...');
          setProgress(100);
          
          // Add a slight delay to let user see 100%
          setTimeout(() => {
            if (!cancelled) setLoading(false);
          }, 800);
        }
      } catch (err) {
        console.error('Failed to fetch Firebase data:', err);
        if (!cancelled) {
          setStatusText('System error detected. Falling back to local cache...');
          setProgress(100);
          setTimeout(() => {
            if (!cancelled) setLoading(false);
          }, 1200);
        }
      }
    }

    fetchAll();

    return () => { cancelled = true; };
  }, []);

  return { data, loading, progress, statusText };
}
