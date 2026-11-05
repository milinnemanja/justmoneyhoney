import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Lock,
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  Rocket,
  Save,
  ArrowLeft,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  PanelRightClose,
  PanelRightOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  LogOut,
  FileText,
  ExternalLink,
  RotateCcw,
  Users,
} from 'lucide-react';
import RichTextEditor from '../editor/RichTextEditor';
import EditorSidebar from '../editor/sidebar/EditorSidebar';
import ImageCropModal from '../editor/modals/ImageCropModal';
import LinkDialogModal from '../editor/modals/LinkDialogModal';
import ArticlePreviewModal from '../editor/modals/ArticlePreviewModal';
import PublishConfirmModal from '../editor/modals/PublishConfirmModal';
import AuthorManagerModal from '../editor/modals/AuthorManagerModal';
import { analyzeArticleSeo } from '../utils/seoAnalyzer';
import { optimizeImageFile } from '../utils/imageOptimizer';

const EMPTY_POST_TEMPLATE = {
  id: null,
  title: 'New Article Headline',
  slug: 'new-article-headline',
  excerpt: '',
  featuredImage: '',
  featuredImageAlt: '',
  featuredImageCaption: '',
  authorId: 'author-1793537534556',
  category: 'Finance',
  tags: ['Finance', 'Lifestyle'],
  status: 'draft',
  visibility: 'public',
  publishedAt: null,
  scheduledAt: null,
  featured: false,
  relatedPostIds: [],
  seo: {
    metaTitle: '',
    metaDescription: '',
    focusKeyword: '',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
  },
  contentHtml:
    '<h2>Start with a compelling headline</h2><p>Write your article here or type <code>/</code> to insert subheadings, callout boxes, tables, image galleries, or CTA buttons.</p>',
  contentJson: null,
  revisions: [],
};

