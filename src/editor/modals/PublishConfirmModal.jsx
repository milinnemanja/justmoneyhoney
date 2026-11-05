import React, { useState } from 'react';
import { Rocket, Calendar, CheckCircle2, AlertCircle, X, Globe, Lock } from 'lucide-react';

export default function PublishConfirmModal({
  post,
  seoAnalysis,
  onConfirmPublish,
  onConfirmSchedule,
  onClose,
}) {
  const [mode, setMode] = useState(post.status === 'scheduled' ? 'schedule' : 'publish');
  const [scheduleDate, setScheduleDate] = useState(
    post.scheduledAt
      ? new Date(post.scheduledAt).toISOString().slice(0, 16)
      : new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  );
  const [visibility, setVisibility] = useState(post.visibility || 'public');

  const warnings = seoAnalysis.checks.filter((c) => !c.passed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#12121B] border border-white/15 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-[#FF2E93]" />
            <h3 className="font-display font-extrabold text-lg">Ready to publish this article?</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Card */}
        <div className="p-4 rounded-xl bg-black/50 border border-white/10 mb-4 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[#FF2E93]">{post.category}</div>
          <div className="font-display font-bold text-base text-white">{post.title || 'Untitled Article'}</div>
          <div className="text-xs text-zinc-400 truncate">/post/{post.slug || 'article'}</div>
          <div className="flex items-center gap-4 pt-2 text-xs text-zinc-300">
            <span>{seoAnalysis.wordCount} words</span>
            <span>•</span>
            <span>{seoAnalysis.readingTimeMinutes} min read</span>
            <span>•</span>
            <span className="font-bold text-[#FF2E93]">SEO Score: {seoAnalysis.score}/100</span>
          </div>
        </div>

        {/* Mode Selector: Publish Now vs Schedule */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={() => setMode('publish')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
              mode === 'publish'
                ? 'bg-[#FF2E93]/20 border-[#FF2E93] text-white'
                : 'bg-white/5 border-white/10 text-zinc-400'
            }`}
          >
            <Rocket className="w-4 h-4 text-[#FF2E93]" /> Publish Now
          </button>
          <button
            type="button"
            onClick={() => setMode('schedule')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
              mode === 'schedule'
                ? 'bg-[#FF2E93]/20 border-[#FF2E93] text-white'
                : 'bg-white/5 border-white/10 text-zinc-400'
            }`}
          >
            <Calendar className="w-4 h-4 text-[#FF2E93]" /> Schedule for Later
          </button>
        </div>

        {mode === 'schedule' && (
          <div className="mb-4 p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
              Scheduled Date & Time
            </label>
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/15 text-xs text-white focus:border-[#FF2E93] outline-none"
            />
          </div>
        )}

        {/* Visibility */}
        <div className="mb-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
            Article Visibility
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setVisibility('public')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${
                visibility === 'public'
                  ? 'border-emerald-400 bg-emerald-500/10 text-emerald-300'
                  : 'border-white/10 bg-white/5 text-zinc-400'
              }`}
            >
              <Globe className="w-4 h-4" /> Public on Website
            </button>
            <button
              type="button"
              onClick={() => setVisibility('private')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${
                visibility === 'private'
                  ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                  : 'border-white/10 bg-white/5 text-zinc-400'
              }`}
            >
              <Lock className="w-4 h-4" /> Private (Admin Only)
            </button>
          </div>
        </div>

        {/* Non-blocking SEO suggestions */}
        <div className="mb-5 p-3.5 rounded-xl bg-white/[0.02] border border-white/10 max-h-36 overflow-y-auto">
          <div className="text-xs font-bold text-zinc-300 mb-2">
            Pre-Publish SEO Check ({seoAnalysis.checks.length - warnings.length}/{seoAnalysis.checks.length} passed — non-blocking)
          </div>
          {warnings.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 className="w-4 h-4" /> Everything looks great! Your article is ready for search engines.
            </div>
          ) : (
            <ul className="space-y-1.5 text-xs text-amber-300">
              {warnings.map((w) => (
                <li key={w.id} className="flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                  <span>{w.label}: {w.hint}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold"
          >
            Back to Editor
          </button>
          {mode === 'schedule' ? (
            <button
              type="button"
              onClick={() => {
                onConfirmSchedule({
                  scheduledAt: new Date(scheduleDate).toISOString(),
                  visibility,
                });
              }}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#FF2E93] hover:bg-[#ff4da2] text-xs font-bold text-white shadow-lg shadow-[#FF2E93]/30"
            >
              <Calendar className="w-4 h-4" /> Confirm Schedule
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onConfirmPublish({ visibility });
              }}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#FF2E93] hover:bg-[#ff4da2] text-xs font-bold text-white shadow-lg shadow-[#FF2E93]/30"
            >
              <Rocket className="w-4 h-4" /> Confirm & Publish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
