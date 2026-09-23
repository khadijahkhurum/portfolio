# Khadijah Khurum — Portfolio

A static, single-page portfolio with a GRC / Technical toggle: the same
projects and background, framed differently for a compliance audience versus
an engineering one. No build step, no backend, no tracking.

## Files

- `index.html` — all content and structure
- `style.css` — design tokens and layout; the toggle works by swapping CSS
  variables and showing/hiding elements tagged `data-show="grc"` or
  `data-show="technical"`
- `script.js` — mode toggle logic (persisted in `localStorage`) and a guard
  on the contact form

## Before you publish

1. **Contact form.** The form currently posts to a placeholder Formspree URL
   (`YOUR_FORM_ID` in `index.html`). To make it work:
   - Create a free form at [formspree.io](https://formspree.io) with your
     email.
   - Replace `YOUR_FORM_ID` in the `<form action="...">` attribute with your
     real form ID.
   - Until you do this, the form shows an alert telling visitors to use
     LinkedIn instead — it won't silently fail.
2. **LinkedIn link.** Replace `YOUR-LINKEDIN-HANDLE` (two places in
   `index.html`) with your actual profile handle.
3. **Project links.** The FAIR Risk Radar and F1 research links are already
   filled in from what you gave me. Double check they still resolve before
   publishing.
4. **Privacy.** No phone number or address appears anywhere in the source —
   confirmed by search:
   ```
   grep -in "phone\|address" index.html
   ```
   Contact is form + LinkedIn only, as agreed. Keep it that way if you add
   content later.

## Deploying to GitHub Pages

1. Push this folder to a repo (e.g. `khadijahkhurum/portfolio`):
   ```
   git init
   git add .
   git commit -m "Initial portfolio site"
   git branch -M main
   git remote add origin https://github.com/khadijahkhurum/portfolio.git
   git push -u origin main
   ```
2. In the repo on GitHub: **Settings → Pages → Source → Deploy from a
   branch → `main` / root**.
3. Your site will be live at `https://khadijahkhurum.github.io/portfolio/`
   within a few minutes.

## Deploying to Vercel

1. Push the repo to GitHub as above (Vercel deploys from a repo).
2. Go to [vercel.com/new](https://vercel.com/new), import the repo, and
   leave all settings at their defaults — this is a static site, no
   framework preset or build command needed.
3. Deploy. Vercel gives you a `*.vercel.app` URL immediately, and you can
   attach a custom domain later from the project settings.

## Editing content later

Everything lives in plain HTML in `index.html`, split into sections in this
order: header, hero, frameworks/stack register, projects, background,
contact, footer. Anything wrapped in `data-show="grc"` only shows in GRC
mode; `data-show="technical"` only in Technical mode; anything without that
attribute shows in both. Add a new project by copying one `<article
class="dossier">...</article>` block and editing its contents.
