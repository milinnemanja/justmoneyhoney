import React, { useState, useEffect, useCallback } from 'react';
import PublicBlog from './pages/PublicBlog';
import AdminPortal from './pages/AdminPortal';

export default function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname || '/');
  const [publicData, setPublicData] = useState({
    posts: [],
    categories: [],
    authors: [],
  });

  const loadPublicBootstrap = useCallback(async () => {
    try {
      const res = await fetch('/api/public/bootstrap');
      if (res.ok) {
        const data = await res.json();
        setPublicData({
          posts: data.posts || [],
          categories: data.categories || [],
          authors: data.authors || [],
        });
      }
    } catch (e) {
      console.error('Failed to fetch public blog data:', e);
    }
  }, []);

  useEffect(() => {
    loadPublicBootstrap();
  }, [loadPublicBootstrap]);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Intercept internal links inside article prose so navigation is instant SPA
  useEffect(() => {
    const handleDocClick = (e) => {
      const anchor = e.target.closest('a[href]');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (href && href.startsWith('/') && !href.startsWith('//') && anchor.getAttribute('target') !== '_blank') {
        e.preventDefault();
        navigate(href);
      }
    };
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  });

  const navigate = useCallback((toPath) => {
    window.history.pushState({}, '', toPath);
    setCurrentPath(toPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (currentPath.startsWith('/admin')) {
    return (
      <AdminPortal
        onNavigatePublic={(path) => navigate(path || '/')}
        onPublicDataChanged={loadPublicBootstrap}
      />
    );
  }

  return (
    <PublicBlog
      currentPath={currentPath}
      onNavigate={navigate}
      posts={publicData.posts}
      categories={publicData.categories}
      authors={publicData.authors}
    />
  );
}
