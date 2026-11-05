import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import FontFamily from '@tiptap/extension-font-family';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Quote,
  Code,
  FileCode,
  Minus,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Eraser,
  Undo2,
  Redo2,
  Link2,
  Image as ImageIcon,
  Images,
  Table as TableIcon,
  Info,
  MousePointerClick,
  Video,
  Share2,
  Search,
  ArrowUp,
  ArrowDown,
  Copy,
  Palette,
  Highlighter,
  X,
} from 'lucide-react';
import {
  FontSize,
  EnhancedImage,
  ImageGallery,
  CalloutBlock,
  CtaButtonNode,
  VideoEmbedNode,
  SocialEmbedNode,
  parseVideoEmbedUrl,
} from './extensions/customNodes';
import { cleanWordAndDocsPaste } from '../utils/sanitizeAndPaste';

const lowlight = createLowlight(common);

const FONT_FAMILIES = [
  { label: 'Default (Plus Jakarta)', value: 'Plus Jakarta Sans, sans-serif' },
  { label: 'Display Sans (Outfit)', value: 'Outfit, sans-serif' },
  { label: 'Editorial Serif (Merriweather)', value: 'Merriweather, serif' },
  { label: 'Luxury Serif (Playfair)', value: 'Playfair Display, serif' },
  { label: 'Clean Sans (Inter)', value: 'Inter, sans-serif' },
  { label: 'Monospace (Code)', value: 'JetBrains Mono, monospace' },
];

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px'];

const TEXT_COLORS = [
  { label: 'Pure White', color: '#FFFFFF' },
  { label: 'Money Pink', color: '#FF2E93' },
  { label: 'Emerald Green', color: '#34D399' },
  { label: 'Honey Gold', color: '#FBBF24' },
  { label: 'Sky Blue', color: '#38BDF8' },
  { label: 'Coral Red', color: '#FB7185' },
  { label: 'Muted Silver', color: '#A1A1AA' },
  { label: 'Dark Ink', color: '#111827' },
];

const HIGHLIGHT_COLORS = [
  { label: 'Pink Highlight', color: 'rgba(255, 46, 147, 0.28)' },
  { label: 'Gold Highlight', color: 'rgba(251, 191, 36, 0.28)' },
  { label: 'Green Highlight', color: 'rgba(52, 211, 153, 0.28)' },
  { label: 'Blue Highlight', color: 'rgba(56, 189, 248, 0.28)' },
  { label: 'Purple Highlight', color: 'rgba(168, 85, 247, 0.28)' },
];

const SLASH_ITEMS = [
  { id: 'h1', label: 'Heading 1 (H1)', desc: 'Large section headline', keywords: 'h1 heading title' },
  { id: 'h2', label: 'Heading 2 (H2)', desc: 'Main article subheading', keywords: 'h2 subheading section' },
  { id: 'h3', label: 'Heading 3 (H3)', desc: 'Subsection heading', keywords: 'h3 subheading' },
  { id: 'h4', label: 'Heading 4 (H4)', desc: 'Compact subheading', keywords: 'h4 subheading' },
  { id: 'bullet', label: 'Bullet List', desc: 'Unordered bullet points', keywords: 'ul bullet list' },
  { id: 'ordered', label: 'Numbered List', desc: 'Step-by-step ordered list (1, 2, 3...)', keywords: 'ol numbered list steps' },
  { id: 'quote', label: 'Blockquote', desc: 'Highlight a key quote or insight', keywords: 'quote blockquote' },
  { id: 'callout-tip', label: 'Callout / Tip Box', desc: 'Framed tip, note, or warning box', keywords: 'callout info tip warning box' },
  { id: 'table', label: 'Table', desc: 'Insert a table with rows and columns', keywords: 'table grid' },
  { id: 'image', label: 'Upload / Insert Image', desc: 'Image with resize, crop & ALT text', keywords: 'image photo upload' },
  { id: 'gallery', label: 'Image Gallery', desc: 'Multi-image grid in 2 or 3 columns', keywords: 'gallery images photos' },
  { id: 'cta', label: 'CTA Button', desc: 'Customizable call-to-action button', keywords: 'button cta link' },
  { id: 'video', label: 'YouTube / Vimeo Video', desc: 'Embed video via URL', keywords: 'video youtube vimeo' },
  { id: 'social', label: 'Social Post Embed', desc: 'Embed an X, Instagram, or TikTok card', keywords: 'social twitter x instagram tiktok' },
  { id: 'code', label: 'Code Block', desc: 'Syntax-highlighted code or formula', keywords: 'code snippet' },
  { id: 'divider', label: 'Horizontal Divider', desc: 'Visual separator between sections', keywords: 'hr divider line' },
];

