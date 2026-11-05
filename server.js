import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { INITIAL_AUTHORS, INITIAL_CATEGORIES, INITIAL_POSTS } from './data/seedPosts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function hashPassword(password, salt = 'jmh-salt-2026') {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function loadDb() {
  if (!fs.existsSync(DB_PATH)) {
    const initialDb = {
      admin: {
        username: 'admin',
        email: 'editor@justmoneyhoney.com',
        passwordHash: hashPassword('moneyhoney2026'),
      },
      sessions: {},
      authors: INITIAL_AUTHORS,
      categories: INITIAL_CATEGORIES,
      posts: INITIAL_POSTS,
      media: [
        {
          id: 'media-1',
          url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80',
          name: 'budget-workspace.jpg',
          alt: 'Modern workspace with financial planner, coffee, and laptop',
          caption: '4-Bucket Income Allocation',
          mimeType: 'image/jpeg',
          size: 148200,
          createdAt: '2026-10-28T09:00:00.000Z'
        },
        {
          id: 'media-2',
          url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=1200&q=80',
          name: 'high-yield-savings-jar.jpg',
          alt: 'Glass jar with coins and plant symbolizing compound interest',
          caption: 'Compound Interest Growth',
          mimeType: 'image/jpeg',
          size: 132400,
          createdAt: '2026-10-26T14:00:00.000Z'
        },
        {
          id: 'media-3',
          url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1200&q=80',
          name: 'credit-cards-payoff.jpg',
          alt: 'Debt payoff and investment plan on desk',
          caption: 'Financial Flywheel',
          mimeType: 'image/jpeg',
          size: 164000,
          createdAt: '2026-10-22T10:30:00.000Z'
        },
        {
          id: 'media-4',
          url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80',
          name: 'conscious-luxury-dinner.jpg',
          alt: 'Elegant dinner with friends and intentional wealth management',
          caption: 'Conscious Luxury & Lifestyle',
          mimeType: 'image/jpeg',
          size: 155000,
          createdAt: '2026-10-18T16:00:00.000Z'
        }
      ]
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2), 'utf-8');
    return initialDb;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch (e) {
    console.error('Error reading db.json, resetting to seed:', e);
    return {
      admin: {
        username: 'admin',
        email: 'editor@justmoneyhoney.com',
        passwordHash: hashPassword('moneyhoney2026'),
      },
      sessions: {},
      authors: INITIAL_AUTHORS,
      categories: INITIAL_CATEGORIES,
      posts: INITIAL_POSTS,
      media: []
    };
  }
}

function saveDb(db) {
  const tempPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tempPath, DB_PATH);
}

// Server-side HTML sanitizer to prevent XSS while keeping rich formatting intact
function sanitizeHtmlServer(html) {
  if (!html || typeof html !== 'string') return '';
  return html
    // Remove script, style, object, embed, form, input, button (actual form buttons)
    .replace(/<\s*(script|object|embed|applet|meta|link|base|form|input|textarea)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|object|embed|applet|meta|link|base|input)[^>]*\/?>/gi, '')
    // Strip inline event handlers on*=
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // Prevent javascript: or vbscript: or data:text/html in href/src
    .replace(/(href|src)\s*=\s*(['"]?)\s*(javascript:|vbscript:|data:text\/html)[^'"\s>]*/gi, '$1=$2#blocked')
    // Ensure external links have rel="noopener noreferrer" when target="_blank"
    .replace(/<a\s+([^>]*target=["']_blank["'][^>]*)>/gi, (match, attrs) => {
      if (!/rel=/i.test(attrs)) {
        return `<a ${attrs} rel="noopener noreferrer">`;
      }
      return match;
    });
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'dj')
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || `post-${Date.now()}`;
}

function processScheduledPosts(db) {
  const now = new Date();
  let changed = false;
  for (const post of db.posts) {
    if (post.status === 'scheduled' && post.scheduledAt) {
      const schedDate = new Date(post.scheduledAt);
      if (schedDate <= now) {
        post.status = 'published';
        post.publishedAt = post.scheduledAt;
        changed = true;
      }
    }
  }
  if (changed) saveDb(db);
}

function getAuthSession(req, db) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (!token || !db.sessions || !db.sessions[token]) return null;
  const session = db.sessions[token];
  if (new Date(session.expiresAt) < new Date()) {
    delete db.sessions[token];
    saveDb(db);
    return null;
  }
  return session;
}

function requireAuth(req, res, next) {
  const db = loadDb();
  const session = getAuthSession(req, db);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized: Administrator sign-in required.' });
  }
  req.db = db;
  req.session = session;
  next();
}