export default function AdminPortal({ onNavigatePublic, onPublicDataChanged }) {
  const [token, setToken] = useState(() => localStorage.getItem('jmh_admin_token') || '');
  const [adminUser, setAdminUser] = useState(null);
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [authLoading, setAuthLoading] = useState(true);

  // CMS Data
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [mediaLibrary, setMediaLibrary] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Editor Studio state
  const [mode, setMode] = useState('dashboard'); // 'dashboard' | 'editor'
  const [activePost, setActivePost] = useState(EMPTY_POST_TEMPLATE);
  const [isDirty, setIsDirty] = useState(false);
  const [saveState, setSaveState] = useState('saved'); // 'saved' | 'saving' | 'unsaved' | 'autosaved' | 'error'
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('settings');
  const [editorTheme, setEditorTheme] = useState('dark'); // 'dark' | 'light'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Modals
  const [previewOpen, setPreviewOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [authorManagerOpen, setAuthorManagerOpen] = useState(false);
  const [linkModalState, setLinkModalState] = useState(null);
  const [cropModalState, setCropModalState] = useState(null);
  const [recoveryCandidate, setRecoveryCandidate] = useState(null);

  const editorInstanceRef = useRef(null);
  const autosaveTimerRef = useRef(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.msg === msg ? null : prev));
    }, 3500);
  }, []);

  const fetchAdminBootstrap = useCallback(
    async (authToken = token) => {
      if (!authToken) {
        setAuthLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/admin/bootstrap', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!res.ok) {
          throw new Error('Session expired');
        }
        const data = await res.json();
        setPosts(data.posts || []);
        setCategories(data.categories || []);
        setAuthors(data.authors || []);
        setMediaLibrary(data.media || []);
        setAdminUser({ username: 'admin' });
      } catch {
        localStorage.removeItem('jmh_admin_token');
        setToken('');
        setAdminUser(null);
      } finally {
        setAuthLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchAdminBootstrap(token);
  }, [token, fetchAdminBootstrap]);

  // Warn before closing tab if unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty && mode === 'editor') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, mode]);

  // Login Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Invalid login credentials');
        return;
      }
      localStorage.setItem('jmh_admin_token', data.token);
      setToken(data.token);
      setAdminUser(data.user);
      await fetchAdminBootstrap(data.token);
    } catch {
      setLoginError('Network error while signing in.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // ignore
    }
    localStorage.removeItem('jmh_admin_token');
    setToken('');
    setAdminUser(null);
  };

  // Open Post in Editor Studio
  const openPostInEditor = (postToEdit = null) => {
    const base = postToEdit
      ? JSON.parse(JSON.stringify(postToEdit))
      : {
          ...EMPTY_POST_TEMPLATE,
          id: null,
          authorId: authors[0]?.id || 'author-1793537534556',
          category: categories[0]?.name || 'Tech & AI',
          title: 'New Feature Story',
          slug: `new-feature-story-${Math.floor(100 + Math.random() * 900)}`,
        };
    setActivePost(base);
    setIsDirty(false);
    setSaveState('saved');
    setMode('editor');

    const recoveryKey = `jmh_draft_recovery_${base.id || 'new'}`;
    try {
      const cachedRaw = localStorage.getItem(recoveryKey);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        const serverTime = base.updatedAt ? new Date(base.updatedAt).getTime() : 0;
        if (cached.cachedAt && cached.cachedAt > serverTime + 5000) {
          setRecoveryCandidate({ key: recoveryKey, data: cached });
        } else {
          setRecoveryCandidate(null);
        }
      } else {
        setRecoveryCandidate(null);
      }
    } catch {
      setRecoveryCandidate(null);
    }
  };

  const updatePost = useCallback((patch) => {
    setActivePost((prev) => {
      const next = { ...prev, ...patch };
      const recoveryKey = `jmh_draft_recovery_${next.id || 'new'}`;
      try {
        localStorage.setItem(
          recoveryKey,
          JSON.stringify({
            ...next,
            cachedAt: Date.now(),
          })
        );
      } catch {
        // ignore quota errors
      }
      return next;
    });
    setIsDirty(true);
    setSaveState('unsaved');
  }, []);

  const updateSeo = useCallback((seoPatch) => {
    setActivePost((prev) => {
      const next = {
        ...prev,
        seo: { ...(prev.seo || {}), ...seoPatch },
      };
      return next;
    });
    setIsDirty(true);
    setSaveState('unsaved');
  }, []);

  // Save or Publish API Call
  const persistPost = useCallback(
    async ({ statusOverride, scheduledAtOverride, visibilityOverride, isAutosave = false, revisionNote } = {}) => {
      if (!token) return null;
      setSaveState('saving');
      try {
        const payload = {
          ...activePost,
          status: statusOverride || activePost.status || 'draft',
          scheduledAt:
            scheduledAtOverride !== undefined ? scheduledAtOverride : activePost.scheduledAt,
          visibility: visibilityOverride || activePost.visibility || 'public',
          isAutosave,
          baseUpdatedAt: activePost.updatedAt,
          revisionNote,
        };

        const isNew = !activePost.id;
        const url = isNew ? '/api/admin/posts' : `/api/admin/posts/${activePost.id}`;
        const method = isNew ? 'POST' : 'PUT';

        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          if (res.status === 409 && isAutosave) {
            return null;
          }
          throw new Error(data.error || 'Failed to save article');
        }

        const saved = data.post;
        setActivePost(saved);
        setIsDirty(false);
        setSaveState(isAutosave ? 'autosaved' : 'saved');
        setLastSavedTime(new Date());

        localStorage.removeItem(`jmh_draft_recovery_${saved.id}`);
        localStorage.removeItem('jmh_draft_recovery_new');

        setPosts((prev) => {
          const exists = prev.some((p) => p.id === saved.id);
          if (exists) return prev.map((p) => (p.id === saved.id ? saved : p));
          return [saved, ...prev];
        });
        if (onPublicDataChanged) onPublicDataChanged();
        if (!isAutosave) {
          showToast(
            saved.status === 'published'
              ? 'Article published live on justmoneyhoney!'
              : saved.status === 'scheduled'
              ? 'Article scheduled for publication!'
              : 'Draft saved successfully.'
          );
        }
        return saved;
      } catch (err) {
        setSaveState('error');
        if (!isAutosave) showToast(err.message || 'Save failed', 'error');
        return null;
      }
    },
    [token, activePost, onPublicDataChanged, showToast]
  );

  // Automatic debounced saving while typing
  useEffect(() => {
    if (mode !== 'editor' || !isDirty || !activePost.id) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      persistPost({ isAutosave: true });
    }, 6000);
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [mode, isDirty, activePost, persistPost]);

  // Ctrl+S keyboard shortcut for manual save
  useEffect(() => {
    if (mode !== 'editor') return;
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        persistPost({ isAutosave: false, revisionNote: 'Manual save (Ctrl+S)' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, persistPost]);

  // Image Upload + Automatic Optimization Handler
  const handleUploadMediaFiles = useCallback(
    async (files, { insertIntoEditor = false, returnOnly = false } = {}) => {
      if (!files || files.length === 0) return [];
      setIsUploading(true);
      const uploadedItems = [];
      try {
        for (const file of files) {
          const optimized = await optimizeImageFile(file);
          const res = await fetch('/api/admin/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              dataUrl: optimized.dataUrl,
              filename: optimized.filename,
              alt: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
              width: optimized.width,
              height: optimized.height,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Upload failed');
          uploadedItems.push(data.media);
        }

        setMediaLibrary((prev) => [...uploadedItems, ...prev]);
        if (insertIntoEditor && editorInstanceRef.current && !returnOnly) {
          if (uploadedItems.length === 1) {
            const img = uploadedItems[0];
            editorInstanceRef.current
              .chain()
              .focus()
              .setImage({ src: img.url, alt: img.alt || '', caption: img.caption || '' })
              .run();
          } else if (uploadedItems.length > 1) {
            editorInstanceRef.current
              .chain()
              .focus()
              .insertContent({
                type: 'imageGallery',
                attrs: {
                  columns: Math.min(3, uploadedItems.length),
                  images: uploadedItems.map((u) => ({
                    src: u.url,
                    alt: u.alt || '',
                    caption: '',
                  })),
                },
              })
              .run();
          }
        }
        showToast(`Optimized & uploaded ${uploadedItems.length} image(s)`);
        return uploadedItems;
      } catch (err) {
        showToast(err.message || 'Image upload failed', 'error');
        return [];
      } finally {
        setIsUploading(false);
      }
    },
    [token, showToast]
  );

  const handleDeleteMediaItem = async (mediaId) => {
    try {
      await fetch(`/api/admin/media/${mediaId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setMediaLibrary((prev) => prev.filter((m) => m.id !== mediaId));
      showToast('Image deleted');
    } catch {
      showToast('Failed to delete image', 'error');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to permanently delete this article?')) return;
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        if (onPublicDataChanged) onPublicDataChanged();
        showToast('Article deleted');
      }
    } catch {
      showToast('Delete failed', 'error');
    }
  };

  // Author CRUD Handlers
  const handleCreateAuthor = async (authorPayload) => {
    const res = await fetch('/api/admin/authors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(authorPayload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create author');
    setAuthors(data.authors || []);
    if (onPublicDataChanged) onPublicDataChanged();
    showToast(`Added author "${data.author.name}"`);
    return data.author;
  };

  const handleUpdateAuthor = async (authorId, authorPayload) => {
    const res = await fetch(`/api/admin/authors/${authorId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(authorPayload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update author');
    setAuthors(data.authors || []);
    if (onPublicDataChanged) onPublicDataChanged();
    showToast(`Saved changes for "${data.author.name}"`);
    return data.author;
  };

  const handleDeleteAuthor = async (authorId) => {
    try {
      const res = await fetch(`/api/admin/authors/${authorId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete author');
      setAuthors(data.authors || []);
      if (activePost.authorId === authorId && data.fallbackId) {
        updatePost({ authorId: data.fallbackId });
      }
      if (onPublicDataChanged) onPublicDataChanged();
      showToast('Author removed');
    } catch (err) {
      showToast(err.message || 'Cannot delete author', 'error');
    }
  };

  // Auto-fix missing ALT attributes on inline images
  const handleFixMissingInlineAlts = () => {
    if (!editorInstanceRef.current) return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(activePost.contentHtml || '', 'text/html');
    doc.querySelectorAll('img').forEach((img, idx) => {
      if (!img.getAttribute('alt')?.trim()) {
        img.setAttribute('alt', `${activePost.title || 'Article'} illustration ${idx + 1}`);
      }
    });
    const fixedHtml = doc.body.innerHTML;
    editorInstanceRef.current.commands.setContent(fixedHtml, true);
    updatePost({ contentHtml: fixedHtml });
    showToast('Added ALT descriptions to all inline images');
  };

  // Restore previous revision
  const handleRestoreRevision = async (rev) => {
    if (activePost.id) {
      const res = await fetch(`/api/admin/posts/${activePost.id}/restore-revision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ revisionId: rev.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setActivePost(data.post);
        if (editorInstanceRef.current) {
          editorInstanceRef.current.commands.setContent(data.post.contentHtml || '<p></p>', false);
        }
        showToast('Previous revision restored!');
        return;
      }
    }
    if (rev.contentHtml && editorInstanceRef.current) {
      editorInstanceRef.current.commands.setContent(rev.contentHtml, false);
      updatePost({
        title: rev.title || activePost.title,
        excerpt: rev.excerpt ?? activePost.excerpt,
        contentHtml: rev.contentHtml,
      });
      showToast('Previous revision restored');
    }
  };

  // Live SEO Analysis for active post
  const currentAuthor = useMemo(
    () => authors.find((a) => a.id === activePost.authorId) || authors[0],
    [authors, activePost.authorId]
  );

  const seoAnalysis = useMemo(
    () =>
      analyzeArticleSeo({
        title: activePost.title,
        slug: activePost.slug,
        excerpt: activePost.excerpt,
        contentHtml: activePost.contentHtml,
        featuredImage: activePost.featuredImage,
        featuredImageAlt: activePost.featuredImageAlt,
        seo: activePost.seo || {},
        authorName: currentAuthor?.name || 'Nemanja Milin',
        publishedAt: activePost.publishedAt,
        updatedAt: activePost.updatedAt,
        category: activePost.category,
      }),
    [activePost, currentAuthor]
  );

  // Filtered posts for dashboard
  const filteredDashboardPosts = useMemo(() => {
    return posts.filter((p) => {
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      if (filterCategory !== 'all' && p.category !== filterCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          (p.excerpt || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [posts, filterStatus, filterCategory, searchQuery]);

  // =========================================================
  // 1. PRIVATE ADMIN LOGIN SCREEN
  // =========================================================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#08080C] text-white flex items-center justify-center">
        <div className="animate-pulse font-display font-bold text-lg">Loading Admin Studio...</div>
      </div>
    );
  }

  if (!token || !adminUser) {
    return (
      <div className="min-h-screen bg-[#08080C] text-white flex flex-col justify-center items-center px-4">
        <div className="w-full max-w-md bg-[#12121B] border border-white/15 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="font-display font-black text-2xl tracking-tight">
              <span className="text-white">just</span>
              <span className="text-[#FF2E93]">money</span>
              <span className="text-white">honey</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF2E93]/15 border border-[#FF2E93]/30 text-[#FF2E93] text-xs font-bold">
              <Lock className="w-3.5 h-3.5" /> Private CMS
            </span>
          </div>

          <h1 className="font-display font-extrabold text-xl mb-1">Editorial Studio Sign In</h1>
          <p className="text-xs text-zinc-400 mb-6">
            Restricted access. Sign in to write articles, upload media, optimize SEO, and publish on justmoneyhoney.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Username or Email
              </label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-sm text-white focus:border-[#FF2E93] outline-none"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-sm text-white focus:border-[#FF2E93] outline-none"
                placeholder="Enter admin password..."
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#FF2E93] hover:bg-[#ff4da2] text-white font-display font-extrabold text-sm shadow-lg shadow-[#FF2E93]/30 transition"
            >
              Unlock Editorial Studio →
            </button>
          </form>

          {/* Quick Demo Fill */}
          <div className="mt-5 pt-5 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
            <span>Default password: <code className="text-[#FF2E93]">moneyhoney2026</code></span>
            <button
              type="button"
              onClick={() => {
                setLoginUsername('admin');
                setLoginPassword('moneyhoney2026');
              }}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold"
            >
              Auto-fill
            </button>
          </div>

          <button
            type="button"
            onClick={() => onNavigatePublic('/')}
            className="mt-4 w-full py-2 text-center text-xs text-zinc-400 hover:text-white transition"
          >
            ← Back to Public Website
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // 2. FULL RICH TEXT EDITOR STUDIO VIEW
  // =========================================================
  if (mode === 'editor') {
    const isLight = editorTheme === 'light';

    return (
      <div
        className={`${
          isFullscreen ? 'fixed inset-0 z-50' : 'min-h-screen'
        } flex flex-col ${
          isLight ? 'bg-zinc-50 text-zinc-900 editor-light' : 'bg-[#09090F] text-white'
        }`}
      >
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed bottom-12 right-6 z-50 px-4 py-2.5 rounded-xl shadow-2xl border text-xs font-bold flex items-center gap-2 ${
              toastMessage.type === 'error'
                ? 'bg-red-950 border-red-500 text-red-200'
                : 'bg-[#14141F] border-[#FF2E93] text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-[#FF2E93]" />
            <span>{toastMessage.msg}</span>
          </div>
        )}

        {/* Top Studio Header */}
        <header
          className={`h-16 px-4 sm:px-6 border-b flex items-center justify-between gap-3 shrink-0 ${
            isLight ? 'bg-white border-zinc-200' : 'bg-[#0E0E16] border-white/10'
          }`}
        >
          {/* Left: Back & Brand */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => {
                if (isDirty && !window.confirm('You have unsaved changes. Leave the editor anyway?')) {
                  return;
                }
                setMode('dashboard');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold shrink-0 transition ${
                isLight
                  ? 'border-zinc-300 hover:bg-zinc-100 text-zinc-700'
                  : 'border-white/15 hover:bg-white/10 text-zinc-200'
              }`}
            >
              <ArrowLeft className="w-4 h-4" /> Articles
            </button>

            <div className="hidden md:flex items-center font-display font-black text-base tracking-tight shrink-0">
              <span className={isLight ? 'text-zinc-900' : 'text-white'}>just</span>
              <span className="text-[#FF2E93]">money</span>
              <span className={isLight ? 'text-zinc-900' : 'text-white'}>honey</span>
            </div>

            <span className="text-zinc-500 hidden md:inline">/</span>

            {/* Editable Blog Title right in Header */}
            <input
              type="text"
              value={activePost.title || ''}
              onChange={(e) => updatePost({ title: e.target.value })}
              placeholder="Enter article headline..."
              className={`font-display font-extrabold text-sm sm:text-base bg-transparent border-b border-transparent focus:border-[#FF2E93] outline-none truncate w-full max-w-md px-1 py-0.5 ${
                isLight ? 'text-zinc-900' : 'text-white'
              }`}
            />
          </div>

          {/* Center/Right: Save Status + Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Save Status Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-white/10 bg-black/20">
              {saveState === 'saving' && (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span className="text-amber-300">Saving...</span>
                </>
              )}
              {saveState === 'unsaved' && (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-300">Unsaved changes</span>
                </>
              )}
              {(saveState === 'saved' || saveState === 'autosaved') && (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">
                    {saveState === 'autosaved' ? 'Autosaved' : 'Saved'}
                    {lastSavedTime
                      ? ` ${lastSavedTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                      : ''}
                  </span>
                </>
              )}
            </div>

            {/* Light / Dark Mode Toggle */}
            <button
              type="button"
              onClick={() => setEditorTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              className={`p-2 rounded-xl border transition ${
                isLight
                  ? 'border-zinc-300 hover:bg-zinc-100 text-zinc-700'
                  : 'border-white/15 hover:bg-white/10 text-zinc-300'
              }`}
              title="Toggle light / dark editor theme"
            >
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Fullscreen Writing Mode */}
            <button
              type="button"
              onClick={() => setIsFullscreen((f) => !f)}
              className={`p-2 rounded-xl border transition ${
                isLight
                  ? 'border-zinc-300 hover:bg-zinc-100 text-zinc-700'
                  : 'border-white/15 hover:bg-white/10 text-zinc-300'
              }`}
              title="Distraction-free fullscreen mode"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Save Draft Button */}
            <button
              type="button"
              onClick={() => persistPost({ statusOverride: 'draft', isAutosave: false })}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition ${
                isLight
                  ? 'border-zinc-300 hover:bg-zinc-100 text-zinc-800'
                  : 'border-white/15 hover:bg-white/10 text-white'
              }`}
            >
              <Save className="w-3.5 h-3.5 text-[#FF2E93]" />
              <span className="hidden sm:inline">Save Draft</span>
            </button>

            {/* Preview Button */}
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition ${
                isLight
                  ? 'border-zinc-300 hover:bg-zinc-100 text-zinc-800'
                  : 'border-white/15 hover:bg-white/10 text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-[#FF2E93]" />
              <span className="hidden sm:inline">Preview</span>
            </button>

            {/* Publish / Schedule Button */}
            <button
              type="button"
              onClick={() => setPublishModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF2E93] hover:bg-[#ff4da2] text-white font-display font-extrabold text-xs shadow-lg shadow-[#FF2E93]/30 transition"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>{activePost.status === 'published' ? 'Update Post' : 'Publish'}</span>
            </button>

            {/* Collapse/Expand Right Sidebar */}
            <button
              type="button"
              onClick={() => setSidebarOpen((s) => !s)}
              className={`p-2 rounded-xl border transition ${
                isLight
                  ? 'border-zinc-300 hover:bg-zinc-100 text-zinc-700'
                  : 'border-white/15 hover:bg-white/10 text-zinc-300'
              }`}
              title="Show / Hide right sidebar"
            >
              {sidebarOpen ? (
                <PanelRightClose className="w-4 h-4" />
              ) : (
                <PanelRightOpen className="w-4 h-4" />
              )}
            </button>
          </div>
        </header>

        {/* Draft Recovery Banner */}
        {recoveryCandidate && (
          <div className="px-6 py-2.5 bg-amber-500/20 border-b border-amber-500/40 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>
                Found an unsaved local draft from{' '}
                <strong>{new Date(recoveryCandidate.data.cachedAt).toLocaleTimeString('en-US')}</strong>.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const rec = recoveryCandidate.data;
                  setActivePost(rec);
                  if (editorInstanceRef.current && rec.contentHtml) {
                    editorInstanceRef.current.commands.setContent(rec.contentHtml, false);
                  }
                  setRecoveryCandidate(null);
                  showToast('Unsaved draft restored!');
                }}
                className="px-3 py-1 rounded-lg bg-amber-400 text-black font-bold"
              >
                Restore Draft
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem(recoveryCandidate.key);
                  setRecoveryCandidate(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-black/40 text-zinc-300"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Main Center Workspace + Collapsible Right Sidebar */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Inline Document Title Header inside the spacious writing canvas */}
            <div className="max-w-4xl w-full mx-auto px-6 sm:px-14 pt-8 pb-2">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-[#FF2E93]/15 text-[#FF2E93] text-xs font-bold uppercase tracking-wider">
                  {activePost.category || 'Finance'}
                </span>
                <span className="text-xs text-zinc-500">•</span>
                <span className="text-xs text-zinc-400">/post/{activePost.slug || 'article'}</span>
              </div>
              <input
                type="text"
                value={activePost.title || ''}
                onChange={(e) => updatePost({ title: e.target.value })}
                placeholder="Article headline..."
                className={`w-full font-display font-black text-3xl sm:text-4xl bg-transparent outline-none border-b border-transparent focus:border-[#FF2E93]/40 pb-2 ${
                  isLight ? 'text-zinc-900 placeholder:text-zinc-400' : 'text-white placeholder:text-zinc-600'
                }`}
              />
            </div>

            {/* Tiptap Rich Text Editor */}
            <RichTextEditor
              key={activePost.id || 'new-post'}
              initialHtml={activePost.contentHtml}
              editorTheme={editorTheme}
              editorRefCallback={(ed) => {
                editorInstanceRef.current = ed;
              }}
              onChange={({ html, json }) => {
                updatePost({ contentHtml: html, contentJson: json });
              }}
              onOpenLinkModal={(attrs) => {
                setLinkModalState({
                  href: attrs?.href || '',
                  target: attrs?.target || '_self',
                  rel: attrs?.rel || '',
                });
              }}
              onRequestCropImage={(src, applyCroppedUrl) => {
                setCropModalState({ src, applyCroppedUrl });
              }}
              onUploadAndInsertFiles={(files, opts = {}) =>
                handleUploadMediaFiles(files, { insertIntoEditor: true, ...opts })
              }
            />
          </div>

          {/* Right Sidebar: Post Settings, SEO, Media, Revisions */}
          {sidebarOpen && (
            <EditorSidebar
              activeTab={sidebarTab}
              setActiveTab={setSidebarTab}
              post={activePost}
              updatePost={updatePost}
              updateSeo={updateSeo}
              authors={authors}
              categories={categories}
              allPosts={posts}
              mediaLibrary={mediaLibrary}
              seoAnalysis={seoAnalysis}
              onUploadMediaFiles={(files) => handleUploadMediaFiles(files, { insertIntoEditor: false })}
              onInsertImageIntoEditor={(img) => {
                if (editorInstanceRef.current) {
                  editorInstanceRef.current
                    .chain()
                    .focus()
                    .setImage({ src: img.src, alt: img.alt || '', caption: img.caption || '' })
                    .run();
                }
              }}
              onInsertGalleryIntoEditor={(images) => {
                if (editorInstanceRef.current) {
                  editorInstanceRef.current
                    .chain()
                    .focus()
                    .insertContent({
                      type: 'imageGallery',
                      attrs: { columns: Math.min(3, images.length), images },
                    })
                    .run();
                }
              }}
              onDeleteMediaItem={handleDeleteMediaItem}
              onFixMissingInlineAlts={handleFixMissingInlineAlts}
              onRestoreRevision={handleRestoreRevision}
              onSaveManualRevision={() =>
                persistPost({ isAutosave: false, revisionNote: 'Manually saved revision' })
              }
              onOpenAuthorManager={() => setAuthorManagerOpen(true)}
              isUploading={isUploading}
              editorTheme={editorTheme}
            />
          )}
        </div>

        {/* Bottom Editor Metrics Footer */}
        <footer
          className={`h-9 px-6 border-t flex items-center justify-between text-[11px] shrink-0 ${
            isLight
              ? 'bg-white border-zinc-200 text-zinc-600'
              : 'bg-[#0E0E16] border-white/10 text-zinc-400'
          }`}
        >
          <div className="flex items-center gap-4">
            <span>
              <strong className={isLight ? 'text-zinc-900' : 'text-white'}>{seoAnalysis.wordCount}</strong> words
            </span>
            <span>
              <strong className={isLight ? 'text-zinc-900' : 'text-white'}>{seoAnalysis.charCount}</strong> chars
            </span>
            <span>
              ~<strong className="text-[#FF2E93]">{seoAnalysis.readingTimeMinutes} min</strong> read
            </span>
            <span className="hidden sm:inline">
              <strong>{seoAnalysis.headings.length}</strong> headings
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-zinc-500">
              Tip: Type <code className="text-[#FF2E93] font-bold">/</code> for blocks or select text for the floating toolbar
            </span>
            <button
              type="button"
              onClick={() => {
                setSidebarOpen(true);
                setSidebarTab('seo');
              }}
              className="font-bold text-[#FF2E93] hover:underline"
            >
              SEO Score: {seoAnalysis.score}/100
            </button>
          </div>
        </footer>

        {/* Modals */}
        {previewOpen && (
          <ArticlePreviewModal
            post={activePost}
            author={currentAuthor}
            readingTimeMinutes={seoAnalysis.readingTimeMinutes}
            onClose={() => setPreviewOpen(false)}
          />
        )}

        {publishModalOpen && (
          <PublishConfirmModal
            post={activePost}
            seoAnalysis={seoAnalysis}
            onClose={() => setPublishModalOpen(false)}
            onConfirmPublish={async ({ visibility }) => {
              setPublishModalOpen(false);
              await persistPost({
                statusOverride: 'published',
                visibilityOverride: visibility,
                isAutosave: false,
                revisionNote: 'Published live',
              });
            }}
            onConfirmSchedule={async ({ scheduledAt, visibility }) => {
              setPublishModalOpen(false);
              await persistPost({
                statusOverride: 'scheduled',
                scheduledAtOverride: scheduledAt,
                visibilityOverride: visibility,
                isAutosave: false,
                revisionNote: `Scheduled for ${new Date(scheduledAt).toLocaleString('en-US')}`,
              });
            }}
          />
        )}

        {linkModalState && (
          <LinkDialogModal
            initialHref={linkModalState.href}
            initialTarget={linkModalState.target}
            initialRel={linkModalState.rel}
            allPosts={posts}
            onClose={() => setLinkModalState(null)}
            onApply={({ href, target, rel }) => {
              if (editorInstanceRef.current) {
                editorInstanceRef.current
                  .chain()
                  .focus()
                  .extendMarkRange('link')
                  .setLink({ href, target, rel })
                  .run();
              }
            }}
            onRemove={() => {
              if (editorInstanceRef.current) {
                editorInstanceRef.current.chain().focus().unsetLink().run();
              }
            }}
          />
        )}

        {cropModalState && (
          <ImageCropModal
            imageSrc={cropModalState.src}
            onClose={() => setCropModalState(null)}
            onCropComplete={async ({ dataUrl, width, height }) => {
              const res = await fetch('/api/admin/upload', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  dataUrl,
                  filename: `cropped-${Date.now()}.webp`,
                  alt: activePost.title || 'Cropped article image',
                  width,
                  height,
                }),
              });
              const data = await res.json();
              if (res.ok && data.media) {
                setMediaLibrary((prev) => [data.media, ...prev]);
                cropModalState.applyCroppedUrl(data.media.url);
                showToast('Image cropped & optimized!');
              }
            }}
          />
        )}

        {authorManagerOpen && (
          <AuthorManagerModal
            authors={authors}
            selectedAuthorId={activePost.authorId}
            onSelectAuthor={(authorId) => updatePost({ authorId })}
            onCreateAuthor={handleCreateAuthor}
            onUpdateAuthor={handleUpdateAuthor}
            onDeleteAuthor={handleDeleteAuthor}
            onUploadAvatarFile={(files) => handleUploadMediaFiles(files, { insertIntoEditor: false })}
            onClose={() => setAuthorManagerOpen(false)}
          />
        )}
      </div>
    );
  }

  // =========================================================
  // 3. ADMIN CMS DASHBOARD VIEW (POSTS & CONTENT MANAGEMENT)
  // =========================================================
  const publishedCount = posts.filter((p) => p.status === 'published').length;
  const draftCount = posts.filter((p) => p.status === 'draft').length;
  const scheduledCount = posts.filter((p) => p.status === 'scheduled').length;

  return (
    <div className="min-h-screen bg-[#08080C] text-white">
      {toastMessage && (
        <div className="fixed bottom-8 right-6 z-50 px-4 py-2.5 rounded-xl bg-[#14141F] border border-[#FF2E93] text-xs font-bold shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#FF2E93]" />
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Admin Top Header */}
      <header className="border-b border-white/10 bg-[#0E0E16]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onNavigatePublic('/')}
              className="font-display font-black text-2xl tracking-tight"
            >
              <span className="text-white">just</span>
              <span className="text-[#FF2E93]">money</span>
              <span className="text-white">honey</span>
            </button>
            <span className="px-2.5 py-0.5 rounded-full bg-[#FF2E93]/15 border border-[#FF2E93]/30 text-[#FF2E93] text-xs font-bold">
              Editorial CMS
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAuthorManagerOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold"
            >
              <Users className="w-3.5 h-3.5 text-[#FF2E93]" /> Authors ({authors.length})
            </button>
            <button
              type="button"
              onClick={() => onNavigatePublic('/')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#FF2E93]" /> View Website
            </button>
            <button
              type="button"
              onClick={() => openPostInEditor(null)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF2E93] hover:bg-[#ff4da2] text-white font-display font-extrabold text-xs shadow-lg shadow-[#FF2E93]/30"
            >
              <Plus className="w-4 h-4" /> Write New Article
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#12121B] border border-white/10">
            <div className="text-xs text-zinc-400 uppercase font-bold">Total Articles</div>
            <div className="font-display font-black text-3xl mt-1">{posts.length}</div>
          </div>
          <div className="p-5 rounded-2xl bg-[#12121B] border border-white/10">
            <div className="text-xs text-emerald-400 uppercase font-bold">Published Live</div>
            <div className="font-display font-black text-3xl mt-1 text-emerald-400">{publishedCount}</div>
          </div>
          <div className="p-5 rounded-2xl bg-[#12121B] border border-white/10">
            <div className="text-xs text-amber-400 uppercase font-bold">Private Drafts</div>
            <div className="font-display font-black text-3xl mt-1 text-amber-300">{draftCount}</div>
          </div>
          <div className="p-5 rounded-2xl bg-[#12121B] border border-white/10">
            <div className="text-xs text-[#FF2E93] uppercase font-bold">Scheduled / Media</div>
            <div className="font-display font-black text-3xl mt-1 text-[#FF2E93]">
              {scheduledCount} / {mediaLibrary.length}
            </div>
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#12121B] border border-white/10 p-4 rounded-2xl">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { k: 'all', l: 'All' },
              { k: 'published', l: 'Published' },
              { k: 'draft', l: 'Drafts' },
              { k: 'scheduled', l: 'Scheduled' },
            ].map((st) => (
              <button
                key={st.k}
                type="button"
                onClick={() => setFilterStatus(st.k)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  filterStatus === st.k
                    ? 'bg-[#FF2E93] text-white'
                    : 'bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                {st.l}
              </button>
            ))}

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-black/50 border border-white/15 text-xs font-semibold text-white outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white focus:border-[#FF2E93] outline-none"
            />
          </div>
        </div>

        {/* Articles Table / List */}
        <div className="space-y-3">
          {filteredDashboardPosts.map((post) => {
            const author = authors.find((a) => a.id === post.authorId) || authors[0];
            return (
              <div
                key={post.id}
                className="p-4 sm:p-5 rounded-2xl bg-[#12121B] border border-white/10 hover:border-[#FF2E93]/40 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 min-w-0">
                  {post.featuredImage ? (
                    <img
                      src={post.featuredImage}
                      alt={post.featuredImageAlt || post.title}
                      className="w-20 h-16 rounded-xl object-cover shrink-0 border border-white/10"
                    />
                  ) : (
                    <div className="w-20 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6 text-zinc-600" />
                    </div>
                  )}

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                          post.status === 'published'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : post.status === 'scheduled'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-zinc-500/20 text-zinc-300'
                        }`}
                      >
                        {post.status === 'published'
                          ? 'Published'
                          : post.status === 'scheduled'
                          ? 'Scheduled'
                          : 'Draft'}
                      </span>
                      <span className="text-xs font-bold text-[#FF2E93]">{post.category}</span>
                      <span className="text-xs text-zinc-500">•</span>
                      <span className="text-xs text-zinc-400">{author?.name}</span>
                    </div>

                    <h3
                      onClick={() => openPostInEditor(post)}
                      className="font-display font-extrabold text-base sm:text-lg text-white hover:text-[#FF2E93] cursor-pointer truncate"
                    >
                      {post.title}
                    </h3>

                    <p className="text-xs text-zinc-400 line-clamp-1">{post.excerpt}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => openPostInEditor(post)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FF2E93] hover:bg-[#ff4da2] text-white text-xs font-bold"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit in Studio
                  </button>
                  {post.status === 'published' && (
                    <button
                      type="button"
                      onClick={() => onNavigatePublic(`/post/${post.slug}`)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-zinc-300"
                      title="View published article"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeletePost(post.id)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400"
                    title="Delete article"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {authorManagerOpen && (
        <AuthorManagerModal
          authors={authors}
          selectedAuthorId={null}
          onSelectAuthor={null}
          onCreateAuthor={handleCreateAuthor}
          onUpdateAuthor={handleUpdateAuthor}
          onDeleteAuthor={handleDeleteAuthor}
          onUploadAvatarFile={(files) => handleUploadMediaFiles(files, { insertIntoEditor: false })}
          onClose={() => setAuthorManagerOpen(false)}
        />
      )}
    </div>
  );
}
