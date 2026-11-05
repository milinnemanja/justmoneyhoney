export const PERSONAL_FINANCE_KEYWORD_SUGGESTIONS = {
  'Tech & AI': [
    'artificial intelligence trends',
    'generative AI tools',
    'future of technology',
    'tech innovation',
    'smart home tech',
    'AI productivity',
  ],
  Automotive: [
    'luxury supercars',
    'electric hypercars',
    'collector cars investment',
    'automotive design',
    'bespoke grand tourer',
  ],
  'Real Estate': [
    'prime real estate investment',
    'luxury property market',
    'architectural homes',
    'rental yield strategy',
    'international real estate',
  ],
  'Boats & Yachts': [
    'superyacht design',
    'luxury yacht charter',
    'mediterranean sailing',
    'custom motor yachts',
    'marine lifestyle',
  ],
  Luxury: [
    'fine horology watches',
    'timeless luxury brands',
    'bespoke craftsmanship',
    'luxury lifestyle',
    'high-end collectibles',
  ],
  Travel: [
    'five-star luxury resorts',
    'private aviation travel',
    'boutique hotels',
    'exclusive travel destinations',
    'culinary travel experiences',
  ],
  Finance: [
    'personal finance strategy',
    'wealth building habits',
    'index fund investing',
    'passive income streams',
    'financial independence',
  ],
  Lifestyle: [
    'conscious luxury living',
    'modern lifestyle habits',
    'work-life balance',
    'high-performance mindset',
    'curated daily routines',
  ],
};

