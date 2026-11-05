import DOMPurify from 'dompurify';

export function sanitizeHtml(html) {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe', 'figure', 'figcaption'],
    ADD_ATTR: [
      'target',
      'rel',
      'allow',
      'allowfullscreen',
      'frameborder',
      'scrolling',
      'data-callout',
      'data-type',
      'data-cta-button',
      'data-style',
      'data-align',
      'data-width',
      'data-cols',
      'data-gallery',
      'data-social-embed',
      'data-platform',
      'style',
      'class',
      'id',
    ],
  });
}

/**
 * Cleans HTML pasted from Google Docs or Microsoft Word while preserving
 * semantic headings, bold, italic, underline, lists, tables, and links.
 */
export function cleanWordAndDocsPaste(html) {
  if (!html || typeof html !== 'string') return html;

  let cleaned = html
    // Remove Word XML/meta comments and style blocks
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    // Remove <o:p> tags from MS Word
    .replace(/<\/?o:[^>]*>/gi, '')
    .replace(/<\/?w:[^>]*>/gi, '')
    .replace(/<\/?m:[^>]*>/gi, '')
    // Convert Google Docs bold/italic spans into semantic tags
    .replace(/<span[^>]*style="[^"]*font-weight:\s*(700|bold)[^"]*"[^>]*>([\s\S]*?)<\/span>/gi, '<strong>$2</strong>')
    .replace(/<span[^>]*style="[^"]*font-style:\s*italic[^"]*"[^>]*>([\s\S]*?)<\/span>/gi, '<em>$2</em>')
    // Remove MSO classes and noisy inline styles from Word
    .replace(/\s*class="Mso[^"]*"/gi, '')
    .replace(/\s*style="[^"]*mso-[^"]*"/gi, '')
    // Unwrap Google Docs wrapper <b style="font-weight:normal" id="docs-internal-guid-...">
    .replace(/<b[^>]*id="docs-internal-guid-[^"]*"[^>]*>([\s\S]*?)<\/b>/gi, '$1');

  return sanitizeHtml(cleaned);
}

/**
 * Injects deterministic IDs into H1-H4 tags and extracts a structured Table of Contents
 */
export function extractTocAndInjectIds(html) {
  if (!html) return { toc: [], htmlWithIds: '' };
  const toc = [];
  let idx = 0;

  const htmlWithIds = html.replace(/<h([1-4])([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, levelStr, attrs, inner) => {
    const level = Number(levelStr);
    const plainText = inner.replace(/<[^>]+>/g, '').trim();
    if (!plainText) return match;
    idx += 1;
    const slug =
      plainText
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 50) || `section-${idx}`;
    const id = `heading-${idx}-${slug}`;
    toc.push({ id, level, text: plainText });
    if (/id=/i.test(attrs)) {
      return match;
    }
    return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
  });

  return { toc, htmlWithIds };
}