export default function RichTextEditor({
  initialHtml,
  onChange,
  onOpenLinkModal,
  onRequestCropImage,
  onUploadAndInsertFiles,
  editorTheme = 'dark',
  editorRefCallback,
}) {
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findTerm, setFindTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [findCount, setFindCount] = useState(0);

  // Video quick-insert modal
  const [videoPromptOpen, setVideoPromptOpen] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoCaptionInput, setVideoCaptionInput] = useState('');

  // Floating selection toolbar state
  const [bubbleCoords, setBubbleCoords] = useState(null);

  // Slash command state
  const [slashMenu, setSlashMenu] = useState({
    open: false,
    query: '',
    selectedIndex: 0,
    coords: { top: 0, left: 0 },
    range: null,
  });

  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const galleryCallbackRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Underline,
      TextStyle,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily,
      Subscript,
      Superscript,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Placeholder.configure({
        placeholder: 'Start writing your story or type "/" to insert blocks (Headings, Callouts, Tables, Images, Video)...',
      }),
      CharacterCount,
      EnhancedImage.configure({
        onRequestCrop: (src, applyCroppedUrl) => {
          if (onRequestCropImage) {
            onRequestCropImage(src, applyCroppedUrl);
          }
        },
      }),
      ImageGallery.configure({
        onAddGalleryImages: (cb) => {
          galleryCallbackRef.current = cb;
          galleryInputRef.current?.click();
        },
      }),
      CalloutBlock,
      CtaButtonNode,
      VideoEmbedNode,
      SocialEmbedNode,
    ],
    content: initialHtml || '<p></p>',
    editorProps: {
      transformPastedHTML(html) {
        return cleanWordAndDocsPaste(html);
      },
      handleDrop(view, event, _slice, moved) {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
          const files = Array.from(event.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
          if (files.length > 0) {
            event.preventDefault();
            onUploadAndInsertFiles(files);
            return true;
          }
        }
        return false;
      },
      handlePaste(view, event) {
        const items = Array.from(event.clipboardData?.items || []);
        const imageFiles = items
          .filter((item) => item.type.startsWith('image/'))
          .map((item) => item.getAsFile())
          .filter(Boolean);
        if (imageFiles.length > 0) {
          event.preventDefault();
          onUploadAndInsertFiles(imageFiles);
          return true;
        }
        return false;
      },
    },
    onUpdate({ editor: ed }) {
      const html = ed.getHTML();
      const json = ed.getJSON();
      onChange({ html, json });

      // Detect slash command trigger ("/" at start of block or after space)
      const { selection } = ed.state;
      const { $from, empty } = selection;
      if (empty && $from.parent.isTextblock) {
        const textBefore = $from.parent.textBetween(0, $from.parentOffset, '\n', '\0');
        const slashMatch = textBefore.match(/(?:^|\s)\/([a-zA-Z0-9-]*)$/);
        if (slashMatch) {
          const query = slashMatch[1].toLowerCase();
          const coords = ed.view.coordsAtPos($from.pos);
          const fromPos = $from.pos - slashMatch[1].length - 1;
          setSlashMenu({
            open: true,
            query,
            selectedIndex: 0,
            coords: { top: coords.bottom + 8, left: coords.left },
            range: { from: fromPos, to: $from.pos },
          });
          return;
        }
      }
      setSlashMenu((prev) => (prev.open ? { ...prev, open: false } : prev));
    },
    onSelectionUpdate({ editor: ed }) {
      const { from, to, empty } = ed.state.selection;
      if (empty || from === to || ed.isActive('image') || ed.isActive('codeBlock')) {
        setBubbleCoords(null);
        return;
      }
      try {
        const start = ed.view.coordsAtPos(from);
        const end = ed.view.coordsAtPos(to);
        setBubbleCoords({
          top: Math.min(start.top, end.top) - 48,
          left: (start.left + end.left) / 2,
        });
      } catch {
        setBubbleCoords(null);
      }
    },
  });

  useEffect(() => {
    if (editor && editorRefCallback) {
      editorRefCallback(editor);
    }
  }, [editor, editorRefCallback]);

  // Keyboard shortcuts for Link (Ctrl+K) & Find (Ctrl+F)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        if (editor && editor.isFocused) {
          e.preventDefault();
          const attrs = editor.getAttributes('link');
          onOpenLinkModal(attrs);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        if (editor && editor.isFocused) {
          e.preventDefault();
          setShowFindReplace((v) => !v);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, onOpenLinkModal]);

  const filteredSlashItems = SLASH_ITEMS.filter((item) => {
    if (!slashMenu.query) return true;
    return (
      item.label.toLowerCase().includes(slashMenu.query) ||
      item.keywords.toLowerCase().includes(slashMenu.query)
    );
  });

  const executeSlashCommand = useCallback(
    (item) => {
      if (!editor) return;
      if (slashMenu.range) {
        editor.chain().focus().deleteRange(slashMenu.range).run();
      }
      setSlashMenu((prev) => ({ ...prev, open: false }));

      switch (item.id) {
        case 'h1':
          editor.chain().focus().toggleHeading({ level: 1 }).run();
          break;
        case 'h2':
          editor.chain().focus().toggleHeading({ level: 2 }).run();
          break;
        case 'h3':
          editor.chain().focus().toggleHeading({ level: 3 }).run();
          break;
        case 'h4':
          editor.chain().focus().toggleHeading({ level: 4 }).run();
          break;
        case 'bullet':
          editor.chain().focus().toggleBulletList().run();
          break;
        case 'ordered':
          editor.chain().focus().toggleOrderedList().run();
          break;
        case 'quote':
          editor.chain().focus().toggleBlockquote().run();
          break;
        case 'callout-tip':
          editor.chain().focus().insertContent({ type: 'calloutBlock', attrs: { variant: 'tip' } }).run();
          break;
        case 'table':
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
          break;
        case 'image':
          fileInputRef.current?.click();
          break;
        case 'gallery':
          galleryCallbackRef.current = null;
          galleryInputRef.current?.click();
          break;
        case 'cta':
          editor.chain().focus().insertContent({ type: 'ctaButton' }).run();
          break;
        case 'video':
          setVideoPromptOpen(true);
          break;
        case 'social':
          editor.chain().focus().insertContent({ type: 'socialEmbed' }).run();
          break;
        case 'code':
          editor.chain().focus().toggleCodeBlock().run();
          break;
        case 'divider':
          editor.chain().focus().setHorizontalRule().run();
          break;
        default:
          break;
      }
    },
    [editor, slashMenu.range]
  );

  const moveCurrentBlock = (direction) => {
    if (!editor) return;
    const { state, view } = editor;
    const { $from } = state.selection;
    if ($from.depth < 1) return;

    const doc = state.doc;
    const topIndex = $from.index(0);
    const targetIndex = direction === 'up' ? topIndex - 1 : topIndex + 1;
    if (targetIndex < 0 || targetIndex >= doc.childCount) return;

    const blocks = [];
    doc.forEach((node) => blocks.push(node));
    const temp = blocks[topIndex];
    blocks[topIndex] = blocks[targetIndex];
    blocks[targetIndex] = temp;

    const tr = state.tr.replaceWith(0, doc.content.size, blocks);
    view.dispatch(tr.scrollIntoView());
  };

  const duplicateCurrentBlock = () => {
    if (!editor) return;
    const { state, view } = editor;
    const { $from } = state.selection;
    if ($from.depth < 1) return;
    const topPosAfter = $from.after(1);
    const node = $from.node(1);
    const tr = state.tr.insert(topPosAfter, node.copy(node.content));
    view.dispatch(tr.scrollIntoView());
  };

  useEffect(() => {
    if (!editor || !findTerm.trim()) {
      setFindCount(0);
      return;
    }
    const text = editor.getText();
    const escaped = findTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = text.match(new RegExp(escaped, 'gi'));
    setFindCount(matches ? matches.length : 0);
  }, [findTerm, editor]);

  const handleReplace = (replaceAll = false) => {
    if (!editor || !findTerm) return;
    const html = editor.getHTML();
    const escaped = findTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?![^<]*>)${escaped}`, replaceAll ? 'gi' : 'i');
    const nextHtml = html.replace(regex, replaceTerm);
    editor.commands.setContent(nextHtml, true);
  };

  if (!editor) return null;

  const isLight = editorTheme === 'light';
  const toolbarBg = isLight
    ? 'bg-zinc-100/95 border-zinc-300 text-zinc-800'
    : 'bg-[#12121C]/95 border-white/10 text-zinc-200';
  const btnHover = isLight ? 'hover:bg-zinc-200' : 'hover:bg-white/10';
  const activeBtn = 'bg-[#FF2E93] text-white';

  const currentHeadingVal = editor.isActive('heading', { level: 1 })
    ? 'h1'
    : editor.isActive('heading', { level: 2 })
    ? 'h2'
    : editor.isActive('heading', { level: 3 })
    ? 'h3'
    : editor.isActive('heading', { level: 4 })
    ? 'h4'
    : editor.isActive('heading', { level: 5 })
    ? 'h5'
    : editor.isActive('heading', { level: 6 })
    ? 'h6'
    : 'p';

  return (
    <div className="relative flex flex-col flex-1">
      {/* Hidden File Inputs for Single Image & Multi-Image Gallery */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={async (e) => {
          const files = Array.from(e.target.files || []);
          if (files.length > 0) {
            await onUploadAndInsertFiles(files);
          }
          e.target.value = '';
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={async (e) => {
          const files = Array.from(e.target.files || []);
          if (files.length > 0) {
            const uploaded = await onUploadAndInsertFiles(files, { returnOnly: true });
            if (uploaded?.length) {
              const items = uploaded.map((u) => ({
                src: u.url,
                alt: u.alt || u.name,
                caption: u.caption || '',
              }));
              if (galleryCallbackRef.current) {
                galleryCallbackRef.current(items);
                galleryCallbackRef.current = null;
              } else {
                editor
                  .chain()
                  .focus()
                  .insertContent({
                    type: 'imageGallery',
                    attrs: { columns: Math.min(3, items.length), images: items },
                  })
                  .run();
              }
            }
          }
          e.target.value = '';
        }}
      />

      {/* =========================================================
          STICKY RICH TEXT FORMATTING TOOLBAR
         ========================================================= */}
      <div
        className={`sticky top-0 z-30 border-b backdrop-blur-md px-3 py-2 flex flex-wrap items-center gap-1 text-xs ${toolbarBg}`}
      >
        {/* Undo / Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={`p-1.5 rounded-lg ${btnHover} disabled:opacity-30`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={`p-1.5 rounded-lg ${btnHover} disabled:opacity-30`}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <span className="h-4 w-px bg-current opacity-15 mx-1" />

        {/* Block Level Selector (Paragraph & H1-H6) */}
        <select
          value={currentHeadingVal}
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'p') {
              editor.chain().focus().setParagraph().run();
            } else {
              const lvl = Number(val.slice(1));
              editor.chain().focus().toggleHeading({ level: lvl }).run();
            }
          }}
          className={`px-2 py-1.5 rounded-lg border text-xs font-bold outline-none ${
            isLight ? 'bg-white border-zinc-300' : 'bg-black/40 border-white/15 text-white'
          }`}
          title="Paragraph / Heading style"
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1 (H1)</option>
          <option value="h2">Heading 2 (H2)</option>
          <option value="h3">Heading 3 (H3)</option>
          <option value="h4">Heading 4 (H4)</option>
          <option value="h5">Heading 5 (H5)</option>
          <option value="h6">Heading 6 (H6)</option>
        </select>

        {/* Font Family */}
        <select
          value={editor.getAttributes('textStyle').fontFamily || ''}
          onChange={(e) => {
            const val = e.target.value;
            if (!val) editor.chain().focus().unsetFontFamily().run();
            else editor.chain().focus().setFontFamily(val).run();
          }}
          className={`px-2 py-1.5 rounded-lg border text-xs outline-none max-w-[130px] ${
            isLight ? 'bg-white border-zinc-300' : 'bg-black/40 border-white/15 text-white'
          }`}
          title="Font family"
        >
          <option value="">Font Family</option>
          {FONT_FAMILIES.map((f) => (
            <option key={f.label} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        {/* Font Size */}
        <select
          value={editor.getAttributes('textStyle').fontSize || ''}
          onChange={(e) => {
            const val = e.target.value;
            if (!val) editor.chain().focus().unsetFontSize().run();
            else editor.chain().focus().setFontSize(val).run();
          }}
          className={`px-2 py-1.5 rounded-lg border text-xs outline-none ${
            isLight ? 'bg-white border-zinc-300' : 'bg-black/40 border-white/15 text-white'
          }`}
          title="Font size"
        >
          <option value="">Size</option>
          {FONT_SIZES.map((sz) => (
            <option key={sz} value={sz}>
              {sz}
            </option>
          ))}
        </select>

        <span className="h-4 w-px bg-current opacity-15 mx-1" />

        {/* Text Formatting Marks */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg ${editor.isActive('bold') ? activeBtn : btnHover}`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg ${editor.isActive('italic') ? activeBtn : btnHover}`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded-lg ${editor.isActive('underline') ? activeBtn : btnHover}`}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded-lg ${editor.isActive('strike') ? activeBtn : btnHover}`}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          className={`p-1.5 rounded-lg ${editor.isActive('subscript') ? activeBtn : btnHover}`}
          title="Subscript"
        >
          <SubscriptIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          className={`p-1.5 rounded-lg ${editor.isActive('superscript') ? activeBtn : btnHover}`}
          title="Superscript"
        >
          <SuperscriptIcon className="w-4 h-4" />
        </button>

        {/* Text Color Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowColorMenu((v) => !v);
              setShowHighlightMenu(false);
            }}
            className={`p-1.5 rounded-lg flex items-center gap-0.5 ${btnHover}`}
            title="Text color"
          >
            <Palette className="w-4 h-4 text-[#FF2E93]" />
          </button>
          {showColorMenu && (
            <div className="absolute left-0 top-9 z-40 p-2.5 rounded-xl bg-[#161622] border border-white/15 shadow-2xl w-44">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Text Color
              </div>
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setColor(c.color).run();
                      setShowColorMenu(false);
                    }}
                    style={{ backgroundColor: c.color }}
                    className="w-7 h-7 rounded-lg border border-white/20 hover:scale-110 transition"
                    title={c.label}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
                <input
                  type="color"
                  onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                  className="w-7 h-6 bg-transparent cursor-pointer"
                  title="Custom color"
                />
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().unsetColor().run();
                    setShowColorMenu(false);
                  }}
                  className="text-[11px] text-zinc-300 hover:text-[#FF2E93]"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Highlight Color Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowHighlightMenu((v) => !v);
              setShowColorMenu(false);
            }}
            className={`p-1.5 rounded-lg ${editor.isActive('highlight') ? activeBtn : btnHover}`}
            title="Highlight background color"
          >
            <Highlighter className="w-4 h-4" />
          </button>
          {showHighlightMenu && (
            <div className="absolute left-0 top-9 z-40 p-2.5 rounded-xl bg-[#161622] border border-white/15 shadow-2xl w-44">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Highlight Color
              </div>
              <div className="space-y-1">
                {HIGHLIGHT_COLORS.map((h) => (
                  <button
                    key={h.label}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().toggleHighlight({ color: h.color }).run();
                      setShowHighlightMenu(false);
                    }}
                    className="w-full text-left px-2 py-1 rounded flex items-center gap-2 hover:bg-white/10 text-xs text-white"
                  >
                    <span className="w-4 h-4 rounded" style={{ backgroundColor: h.color }} />
                    <span>{h.label}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().unsetHighlight().run();
                    setShowHighlightMenu(false);
                  }}
                  className="w-full text-left px-2 py-1 rounded text-[11px] text-red-400 hover:bg-white/10"
                >
                  Remove Highlight
                </button>
              </div>
            </div>
          )}
        </div>

        <span className="h-4 w-px bg-current opacity-15 mx-1" />

        {/* Alignment */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-1.5 rounded-lg ${editor.isActive({ textAlign: 'left' }) ? activeBtn : btnHover}`}
          title="Align left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-1.5 rounded-lg ${editor.isActive({ textAlign: 'center' }) ? activeBtn : btnHover}`}
          title="Align center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-1.5 rounded-lg ${editor.isActive({ textAlign: 'right' }) ? activeBtn : btnHover}`}
          title="Align right"
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`p-1.5 rounded-lg ${editor.isActive({ textAlign: 'justify' }) ? activeBtn : btnHover}`}
          title="Justify"
        >
          <AlignJustify className="w-4 h-4" />
        </button>

        <span className="h-4 w-px bg-current opacity-15 mx-1" />

        {/* Lists & Nesting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg ${editor.isActive('bulletList') ? activeBtn : btnHover}`}
          title="Bullet list"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg ${editor.isActive('orderedList') ? activeBtn : btnHover}`}
          title="Numbered list"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
          disabled={!editor.can().sinkListItem('listItem')}
          className={`p-1.5 rounded-lg ${btnHover} disabled:opacity-30`}
          title="Indent list item"
        >
          <Indent className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().liftListItem('listItem').run()}
          disabled={!editor.can().liftListItem('listItem')}
          className={`p-1.5 rounded-lg ${btnHover} disabled:opacity-30`}
          title="Outdent list item"
        >
          <Outdent className="w-4 h-4" />
        </button>

        <span className="h-4 w-px bg-current opacity-15 mx-1" />

        {/* Quote, Code, CodeBlock, Divider, Clear Formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-lg ${editor.isActive('blockquote') ? activeBtn : btnHover}`}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-1.5 rounded-lg ${editor.isActive('code') ? activeBtn : btnHover}`}
          title="Inline code"
        >
          <Code className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-1.5 rounded-lg ${editor.isActive('codeBlock') ? activeBtn : btnHover}`}
          title="Syntax code block"
        >
          <FileCode className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={`p-1.5 rounded-lg ${btnHover}`}
          title="Horizontal rule"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          className={`p-1.5 rounded-lg ${btnHover}`}
          title="Clear formatting"
        >
          <Eraser className="w-4 h-4" />
        </button>

        <span className="h-4 w-px bg-current opacity-15 mx-1" />

        {/* Rich Media & Custom Blocks Insertion */}
        <button
          type="button"
          onClick={() => onOpenLinkModal(editor.getAttributes('link'))}
          className={`p-1.5 rounded-lg ${editor.isActive('link') ? activeBtn : btnHover}`}
          title="Insert / Edit link (Ctrl+K)"
        >
          <Link2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`p-1.5 rounded-lg ${btnHover}`}
          title="Upload / Insert image"
        >
          <ImageIcon className="w-4 h-4 text-[#FF2E93]" />
        </button>
        <button
          type="button"
          onClick={() => {
            galleryCallbackRef.current = null;
            galleryInputRef.current?.click();
          }}
          className={`p-1.5 rounded-lg ${btnHover}`}
          title="Insert multi-image gallery"
        >
          <Images className="w-4 h-4 text-[#FF2E93]" />
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
          className={`p-1.5 rounded-lg ${editor.isActive('table') ? activeBtn : btnHover}`}
          title="Insert table"
        >
          <TableIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().insertContent({ type: 'calloutBlock', attrs: { variant: 'tip' } }).run()
          }
          className={`p-1.5 rounded-lg ${btnHover}`}
          title="Insert callout / tip box"
        >
          <Info className="w-4 h-4 text-[#FF2E93]" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().insertContent({ type: 'ctaButton' }).run()}
          className={`p-1.5 rounded-lg ${btnHover}`}
          title="Insert CTA button"
        >
          <MousePointerClick className="w-4 h-4 text-[#FF2E93]" />
        </button>
        <button
          type="button"
          onClick={() => setVideoPromptOpen(true)}
          className={`p-1.5 rounded-lg ${btnHover}`}
          title="Embed YouTube / Vimeo video"
        >
          <Video className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().insertContent({ type: 'socialEmbed' }).run()}
          className={`p-1.5 rounded-lg ${btnHover}`}
          title="Embed social media post"
        >
          <Share2 className="w-4 h-4" />
        </button>

        <span className="h-4 w-px bg-current opacity-15 mx-1" />

        {/* Block Reordering & Find/Replace */}
        <button
          type="button"
          onClick={() => moveCurrentBlock('up')}
          className={`p-1.5 rounded-lg ${btnHover}`}
          title="Move block up"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => moveCurrentBlock('down')}
          className={`p-1.5 rounded-lg ${btnHover}`}
          title="Move block down"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={duplicateCurrentBlock}
          className={`p-1.5 rounded-lg ${btnHover}`}
          title="Duplicate block"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setShowFindReplace((v) => !v)}
          className={`p-1.5 rounded-lg ${showFindReplace ? activeBtn : btnHover}`}
          title="Find & Replace (Ctrl+F)"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* Contextual Table Operations Bar when cursor is inside a Table */}
      {editor.isActive('table') && (
        <div className="px-4 py-1.5 bg-[#FF2E93]/15 border-b border-[#FF2E93]/30 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-[#FF2E93] uppercase tracking-wider text-[10px]">Table Tools:</span>
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowBefore().run()}
            className="px-2 py-0.5 rounded bg-black/40 hover:bg-black/70 text-white"
          >
            + Row Above
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            className="px-2 py-0.5 rounded bg-black/40 hover:bg-black/70 text-white"
          >
            + Row Below
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteRow().run()}
            className="px-2 py-0.5 rounded bg-black/40 hover:bg-red-500/40 text-red-300"
          >
            - Delete Row
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            className="px-2 py-0.5 rounded bg-black/40 hover:bg-black/70 text-white"
          >
            + Col Left
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            className="px-2 py-0.5 rounded bg-black/40 hover:bg-black/70 text-white"
          >
            + Col Right
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            className="px-2 py-0.5 rounded bg-black/40 hover:bg-red-500/40 text-red-300"
          >
            - Delete Col
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeaderRow().run()}
            className="px-2 py-0.5 rounded bg-black/40 hover:bg-black/70 text-white"
          >
            Toggle Header Row
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteTable().run()}
            className="px-2 py-0.5 rounded bg-red-500/30 hover:bg-red-500/50 text-red-200 font-semibold ml-auto"
          >
            Delete Table
          </button>
        </div>
      )}

      {/* Find & Replace Bar */}
      {showFindReplace && (
        <div className="px-4 py-2.5 bg-[#161622] border-b border-white/15 flex flex-wrap items-center gap-2 text-xs text-white">
          <div className="flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-[#FF2E93]" />
            <input
              type="text"
              value={findTerm}
              onChange={(e) => setFindTerm(e.target.value)}
              placeholder="Find in text..."
              className="px-2.5 py-1 rounded-lg bg-black/60 border border-white/15 text-white outline-none focus:border-[#FF2E93]"
            />
            <span className="text-[11px] text-zinc-400">Matches: {findCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              placeholder="Replace with..."
              className="px-2.5 py-1 rounded-lg bg-black/60 border border-white/15 text-white outline-none focus:border-[#FF2E93]"
            />
            <button
              type="button"
              onClick={() => handleReplace(false)}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 font-semibold"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => handleReplace(true)}
              className="px-2.5 py-1 rounded-lg bg-[#FF2E93] hover:bg-[#ff4da2] font-bold text-white"
            >
              Replace All
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowFindReplace(false)}
            className="ml-auto p-1 rounded hover:bg-white/10 text-zinc-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Selection Bubble Toolbar */}
      {bubbleCoords && (
        <div
          style={{
            position: 'fixed',
            top: Math.max(12, bubbleCoords.top),
            left: Math.max(16, bubbleCoords.left),
            transform: 'translateX(-50%)',
          }}
          className="z-50 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#14141F] border border-white/20 shadow-2xl text-white text-xs"
        >
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1 rounded ${editor.isActive('bold') ? 'bg-[#FF2E93]' : 'hover:bg-white/10'}`}
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1 rounded ${editor.isActive('italic') ? 'bg-[#FF2E93]' : 'hover:bg-white/10'}`}
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1 rounded ${editor.isActive('underline') ? 'bg-[#FF2E93]' : 'hover:bg-white/10'}`}
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-1.5 py-0.5 rounded font-bold ${
              editor.isActive('heading', { level: 2 }) ? 'bg-[#FF2E93]' : 'hover:bg-white/10'
            }`}
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-1.5 py-0.5 rounded font-bold ${
              editor.isActive('heading', { level: 3 }) ? 'bg-[#FF2E93]' : 'hover:bg-white/10'
            }`}
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHighlight({ color: 'rgba(255, 46, 147, 0.28)' }).run()}
            className={`p-1 rounded ${editor.isActive('highlight') ? 'bg-[#FF2E93]' : 'hover:bg-white/10'}`}
          >
            <Highlighter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onOpenLinkModal(editor.getAttributes('link'))}
            className={`p-1 rounded ${editor.isActive('link') ? 'bg-[#FF2E93]' : 'hover:bg-white/10'}`}
          >
            <Link2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Slash Commands Menu ("/" Block Inserter) */}
      {slashMenu.open && filteredSlashItems.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: Math.min(window.innerHeight - 280, slashMenu.coords.top),
            left: Math.min(window.innerWidth - 280, slashMenu.coords.left),
          }}
          className="z-50 w-64 max-h-72 overflow-y-auto rounded-2xl bg-[#14141F] border border-white/15 shadow-2xl p-2 text-white"
        >
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#FF2E93]">
            Insert Content Block
          </div>
          {filteredSlashItems.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => executeSlashCommand(item)}
              className={`w-full text-left px-2.5 py-2 rounded-xl flex flex-col transition ${
                idx === slashMenu.selectedIndex ? 'bg-[#FF2E93]/20 text-white' : 'hover:bg-white/10'
              }`}
            >
              <span className="font-bold text-xs">{item.label}</span>
              <span className="text-[11px] text-zinc-400">{item.desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* Video Embed Modal */}
      {videoPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-[#14141F] border border-white/15 rounded-2xl max-w-md w-full p-5 text-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-base flex items-center gap-2">
                <Video className="w-4 h-4 text-[#FF2E93]" /> Embed YouTube or Vimeo Video
              </span>
              <button onClick={() => setVideoPromptOpen(false)}>
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
            <input
              type="text"
              value={videoUrlInput}
              onChange={(e) => setVideoUrlInput(e.target.value)}
              placeholder="Paste YouTube or Vimeo URL (e.g. https://www.youtube.com/watch?v=...)"
              className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white outline-none focus:border-[#FF2E93]"
            />
            <input
              type="text"
              value={videoCaptionInput}
              onChange={(e) => setVideoCaptionInput(e.target.value)}
              placeholder="Optional video caption..."
              className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white outline-none focus:border-[#FF2E93]"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setVideoPromptOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const parsed = parseVideoEmbedUrl(videoUrlInput) || {
                    provider: 'YouTube',
                    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                  };
                  editor
                    .chain()
                    .focus()
                    .insertContent({
                      type: 'videoEmbed',
                      attrs: {
                        embedUrl: parsed.embedUrl,
                        provider: parsed.provider,
                        caption: videoCaptionInput,
                      },
                    })
                    .run();
                  setVideoUrlInput('');
                  setVideoCaptionInput('');
                  setVideoPromptOpen(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-[#FF2E93] text-xs font-bold text-white"
              >
                Insert Video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Writing Canvas */}
      <div className="flex-1 px-6 sm:px-14 py-8 max-w-4xl w-full mx-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
