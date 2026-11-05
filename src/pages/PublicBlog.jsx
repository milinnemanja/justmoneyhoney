import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Clock,
  ArrowRight,
  Calculator,
  TrendingUp,
  Menu,
  X,
  Share2,
  Lock,
  CheckCircle2,
  DollarSign,
  Percent,
  Mail,
} from 'lucide-react';
import { extractTocAndInjectIds, sanitizeHtml } from '../utils/sanitizeAndPaste';

const NAV_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'Tech & AI', path: '/category/Tech & AI' },
  { label: 'Automotive', path: '/category/Automotive' },
  { label: 'Real Estate', path: '/category/Real Estate' },
  { label: 'Boats & Yachts', path: '/category/Boats & Yachts' },
  { label: 'Luxury', path: '/category/Luxury' },
  { label: 'Travel', path: '/category/Travel' },
  { label: 'Finance', path: '/category/Finance' },
  { label: 'Lifestyle', path: '/category/Lifestyle' },
];

export default function PublicBlog({
  currentPath,
  onNavigate,
  posts = [],
  categories = [],
  authors = [],
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Interactive Calculators state (for /tools)
  const [takeHomePay, setTakeHomePay] = useState(4500);
  const [savingsBalance, setSavingsBalance] = useState(25000);
  const [hysaApy, setHysaApy] = useState(4.65);
  const [annualExpenses, setAnnualExpenses] = useState(48000);

  // Determine current route view
  const routeInfo = useMemo(() => {
    if (currentPath === '/' || currentPath === '') {
      return { type: 'home' };
    }
    if (currentPath === '/tools') {
      return { type: 'tools' };
    }
    if (currentPath === '/about') {
      return { type: 'about' };
    }
    if (currentPath.startsWith('/category/')) {
      const catName = decodeURIComponent(currentPath.replace('/category/', ''));
      return { type: 'category', category: catName };
    }
    if (currentPath.startsWith('/post/')) {
      const slug = decodeURIComponent(currentPath.replace('/post/', ''));
      return { type: 'post', slug };
    }
    return { type: 'home' };
  }, [currentPath]);

  const currentPost = useMemo(() => {
    if (routeInfo.type !== 'post') return null;
    return posts.find((p) => p.slug === routeInfo.slug || p.id === routeInfo.slug) || null;
  }, [routeInfo, posts]);

  // Update document head SEO tags & JSON-LD dynamically
  useEffect(() => {
    if (currentPost) {
      const metaTitle = currentPost.seo?.metaTitle || `${currentPost.title} | justmoneyhoney`;
      const metaDesc = currentPost.seo?.metaDescription || currentPost.excerpt || '';
      document.title = metaTitle;

      let descTag = document.querySelector('meta[name="description"]');
      if (descTag) descTag.setAttribute('content', metaDesc);

      // Inject JSON-LD structured data
      let scriptTag = document.getElementById('jmh-jsonld');
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = 'jmh-jsonld';
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      const author = authors.find((a) => a.id === currentPost.authorId) || authors[0];
      scriptTag.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: currentPost.title,
        description: metaDesc,
        image: currentPost.featuredImage ? [currentPost.featuredImage] : [],
        datePublished: currentPost.publishedAt || currentPost.updatedAt,
        dateModified: currentPost.updatedAt,
        author: {
          '@type': 'Person',
          name: author?.name || 'Nemanja Milin',
        },
        publisher: {
          '@type': 'Organization',
          name: 'justmoneyhoney',
        },
      });
    } else {
      document.title = 'justmoneyhoney — Tech, Luxury, Real Estate, Finance & Lifestyle';
    }
  }, [currentPost, authors]);

  const estimateReadingTime = (html) => {
    const text = String(html || '').replace(/<[^>]+>/g, ' ');
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 215));
  };

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const q = searchTerm.toLowerCase();
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.excerpt || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }, [posts, searchTerm]);

  const featuredHeroPost = useMemo(
    () => posts.find((p) => p.featured) || posts[0] || null,
    [posts]
  );

  return (
    <div className="min-h-screen bg-[#08080C] text-white flex flex-col">
      {/* =========================================================
          TOP BRAND NAVBAR
          Logo: "just" white, "money" pink, "honey" white
          Links: Home, Tech & AI, Automotive, Real Estate, Boats & Yachts, Luxury, Travel, Finance, Lifestyle
         ========================================================= */}
      <header className="sticky top-0 z-40 bg-[#08080C]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="font-display font-black text-2xl sm:text-3xl tracking-tight flex items-center select-none group shrink-0"
          >
            <span className="text-white">just</span>
            <span className="text-[#FF2E93] group-hover:brightness-110 transition">money</span>
            <span className="text-white">honey</span>
            <span className="w-2 h-2 rounded-full bg-[#FF2E93] ml-1 mt-2" />
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const decodedCurrent = decodeURIComponent(currentPath);
              const isActive =
                decodedCurrent === item.path ||
                (item.path !== '/' && decodedCurrent.startsWith(item.path));
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onNavigate(item.path)}
                  className={`px-2.5 xl:px-3.5 py-2 rounded-full font-display font-bold text-xs xl:text-sm whitespace-nowrap transition ${
                    isActive
                      ? 'bg-[#FF2E93] text-white shadow-lg shadow-[#FF2E93]/30'
                      : 'text-white hover:text-[#FF2E93] hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Search & Mobile Menu Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white transition"
              title="Search articles"
            >
              <Search className="w-4 h-4 text-[#FF2E93]" />
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="lg:hidden p-2.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Search Drawer */}
        {searchOpen && (
          <div className="border-t border-white/10 bg-[#101018] px-4 sm:px-8 py-4">
            <div className="max-w-3xl mx-auto">
              <div className="relative">
                <Search className="w-4 h-4 text-[#FF2E93] absolute left-3.5 top-3" />
                <input
                  type="text"
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search topics: Tech & AI, Automotive, Real Estate, Boats & Yachts, Luxury, Travel, Finance, Lifestyle..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-black/60 border border-white/15 text-sm text-white focus:border-[#FF2E93] outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSearchOpen(false);
                  }}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {searchTerm.trim() && (
                <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="text-xs text-zinc-400 py-2">
                      No articles found for "{searchTerm}".
                    </div>
                  ) : (
                    searchResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchTerm('');
                          onNavigate(`/post/${p.slug}`);
                        }}
                        className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-[#FF2E93]/15 border border-white/10 flex items-center justify-between gap-3 transition"
                      >
                        <div>
                          <div className="text-xs font-bold text-[#FF2E93]">{p.category}</div>
                          <div className="font-display font-bold text-sm text-white">{p.title}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#FF2E93] shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 bg-[#0E0E16] px-4 py-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const decodedCurrent = decodeURIComponent(currentPath);
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate(item.path);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl font-display font-bold text-sm ${
                    decodedCurrent === item.path
                      ? 'bg-[#FF2E93] text-white'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* =========================================================
          MAIN CONTENT AREA
         ========================================================= */}
      <main className="flex-1">
        {/* ---------------------------------------------------------
            VIEW 1: HOME PAGE
           --------------------------------------------------------- */}
        {routeInfo.type === 'home' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-16">
            {/* Hero Spotlight */}
            {featuredHeroPost && (
              <section className="relative rounded-3xl overflow-hidden border border-white/15 bg-gradient-to-br from-[#161622] via-[#101018] to-[#08080C] p-6 sm:p-12 shadow-2xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 space-y-5">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FF2E93]/20 border border-[#FF2E93]/40 text-[#FF2E93] text-xs font-extrabold uppercase tracking-wider">
                      Featured Story • {featuredHeroPost.category}
                    </div>
                    <h1
                      onClick={() => onNavigate(`/post/${featuredHeroPost.slug}`)}
                      className="font-display font-black text-3xl sm:text-5xl leading-[1.12] tracking-tight text-white hover:text-[#FF2E93] transition cursor-pointer"
                    >
                      {featuredHeroPost.title}
                    </h1>
                    <p className="text-zinc-300 text-base sm:text-lg leading-relaxed max-w-2xl">
                      {featuredHeroPost.excerpt}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 pt-2">
                      <button
                        type="button"
                        onClick={() => onNavigate(`/post/${featuredHeroPost.slug}`)}
                        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#FF2E93] hover:bg-[#ff4da2] text-white font-display font-extrabold text-sm shadow-xl shadow-[#FF2E93]/30 transition"
                      >
                        Read Full Story <ArrowRight className="w-4 h-4" />
                      </button>
                      <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <Clock className="w-4 h-4 text-[#FF2E93]" />
                        {estimateReadingTime(featuredHeroPost.contentHtml)} min read
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-5">
                    {featuredHeroPost.featuredImage && (
                      <div
                        onClick={() => onNavigate(`/post/${featuredHeroPost.slug}`)}
                        className="rounded-2xl overflow-hidden border border-white/15 shadow-2xl cursor-pointer group"
                      >
                        <img
                          src={featuredHeroPost.featuredImage}
                          alt={featuredHeroPost.featuredImageAlt || featuredHeroPost.title}
                          className="w-full h-72 sm:h-80 object-cover group-hover:scale-105 transition duration-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Category Quick Bar */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    cat.name === 'Tools'
                      ? onNavigate('/tools')
                      : onNavigate(`/category/${cat.name}`)
                  }
                  className="p-4 rounded-2xl bg-[#12121B] hover:bg-[#FF2E93]/15 border border-white/10 hover:border-[#FF2E93]/50 text-left transition group"
                >
                  <div className="font-display font-extrabold text-base text-white group-hover:text-[#FF2E93] flex items-center justify-between">
                    <span>{cat.name}</span>
                    <ArrowRight className="w-4 h-4 text-[#FF2E93] opacity-70 group-hover:translate-x-1 transition" />
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{cat.description}</p>
                </button>
              ))}
            </section>

            {/* Latest Articles Feed */}
            <section className="space-y-6">
              <div className="flex items-end justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-widest text-[#FF2E93]">
                    Tech, Luxury, Finance & Modern Living
                  </span>
                  <h2 className="font-display font-black text-2xl sm:text-3xl mt-1">
                    Latest Articles
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                {posts.map((post) => {
                  const author = authors.find((a) => a.id === post.authorId) || authors[0];
                  return (
                    <article
                      key={post.id}
                      onClick={() => onNavigate(`/post/${post.slug}`)}
                      className="rounded-3xl bg-[#12121B] border border-white/10 hover:border-[#FF2E93]/50 overflow-hidden flex flex-col cursor-pointer group transition shadow-lg"
                    >
                      {post.featuredImage && (
                        <div className="h-52 overflow-hidden relative">
                          <img
                            src={post.featuredImage}
                            alt={post.featuredImageAlt || post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                          <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/15 text-[#FF2E93] text-[11px] font-extrabold uppercase tracking-wider">
                            {post.category}
                          </span>
                        </div>
                      )}
                      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2.5">
                          <h3 className="font-display font-extrabold text-xl leading-snug text-white group-hover:text-[#FF2E93] transition">
                            {post.title}
                          </h3>
                          <p className="text-zinc-300 text-sm leading-relaxed line-clamp-3">
                            {post.excerpt}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
                          <div className="flex items-center gap-2">
                            {author && (
                              <img
                                src={author.avatar}
                                alt={author.name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            )}
                            <span className="font-semibold text-white">{author?.name}</span>
                          </div>
                          <span>{estimateReadingTime(post.contentHtml)} min read</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* Newsletter Banner */}
            <section className="rounded-3xl bg-gradient-to-r from-[#FF2E93]/20 via-[#161622] to-[#12121B] border border-[#FF2E93]/40 p-8 sm:p-12 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="space-y-2 max-w-xl">
                <div className="text-xs font-extrabold uppercase tracking-widest text-[#FF2E93]">
                  Weekly Friday Newsletter
                </div>
                <h3 className="font-display font-black text-2xl sm:text-3xl">
                  Manage your money smarter in 5 minutes a week.
                </h3>
                <p className="text-zinc-300 text-sm">
                  No dry banking jargon. Actionable insights on tech, luxury, real estate, smart investing, and a higher standard of living delivered to your inbox every Friday.
                </p>
              </div>

              {newsletterSubscribed ? (
                <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" /> You're subscribed! Check your inbox.
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newsletterEmail.trim()) setNewsletterSubscribed(true);
                  }}
                  className="flex w-full max-w-md gap-2"
                >
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email address..."
                    className="flex-1 px-4 py-3 rounded-full bg-black/70 border border-white/20 text-sm text-white focus:border-[#FF2E93] outline-none"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-full bg-[#FF2E93] hover:bg-[#ff4da2] text-white font-display font-extrabold text-sm shrink-0 shadow-lg shadow-[#FF2E93]/30"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </section>

            {/* Story Submission Banner */}
            <section className="rounded-3xl bg-[#12121B] border border-white/10 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
              <Mail className="w-5 h-5 text-[#FF2E93] shrink-0" />
              <p className="font-display font-bold text-base sm:text-lg text-white">
                If you have a story for us, send it via email:{' '}
                <a
                  href="mailto:justmoneyhoney@gmail.com"
                  className="text-[#FF2E93] hover:underline font-extrabold"
                >
                  justmoneyhoney@gmail.com
                </a>
              </p>
            </section>
          </div>
        )}

        {/* ---------------------------------------------------------
            VIEW 2: CATEGORIES
           --------------------------------------------------------- */}
        {routeInfo.type === 'category' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 space-y-10">
            <div className="p-8 sm:p-10 rounded-3xl bg-[#12121B] border border-white/10">
              <div className="text-xs font-extrabold uppercase tracking-widest text-[#FF2E93] mb-2">
                Category
              </div>
              <h1 className="font-display font-black text-3xl sm:text-5xl mb-3">
                {routeInfo.category}
              </h1>
              <p className="text-zinc-300 text-base max-w-2xl">
                {categories.find((c) => c.name.toLowerCase() === routeInfo.category.toLowerCase())
                  ?.description ||
                  `Curated guides, stories, and insights in ${routeInfo.category}.`}
              </p>
            </div>

            {posts.filter((p) => p.category.toLowerCase() === routeInfo.category.toLowerCase()).length === 0 ? (
              <div className="p-10 rounded-3xl bg-[#12121B] border border-white/10 text-center text-zinc-400 text-sm">
                No published articles in "{routeInfo.category}" yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                {posts
                  .filter((p) => p.category.toLowerCase() === routeInfo.category.toLowerCase())
                  .map((post) => {
                    const author = authors.find((a) => a.id === post.authorId) || authors[0];
                    return (
                      <article
                        key={post.id}
                        onClick={() => onNavigate(`/post/${post.slug}`)}
                        className="rounded-3xl bg-[#12121B] border border-white/10 hover:border-[#FF2E93]/50 overflow-hidden flex flex-col cursor-pointer group transition"
                      >
                        {post.featuredImage && (
                          <img
                            src={post.featuredImage}
                            alt={post.featuredImageAlt || post.title}
                            className="w-full h-52 object-cover group-hover:scale-105 transition duration-500"
                          />
                        )}
                        <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                          <div>
                            <span className="text-xs font-bold text-[#FF2E93] uppercase">
                              {post.category}
                            </span>
                            <h2 className="font-display font-extrabold text-xl mt-1 group-hover:text-[#FF2E93] transition">
                              {post.title}
                            </h2>
                            <p className="text-zinc-300 text-sm mt-2 line-clamp-3">{post.excerpt}</p>
                          </div>
                          <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
                            <span className="font-semibold text-white">{author?.name}</span>
                            <span>{estimateReadingTime(post.contentHtml)} min read</span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------------
            VIEW 3: INTERACTIVE FINANCIAL TOOLS (/tools)
           --------------------------------------------------------- */}
        {routeInfo.type === 'tools' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 space-y-12">
            <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#161622] to-[#0E0E16] border border-white/15">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF2E93]/20 text-[#FF2E93] text-xs font-bold uppercase mb-3">
                <Calculator className="w-3.5 h-3.5" /> Financial Lab
              </div>
              <h1 className="font-display font-black text-3xl sm:text-5xl mb-3">
                Interactive Personal Finance Calculators
              </h1>
              <p className="text-zinc-300 text-base max-w-2xl">
                Run your numbers in seconds. Plan your monthly income allocation across 4 buckets, compare high-yield savings returns, and calculate your financial independence number.
              </p>
            </div>

            {/* Interactive Calculators Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calculator 1: 4-Bucket Income Allocation */}
              <div className="p-6 rounded-3xl bg-[#12121B] border border-white/10 space-y-4">
                <div className="flex items-center gap-2 text-[#FF2E93] font-display font-extrabold text-lg">
                  <DollarSign className="w-5 h-5" /> 1. Income Allocation Calculator
                </div>
                <p className="text-xs text-zinc-400">
                  Enter your monthly net take-home pay to see the ideal 4-bucket breakdown:
                </p>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Monthly Net Income: €{Number(takeHomePay).toLocaleString()}
                  </label>
                  <input
                    type="range"
                    min="500"
                    max="20000"
                    step="100"
                    value={takeHomePay}
                    onChange={(e) => setTakeHomePay(Number(e.target.value))}
                    className="w-full accent-[#FF2E93]"
                  />
                </div>
                <div className="space-y-2 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex justify-between">
                    <span>1. Fixed Costs & Essentials (55%)</span>
                    <strong className="text-white">€{Math.round(takeHomePay * 0.55).toLocaleString()}/mo</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex justify-between">
                    <span>2. Investments & Future Wealth (20%)</span>
                    <strong className="text-emerald-400">€{Math.round(takeHomePay * 0.2).toLocaleString()}/mo</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex justify-between">
                    <span>3. Short-Term Goals & Travel (10%)</span>
                    <strong className="text-sky-400">€{Math.round(takeHomePay * 0.1).toLocaleString()}/mo</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FF2E93]/15 border border-[#FF2E93]/40 flex justify-between">
                    <span className="font-bold text-[#FF2E93]">4. Guilt-Free Spending (15%)</span>
                    <strong className="text-[#FF2E93]">€{Math.round(takeHomePay * 0.15).toLocaleString()}/mo</strong>
                  </div>
                </div>
              </div>

              {/* Calculator 2: High-Yield Savings Interest */}
              <div className="p-6 rounded-3xl bg-[#12121B] border border-white/10 space-y-4">
                <div className="flex items-center gap-2 text-[#FF2E93] font-display font-extrabold text-lg">
                  <Percent className="w-5 h-5" /> 2. High-Yield Savings Calculator
                </div>
                <p className="text-xs text-zinc-400">
                  Compare a high-yield savings account against a standard 0.01% checking account:
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Savings Balance: €{Number(savingsBalance).toLocaleString()}
                    </label>
                    <input
                      type="range"
                      min="1000"
                      max="100000"
                      step="1000"
                      value={savingsBalance}
                      onChange={(e) => setSavingsBalance(Number(e.target.value))}
                      className="w-full accent-[#FF2E93]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Annual Interest Rate (APY): {hysaApy}%
                    </label>
                    <input
                      type="range"
                      min="2.0"
                      max="6.0"
                      step="0.05"
                      value={hysaApy}
                      onChange={(e) => setHysaApy(Number(e.target.value))}
                      className="w-full accent-[#FF2E93]"
                    />
                  </div>
                </div>
                <div className="space-y-2 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex justify-between">
                    <span>Standard Bank (0.01% APY)</span>
                    <strong className="text-zinc-400">€{(savingsBalance * 0.0001).toFixed(2)}/yr</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex justify-between">
                    <span className="font-bold text-emerald-300">High-Yield ({hysaApy}% APY)</span>
                    <strong className="text-emerald-300">
                      +€{Math.round(savingsBalance * (hysaApy / 100)).toLocaleString()}/yr
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FF2E93]/15 border border-[#FF2E93]/40 flex justify-between">
                    <span className="font-bold text-[#FF2E93]">3-Year Compounded Gain</span>
                    <strong className="text-[#FF2E93]">
                      +€{Math.round(savingsBalance * Math.pow(1 + hysaApy / 100, 3) - savingsBalance).toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Calculator 3: Financial Independence Number */}
              <div className="p-6 rounded-3xl bg-[#12121B] border border-white/10 space-y-4">
                <div className="flex items-center gap-2 text-[#FF2E93] font-display font-extrabold text-lg">
                  <TrendingUp className="w-5 h-5" /> 3. Financial Freedom Number
                </div>
                <p className="text-xs text-zinc-400">
                  Based on the 4% safe withdrawal rule (25× your annual lifestyle expenses):
                </p>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Target Annual Expenses: €{Number(annualExpenses).toLocaleString()}/yr
                  </label>
                  <input
                    type="range"
                    min="12000"
                    max="200000"
                    step="2000"
                    value={annualExpenses}
                    onChange={(e) => setAnnualExpenses(Number(e.target.value))}
                    className="w-full accent-[#FF2E93]"
                  />
                </div>
                <div className="space-y-2 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex justify-between">
                    <span>Lean Independence (20×)</span>
                    <strong className="text-white">€{(annualExpenses * 20).toLocaleString()}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FF2E93]/15 border border-[#FF2E93]/40 flex justify-between">
                    <span className="font-bold text-[#FF2E93]">Full Financial Freedom (25×)</span>
                    <strong className="text-[#FF2E93]">€{(annualExpenses * 25).toLocaleString()}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex justify-between">
                    <span>Abundant Luxury Cushion (30×)</span>
                    <strong className="text-emerald-400">€{(annualExpenses * 30).toLocaleString()}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------
            VIEW 4: ABOUT US (/about)
           --------------------------------------------------------- */}
        {routeInfo.type === 'about' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12 space-y-12">
            <div className="p-8 sm:p-12 rounded-3xl bg-[#12121B] border border-white/15 space-y-5">
              <div className="text-xs font-extrabold uppercase tracking-widest text-[#FF2E93]">
                Our Editorial Manifesto
              </div>
              <h1 className="font-display font-black text-3xl sm:text-5xl leading-tight">
                We believe in building serious wealth while enjoying the finest things in life.
              </h1>
              <p className="text-zinc-300 text-base sm:text-lg leading-relaxed">
                Welcome to{' '}
                <strong className="font-display">
                  <span className="text-white">just</span>
                  <span className="text-[#FF2E93]">money</span>
                  <span className="text-white">honey</span>
                </strong>
                . Explore our curated coverage across Tech &amp; AI, Automotive, Real Estate, Boats &amp; Yachts, Luxury, Travel, Finance, and Lifestyle — designed for ambitious readers who appreciate innovation, smart capital allocation, and timeless craftsmanship.
              </p>
            </div>

            <div className="space-y-6">
              <h2 className="font-display font-black text-2xl sm:text-3xl">Meet the Editorial Team</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {authors.map((a) => (
                  <div
                    key={a.id}
                    className="p-6 rounded-3xl bg-[#12121B] border border-white/10 space-y-4"
                  >
                    <img
                      src={a.avatar}
                      alt={a.name}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-[#FF2E93]"
                    />
                    <div>
                      <h3 className="font-display font-extrabold text-xl">{a.name}</h3>
                      <div className="text-xs font-bold text-[#FF2E93] mt-0.5">{a.role}</div>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">{a.bio}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------
            VIEW 5: SINGLE ARTICLE (/post/:slug)
           --------------------------------------------------------- */}
        {routeInfo.type === 'post' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12">
            {!currentPost ? (
              <div className="p-12 rounded-3xl bg-[#12121B] border border-white/10 text-center space-y-4">
                <h1 className="font-display font-black text-2xl">Article Not Found</h1>
                <p className="text-sm text-zinc-400">
                  This article may be a private draft or its URL has changed.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('/')}
                  className="px-5 py-2.5 rounded-full bg-[#FF2E93] text-white font-bold text-xs"
                >
                  Back to Home
                </button>
              </div>
            ) : (
              (() => {
                const author =
                  authors.find((a) => a.id === currentPost.authorId) || authors[0];
                const { htmlWithIds } = extractTocAndInjectIds(
                  sanitizeHtml(currentPost.contentHtml || '')
                );
                const relatedPosts = posts
                  .filter(
                    (p) =>
                      p.id !== currentPost.id &&
                      ((currentPost.relatedPostIds || []).includes(p.id) ||
                        p.category === currentPost.category)
                  )
                  .slice(0, 2);

                return (
                  <article className="space-y-8">
                    {/* Breadcrumb & Category */}
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => onNavigate('/')}
                        className="text-zinc-400 hover:text-white"
                      >
                        Home
                      </button>
                      <span className="text-zinc-600">/</span>
                      <button
                        type="button"
                        onClick={() => onNavigate(`/category/${currentPost.category}`)}
                        className="font-bold text-[#FF2E93] hover:underline"
                      >
                        {currentPost.category}
                      </button>
                    </div>

                    {/* Headline & Excerpt */}
                    <header className="space-y-4">
                      <h1 className="font-display font-black text-3xl sm:text-5xl leading-[1.15] tracking-tight">
                        {currentPost.title}
                      </h1>
                      {currentPost.excerpt && (
                        <p className="text-zinc-300 text-lg sm:text-xl leading-relaxed">
                          {currentPost.excerpt}
                        </p>
                      )}

                      {/* Author & Meta Bar */}
                      <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {author && (
                            <img
                              src={author.avatar}
                              alt={author.name}
                              className="w-11 h-11 rounded-full object-cover border-2 border-[#FF2E93]"
                            />
                          )}
                          <div>
                            <div className="font-display font-bold text-sm text-white">
                              {author?.name}
                            </div>
                            <div className="text-xs text-zinc-400 flex items-center gap-2">
                              <span>
                                {new Date(
                                  currentPost.publishedAt || currentPost.updatedAt
                                ).toLocaleDateString('en-US', {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                              <span>•</span>
                              <span className="text-[#FF2E93] font-semibold">
                                {estimateReadingTime(currentPost.contentHtml)} min read
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(window.location.href);
                            setCopiedShare(true);
                            setTimeout(() => setCopiedShare(false), 2500);
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-bold"
                        >
                          <Share2 className="w-3.5 h-3.5 text-[#FF2E93]" />
                          <span>{copiedShare ? 'Link copied!' : 'Share article'}</span>
                        </button>
                      </div>
                    </header>

                    {/* Featured Image */}
                    {currentPost.featuredImage && (
                      <figure className="my-6">
                        <img
                          src={currentPost.featuredImage}
                          alt={currentPost.featuredImageAlt || currentPost.title}
                          className="w-full max-h-[500px] object-cover rounded-3xl border border-white/15 shadow-2xl"
                        />
                        {currentPost.featuredImageCaption && (
                          <figcaption className="text-xs text-zinc-400 text-center mt-2.5">
                            {currentPost.featuredImageCaption}
                          </figcaption>
                        )}
                      </figure>
                    )}

                    {/* Semantic Published Content */}
                    <div
                      className="jmh-prose"
                      dangerouslySetInnerHTML={{ __html: htmlWithIds }}
                    />

                    {/* Tags */}
                    {currentPost.tags?.length > 0 && (
                      <div className="pt-6 border-t border-white/10 flex flex-wrap gap-2">
                        {currentPost.tags.map((t) => (
                          <span
                            key={t}
                            className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Author Bio Box */}
                    {author && (
                      <div className="p-6 rounded-3xl bg-[#12121B] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                        <img
                          src={author.avatar}
                          alt={author.name}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-[#FF2E93]"
                        />
                        <div>
                          <div className="text-xs font-bold uppercase text-[#FF2E93]">
                            Written by • {author.role}
                          </div>
                          <div className="font-display font-extrabold text-lg text-white">
                            {author.name}
                          </div>
                          <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{author.bio}</p>
                        </div>
                      </div>
                    )}

                    {/* Related Articles */}
                    {relatedPosts.length > 0 && (
                      <section className="pt-8 border-t border-white/10 space-y-4">
                        <h3 className="font-display font-black text-2xl">
                          Related Articles on justmoneyhoney
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {relatedPosts.map((rp) => (
                            <div
                              key={rp.id}
                              onClick={() => onNavigate(`/post/${rp.slug}`)}
                              className="p-5 rounded-2xl bg-[#12121B] border border-white/10 hover:border-[#FF2E93] cursor-pointer transition space-y-2"
                            >
                              <span className="text-xs font-bold text-[#FF2E93]">
                                {rp.category}
                              </span>
                              <h4 className="font-display font-extrabold text-lg text-white">
                                {rp.title}
                              </h4>
                              <p className="text-xs text-zinc-400 line-clamp-2">{rp.excerpt}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </article>
                );
              })()
            )}
          </div>
        )}
      </main>

      {/* =========================================================
          DARK LUXURY FOOTER (With Discrete Private Admin Access)
         ========================================================= */}
      <footer className="border-t border-white/10 bg-[#050508] mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="font-display font-black text-2xl tracking-tight">
              <span className="text-white">just</span>
              <span className="text-[#FF2E93]">money</span>
              <span className="text-white">honey</span>
            </div>
            <p className="text-xs text-zinc-400">
              Tech, Luxury, Real Estate, Finance &amp; Lifestyle. Spend intentionally, build wealth unapologetically.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-400">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => onNavigate(item.path)}
                className="hover:text-[#FF2E93] transition"
              >
                {item.label}
              </button>
            ))}
            <span className="text-zinc-700">|</span>
            <button
              type="button"
              onClick={() => onNavigate('/admin')}
              className="inline-flex items-center gap-1 text-zinc-500 hover:text-[#FF2E93] transition"
              title="Access Editorial CMS"
            >
              <Lock className="w-3 h-3" /> Admin Panel
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