export function analyzeArticleSeo({
  title = '',
  slug = '',
  excerpt = '',
  contentHtml = '',
  featuredImage = '',
  featuredImageAlt = '',
  seo = {},
  authorName = 'Nemanja Milin',
  publishedAt = null,
  updatedAt = null,
  category = 'Finance',
}) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(contentHtml || '<p></p>', 'text/html');
  const plainText = (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
  const words = plainText ? plainText.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const charCount = plainText.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 215));

  // Headings extraction & hierarchy validation
  const headingNodes = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  const headings = headingNodes.map((node, index) => ({
    index,
    level: Number(node.tagName.slice(1)),
    tag: node.tagName.toUpperCase(),
    text: (node.textContent || '').trim(),
  }));

  const headingIssues = [];
  const h1Count = headings.filter((h) => h.level === 1).length;
  if (h1Count > 1) {
    headingIssues.push(
      `Found ${h1Count} H1 headings inside the body. Since the article title is already H1, use H2 for main sections.`
    );
  }
  if (!headings.some((h) => h.level === 2)) {
    headingIssues.push('Add at least one H2 subheading for better structure and SEO.');
  }
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1].level;
    const curr = headings[i].level;
    if (curr > prev + 1) {
      headingIssues.push(`Skipped heading level from H${prev} to H${curr} ("${headings[i].text.slice(0, 36)}").`);
    }
  }

  // Image & ALT text check
  const imgNodes = Array.from(doc.querySelectorAll('img'));
  const inlineImages = imgNodes.map((img, index) => ({
    index,
    src: img.getAttribute('src') || '',
    alt: (img.getAttribute('alt') || '').trim(),
  }));
  const missingInlineAlt = inlineImages.filter((img) => !img.alt);
  const featuredMissingAlt = Boolean(featuredImage && !String(featuredImageAlt || '').trim());

  // Internal vs External links
  const linkNodes = Array.from(doc.querySelectorAll('a[href]'));
  const links = linkNodes.map((a) => {
    const href = (a.getAttribute('href') || '').trim();
    const isInternal =
      href.startsWith('/') ||
      href.startsWith('#') ||
      href.includes('justmoneyhoney.com') ||
      href.includes('localhost');
    return {
      href,
      text: (a.textContent || '').trim() || href,
      target: a.getAttribute('target') || '_self',
      rel: a.getAttribute('rel') || '',
      isInternal,
    };
  });
  const internalLinks = links.filter((l) => l.isInternal);
  const externalLinks = links.filter((l) => !l.isInternal);

  // Meta fields & keyword checks
  const metaTitle = (seo.metaTitle || title || '').trim();
  const metaDescription = (seo.metaDescription || excerpt || '').trim();
  const focusKeyword = (seo.focusKeyword || '').trim().toLowerCase();

  const keywordChecks = [];
  if (focusKeyword) {
    const inTitle = title.toLowerCase().includes(focusKeyword) || metaTitle.toLowerCase().includes(focusKeyword);
    const inDesc = metaDescription.toLowerCase().includes(focusKeyword);
    const inSlug = slug.toLowerCase().includes(focusKeyword.replace(/\s+/g, '-'));
    const inContent = plainText.toLowerCase().includes(focusKeyword);
    const inHeading = headings.some((h) => h.text.toLowerCase().includes(focusKeyword));

    keywordChecks.push(
      { label: 'Focus keyword in SEO Title', passed: inTitle },
      { label: 'Focus keyword in Meta Description', passed: inDesc },
      { label: 'Focus keyword in URL Slug', passed: inSlug },
      { label: 'Focus keyword in article body', passed: inContent },
      { label: 'Focus keyword in at least one H2/H3 subheading', passed: inHeading }
    );
  }

  // Overall non-blocking SEO score & checklist
  const checks = [
    {
      id: 'title-len',
      label: `SEO Title length (${metaTitle.length}/60 chars)`,
      passed: metaTitle.length >= 30 && metaTitle.length <= 65,
      hint: 'Aim for 45–60 characters so Google displays the full headline.',
    },
    {
      id: 'desc-len',
      label: `Meta Description length (${metaDescription.length}/160 chars)`,
      passed: metaDescription.length >= 90 && metaDescription.length <= 165,
      hint: 'Aim for 120–160 characters for higher search click-through rates.',
    },
    {
      id: 'word-count',
      label: `Article length (${wordCount} words)`,
      passed: wordCount >= 250,
      hint: 'Comprehensive articles (300+ words) rank better in search engines.',
    },
    {
      id: 'headings',
      label: 'Proper H2/H3 subheading hierarchy',
      passed: headingIssues.length === 0,
      hint: headingIssues[0] || 'Subheading structure is properly organized.',
    },
    {
      id: 'alt-text',
      label: 'All images have descriptive ALT text',
      passed: !featuredMissingAlt && missingInlineAlt.length === 0 && Boolean(featuredImage || inlineImages.length > 0),
      hint: featuredMissingAlt
        ? 'Featured image is missing ALT text.'
        : missingInlineAlt.length > 0
        ? `${missingInlineAlt.length} inline image(s) missing ALT text.`
        : 'Add a featured or inline image with descriptive ALT text.',
    },
    {
      id: 'links',
      label: `Internal (${internalLinks.length}) & external (${externalLinks.length}) links`,
      passed: internalLinks.length >= 1 || externalLinks.length >= 1,
      hint: 'Include at least 1 internal or external reference link.',
    },
    ...keywordChecks.map((kc, idx) => ({
      id: `kw-${idx}`,
      label: kc.label,
      passed: kc.passed,
      hint: `Include "${seo.focusKeyword}" naturally.`,
    })),
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const score = Math.round((passedCount / Math.max(1, checks.length)) * 100);

  // Build JSON-LD Article structured data
  const canonicalUrl = seo.canonicalUrl || `https://justmoneyhoney.com/post/${slug || 'article'}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: metaTitle || title,
    description: metaDescription,
    articleSection: category,
    wordCount,
    image: (seo.ogImage || featuredImage) ? [seo.ogImage || featuredImage] : [],
    datePublished: publishedAt || new Date().toISOString(),
    dateModified: updatedAt || new Date().toISOString(),
    author: {
      '@type': 'Person',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'justmoneyhoney',
      logo: {
        '@type': 'ImageObject',
        url: 'https://justmoneyhoney.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  };

  return {
    wordCount,
    charCount,
    readingTimeMinutes,
    headings,
    headingIssues,
    inlineImages,
    missingInlineAlt,
    featuredMissingAlt,
    links,
    internalLinks,
    externalLinks,
    checks,
    score,
    jsonLd,
    keywordSuggestions:
      PERSONAL_FINANCE_KEYWORD_SUGGESTIONS[category] ||
      PERSONAL_FINANCE_KEYWORD_SUGGESTIONS['Finance'],
  };
}
