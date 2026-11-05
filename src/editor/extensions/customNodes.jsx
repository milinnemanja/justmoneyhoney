import React, { useState } from 'react';
import { Node, Extension } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Crop,
  Trash2,
  Image as ImageIcon,
  Plus,
  ExternalLink,
  AlertTriangle,
  Info,
  Zap,
  Video,
  Share2,
} from 'lucide-react';

// =========================================================
// 1. FONT SIZE EXTENSION ON TEXTSTYLE
// =========================================================
export const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize?.replace(/['"]+/g, '') || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
        },
    };
  },
});

// =========================================================
// 2. ENHANCED IMAGE NODE (RESIZE, ALIGN, ALT, CAPTION, CROP)
// =========================================================
function EnhancedImageView({ node, updateAttributes, deleteNode, selected, extension }) {
  const { src, alt = '', caption = '', width = '100%', align = 'center' } = node.attrs;
  const [showMetaEdit, setShowMetaEdit] = useState(false);

  const alignStyles = {
    left: 'items-start text-left',
    center: 'items-center text-center mx-auto',
    right: 'items-end text-right ml-auto',
    full: 'items-stretch w-full',
  };

  return (
    <NodeViewWrapper className="my-6 relative group" data-drag-handle>
      <figure
        className={`jmh-figure flex flex-col ${alignStyles[align] || alignStyles.center} ${
          selected ? 'ring-2 ring-[#FF2E93] rounded-xl p-1.5 bg-[#FF2E93]/5' : ''
        }`}
        data-align={align}
      >
        {/* Floating Image Controls Toolbar */}
        <div
          className={`flex flex-wrap items-center gap-1 mb-2 px-2.5 py-1.5 rounded-lg bg-[#14141F]/95 border border-white/15 text-white text-xs shadow-xl transition-opacity ${
            selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
          contentEditable={false}
        >
          {/* Width Presets */}
          {['25%', '50%', '75%', '100%'].map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => updateAttributes({ width: w })}
              className={`px-2 py-0.5 rounded font-semibold transition ${
                width === w ? 'bg-[#FF2E93] text-white' : 'hover:bg-white/10 text-zinc-300'
              }`}
              title={`Resize to ${w}`}
            >
              {w}
            </button>
          ))}
          <span className="h-3.5 w-px bg-white/15 mx-1" />
          {/* Alignment */}
          <button
            type="button"
            onClick={() => updateAttributes({ align: 'left' })}
            className={`p-1 rounded ${align === 'left' ? 'bg-[#FF2E93] text-white' : 'hover:bg-white/10 text-zinc-300'}`}
            title="Align left"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => updateAttributes({ align: 'center' })}
            className={`p-1 rounded ${align === 'center' ? 'bg-[#FF2E93] text-white' : 'hover:bg-white/10 text-zinc-300'}`}
            title="Align center"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => updateAttributes({ align: 'right' })}
            className={`p-1 rounded ${align === 'right' ? 'bg-[#FF2E93] text-white' : 'hover:bg-white/10 text-zinc-300'}`}
            title="Align right"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => updateAttributes({ align: 'full', width: '100%' })}
            className={`p-1 rounded ${align === 'full' ? 'bg-[#FF2E93] text-white' : 'hover:bg-white/10 text-zinc-300'}`}
            title="Full width"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <span className="h-3.5 w-px bg-white/15 mx-1" />
          {/* Crop */}
          <button
            type="button"
            onClick={() => {
              if (extension.options.onRequestCrop) {
                extension.options.onRequestCrop(src, (croppedUrl) => {
                  updateAttributes({ src: croppedUrl });
                });
              }
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/10 text-zinc-200 font-medium"
            title="Crop image"
          >
            <Crop className="w-3.5 h-3.5 text-[#FF2E93]" />
            Crop
          </button>
          {/* Toggle ALT/Caption editor */}
          <button
            type="button"
            onClick={() => setShowMetaEdit((v) => !v)}
            className={`px-2 py-0.5 rounded font-medium ${
              !alt ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'hover:bg-white/10 text-zinc-200'
            }`}
          >
            {alt ? 'ALT & Caption' : '⚠️ Add ALT'}
          </button>
          <button
            type="button"
            onClick={deleteNode}
            className="p-1 rounded hover:bg-red-500/20 text-red-400 ml-1"
            title="Remove image"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <img
          src={src}
          alt={alt || ''}
          style={{ width: width || '100%' }}
          className="rounded-xl border border-white/10 object-cover max-w-full transition-all"
        />

        {(caption || showMetaEdit) && (
          <figcaption className="text-xs text-zinc-400 mt-2 text-center w-full">
            {caption}
          </figcaption>
        )}

        {showMetaEdit && (
          <div
            contentEditable={false}
            className="mt-3 w-full max-w-xl bg-[#13131D] border border-white/15 rounded-xl p-3 space-y-2 text-left shadow-lg"
          >
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Image ALT Text (SEO & Accessibility)
              </label>
              <input
                type="text"
                value={alt || ''}
                onChange={(e) => updateAttributes({ alt: e.target.value })}
                placeholder="Describe this image for screen readers and Google Images..."
                className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-white/15 text-xs text-white focus:border-[#FF2E93] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Visible Caption Below Image
              </label>
              <input
                type="text"
                value={caption || ''}
                onChange={(e) => updateAttributes({ caption: e.target.value })}
                placeholder="Optional caption below image..."
                className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-white/15 text-xs text-white focus:border-[#FF2E93] outline-none"
              />
            </div>
          </div>
        )}
      </figure>
    </NodeViewWrapper>
  );
}

export const EnhancedImage = Node.create({
  name: 'image',
  group: 'block',
  draggable: true,
  selectable: true,

  addOptions() {
    return {
      onRequestCrop: null,
    };
  },

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: '' },
      title: { default: null },
      caption: { default: '' },
      width: { default: '100%' },
      align: { default: 'center' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure.jmh-figure',
        getAttrs: (el) => {
          const img = el.querySelector('img');
          const cap = el.querySelector('figcaption');
          if (!img) return false;
          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt') || '',
            width: img.style.width || el.getAttribute('data-width') || '100%',
            align: el.getAttribute('data-align') || 'center',
            caption: cap ? cap.textContent : '',
          };
        },
      },
      {
        tag: 'img[src]',
        getAttrs: (el) => ({
          src: el.getAttribute('src'),
          alt: el.getAttribute('alt') || '',
          title: el.getAttribute('title') || null,
          width: el.style.width || el.getAttribute('width') || '100%',
          align: el.getAttribute('data-align') || 'center',
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, alt, caption, width = '100%', align = 'center' } = HTMLAttributes;
    const children = [
      [
        'img',
        {
          src,
          alt: alt || '',
          style: `width: ${width}`,
        },
      ],
    ];
    if (caption) {
      children.push(['figcaption', {}, caption]);
    }
    return [
      'figure',
      {
        class: 'jmh-figure',
        'data-align': align,
        'data-width': width,
      },
      ...children,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EnhancedImageView);
  },

  addCommands() {
    return {
      setImage:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});

// =========================================================
// 3. IMAGE GALLERY BLOCK
// =========================================================
function ImageGalleryView({ node, updateAttributes, deleteNode, extension }) {
  const { images = [], columns = 3 } = node.attrs;

  const handleUpdateItem = (idx, field, val) => {
    const next = images.map((item, i) => (i === idx ? { ...item, [field]: val } : item));
    updateAttributes({ images: next });
  };

  const handleRemoveItem = (idx) => {
    const next = images.filter((_, i) => i !== idx);
    updateAttributes({ images: next });
  };

  return (
    <NodeViewWrapper className="my-6 p-4 rounded-2xl border border-white/15 bg-white/[0.02]" data-drag-handle>
      <div contentEditable={false} className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF2E93]">
          <ImageIcon className="w-4 h-4" />
          <span>Image Gallery ({images.length} photos)</span>
        </div>
        <div className="flex items-center gap-1.5">
          {[2, 3].map((col) => (
            <button
              key={col}
              type="button"
              onClick={() => updateAttributes({ columns: col })}
              className={`px-2.5 py-1 rounded text-xs font-semibold ${
                Number(columns) === col ? 'bg-[#FF2E93] text-white' : 'bg-white/10 text-zinc-300'
              }`}
            >
              {col} Columns
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              if (extension.options.onAddGalleryImages) {
                extension.options.onAddGalleryImages((newItems) => {
                  updateAttributes({ images: [...images, ...newItems] });
                });
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> Add Image
          </button>
          <button
            type="button"
            onClick={deleteNode}
            className="p-1 rounded hover:bg-red-500/20 text-red-400"
            title="Delete gallery"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div
        contentEditable={false}
        className={`grid gap-3 ${Number(columns) === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}
      >
        {images.map((img, i) => (
          <div key={i} className="relative group/item rounded-xl overflow-hidden bg-black/40 border border-white/10 p-2">
            <img src={img.src} alt={img.alt || ''} className="w-full h-44 object-cover rounded-lg mb-2" />
            <input
              type="text"
              value={img.alt || ''}
              onChange={(e) => handleUpdateItem(i, 'alt', e.target.value)}
              placeholder="ALT description..."
              className="w-full px-2 py-1 rounded bg-black/60 border border-white/10 text-[11px] text-white mb-1 outline-none focus:border-[#FF2E93]"
            />
            <input
              type="text"
              value={img.caption || ''}
              onChange={(e) => handleUpdateItem(i, 'caption', e.target.value)}
              placeholder="Image caption..."
              className="w-full px-2 py-1 rounded bg-black/60 border border-white/10 text-[11px] text-zinc-300 outline-none focus:border-[#FF2E93]"
            />
            <button
              type="button"
              onClick={() => handleRemoveItem(i)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/80 text-red-400 opacity-0 group-hover/item:opacity-100 transition"
              title="Remove image"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </NodeViewWrapper>
  );
}

export const ImageGallery = Node.create({
  name: 'imageGallery',
  group: 'block',
  atom: true,
  draggable: true,

  addOptions() {
    return {
      onAddGalleryImages: null,
    };
  },

  addAttributes() {
    return {
      columns: { default: 3 },
      images: { default: [] },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-gallery="true"]',
        getAttrs: (el) => {
          const cols = Number(el.getAttribute('data-cols') || 3);
          const imgs = Array.from(el.querySelectorAll('figure, img')).map((item) => {
            const imgEl = item.tagName === 'IMG' ? item : item.querySelector('img');
            const capEl = item.tagName === 'FIGURE' ? item.querySelector('figcaption') : null;
            return {
              src: imgEl?.getAttribute('src') || '',
              alt: imgEl?.getAttribute('alt') || '',
              caption: capEl?.textContent || '',
            };
          });
          return { columns: cols, images: imgs.filter((x) => x.src) };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { columns = 3, images = [] } = HTMLAttributes;
    return [
      'div',
      {
        'data-gallery': 'true',
        'data-cols': String(columns),
        class: 'jmh-gallery',
      },
      ...images.map((img) => [
        'figure',
        { class: 'jmh-gallery-item' },
        ['img', { src: img.src, alt: img.alt || '' }],
        ...(img.caption ? [['figcaption', {}, img.caption]] : []),
      ]),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageGalleryView);
  },
});

// =========================================================
// 4. CALLOUT / INFORMATION PANEL BLOCK
// =========================================================
const CALLOUT_STYLES = {
  tip: {
    label: 'Tip',
    icon: Info,
    badgeClass: 'text-[#FF2E93]',
    boxClass: 'jmh-callout-tip',
    defaultTitle: '💡 Golden Wealth Rule',
  },
  note: {
    label: 'Note',
    icon: Info,
    badgeClass: 'text-sky-400',
    boxClass: 'jmh-callout-note',
    defaultTitle: '📌 Quick Breakdown',
  },
  warning: {
    label: 'Warning',
    icon: AlertTriangle,
    badgeClass: 'text-amber-400',
    boxClass: 'jmh-callout-warning',
    defaultTitle: '⚠️ Watch Out for Hidden Costs',
  },
  hack: {
    label: 'Hack',
    icon: Zap,
    badgeClass: 'text-emerald-400',
    boxClass: 'jmh-callout-hack',
    defaultTitle: '⚡ 5-Minute Strategy',
  },
};

function CalloutBlockView({ node, updateAttributes, deleteNode }) {
  const { variant = 'tip', title = '💡 Golden Wealth Rule', body = '' } = node.attrs;
  const cfg = CALLOUT_STYLES[variant] || CALLOUT_STYLES.tip;

  return (
    <NodeViewWrapper className={`jmh-callout ${cfg.boxClass} relative group`} data-drag-handle>
      <div contentEditable={false} className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          {Object.entries(CALLOUT_STYLES).map(([key, item]) => (
            <button
              key={key}
              type="button"
              onClick={() => updateAttributes({ variant: key })}
              className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider transition ${
                variant === key ? 'bg-[#FF2E93] text-white' : 'bg-white/10 text-zinc-300 hover:bg-white/20'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={deleteNode}
          className="p-1 rounded hover:bg-red-500/20 text-red-400 opacity-70 group-hover:opacity-100"
          title="Remove callout box"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div contentEditable={false} className="space-y-2">
        <input
          type="text"
          value={title}
          onChange={(e) => updateAttributes({ title: e.target.value })}
          placeholder="Callout title..."
          className="w-full bg-transparent font-display font-extrabold text-base border-b border-white/10 pb-1 focus:border-[#FF2E93] outline-none"
        />
        <textarea
          rows={2}
          value={body}
          onChange={(e) => updateAttributes({ body: e.target.value })}
          placeholder="Enter tip, key takeaway, or warning..."
          className="w-full bg-transparent text-sm leading-relaxed resize-y focus:outline-none"
        />
      </div>
    </NodeViewWrapper>
  );
}

export const CalloutBlock = Node.create({
  name: 'calloutBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      variant: { default: 'tip' },
      title: { default: '💡 Golden Wealth Rule' },
      body: {
        default: 'Automate your investments the day your income arrives so discipline never depends on willpower.',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-callout="true"]',
        getAttrs: (el) => ({
          variant: el.getAttribute('data-type') || 'tip',
          title: el.querySelector('.jmh-callout-title')?.textContent || '💡 Key Tip',
          body: el.querySelector('.jmh-callout-body')?.textContent || el.textContent || '',
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { variant = 'tip', title = '', body = '' } = HTMLAttributes;
    return [
      'div',
      {
        'data-callout': 'true',
        'data-type': variant,
        class: `jmh-callout jmh-callout-${variant}`,
      },
      ['div', { class: 'jmh-callout-title' }, title],
      ['div', { class: 'jmh-callout-body' }, body],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutBlockView);
  },
});

// =========================================================
// 5. CUSTOM CTA BUTTON BLOCK
// =========================================================
function CtaButtonView({ node, updateAttributes, deleteNode }) {
  const { text = 'Explore More →', href = '/', style = 'pink', align = 'center', newTab = false } =
    node.attrs;
  const [editing, setEditing] = useState(false);

  const btnStyleClass =
    style === 'outline' ? 'jmh-cta-outline' : style === 'white' ? 'jmh-cta-white' : 'jmh-cta-pink';

  return (
    <NodeViewWrapper className="my-6 relative group" data-drag-handle>
      <div
        contentEditable={false}
        className={`p-3 rounded-xl border border-dashed border-white/15 bg-white/[0.01] ${
          align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-2 text-xs text-zinc-400">
          <span className="font-semibold uppercase tracking-wider text-[10px]">CTA Button</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-xs"
            >
              {editing ? 'Done' : 'Configure Button'}
            </button>
            <button
              type="button"
              onClick={deleteNode}
              className="p-1 rounded hover:bg-red-500/20 text-red-400"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <span className={`jmh-cta-btn ${btnStyleClass} cursor-pointer`} onClick={() => setEditing(true)}>
          {text}
          {newTab && <ExternalLink className="w-4 h-4" />}
        </span>

        {editing && (
          <div className="mt-3 p-3 rounded-xl bg-[#14141F] border border-white/15 text-left grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div>
              <label className="block text-zinc-400 mb-1">Button Label</label>
              <input
                type="text"
                value={text}
                onChange={(e) => updateAttributes({ text: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded bg-black/50 border border-white/15 text-white outline-none focus:border-[#FF2E93]"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Destination Link (URL)</label>
              <input
                type="text"
                value={href}
                onChange={(e) => updateAttributes({ href: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded bg-black/50 border border-white/15 text-white outline-none focus:border-[#FF2E93]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Style:</span>
              {[
                { k: 'pink', l: 'Pink' },
                { k: 'white', l: 'White' },
                { k: 'outline', l: 'Outline' },
              ].map((s) => (
                <button
                  key={s.k}
                  type="button"
                  onClick={() => updateAttributes({ style: s.k })}
                  className={`px-2 py-1 rounded ${
                    style === s.k ? 'bg-[#FF2E93] text-white' : 'bg-white/10 text-zinc-300'
                  }`}
                >
                  {s.l}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {[
                  { k: 'left', l: 'Left' },
                  { k: 'center', l: 'Center' },
                  { k: 'right', l: 'Right' },
                ].map((a) => (
                  <button
                    key={a.k}
                    type="button"
                    onClick={() => updateAttributes({ align: a.k })}
                    className={`px-2 py-1 rounded ${
                      align === a.k ? 'bg-[#FF2E93] text-white' : 'bg-white/10 text-zinc-300'
                    }`}
                  >
                    {a.l}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-1.5 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(newTab)}
                  onChange={(e) => updateAttributes({ newTab: e.target.checked })}
                />
                New tab
              </label>
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

export const CtaButtonNode = Node.create({
  name: 'ctaButton',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      text: { default: 'Explore More →' },
      href: { default: '/' },
      style: { default: 'pink' },
      align: { default: 'center' },
      newTab: { default: false },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-cta-button="true"]',
        getAttrs: (el) => {
          const a = el.querySelector('a');
          return {
            text: a?.textContent || 'Learn More',
            href: a?.getAttribute('href') || '#',
            style: el.getAttribute('data-style') || 'pink',
            align: el.getAttribute('data-align') || 'center',
            newTab: a?.getAttribute('target') === '_blank',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { text, href, style = 'pink', align = 'center', newTab = false } = HTMLAttributes;
    const btnClass =
      style === 'outline' ? 'jmh-cta-outline' : style === 'white' ? 'jmh-cta-white' : 'jmh-cta-pink';
    const alignClass = align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center';

    return [
      'div',
      {
        'data-cta-button': 'true',
        'data-style': style,
        'data-align': align,
        class: `jmh-cta-wrapper ${alignClass} my-8`,
      },
      [
        'a',
        {
          href: href || '#',
          class: `jmh-cta-btn ${btnClass}`,
          ...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
        },
        text,
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CtaButtonView);
  },
});

// =========================================================
// 6. VIDEO EMBED BLOCK (YOUTUBE & VIMEO)
// =========================================================
export function parseVideoEmbedUrl(rawUrl) {
  if (!rawUrl) return null;
  const url = rawUrl.trim();
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    return {
      provider: 'YouTube',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
    };
  }
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return {
      provider: 'Vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
    };
  }
  return null;
}

function VideoEmbedView({ node, updateAttributes, deleteNode }) {
  const { embedUrl, caption = '', provider = 'YouTube' } = node.attrs;

  return (
    <NodeViewWrapper className="my-6" data-drag-handle>
      <div contentEditable={false} className="rounded-2xl border border-white/15 bg-black/40 p-3">
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="flex items-center gap-1.5 font-bold text-[#FF2E93]">
            <Video className="w-4 h-4" /> {provider} Video Embed
          </span>
          <button
            type="button"
            onClick={deleteNode}
            className="p-1 rounded hover:bg-red-500/20 text-red-400"
            title="Remove video"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="jmh-embed-container my-2">
          <iframe
            src={embedUrl}
            title={caption || 'Embedded video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <input
          type="text"
          value={caption || ''}
          onChange={(e) => updateAttributes({ caption: e.target.value })}
          placeholder="Optional caption below video..."
          className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-white/10 text-xs text-zinc-300 outline-none focus:border-[#FF2E93]"
        />
      </div>
    </NodeViewWrapper>
  );
}

export const VideoEmbedNode = Node.create({
  name: 'videoEmbed',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      embedUrl: { default: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      provider: { default: 'YouTube' },
      caption: { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div.jmh-embed-container',
        getAttrs: (el) => {
          const iframe = el.querySelector('iframe');
          return {
            embedUrl: iframe?.getAttribute('src') || '',
            provider: iframe?.getAttribute('src')?.includes('vimeo') ? 'Vimeo' : 'YouTube',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { embedUrl, caption } = HTMLAttributes;
    return [
      'div',
      { class: 'jmh-embed-container' },
      [
        'iframe',
        {
          src: embedUrl,
          title: caption || 'Embedded video',
          frameborder: '0',
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          allowfullscreen: 'true',
        },
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoEmbedView);
  },
});

// =========================================================
// 7. SOCIAL MEDIA POST EMBED BLOCK
// =========================================================
function SocialEmbedView({ node, updateAttributes, deleteNode }) {
  const {
    platform = 'X / Twitter',
    handle = '@justmoneyhoney',
    content = 'Smart wealth building means skipping what does not matter to you so you can invest unapologetically in freedom, luxury, and experiences you love.',
    url = 'https://x.com/justmoneyhoney',
  } = node.attrs;

  return (
    <NodeViewWrapper className="my-6" data-drag-handle>
      <div contentEditable={false} className="jmh-social-card relative">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#FF2E93]/20 text-[#FF2E93]">
              <Share2 className="w-4 h-4" />
            </span>
            <select
              value={platform}
              onChange={(e) => updateAttributes({ platform: e.target.value })}
              className="bg-black/60 border border-white/15 rounded px-2 py-1 text-xs font-bold text-white outline-none"
            >
              <option value="X / Twitter">X / Twitter</option>
              <option value="Instagram">Instagram</option>
              <option value="TikTok">TikTok</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Threads">Threads</option>
            </select>
            <input
              type="text"
              value={handle}
              onChange={(e) => updateAttributes({ handle: e.target.value })}
              placeholder="@handle"
              className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-zinc-300 outline-none focus:border-[#FF2E93]"
            />
          </div>
          <button
            type="button"
            onClick={deleteNode}
            className="p-1 rounded hover:bg-red-500/20 text-red-400"
            title="Remove post"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <textarea
          rows={2}
          value={content}
          onChange={(e) => updateAttributes({ content: e.target.value })}
          placeholder="Post text or quote..."
          className="w-full bg-transparent text-sm leading-relaxed border-b border-white/10 pb-2 mb-2 focus:outline-none"
        />
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-400">Post URL:</span>
          <input
            type="text"
            value={url}
            onChange={(e) => updateAttributes({ url: e.target.value })}
            className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-[#FF2E93] outline-none"
          />
        </div>
      </div>
    </NodeViewWrapper>
  );
}

export const SocialEmbedNode = Node.create({
  name: 'socialEmbed',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      platform: { default: 'X / Twitter' },
      handle: { default: '@justmoneyhoney' },
      content: {
        default:
          'Smart wealth building means skipping what does not matter to you so you can invest unapologetically in freedom, luxury, and experiences you love.',
      },
      url: { default: 'https://x.com/justmoneyhoney' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-social-embed="true"]',
        getAttrs: (el) => ({
          platform: el.getAttribute('data-platform') || 'X / Twitter',
          handle: el.getAttribute('data-handle') || '@justmoneyhoney',
          content: el.querySelector('.jmh-social-body')?.textContent || '',
          url: el.querySelector('a')?.getAttribute('href') || '#',
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { platform, handle, content, url } = HTMLAttributes;
    return [
      'div',
      {
        'data-social-embed': 'true',
        'data-platform': platform,
        'data-handle': handle,
        class: 'jmh-social-card',
      },
      [
        'div',
        { class: 'flex items-center justify-between mb-2 text-xs font-bold text-[#FF2E93]' },
        `${platform} • ${handle}`,
      ],
      ['p', { class: 'jmh-social-body text-sm mb-2' }, content],
      [
        'a',
        {
          href: url || '#',
          target: '_blank',
          rel: 'noopener noreferrer nofollow',
          class: 'text-xs text-[#FF2E93]',
        },
        'View original post →',
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SocialEmbedView);
  },
});
