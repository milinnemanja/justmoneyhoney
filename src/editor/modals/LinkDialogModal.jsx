import React, { useState, useMemo } from 'react';
import { Link2, ExternalLink, Search, Trash2, X, Check, ShieldAlert } from 'lucide-react';

export default function LinkDialogModal({
  initialHref = '',
  initialTarget = '_self',
  initialRel = '',
  allPosts = [],
  onApply,
  onRemove,
  onClose,
}) {
  const [url, setUrl] = useState(initialHref || '');
  const [openInNewTab, setOpenInNewTab] = useState(initialTarget === '_blank');
  const [nofollow, setNofollow] = useState(initialRel.includes('nofollow'));
  const [sponsored, setSponsored] = useState(initialRel.includes('sponsored'));
  const [searchQuery, setSearchQuery] = useState('');

  const matchingInternalPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allPosts
      .filter((p) => {
        if (!q) return true;
        return (
          p.title.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q)
        );
      })
      .slice(0, 6);
  }, [allPosts, searchQuery]);

  const handleConfirm = (e) => {
    e.preventDefault();
    let finalUrl = url.trim();
    if (!finalUrl) {
      onRemove();
      onClose();
      return;
    }
    if (
      !finalUrl.startsWith('/') &&
      !finalUrl.startsWith('#') &&
      !finalUrl.startsWith('http://') &&
      !finalUrl.startsWith('https://') &&
      !finalUrl.startsWith('mailto:')
    ) {
      finalUrl = `https://${finalUrl}`;
    }

    const isExternal = finalUrl.startsWith('http://') || finalUrl.startsWith('https://');
    const relParts = new Set();
    if (openInNewTab || isExternal) {
      relParts.add('noopener');
      relParts.add('noreferrer');
    }
    if (nofollow) relParts.add('nofollow');
    if (sponsored) relParts.add('sponsored');

    onApply({
      href: finalUrl,
      target: openInNewTab ? '_blank' : '_self',
      rel: Array.from(relParts).join(' '),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#12121B] border border-white/15 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-[#FF2E93]" />
            <h3 className="font-display font-extrabold text-lg">Insert / Edit Link</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Destination URL
            </label>
            <input
              type="text"
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com or /post/article-slug"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-sm text-white focus:border-[#FF2E93] outline-none"
            />
          </div>

          {/* Link Attributes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={openInNewTab}
                onChange={(e) => setOpenInNewTab(e.target.checked)}
                className="accent-[#FF2E93]"
              />
              <span className="flex items-center gap-1">
                New tab <ExternalLink className="w-3 h-3 text-zinc-400" />
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={nofollow}
                onChange={(e) => setNofollow(e.target.checked)}
                className="accent-[#FF2E93]"
              />
              <span>rel="nofollow"</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sponsored}
                onChange={(e) => setSponsored(e.target.checked)}
                className="accent-[#FF2E93]"
              />
              <span>rel="sponsored"</span>
            </label>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>External links automatically receive security attributes (rel="noopener noreferrer").</span>
          </div>

          {/* Internal Article Link Search */}
          <div className="border-t border-white/10 pt-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Or link to an existing article / page
            </label>
            <div className="relative mb-2">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles by title or category..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:border-[#FF2E93] outline-none"
              />
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
              <button
                type="button"
                onClick={() => {
                  setUrl('/tools');
                  setOpenInNewTab(false);
                }}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 flex items-center justify-between text-xs"
              >
                <span className="font-semibold text-[#FF2E93]">🧮 Interactive Financial Calculators</span>
                <span className="text-[11px] text-zinc-500">/tools</span>
              </button>
              {matchingInternalPosts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setUrl(`/post/${p.slug}`);
                    setOpenInNewTab(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 flex items-center justify-between gap-2 text-xs"
                >
                  <span className="truncate font-medium text-zinc-200">{p.title}</span>
                  <span className="shrink-0 px-2 py-0.5 rounded bg-white/5 text-[10px] text-zinc-400">
                    {p.category}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {initialHref ? (
              <button
                type="button"
                onClick={() => {
                  onRemove();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-bold"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove Link
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#FF2E93] hover:bg-[#ff4da2] text-xs font-bold text-white shadow-lg shadow-[#FF2E93]/30"
              >
                <Check className="w-4 h-4" /> Apply Link
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
