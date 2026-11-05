import React, { useState } from 'react';
import { Users, Plus, Edit3, Trash2, Upload, Check, X, UserCheck } from 'lucide-react';

const EMPTY_AUTHOR_FORM = {
  id: null,
  name: '',
  role: 'Founder & Contributing Writer',
  bio: '',
  avatar: '',
};

export default function AuthorManagerModal({
  authors = [],
  selectedAuthorId,
  onSelectAuthor,
  onCreateAuthor,
  onUpdateAuthor,
  onDeleteAuthor,
  onUploadAvatarFile,
  onClose,
}) {
  const [editingAuthor, setEditingAuthor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState('');

  const startCreate = () => {
    setError('');
    setEditingAuthor({ ...EMPTY_AUTHOR_FORM });
  };

  const startEdit = (author) => {
    setError('');
    setEditingAuthor({ ...author });
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!editingAuthor.name.trim()) {
      setError('Please enter an author name.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingAuthor.id) {
        const updated = await onUpdateAuthor(editingAuthor.id, editingAuthor);
        if (updated && onSelectAuthor) {
          onSelectAuthor(updated.id);
        }
      } else {
        const created = await onCreateAuthor(editingAuthor);
        if (created && onSelectAuthor) {
          onSelectAuthor(created.id);
        }
      }
      setEditingAuthor(null);
    } catch (err) {
      setError(err.message || 'Failed to save author.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadAvatarFile) return;
    setUploadingAvatar(true);
    setError('');
    try {
      const uploaded = await onUploadAvatarFile([file]);
      if (uploaded?.[0]?.url) {
        setEditingAuthor((prev) => ({ ...prev, avatar: uploaded[0].url }));
      }
    } catch (err) {
      setError(err.message || 'Failed to upload profile photo.');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#12121B] border border-white/15 rounded-2xl max-w-2xl w-full p-6 shadow-2xl text-white max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#FF2E93]/15 text-[#FF2E93]">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-display font-extrabold text-lg">Manage Authors</h3>
              <p className="text-xs text-zinc-400">
                Add new writers, upload profile photos, or edit author bios for justmoneyhoney.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300">
              {error}
            </div>
          )}

          {/* Create / Edit Form */}
          {editingAuthor ? (
            <form
              onSubmit={handleSaveForm}
              className="p-4 rounded-2xl bg-black/40 border border-[#FF2E93]/40 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-display font-extrabold text-sm text-[#FF2E93]">
                  {editingAuthor.id ? `Edit Author: ${editingAuthor.name}` : 'Add New Author'}
                </span>
                <button
                  type="button"
                  onClick={() => setEditingAuthor(null)}
                  className="text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={editingAuthor.name}
                    onChange={(e) => setEditingAuthor((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Nemanja Milin"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white focus:border-[#FF2E93] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Role / Title
                  </label>
                  <input
                    type="text"
                    value={editingAuthor.role}
                    onChange={(e) => setEditingAuthor((p) => ({ ...p, role: e.target.value }))}
                    placeholder="e.g. Founder & Editor-in-Chief"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white focus:border-[#FF2E93] outline-none"
                  />
                </div>
              </div>

              {/* Avatar Upload & URL */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Profile Photo (Upload or Enter URL)
                </label>
                <div className="flex items-center gap-3">
                  {editingAuthor.avatar ? (
                    <img
                      src={editingAuthor.avatar}
                      alt={editingAuthor.name || 'Profile photo'}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-[#FF2E93] shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center text-zinc-500 font-bold shrink-0">
                      Photo
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingAuthor.avatar}
                        onChange={(e) => setEditingAuthor((p) => ({ ...p, avatar: e.target.value }))}
                        placeholder="https://... or upload photo →"
                        className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white focus:border-[#FF2E93] outline-none"
                      />
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold shrink-0">
                        <Upload className="w-3.5 h-3.5 text-[#FF2E93]" />
                        <span>{uploadingAvatar ? 'Uploading...' : 'Upload Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarFileChange}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Author Bio (Displayed below articles and on About Us)
                </label>
                <textarea
                  rows={3}
                  value={editingAuthor.bio}
                  onChange={(e) => setEditingAuthor((p) => ({ ...p, bio: e.target.value }))}
                  placeholder="Short author biography..."
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white focus:border-[#FF2E93] outline-none resize-y"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAuthor(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#FF2E93] hover:bg-[#ff4da2] text-white font-bold shadow-lg shadow-[#FF2E93]/30 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : editingAuthor.id ? 'Save Changes' : 'Create Author'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Editorial Team ({authors.length})
              </span>
              <button
                type="button"
                onClick={startCreate}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FF2E93] hover:bg-[#ff4da2] text-white text-xs font-bold shadow-lg shadow-[#FF2E93]/25"
              >
                <Plus className="w-4 h-4" /> Add New Author
              </button>
            </div>
          )}

          {/* Authors List */}
          <div className="space-y-2.5">
            {authors.map((author) => {
              const isSelected = selectedAuthorId === author.id;
              return (
                <div
                  key={author.id}
                  className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#FF2E93]/10 border-[#FF2E93]'
                      : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={author.avatar}
                      alt={author.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-[#FF2E93] shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-extrabold text-sm text-white truncate">
                          {author.name}
                        </span>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full bg-[#FF2E93] text-white text-[10px] font-bold">
                            Selected Author
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-[#FF2E93]">{author.role}</div>
                      {author.bio && (
                        <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">{author.bio}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {onSelectAuthor && !isSelected && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectAuthor(author.id);
                          onClose();
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#FF2E93]/20 hover:bg-[#FF2E93] text-[#FF2E93] hover:text-white text-xs font-bold transition"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Select
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => startEdit(author)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white"
                      title="Edit author"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    {authors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete author "${author.name}"? All articles by this author will be reassigned.`
                            )
                          ) {
                            onDeleteAuthor(author.id);
                          }
                        }}
                        className="p-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400"
                        title="Delete author"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
