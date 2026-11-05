import React, { useState } from 'react';
import { X, Crop, Check, RotateCcw } from 'lucide-react';
import { cropImageToDataUrl } from '../../utils/imageOptimizer';

const ASPECT_PRESETS = [
  { label: 'Free', w: 80, h: 80 },
  { label: '16:9 Wide', w: 90, h: 52 },
  { label: '4:3 Blog', w: 84, h: 64 },
  { label: '1:1 Square', w: 70, h: 70 },
];

export default function ImageCropModal({ imageSrc, onClose, onCropComplete }) {
  const [cropRect, setCropRect] = useState({ x: 5, y: 5, width: 90, height: 85 });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const applyPreset = (preset) => {
    const x = Math.round((100 - preset.w) / 2);
    const y = Math.round((100 - preset.h) / 2);
    setCropRect({ x, y, width: preset.w, height: preset.h });
  };

  const handleApplyCrop = async () => {
    setProcessing(true);
    setError('');
    try {
      const result = await cropImageToDataUrl(imageSrc, cropRect, 0.88);
      await onCropComplete(result);
      onClose();
    } catch (err) {
      setError(err.message || 'Unable to crop image.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#12121B] border border-white/15 rounded-2xl max-w-2xl w-full p-6 shadow-2xl text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crop className="w-5 h-5 text-[#FF2E93]" />
            <h3 className="font-display font-extrabold text-lg">Crop & Optimize Image</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aspect Ratio Presets */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mr-1">Aspect Ratio:</span>
          {ASPECT_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-[#FF2E93] text-xs font-semibold transition"
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCropRect({ x: 0, y: 0, width: 100, height: 100 })}
            className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>

        {/* Visual Crop Preview Box */}
        <div className="relative bg-black/70 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center max-h-[340px] mb-4">
          <div className="relative inline-block">
            <img src={imageSrc} alt="Crop preview" className="max-h-[320px] w-auto block opacity-40" />
            <div
              style={{
                left: `${cropRect.x}%`,
                top: `${cropRect.y}%`,
                width: `${cropRect.width}%`,
                height: `${cropRect.height}%`,
              }}
              className="absolute border-2 border-[#FF2E93] shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] pointer-events-none flex items-center justify-center"
            >
              <span className="px-2 py-0.5 rounded bg-[#FF2E93] text-[10px] font-bold text-white shadow">
                {cropRect.width}% × {cropRect.height}%
              </span>
            </div>
          </div>
        </div>

        {/* Fine-Tune Sliders */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-xs">
          <div>
            <label className="block text-zinc-400 mb-1">Left ({cropRect.x}%)</label>
            <input
              type="range"
              min="0"
              max={100 - cropRect.width}
              value={cropRect.x}
              onChange={(e) => setCropRect((r) => ({ ...r, x: Number(e.target.value) }))}
              className="w-full accent-[#FF2E93]"
            />
          </div>
          <div>
            <label className="block text-zinc-400 mb-1">Top ({cropRect.y}%)</label>
            <input
              type="range"
              min="0"
              max={100 - cropRect.height}
              value={cropRect.y}
              onChange={(e) => setCropRect((r) => ({ ...r, y: Number(e.target.value) }))}
              className="w-full accent-[#FF2E93]"
            />
          </div>
          <div>
            <label className="block text-zinc-400 mb-1">Width ({cropRect.width}%)</label>
            <input
              type="range"
              min="20"
              max={100 - cropRect.x}
              value={cropRect.width}
              onChange={(e) => setCropRect((r) => ({ ...r, width: Number(e.target.value) }))}
              className="w-full accent-[#FF2E93]"
            />
          </div>
          <div>
            <label className="block text-zinc-400 mb-1">Height ({cropRect.height}%)</label>
            <input
              type="range"
              min="20"
              max={100 - cropRect.y}
              value={cropRect.height}
              onChange={(e) => setCropRect((r) => ({ ...r, height: Number(e.target.value) }))}
              className="w-full accent-[#FF2E93]"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={processing}
            onClick={handleApplyCrop}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#FF2E93] hover:bg-[#ff4da2] text-xs font-bold text-white shadow-lg shadow-[#FF2E93]/30 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            {processing ? 'Optimizing...' : 'Apply & Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