export async function createServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Auto-check scheduled posts periodically
  setInterval(() => {
    try {
      const db = loadDb();
      processScheduledPosts(db);
    } catch (e) {
      // ignore
    }
  }, 30000);

  // ==========================================
  // AUTHENTICATION API
  // ==========================================
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body || {};
    const db = loadDb();
    const userMatch =
      username &&
      (username.toLowerCase() === db.admin.username.toLowerCase() ||
        username.toLowerCase() === db.admin.email.toLowerCase());
    const passHash = hashPassword(String(password || ''));
    if (!userMatch || passHash !== db.admin.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials. Default: admin / moneyhoney2026' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
    db.sessions[token] = {
      username: db.admin.username,
      email: db.admin.email,
      createdAt: new Date().toISOString(),
      expiresAt,
    };
    saveDb(db);
    res.json({
      token,
      user: {
        username: db.admin.username,
        email: db.admin.email,
      },
    });
  });

  app.get('/api/auth/me', requireAuth, (req, res) => {
    res.json({
      user: {
        username: req.db.admin.username,
        email: req.db.admin.email,
      },
    });
  });

  app.post('/api/auth/logout', requireAuth, (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.slice(7).trim();
    delete req.db.sessions[token];
    saveDb(req.db);
    res.json({ ok: true });
  });

  // ==========================================
  // PUBLIC BLOG API
  // ==========================================
  app.get('/api/public/bootstrap', (req, res) => {
    const db = loadDb();
    processScheduledPosts(db);
    const publishedPosts = db.posts
      .filter((p) => p.status === 'published' && p.visibility !== 'private')
      .sort((a, b) => new Date(b.publishedAt || b.updatedAt) - new Date(a.publishedAt || a.updatedAt));

    res.json({
      posts: publishedPosts,
      categories: db.categories,
      authors: db.authors,
    });
  });

  app.get('/api/public/posts/:slug', (req, res) => {
    const db = loadDb();
    processScheduledPosts(db);
    const isAdmin = Boolean(getAuthSession(req, db));
    const post = db.posts.find((p) => p.slug === req.params.slug || p.id === req.params.slug);
    if (!post) {
      return res.status(404).json({ error: 'Article not found' });
    }
    if (!isAdmin && (post.status !== 'published' || post.visibility === 'private')) {
      return res.status(404).json({ error: 'This article is private or not yet published' });
    }
    const author = db.authors.find((a) => a.id === post.authorId) || db.authors[0];
    res.json({ post, author, authors: db.authors, categories: db.categories });
  });

  // ==========================================
  // PRIVATE ADMIN CMS API
  // ==========================================
  app.get('/api/admin/bootstrap', requireAuth, (req, res) => {
    processScheduledPosts(req.db);
    const sortedPosts = [...req.db.posts].sort(
      (a, b) => new Date(b.updatedAt || b.publishedAt || 0) - new Date(a.updatedAt || a.publishedAt || 0)
    );
    res.json({
      posts: sortedPosts,
      categories: req.db.categories,
      authors: req.db.authors,
      media: req.db.media || [],
    });
  });

  app.get('/api/admin/posts/:id', requireAuth, (req, res) => {
    const post = req.db.posts.find((p) => p.id === req.params.id || p.slug === req.params.id);
    if (!post) return res.status(404).json({ error: 'Article not found' });
    res.json({ post });
  });

  // Create new post
  app.post('/api/admin/posts', requireAuth, (req, res) => {
    const payload = req.body || {};
    const now = new Date().toISOString();
    let desiredSlug = slugify(payload.slug || payload.title || 'new-article');
    if (req.db.posts.some((p) => p.slug === desiredSlug)) {
      desiredSlug = `${desiredSlug}-${Math.floor(100 + Math.random() * 900)}`;
    }
    const status = ['draft', 'scheduled', 'published'].includes(payload.status) ? payload.status : 'draft';
    const sanitizedHtml = sanitizeHtmlServer(payload.contentHtml || '<p></p>');

    const newPost = {
      id: `post-${Date.now()}`,
      title: String(payload.title || 'Untitled Article').trim(),
      slug: desiredSlug,
      excerpt: String(payload.excerpt || '').trim(),
      featuredImage: payload.featuredImage || '',
      featuredImageAlt: String(payload.featuredImageAlt || '').trim(),
      featuredImageCaption: String(payload.featuredImageCaption || '').trim(),
      authorId: payload.authorId || req.db.authors[0]?.id || 'author-1',
      category: payload.category || 'Finance',
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      status,
      visibility: payload.visibility || 'public',
      publishedAt: status === 'published' ? payload.publishedAt || now : null,
      scheduledAt: status === 'scheduled' ? payload.scheduledAt || null : null,
      updatedAt: now,
      featured: Boolean(payload.featured),
      relatedPostIds: Array.isArray(payload.relatedPostIds) ? payload.relatedPostIds : [],
      seo: {
        metaTitle: payload.seo?.metaTitle || payload.title || '',
        metaDescription: payload.seo?.metaDescription || payload.excerpt || '',
        focusKeyword: payload.seo?.focusKeyword || '',
        canonicalUrl: payload.seo?.canonicalUrl || `https://justmoneyhoney.com/post/${desiredSlug}`,
        ogTitle: payload.seo?.ogTitle || payload.title || '',
        ogDescription: payload.seo?.ogDescription || payload.excerpt || '',
        ogImage: payload.seo?.ogImage || payload.featuredImage || '',
      },
      contentHtml: sanitizedHtml,
      contentJson: payload.contentJson || null,
      revisions: [
        {
          id: `rev-${Date.now()}`,
          savedAt: now,
          note: payload.revisionNote || (status === 'published' ? 'Published article' : 'Created draft'),
          title: String(payload.title || 'Untitled Article').trim(),
          excerpt: String(payload.excerpt || '').trim(),
          contentHtml: sanitizedHtml,
          contentJson: payload.contentJson || null,
        },
      ],
    };

    req.db.posts.unshift(newPost);
    saveDb(req.db);
    res.status(201).json({ post: newPost });
  });

  // Update / Save / Publish post
  app.put('/api/admin/posts/:id', requireAuth, (req, res) => {
    const idx = req.db.posts.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Article not found' });

    const existing = req.db.posts[idx];
    const payload = req.body || {};

    // Conflict protection for background autosave so it never overwrites newer revisions
    if (payload.isAutosave && payload.baseUpdatedAt) {
      if (new Date(existing.updatedAt).getTime() > new Date(payload.baseUpdatedAt).getTime()) {
        return res.status(409).json({
          error: 'Newer changes detected. Autosave skipped to avoid overwriting a newer revision.',
          serverPost: existing,
        });
      }
    }

    const now = new Date().toISOString();
    let desiredSlug = payload.slug ? slugify(payload.slug) : existing.slug;
    if (req.db.posts.some((p, i) => i !== idx && p.slug === desiredSlug)) {
      desiredSlug = `${desiredSlug}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const status = ['draft', 'scheduled', 'published'].includes(payload.status)
      ? payload.status
      : existing.status;

    const sanitizedHtml =
      payload.contentHtml !== undefined ? sanitizeHtmlServer(payload.contentHtml) : existing.contentHtml;

    let publishedAt = existing.publishedAt;
    if (status === 'published' && !publishedAt) {
      publishedAt = payload.publishedAt || now;
    } else if (payload.publishedAt !== undefined) {
      publishedAt = payload.publishedAt;
    }

    const revisions = Array.isArray(existing.revisions) ? [...existing.revisions] : [];
    const shouldRecordRevision = !payload.isAutosave || payload.recordRevision;
    if (shouldRecordRevision) {
      revisions.unshift({
        id: `rev-${Date.now()}`,
        savedAt: now,
        note:
          payload.revisionNote ||
          (status === 'published' && existing.status !== 'published'
            ? 'Published article'
            : status === 'scheduled'
            ? `Scheduled for ${payload.scheduledAt}`
            : 'Saved revision'),
        title: String(payload.title ?? existing.title).trim(),
        excerpt: String(payload.excerpt ?? existing.excerpt).trim(),
        contentHtml: sanitizedHtml,
        contentJson: payload.contentJson !== undefined ? payload.contentJson : existing.contentJson,
      });
      if (revisions.length > 30) revisions.length = 30;
    }

    const updatedPost = {
      ...existing,
      title: payload.title !== undefined ? String(payload.title).trim() : existing.title,
      slug: desiredSlug,
      excerpt: payload.excerpt !== undefined ? String(payload.excerpt).trim() : existing.excerpt,
      featuredImage: payload.featuredImage !== undefined ? payload.featuredImage : existing.featuredImage,
      featuredImageAlt:
        payload.featuredImageAlt !== undefined ? String(payload.featuredImageAlt).trim() : existing.featuredImageAlt,
      featuredImageCaption:
        payload.featuredImageCaption !== undefined
          ? String(payload.featuredImageCaption).trim()
          : existing.featuredImageCaption,
      authorId: payload.authorId || existing.authorId,
      category: payload.category || existing.category,
      tags: Array.isArray(payload.tags) ? payload.tags : existing.tags,
      status,
      visibility: payload.visibility || existing.visibility || 'public',
      publishedAt,
      scheduledAt: status === 'scheduled' ? payload.scheduledAt || existing.scheduledAt : null,
      updatedAt: now,
      featured: payload.featured !== undefined ? Boolean(payload.featured) : existing.featured,
      relatedPostIds: Array.isArray(payload.relatedPostIds) ? payload.relatedPostIds : existing.relatedPostIds || [],
      seo: {
        metaTitle: payload.seo?.metaTitle ?? existing.seo?.metaTitle ?? '',
        metaDescription: payload.seo?.metaDescription ?? existing.seo?.metaDescription ?? '',
        focusKeyword: payload.seo?.focusKeyword ?? existing.seo?.focusKeyword ?? '',
        canonicalUrl:
          payload.seo?.canonicalUrl ?? existing.seo?.canonicalUrl ?? `https://justmoneyhoney.com/post/${desiredSlug}`,
        ogTitle: payload.seo?.ogTitle ?? existing.seo?.ogTitle ?? '',
        ogDescription: payload.seo?.ogDescription ?? existing.seo?.ogDescription ?? '',
        ogImage: payload.seo?.ogImage ?? existing.seo?.ogImage ?? '',
      },
      contentHtml: sanitizedHtml,
      contentJson: payload.contentJson !== undefined ? payload.contentJson : existing.contentJson,
      revisions,
    };

    req.db.posts[idx] = updatedPost;
    saveDb(req.db);
    res.json({ post: updatedPost });
  });

  // Restore revision
  app.post('/api/admin/posts/:id/restore-revision', requireAuth, (req, res) => {
    const idx = req.db.posts.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Article not found' });
    const post = req.db.posts[idx];
    const { revisionId } = req.body || {};
    const rev = (post.revisions || []).find((r) => r.id === revisionId);
    if (!rev) return res.status(404).json({ error: 'Revision snapshot not found' });

    const now = new Date().toISOString();
    const backupRevisions = [
      {
        id: `rev-${Date.now()}`,
        savedAt: now,
        note: `Restored revision from ${new Date(rev.savedAt).toLocaleString('en-US')}`,
        title: rev.title || post.title,
        excerpt: rev.excerpt ?? post.excerpt,
        contentHtml: rev.contentHtml || post.contentHtml,
        contentJson: rev.contentJson || null,
      },
      ...(post.revisions || []),
    ].slice(0, 30);

    const updatedPost = {
      ...post,
      title: rev.title || post.title,
      excerpt: rev.excerpt ?? post.excerpt,
      contentHtml: rev.contentHtml || post.contentHtml,
      contentJson: rev.contentJson || null,
      updatedAt: now,
      revisions: backupRevisions,
    };

    req.db.posts[idx] = updatedPost;
    saveDb(req.db);
    res.json({ post: updatedPost });
  });

  // Delete post
  app.delete('/api/admin/posts/:id', requireAuth, (req, res) => {
    const idx = req.db.posts.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Article not found' });
    req.db.posts.splice(idx, 1);
    saveDb(req.db);
    res.json({ ok: true });
  });

  // ==========================================
  // AUTHOR MANAGEMENT API
  // ==========================================
  app.post('/api/admin/authors', requireAuth, (req, res) => {
    const { name, role, bio, avatar } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Author name is required.' });
    }
    const newAuthor = {
      id: `author-${Date.now()}`,
      name: String(name).trim(),
      role: String(role || 'Contributing Writer').trim(),
      bio: String(bio || '').trim(),
      avatar:
        String(avatar || '').trim() ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    };
    if (!Array.isArray(req.db.authors)) req.db.authors = [];
    req.db.authors.push(newAuthor);
    saveDb(req.db);
    res.status(201).json({ author: newAuthor, authors: req.db.authors });
  });

  app.put('/api/admin/authors/:id', requireAuth, (req, res) => {
    const idx = (req.db.authors || []).findIndex((a) => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Author not found.' });
    const existing = req.db.authors[idx];
    const { name, role, bio, avatar } = req.body || {};
    if (name !== undefined && !String(name).trim()) {
      return res.status(400).json({ error: 'Author name cannot be empty.' });
    }
    const updatedAuthor = {
      ...existing,
      name: name !== undefined ? String(name).trim() : existing.name,
      role: role !== undefined ? String(role).trim() : existing.role,
      bio: bio !== undefined ? String(bio).trim() : existing.bio,
      avatar: avatar !== undefined ? String(avatar).trim() : existing.avatar,
    };
    req.db.authors[idx] = updatedAuthor;
    saveDb(req.db);
    res.json({ author: updatedAuthor, authors: req.db.authors });
  });

  app.delete('/api/admin/authors/:id', requireAuth, (req, res) => {
    if (!Array.isArray(req.db.authors) || req.db.authors.length <= 1) {
      return res.status(400).json({ error: 'At least one author must remain.' });
    }
    const idx = req.db.authors.findIndex((a) => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Author not found.' });
    const [removed] = req.db.authors.splice(idx, 1);
    const fallbackId = req.db.authors[0].id;
    // Reassign any posts that belonged to the deleted author
    for (const post of req.db.posts || []) {
      if (post.authorId === removed.id) {
        post.authorId = fallbackId;
      }
    }
    saveDb(req.db);
    res.json({ ok: true, authors: req.db.authors, fallbackId });
  });

  // ==========================================
  // MEDIA UPLOAD & OPTIMIZATION API
  // ==========================================
  const ALLOWED_IMAGE_MIMES = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/avif': '.avif',
  };

  app.post('/api/admin/upload', requireAuth, (req, res) => {
    try {
      const { dataUrl, filename, alt, caption, width, height } = req.body || {};
      if (!dataUrl || typeof dataUrl !== 'string') {
        return res.status(400).json({ error: 'No image data provided.' });
      }

      const match = dataUrl.match(/^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/);
      if (!match) {
        return res.status(400).json({ error: 'Invalid image data format.' });
      }

      const mimeType = match[1].toLowerCase();
      const base64Data = match[2];

      if (!ALLOWED_IMAGE_MIMES[mimeType]) {
        return res.status(400).json({
          error: `Unsupported file type (${mimeType}). Only JPG, PNG, WebP, GIF, and AVIF are allowed.`,
        });
      }

      const buffer = Buffer.from(base64Data, 'base64');
      // 12 MB max after optimization
      if (buffer.length > 12 * 1024 * 1024) {
        return res.status(400).json({ error: 'File size exceeds the 12MB limit.' });
      }

      const ext = ALLOWED_IMAGE_MIMES[mimeType];
      const cleanBase = slugify((filename || 'image').replace(/\.[^.]+$/, '')).slice(0, 40);
      const storedFilename = `${cleanBase}-${Date.now()}${ext}`;
      const filePath = path.join(UPLOADS_DIR, storedFilename);

      fs.writeFileSync(filePath, buffer);

      const mediaItem = {
        id: `media-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        url: `/uploads/${storedFilename}`,
        name: filename || storedFilename,
        alt: String(alt || cleanBase.replace(/-/g, ' ')).trim(),
        caption: String(caption || '').trim(),
        mimeType,
        width: width || null,
        height: height || null,
        size: buffer.length,
        createdAt: new Date().toISOString(),
      };

      if (!Array.isArray(req.db.media)) req.db.media = [];
      req.db.media.unshift(mediaItem);
      saveDb(req.db);

      res.status(201).json({ media: mediaItem });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ error: 'Error uploading and processing image.' });
    }
  });

  app.patch('/api/admin/media/:id', requireAuth, (req, res) => {
    const item = (req.db.media || []).find((m) => m.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Media file not found' });
    if (req.body.alt !== undefined) item.alt = String(req.body.alt).trim();
    if (req.body.caption !== undefined) item.caption = String(req.body.caption).trim();
    saveDb(req.db);
    res.json({ media: item });
  });

  app.delete('/api/admin/media/:id', requireAuth, (req, res) => {
    const idx = (req.db.media || []).findIndex((m) => m.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Media file not found' });
    const [removed] = req.db.media.splice(idx, 1);
    if (removed.url && removed.url.startsWith('/uploads/')) {
      const diskPath = path.join(UPLOADS_DIR, path.basename(removed.url));
      if (fs.existsSync(diskPath)) {
        try {
          fs.unlinkSync(diskPath);
        } catch (e) {
          // ignore
        }
      }
    }
    saveDb(req.db);
    res.json({ ok: true });
  });

  // Dynamic SEO head generator for server-rendered meta & JSON-LD
  function buildSeoHeadForUrl(urlPath) {
    try {
      const db = loadDb();
      const postMatch = urlPath.match(/^\/post\/([^/?#]+)/);
      if (postMatch) {
        const slug = decodeURIComponent(postMatch[1]);
        const post = db.posts.find((p) => p.slug === slug && p.status === 'published');
        if (post) {
          const author = db.authors.find((a) => a.id === post.authorId) || db.authors[0];
          const metaTitle = post.seo?.metaTitle || `${post.title} | justmoneyhoney`;
          const metaDesc = post.seo?.metaDescription || post.excerpt || '';
          const canonical = post.seo?.canonicalUrl || `https://justmoneyhoney.com/post/${post.slug}`;
          const ogImage = post.seo?.ogImage || post.featuredImage || '';
          const jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: metaDesc,
            image: ogImage ? [ogImage] : [],
            datePublished: post.publishedAt || post.updatedAt,
            dateModified: post.updatedAt,
            author: [
              {
                '@type': 'Person',
                name: author?.name || 'justmoneyhoney Editorial',
              },
            ],
            publisher: {
              '@type': 'Organization',
              name: 'justmoneyhoney',
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': canonical,
            },
          };
          return `
            <link rel="canonical" href="${canonical}" />
            <meta property="og:type" content="article" />
            <meta property="og:title" content="${ (post.seo?.ogTitle || metaTitle).replace(/"/g, '&quot;') }" />
            <meta property="og:description" content="${ (post.seo?.ogDescription || metaDesc).replace(/"/g, '&quot;') }" />
            <meta property="og:image" content="${ ogImage.replace(/"/g, '&quot;') }" />
            <meta name="twitter:card" content="summary_large_image" />
            <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
          `;
        }
      }
    } catch (e) {
      // ignore
    }
    return '';
  }

  const distPath = path.join(__dirname, 'dist');
  const useBuiltDist = process.env.USE_VITE_DEV !== 'true' && fs.existsSync(path.join(distPath, 'index.html'));

  if (useBuiltDist) {
    app.use(express.static(distPath, { index: false }));
    app.get('*', (req, res) => {
      const htmlPath = path.join(distPath, 'index.html');
      let html = fs.readFileSync(htmlPath, 'utf-8');
      html = html.replace('<!--__DYNAMIC_SEO_HEAD__-->', buildSeoHeadForUrl(req.originalUrl));
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        template = template.replace('<!--__DYNAMIC_SEO_HEAD__-->', buildSeoHeadForUrl(url));
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  }

  return app;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const PORT = process.env.PORT || 3000;
  createServer().then((app) => {
    app.listen(PORT, () => {
      console.log(`justmoneyhoney server running at http://localhost:${PORT}`);
    });
  });
}
