import React, { useState } from 'react';
import {
  Settings,
  Search,
  Image as ImageIcon,
  History,
  CheckCircle2,
  AlertTriangle,
  Plus,
  X,
  Upload,
  Globe,
  Share2,
  Code2,
  ListTree,
  Link2,
  RotateCcw,
  Trash2,
  Users,
} from 'lucide-react';

export default function EditorSidebar({
  activeTab,
  setActiveTab,
  post,
  updatePost,
  updateSeo,
  authors = [],
  categories = [],
  allPosts = [],
  mediaLibrary = [],
  seoAnalysis,
  onUploadMediaFiles,
  onInsertImageIntoEditor,
  onInsertGalleryIntoEditor,
  onDeleteMediaItem,
  onFixMissingInlineAlts,
  onRestoreRevision,
  onSaveManualRevision,
  onOpenAuthorManager,
  isUploading,
  editorTheme,
}) {
  const [tagInput, setTagInput] = useState('');
  const [serpMode, setSerpMode] = useState('desktop');
  const [selectedGalleryUrls, setSelectedGalleryUrls] = useState([]);
  const [showJsonLd, setShowJsonLd] = useState(false);

  const isLight = editorTheme === 'light';
  const inputBg = isLight
    ? 'bg-white border-zinc-300 text-zinc-900 focus:border-[#FF2E93]'
    : 'bg-black/50 border-white/15 text-white focus:border-[#FF2E93]';
  const cardBg = isLight
    ? 'bg-zinc-50 border-zinc-200 text-zinc-900'
    : 'bg-white/[0.03] border-white/10 text-white';
  const mutedText = isLight ? 'text-zinc-500' : 'text-zinc-400';

  const handleAddTag = (tagText) => {
    const clean = String(tagText || tagInput).trim();
    if (!clean) return;
    if (!(post.tags || []).includes(clean)) {
      updatePost({ tags: [...(post.tags || []), clean] });
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    updatePost({ tags: (post.tags || []).filter((t) => t !== tagToRemove) });
  };

  const toggleRelatedPost = (relatedId) => {
    const current = post.relatedPostIds || [];
    if (current.includes(relatedId)) {
      updatePost({ relatedPostIds: current.filter((id) => id !== relatedId) });
    } else {
      updatePost({ relatedPostIds: [...current, relatedId] });
    }
  };

  const toggleSelectForGallery = (mediaItem) => {
    setSelectedGalleryUrls((prev) =>
      prev.some((m) => m.id === mediaItem.id)
        ? prev.filter((m) => m.id !== mediaItem.id)
        : [...prev, mediaItem]
    );
  };

  return (
    <aside
      className={`w-full lg:w-[390px] shrink-0 border-l flex flex-col h-full overflow-hidden ${
        isLight ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-[#0E0E16] border-white/10 text-white'
      }`}
    >
      {/* Sidebar Navigation Tabs */}
      <div
        className={`grid grid-cols-4 border-b text-xs font-bold ${
          isLight ? 'border-zinc-200 bg-zinc-100/70' : 'border-white/10 bg-black/30'
        }`}
      >
        {[
          { id: 'settings', label: 'Settings', icon: Settings },
          { id: 'seo', label: `SEO (${seoAnalysis.score})`, icon: Search },
          { id: 'media', label: 'Media', icon: ImageIcon },
          { id: 'revisions', label: 'History', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 py-3 px-1 border-b-2 transition ${
                active
                  ? 'border-[#FF2E93] text-[#FF2E93] bg-[#FF2E93]/5'
                  : `border-transparent ${mutedText} hover:text-[#FF2E93]`
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* ==========================================
            TAB 1: POST SETTINGS
           ========================================== */}
        {activeTab === 'settings' && (
          <>
            {/* Status, Visibility & Schedule */}
            <div className={`p-3.5 rounded-xl border ${cardBg} space-y-3`}>
              <div className="font-display font-extrabold text-sm flex items-center justify-between">
                <span>Publishing & Visibility</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                    post.status === 'published'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : post.status === 'scheduled'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-zinc-500/20 text-zinc-400'
                  }`}
                >
                  {post.status === 'published'
                    ? 'Published'
                    : post.status === 'scheduled'
                    ? 'Scheduled'
                    : 'Draft'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${mutedText}`}>Status</label>
                  <select
                    value={post.status || 'draft'}
                    onChange={(e) => updatePost({ status: e.target.value })}
                    className={`w-full px-2.5 py-2 rounded-lg border outline-none ${inputBg}`}
                  >
                    <option value="draft">Draft (Private)</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${mutedText}`}>Visibility</label>
                  <select
                    value={post.visibility || 'public'}
                    onChange={(e) => updatePost({ visibility: e.target.value })}
                    className={`w-full px-2.5 py-2 rounded-lg border outline-none ${inputBg}`}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private (Admin only)</option>
                  </select>
                </div>
              </div>

              {post.status === 'scheduled' && (
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 text-amber-400`}>
                    Scheduled Publish Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={
                      post.scheduledAt
                        ? new Date(post.scheduledAt).toISOString().slice(0, 16)
                        : new Date(Date.now() + 86400000).toISOString().slice(0, 16)
                    }
                    onChange={(e) =>
                      updatePost({
                        scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                      })
                    }
                    className={`w-full px-2.5 py-1.5 rounded-lg border outline-none ${inputBg}`}
                  />
                </div>
              )}

              <div>
                <label className={`block text-[11px] font-semibold mb-1 ${mutedText}`}>
                  Publish Date
                </label>
                <input
                  type="datetime-local"
                  value={
                    post.publishedAt
                      ? new Date(post.publishedAt).toISOString().slice(0, 16)
                      : new Date().toISOString().slice(0, 16)
                  }
                  onChange={(e) =>
                    updatePost({
                      publishedAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                    })
                  }
                  className={`w-full px-2.5 py-1.5 rounded-lg border outline-none ${inputBg}`}
                />
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(post.featured)}
                  onChange={(e) => updatePost({ featured: e.target.checked })}
                  className="accent-[#FF2E93]"
                />
                <span className="font-semibold">Feature in homepage hero spotlight</span>
              </label>
            </div>

            {/* Title, Slug & Excerpt */}
            <div className={`p-3.5 rounded-xl border ${cardBg} space-y-3`}>
              <div className="font-display font-extrabold text-sm">Article Details</div>
              <div>
                <label className={`block text-[11px] font-semibold mb-1 ${mutedText}`}>Article Title</label>
                <input
                  type="text"
                  value={post.title || ''}
                  onChange={(e) => updatePost({ title: e.target.value })}
                  placeholder="Enter a compelling headline..."
                  className={`w-full px-3 py-2 rounded-lg border outline-none ${inputBg}`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`text-[11px] font-semibold ${mutedText}`}>URL Slug</label>
                  <button
                    type="button"
                    onClick={() => {
                      const generated = (post.title || 'article')
                        .toLowerCase()
                        .replace(/č/g, 'c')
                        .replace(/ć/g, 'c')
                        .replace(/š/g, 's')
                        .replace(/ž/g, 'z')
                        .replace(/đ/g, 'dj')
                        .replace(/[^\w\s-]/g, '')
                        .trim()
                        .replace(/\s+/g, '-');
                      updatePost({ slug: generated });
                    }}
                    className="text-[10px] text-[#FF2E93] font-bold hover:underline"
                  >
                    Generate from title
                  </button>
                </div>
                <div className="flex items-center">
                  <span className={`px-2 py-2 rounded-l-lg border border-r-0 border-white/15 bg-black/30 ${mutedText}`}>
                    /post/
                  </span>
                  <input
                    type="text"
                    value={post.slug || ''}
                    onChange={(e) => updatePost({ slug: e.target.value })}
                    className={`w-full px-2.5 py-2 rounded-r-lg border outline-none ${inputBg}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-[11px] font-semibold mb-1 ${mutedText}`}>
                  Short Excerpt / Summary
                </label>
                <textarea
                  rows={3}
                  value={post.excerpt || ''}
                  onChange={(e) => updatePost({ excerpt: e.target.value })}
                  placeholder="Short summary (1–2 sentences) displayed on article cards..."
                  className={`w-full px-3 py-2 rounded-lg border outline-none resize-y ${inputBg}`}
                />
              </div>
            </div>

            {/* Category, Author & Tags */}
            <div className={`p-3.5 rounded-xl border ${cardBg} space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="font-display font-extrabold text-sm">Category & Author</span>
                {onOpenAuthorManager && (
                  <button
                    type="button"
                    onClick={onOpenAuthorManager}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FF2E93]/15 hover:bg-[#FF2E93] text-[#FF2E93] hover:text-white font-bold text-[11px] transition"
                  >
                    <Users className="w-3 h-3" /> Authors / + New
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${mutedText}`}>Category</label>
                  <select
                    value={post.category || 'Finance'}
                    onChange={(e) => updatePost({ category: e.target.value })}
                    className={`w-full px-2.5 py-2 rounded-lg border outline-none ${inputBg}`}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${mutedText}`}>Author</label>
                  <select
                    value={post.authorId || authors[0]?.id || 'author-1'}
                    onChange={(e) => updatePost({ authorId: e.target.value })}
                    className={`w-full px-2.5 py-2 rounded-lg border outline-none ${inputBg}`}
                  >
                    {authors.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active Author Card Preview */}
              {(() => {
                const activeAuthor =
                  authors.find((a) => a.id === post.authorId) || authors[0];
                if (!activeAuthor) return null;
                return (
                  <div className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-black/25 border border-white/10">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={activeAuthor.avatar}
                        alt={activeAuthor.name}
                        className="w-8 h-8 rounded-full object-cover border border-[#FF2E93] shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-xs truncate">{activeAuthor.name}</div>
                        <div className={`text-[10px] truncate ${mutedText}`}>{activeAuthor.role}</div>
                      </div>
                    </div>
                    {onOpenAuthorManager && (
                      <button
                        type="button"
                        onClick={onOpenAuthorManager}
                        className="text-[10px] font-bold text-[#FF2E93] hover:underline shrink-0"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Tags */}
              <div>
                <label className={`block text-[11px] font-semibold mb-1 ${mutedText}`}>Tags</label>
                <div className="flex gap-1.5 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Add tag and press Enter..."
                    className={`flex-1 px-2.5 py-1.5 rounded-lg border outline-none ${inputBg}`}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTag()}
                    className="px-3 py-1.5 rounded-lg bg-[#FF2E93] text-white font-bold"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(post.tags || []).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FF2E93]/15 border border-[#FF2E93]/30 text-[#FF2E93] font-semibold"
                    >
                      #{tag}
                      <button type="button" onClick={() => handleRemoveTag(tag)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Featured Image & ALT text */}
            <div className={`p-3.5 rounded-xl border ${cardBg} space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="font-display font-extrabold text-sm">Featured Image</span>
                <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FF2E93] text-white font-bold text-[11px]">
                  <Upload className="w-3 h-3" />
                  <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) {
                        const uploaded = await onUploadMediaFiles(files);
                        if (uploaded?.[0]) {
                          updatePost({
                            featuredImage: uploaded[0].url,
                            featuredImageAlt: uploaded[0].alt || post.title,
                          });
                        }
                      }
                    }}
                  />
                </label>
              </div>

              {post.featuredImage ? (
                <div className="relative rounded-xl overflow-hidden border border-white/10">
                  <img
                    src={post.featuredImage}
                    alt={post.featuredImageAlt || ''}
                    className="w-full h-36 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => updatePost({ featuredImage: '', featuredImageAlt: '' })}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 text-red-400 hover:bg-black"
                    title="Remove featured image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className={`p-4 rounded-xl border border-dashed text-center ${mutedText}`}>
                  No featured image set. Upload above or paste an image URL below.
                </div>
              )}

              <div>
                <label className={`block text-[11px] font-semibold mb-1 ${mutedText}`}>Image URL</label>
                <input
                  type="text"
                  value={post.featuredImage || ''}
                  onChange={(e) => updatePost({ featuredImage: e.target.value })}
                  placeholder="https://... or /uploads/..."
                  className={`w-full px-2.5 py-1.5 rounded-lg border outline-none ${inputBg}`}
                />
              </div>

              <div>
                <label className={`block text-[11px] font-semibold mb-1 ${mutedText}`}>
                  Featured Image ALT Text (Important for SEO)
                </label>
                <input
                  type="text"
                  value={post.featuredImageAlt || ''}
                  onChange={(e) => updatePost({ featuredImageAlt: e.target.value })}
                  placeholder="Describe the featured image..."
                  className={`w-full px-2.5 py-1.5 rounded-lg border outline-none ${inputBg}`}
                />
              </div>

              <div>
                <label className={`block text-[11px] font-semibold mb-1 ${mutedText}`}>
                  Featured Image Caption
                </label>
                <input
                  type="text"
                  value={post.featuredImageCaption || ''}
                  onChange={(e) => updatePost({ featuredImageCaption: e.target.value })}
                  placeholder="Optional caption or photo credit..."
                  className={`w-full px-2.5 py-1.5 rounded-lg border outline-none ${inputBg}`}
                />
              </div>
            </div>

            {/* Related Articles */}
            <div className={`p-3.5 rounded-xl border ${cardBg} space-y-2.5`}>
              <div className="font-display font-extrabold text-sm">Related Articles</div>
              <p className={`text-[11px] ${mutedText}`}>
                Select articles to recommend at the bottom of this post:
              </p>
              <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                {allPosts
                  .filter((p) => p.id !== post.id)
                  .map((p) => {
                    const checked = (post.relatedPostIds || []).includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
                          checked
                            ? 'border-[#FF2E93] bg-[#FF2E93]/10'
                            : 'border-white/10 hover:bg-white/5'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRelatedPost(p.id)}
                          className="accent-[#FF2E93]"
                        />
                        <span className="truncate font-medium flex-1">{p.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-400">
                          {p.category}
                        </span>
                      </label>
                    );
                  })}
              </div>
            </div>
          </>
        )}

        {/* ==========================================
            TAB 2: SEO OPTIMIZATION PANEL
           ========================================== */}
        {activeTab === 'seo' && (
          <>
            {/* Score Banner */}
            <div className={`p-4 rounded-xl border ${cardBg} flex items-center justify-between`}>
              <div>
                <div className="text-[11px] uppercase tracking-wider font-bold text-[#FF2E93]">
                  Real-Time SEO Score
                </div>
                <div className="font-display font-black text-2xl mt-0.5">
                  {seoAnalysis.score} <span className={`text-sm font-normal ${mutedText}`}>/ 100</span>
                </div>
                <div className={`text-[11px] mt-0.5 ${mutedText}`}>
                  Helpful suggestions — never blocks publishing.
                </div>
              </div>
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-display font-black text-lg border-2 ${
                  seoAnalysis.score >= 80
                    ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10'
                    : seoAnalysis.score >= 55
                    ? 'border-amber-400 text-amber-400 bg-amber-500/10'
                    : 'border-[#FF2E93] text-[#FF2E93] bg-[#FF2E93]/10'
                }`}
              >
                {seoAnalysis.score}%
              </div>
            </div>

            {/* Focus Keyword & Suggestions */}
            <div className={`p-3.5 rounded-xl border ${cardBg} space-y-2.5`}>
              <div className="flex items-center gap-1.5 font-display font-extrabold text-sm">
                <Search className="w-4 h-4 text-[#FF2E93]" />
                <span>Focus Keyword & Suggestions</span>
              </div>
              <input
                type="text"
                value={post.seo?.focusKeyword || ''}
                onChange={(e) => updateSeo({ focusKeyword: e.target.value })}
                placeholder="e.g. luxury real estate investment"
                className={`w-full px-3 py-2 rounded-lg border outline-none ${inputBg}`}
              />
              <div>
                <div className={`text-[10px] uppercase tracking-wider font-semibold mb-1.5 ${mutedText}`}>
                  Suggested Keywords ({post.category}):
                </div>
                <div className="flex flex-wrap gap-1">
                  {seoAnalysis.keywordSuggestions.map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => updateSeo({ focusKeyword: kw })}
                      className={`px-2 py-0.5 rounded-full text-[11px] border transition ${
                        post.seo?.focusKeyword === kw
                          ? 'bg-[#FF2E93] text-white border-[#FF2E93]'
                          : 'border-white/15 hover:border-[#FF2E93] text-zinc-300'
                      }`}
                    >
                      + {kw}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Meta Title, Description & Canonical */}
            <div className={`p-3.5 rounded-xl border ${cardBg} space-y-3`}>
              <div className="font-display font-extrabold text-sm">Search Engine Meta Tags</div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className={`text-[11px] font-semibold ${mutedText}`}>SEO Meta Title</label>
                  <span
                    className={`text-[10px] font-bold ${
                      (post.seo?.metaTitle || post.title || '').length > 60
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {(post.seo?.metaTitle || post.title || '').length} / 60
                  </span>
                </div>
                <input
                  type="text"
                  value={post.seo?.metaTitle ?? ''}
                  onChange={(e) => updateSeo({ metaTitle: e.target.value })}
                  placeholder={post.title || 'SEO Title...'}
                  className={`w-full px-2.5 py-2 rounded-lg border outline-none ${inputBg}`}
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label className={`text-[11px] font-semibold ${mutedText}`}>Meta Description</label>
                  <span
                    className={`text-[10px] font-bold ${
                      (post.seo?.metaDescription || post.excerpt || '').length > 160
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {(post.seo?.metaDescription || post.excerpt || '').length} / 160
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={post.seo?.metaDescription ?? ''}
                  onChange={(e) => updateSeo({ metaDescription: e.target.value })}
                  placeholder={post.excerpt || 'Search snippet description for Google results...'}
                  className={`w-full px-2.5 py-2 rounded-lg border outline-none resize-y ${inputBg}`}
                />
              </div>

              <div>
                <label className={`block text-[11px] font-semibold mb-1 ${mutedText}`}>
                  URL Slug
                </label>
                <input
                  type="text"
                  value={post.slug || ''}
                  onChange={(e) => updatePost({ slug: e.target.value })}
                  className={`w-full px-2.5 py-1.5 rounded-lg border outline-none ${inputBg}`}
                />
              </div>

              <div>
                <label className={`block text-[11px] font-semibold mb-1 ${mutedText}`}>
                  Canonical URL
                </label>
                <input
                  type="text"
                  value={
                    post.seo?.canonicalUrl || `https://justmoneyhoney.com/post/${post.slug || 'article'}`
                  }
                  onChange={(e) => updateSeo({ canonicalUrl: e.target.value })}
                  className={`w-full px-2.5 py-1.5 rounded-lg border outline-none ${inputBg}`}
                />
              </div>
            </div>

            {/* Live Google SERP Preview */}
            <div className={`p-3.5 rounded-xl border ${cardBg} space-y-2.5`}>
              <div className="flex items-center justify-between">
                <span className="font-display font-extrabold text-sm flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-[#FF2E93]" /> Google Search Preview
                </span>
                <div className="flex gap-1">
                  {[
                    { k: 'desktop', l: 'Desktop' },
                    { k: 'mobile', l: 'Mobile' },
                  ].map((m) => (
                    <button
                      key={m.k}
                      type="button"
                      onClick={() => setSerpMode(m.k)}
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        serpMode === m.k ? 'bg-[#FF2E93] text-white' : 'bg-white/10 text-zinc-400'
                      }`}
                    >
                      {m.l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white text-zinc-900 border border-zinc-200 shadow-inner">
                <div className="flex items-center gap-2 text-[11px] text-zinc-600 mb-1">
                  <span className="w-5 h-5 rounded-full bg-[#08080C] text-[#FF2E93] font-black flex items-center justify-center text-[10px]">
                    J
                  </span>
                  <div className="truncate">
                    <div className="font-semibold text-zinc-800 leading-none">justmoneyhoney</div>
                    <div className="text-[10px] text-zinc-500 truncate">
                      https://justmoneyhoney.com › post › {post.slug || 'article'}
                    </div>
                  </div>
                </div>
                <div
                  className={`text-[#1a0dab] font-semibold leading-snug hover:underline cursor-pointer ${
                    serpMode === 'mobile' ? 'text-sm' : 'text-base'
                  }`}
                >
                  {(post.seo?.metaTitle || post.title || 'Untitled Article').slice(0, 62)}
                </div>
                <div className="text-xs text-zinc-600 mt-1 line-clamp-2 leading-relaxed">
                  {(
                    post.seo?.metaDescription ||
                    post.excerpt ||
                    'Add a meta description to preview how your article will appear in Google search results.'
                  ).slice(0, 162)}
                </div>
              </div>
            </div>

            {/* Open Graph & Social Sharing Preview */}
            <div className={`p-3.5 rounded-xl border ${cardBg} space-y-2.5`}>
              <div className="font-display font-extrabold text-sm flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-[#FF2E93]" /> Social Card Preview (Open Graph)
              </div>
              <div className="rounded-xl overflow-hidden border border-white/15 bg-[#161622]">
                {(post.seo?.ogImage || post.featuredImage) && (
                  <img
                    src={post.seo?.ogImage || post.featuredImage}
                    alt="Social card preview"
                    className="w-full h-32 object-cover"
                  />
                )}
                <div className="p-3">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-400">
                    JUSTMONEYHONEY.COM
                  </div>
                  <div className="font-bold text-white text-xs mt-0.5 line-clamp-1">
                    {post.seo?.ogTitle || post.seo?.metaTitle || post.title}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">
                    {post.seo?.ogDescription || post.seo?.metaDescription || post.excerpt}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  value={post.seo?.ogTitle ?? ''}
                  onChange={(e) => updateSeo({ ogTitle: e.target.value })}
                  placeholder="Custom social title (optional)..."
                  className={`w-full px-2.5 py-1.5 rounded-lg border outline-none ${inputBg}`}
                />
                <input
                  type="text"
                  value={post.seo?.ogDescription ?? ''}
                  onChange={(e) => updateSeo({ ogDescription: e.target.value })}
                  placeholder="Custom social description (optional)..."
                  className={`w-full px-2.5 py-1.5 rounded-lg border outline-none ${inputBg}`}
                />
                <input
                  type="text"
                  value={post.seo?.ogImage ?? ''}
                  onChange={(e) => updateSeo({ ogImage: e.target.value })}
                  placeholder="Social image URL (defaults to featured image)..."
                  className={`w-full px-2.5 py-1.5 rounded-lg border outline-none ${inputBg}`}
                />
              </div>
            </div>

            {/* SEO Checks & Audits */}
            <div className={`p-3.5 rounded-xl border ${cardBg} space-y-2.5`}>
              <div className="font-display font-extrabold text-sm">SEO Checklist</div>
              <div className="space-y-2">
                {seoAnalysis.checks.map((c) => (
                  <div key={c.id} className="flex items-start gap-2">
                    {c.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-semibold">{c.label}</div>
                      {!c.passed && <div className={`text-[11px] ${mutedText}`}>{c.hint}</div>}
                    </div>
                  </div>
                ))}
              </div>

              {seoAnalysis.missingInlineAlt.length > 0 && (
                <button
                  type="button"
                  onClick={onFixMissingInlineAlts}
                  className="w-full mt-2 py-1.5 px-3 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs hover:bg-amber-500/30"
                >
                  Auto-fill missing ALT text ({seoAnalysis.missingInlineAlt.length})
                </button>
              )}
            </div>

            {/* Heading Structure */}
            <div className={`p-3.5 rounded-xl border ${cardBg} space-y-2`}>
              <div className="font-display font-extrabold text-sm flex items-center gap-1.5">
                <ListTree className="w-4 h-4 text-[#FF2E93]" /> Heading Structure (
                {seoAnalysis.headings.length})
              </div>
              {seoAnalysis.headingIssues.length > 0 && (
                <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px]">
                  {seoAnalysis.headingIssues.map((iss, i) => (
                    <div key={i}>• {iss}</div>
                  ))}
                </div>
              )}
              {seoAnalysis.headings.length === 0 ? (
                <p className={mutedText}>No subheadings yet. Type /h2 or use the formatting toolbar.</p>
              ) : (
                <ul className="space-y-1 max-h-36 overflow-y-auto">
                  {seoAnalysis.headings.map((h) => (
                    <li
                      key={h.index}
                      style={{ paddingLeft: `${Math.max(0, h.level - 1) * 10}px` }}
                      className="flex items-center gap-1.5 truncate"
                    >
                      <span className="px-1.5 py-0.5 rounded bg-[#FF2E93]/20 text-[#FF2E93] font-mono text-[10px] font-bold">
                        {h.tag}
                      </span>
                      <span className="truncate">{h.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Internal & External Link Audit */}
            <div className={`p-3.5 rounded-xl border ${cardBg} space-y-2`}>
              <div className="font-display font-extrabold text-sm flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-[#FF2E93]" /> Link Audit ({seoAnalysis.links.length})
              </div>
              <div className="flex gap-3 text-[11px]">
                <span className="text-emerald-400 font-bold">
                  Internal: {seoAnalysis.internalLinks.length}
                </span>
                <span className="text-sky-400 font-bold">
                  External: {seoAnalysis.externalLinks.length}
                </span>
              </div>
              {seoAnalysis.links.length > 0 && (
                <div className="max-h-32 overflow-y-auto space-y-1 pt-1">
                  {seoAnalysis.links.map((lnk, i) => (
                    <div
                      key={i}
                      className="p-1.5 rounded bg-black/30 border border-white/10 flex items-center justify-between gap-2 text-[11px]"
                    >
                      <div className="truncate">
                        <span className="font-semibold text-white">{lnk.text}</span>
                        <span className="text-zinc-400 ml-1">({lnk.href})</span>
                      </div>
                      <span
                        className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
                          lnk.isInternal
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-sky-500/20 text-sky-300'
                        }`}
                      >
                        {lnk.isInternal ? 'Internal' : 'External'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* JSON-LD Structured Data */}
            <div className={`p-3.5 rounded-xl border ${cardBg} space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="font-display font-extrabold text-sm flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-[#FF2E93]" /> JSON-LD Structured Data
                </span>
                <button
                  type="button"
                  onClick={() => setShowJsonLd((v) => !v)}
                  className="text-[11px] text-[#FF2E93] font-bold hover:underline"
                >
                  {showJsonLd ? 'Hide Schema' : 'Show JSON-LD'}
                </button>
              </div>
              {showJsonLd && (
                <pre className="p-2.5 rounded-lg bg-black text-emerald-300 font-mono text-[10px] overflow-x-auto max-h-48">
                  {JSON.stringify(seoAnalysis.jsonLd, null, 2)}
                </pre>
              )}
            </div>
          </>
        )}

        {/* ==========================================
            TAB 3: MEDIA LIBRARY
           ========================================== */}
        {activeTab === 'media' && (
          <>
            <div className={`p-4 rounded-xl border border-dashed ${cardBg} text-center space-y-2`}>
              <Upload className="w-7 h-7 text-[#FF2E93] mx-auto" />
              <div className="font-display font-bold text-sm">
                Upload & Auto-Optimize Images
              </div>
              <p className={`text-[11px] ${mutedText}`}>
                JPG, PNG, WebP, GIF, AVIF. Automatic compression for fast page loads.
              </p>
              <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF2E93] hover:bg-[#ff4da2] text-white font-bold cursor-pointer shadow-lg shadow-[#FF2E93]/25">
                <Plus className="w-4 h-4" />
                <span>{isUploading ? 'Optimizing...' : 'Select Images'}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      await onUploadMediaFiles(files);
                    }
                  }}
                />
              </label>
            </div>

            {selectedGalleryUrls.length >= 2 && (
              <div className="p-3 rounded-xl bg-[#FF2E93]/15 border border-[#FF2E93]/40 flex items-center justify-between">
                <span className="font-bold text-[#FF2E93]">
                  Selected: {selectedGalleryUrls.length} images
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onInsertGalleryIntoEditor(
                      selectedGalleryUrls.map((m) => ({
                        src: m.url,
                        alt: m.alt || m.name,
                        caption: m.caption || '',
                      }))
                    );
                    setSelectedGalleryUrls([]);
                  }}
                  className="px-3 py-1 rounded-lg bg-[#FF2E93] text-white font-bold"
                >
                  Insert as Gallery
                </button>
              </div>
            )}

            <div className="space-y-2.5">
              <div className="font-display font-extrabold text-sm">
                Media Library ({mediaLibrary.length})
              </div>
              {mediaLibrary.map((item) => {
                const isSelected = selectedGalleryUrls.some((m) => m.id === item.id);
                return (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-xl border ${cardBg} flex gap-3 items-start`}
                  >
                    <img
                      src={item.url}
                      alt={item.alt || item.name}
                      className="w-16 h-16 rounded-lg object-cover shrink-0 border border-white/10"
                    />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="font-semibold truncate">{item.name}</div>
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            onInsertImageIntoEditor({
                              src: item.url,
                              alt: item.alt || item.name,
                              caption: item.caption || '',
                            })
                          }
                          className="px-2 py-0.5 rounded bg-[#FF2E93] text-white font-bold text-[10px]"
                        >
                          Insert in Body
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updatePost({
                              featuredImage: item.url,
                              featuredImageAlt: item.alt || post.title,
                            })
                          }
                          className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 font-semibold text-[10px]"
                        >
                          Set as Featured
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSelectForGallery(item)}
                          className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                            isSelected
                              ? 'bg-emerald-500 text-white'
                              : 'bg-white/10 hover:bg-white/20'
                          }`}
                        >
                          {isSelected ? '✓ Gallery' : '+ Gallery'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteMediaItem(item.id)}
                          className="p-0.5 rounded hover:bg-red-500/20 text-red-400 ml-auto"
                          title="Delete image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ==========================================
            TAB 4: REVISION HISTORY
           ========================================== */}
        {activeTab === 'revisions' && (
          <>
            <div className={`p-3.5 rounded-xl border ${cardBg} space-y-2.5`}>
              <div className="flex items-center justify-between">
                <span className="font-display font-extrabold text-sm">Revision History</span>
                <button
                  type="button"
                  onClick={onSaveManualRevision}
                  className="px-2.5 py-1 rounded-lg bg-[#FF2E93] text-white font-bold text-[11px]"
                >
                  + Save Revision
                </button>
              </div>
              <p className={`text-[11px] ${mutedText}`}>
                Every manual save or publish creates a backup snapshot you can restore in one click.
              </p>
            </div>

            <div className="space-y-2">
              {(post.revisions || []).length === 0 ? (
                <div className={`p-4 rounded-xl border text-center ${mutedText}`}>
                  No revisions saved yet. Click "Save Draft" to create the first snapshot.
                </div>
              ) : (
                (post.revisions || []).map((rev, idx) => (
                  <div
                    key={rev.id || idx}
                    className={`p-3 rounded-xl border ${cardBg} flex items-center justify-between gap-2`}
                  >
                    <div className="min-w-0">
                      <div className="font-bold truncate">{rev.note || 'Saved revision'}</div>
                      <div className={`text-[11px] ${mutedText}`}>
                        {new Date(rev.savedAt).toLocaleString('en-US')}
                      </div>
                      {rev.title && (
                        <div className="text-[11px] text-[#FF2E93] truncate mt-0.5">{rev.title}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onRestoreRevision(rev)}
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-[#FF2E93] hover:text-white font-bold text-[11px] transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Restore
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
