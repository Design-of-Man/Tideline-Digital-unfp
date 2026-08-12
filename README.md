# Design of Man

A single-page marketing site for a website creation &amp; management studio. Beach/sunset theme, custom animated canvas hero, branching flowchart of services, pricing, testimonials, FAQ, and a consultation form.

Everything lives in **`index.html`** — no build step, no dependencies, no framework. It's a pure static site (the only external requests are Google Fonts). That makes it about as simple as a Vercel deploy gets.

## Project structure

```
tideline-digital/
├── index.html      # the entire site (HTML + CSS + JS inline)
├── vercel.json     # clean URLs + security headers
├── .gitignore
└── README.md
```

## Deploy to Vercel

Because there's no build step, Vercel serves `index.html` from the root automatically. Pick whichever path you like.

### Option A — Claude Code

1. Open this folder in Claude Code (`claude` in your terminal, or the Code tab in the Claude desktop app).
2. Ask it to initialize git and deploy, e.g. *"init a git repo, commit, and deploy this to Vercel."*
3. Claude Code can run the Vercel CLI for you and hand back the live URL.

Claude Code install &amp; docs: https://docs.claude.com/en/docs/claude-code/overview
npm package: https://www.npmjs.com/package/@anthropic-ai/claude-code (`npm install -g @anthropic-ai/claude-code`)

### Option B — Vercel CLI

```bash
npm install -g vercel      # if you don't have it
cd tideline-digital
vercel                     # preview deploy (follow the prompts)
vercel --prod              # promote to production
```

### Option C — Git import (no CLI)

1. Push this folder to a new GitHub/GitLab/Bitbucket repo.
2. In the Vercel dashboard: **Add New → Project → Import** the repo.
3. Framework preset: **Other** · Build command: **none** · Output dir: **`./`**
4. **Deploy.**

## Before you go live — checklist

This started as a design mockup, so a few values are placeholders:

- [ ] **Phone number** — replace `(561) 555-0100` (appears in the top bar, contact section, and footer).
- [ ] **Email** — replace `hello@tidelinedigital.com`.
- [ ] **Stats** — the hero counters (120+ sites, 99.9% uptime, 14 yrs, &lt;1 day) are illustrative.
- [ ] **Testimonials** — names, companies, and quotes are invented; swap in real ones.
- [ ] **Pricing** — confirm the Launch / Grow / Care numbers reflect your real offer.
- [ ] **Consultation form** — it currently shows a success state only; it does **not** send anywhere yet. Wire it to a form service (e.g. Formspree, Basin, or a Vercel serverless function) so submissions reach your inbox.
- [ ] **Domain** — add your custom domain in the Vercel project settings.
- [ ] **Metadata/SEO** — add a favicon, and an Open Graph title/description/image for link previews.

## Notes

- Respects `prefers-reduced-motion`: the animated sunset and reveal animations freeze into a static frame for users who ask for reduced motion.
- Fully responsive; the services flowchart and all grids reflow for tablet and mobile.

## SEO & domain

The pages ship with meta descriptions, canonical tags, Open Graph/Twitter cards, a social image (`og.png`), a favicon, and JSON-LD structured data (Organization + WebSite + FAQPage on the homepage, BreadcrumbList + CollectionPage/Article on Work and the case study). `robots.txt` and `sitemap.xml` are included.

**Before launch:** search-and-replace the placeholder domain `https://www.tidelinedigital.com` with your real domain across all `.html` files, `robots.txt`, and `sitemap.xml`, and update the placeholder phone number. Then submit the sitemap in Google Search Console.
