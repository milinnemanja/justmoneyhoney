import React, { useState } from 'react';
import { Monitor, Smartphone, X, Clock, Calendar } from 'lucide-react';
import { extractTocAndInjectIds, sanitizeHtml } from '../../utils/sanitizeAndPaste';

export default function ArticlePreviewModal({ post, author, readingTimeMinutes, onClose }) {
  const [device, setDevice] = useState('desktop'); // 'desktop' | 'mobile'
  const { htmlWithIds } = extractTocAndInjectIds(sanitizeHtml(post.contentHtml || ''));

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-md">
      {/* Preview Top Bar */}
      <div className="h-14 px-6 border-b border-white/10 bg-[#101018] flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <span className="font-display font-black text-lg tracking-tight">
            <span className="text-white">just</span>
            <span className="text-[#FF2E93]">money</span>
            <span className="text-white">honey</span>
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FF2E93]/20 text-[#FF2E93] font-bold">
            Live Site Preview
          </span>
        </div>

        <div className="flex items-center gap-2 bg-black/50 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setDevice('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              device === 'desktop' ? 'bg-[#FF2E93] text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" /> Desktop
          </button>
          <button
            type="button"
            onClick={() => setDevice('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              device === 'mobile' ? 'bg-[#FF2E93] text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" /> Mobile (390px)
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold"
        >
          <X className="w-4 h-4" /> Close Preview
        </button>
      </div>

      {/* Preview Viewport */}
      <div className="flex-1 overflow-y-auto py-8 px-4 flex justify-center">
        <div
          className={`bg-[#08080C] text-white border border-white/15 rounded-3xl shadow-2xl overflow-y-auto transition-all duration-300 ${
            device === 'mobile' ? 'w-[390px] max-w-full px-5 py-6' : 'w-full max-w-4xl px-8 sm:px-14 py-10'
          }`}
        >
          {/* Simulated Site Header */}
          <div className="flex items-center justify-between pb-6 mb-8 border-b border-white/10">
            <div className="font-display font-black text-xl tracking-tight">
              <span className="text-white">just</span>
              <span className="text-[#FF2E93]">money</span>
              <span className="text-white">honey</span>
            </div>
            <span className="text-xs uppercase tracking-widest text-[#FF2E93] font-bold">
              {post.category || 'Finance'}
            </span>
          </div>

          {/* Article Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF2E93]/15 border border-[#FF2E93]/30 text-[#FF2E93] text-xs font-bold uppercase tracking-wider mb-4">
              {post.category || 'Finance'}
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl leading-tight mb-4">
              {post.title || 'Untitled Article'}
            </h1>
            {post.excerpt && (
              <p className="text-zinc-300 text-base sm:text-lg leading-relaxed mb-6">{post.excerpt}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pt-4 border-t border-white/10">
              {author && (
                <div className="flex items-center gap-2.5">
                  <img
                    src={author.avatar}
                    alt={author.name}
                    className="w-9 h-9 rounded-full object-cover border border-[#FF2E93]"
                  />
                  <div>
                    <div className="font-bold text-white">{author.name}</div>
                    <div className="text-[11px] text-zinc-400">{author.role}</div>
                  </div>
                </div>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#FF2E93]" />
                {new Date(post.publishedAt || Date.now()).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#FF2E93]" />
                {readingTimeMinutes} min read
              </span>
            </div>
          </div>

          {/* Featured Image */}
          {post.featuredImage && (
            <figure className="mb-8">
              <img
                src={post.featuredImage}
                alt={post.featuredImageAlt || post.title}
                className="w-full max-h-[460px] object-cover rounded-2xl border border-white/10"
              />
              {post.featuredImageCaption && (
                <figcaption className="text-xs text-zinc-400 text-center mt-2">
                  {post.featuredImageCaption}
                </figcaption>
              )}
            </figure>
          )}

          {/* Article Body */}
          <article
            className="jmh-prose"
            dangerouslySetInnerHTML={{ __html: htmlWithIds }}
          />

          {/* Tags Footer */}
          {post.tags?.length > 0 && (
            <div className="mt-10 pt-6 border-t border-white/10 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
