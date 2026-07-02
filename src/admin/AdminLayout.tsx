import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

/**
 * Forces the dark theme on all admin routes.
 * The portfolio sets data-theme via localStorage, but admin pages
 * always render in dark mode for a consistent admin aesthetic.
 * Restores the previous theme when navigating away.
 */
export default function AdminLayout() {
  useEffect(() => {
    const prev = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', 'dark');

    return () => {
      if (prev) {
        document.documentElement.setAttribute('data-theme', prev);
      }
    };
  }, []);

  return <Outlet />;
}
