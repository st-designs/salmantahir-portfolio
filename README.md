# salmantahir.net

My portfolio. UI/UX design and front-end work, written by hand.

**[View the site](https://salmantahir.net)**

---

## Why it looks like this

The first version of this site ran on WordPress. It did the job for a while, but a personal
portfolio does not need a database, a plugin stack or a monthly bill, and every time I wanted to
change a heading I was logging into an admin panel and waiting for a page builder to load. The site
was heavy, hosting was not free, and maintaining it was more work than the content it held.

So I rebuilt it as static files and moved it to Cloudflare Pages. No CMS, no build step, no
dependencies to update. Editing a page means editing HTML. Deploying means pushing to `main`.

The design is deliberately not the dark, gradient-heavy look that portfolios have converged on.
Off-white grounds, one accent, real squircles by way of `corner-shape`, and motion that resolves
rather than decorates. If a designer builds their own site, it should look like a decision.

## Stack

Vanilla HTML, CSS and JavaScript. No framework, no bundler.

- **Type** Onest, self-hosted as a subset variable woff2 so there is no third-party font request
- **Shape** `corner-shape: squircle` with a `border-radius` fallback, one radius scale across the site
- **Motion** [Lenis](https://github.com/darkroomengineering/lenis) for smooth scroll, vendored locally
- **Contact** a Cloudflare Pages Function that hands the message to Resend
- **Hosting** Cloudflare Pages, deployed from `main`

## Structure

```
index.html                 home
about/index.html           about
contact/index.html         contact form
work/index.html            work index, filterable
work/<slug>/index.html     one folder per case study
assets/
  css/site.css             the whole design system, one file
  js/site.js               reveals, filtering, cursor, form
  js/lenis.min.js          smooth scroll, vendored
  fonts/                   Onest, subset variable woff2
  img/                     shared project imagery
  img/<slug>/              per project: feature, screenshots, logos
functions/api/contact.js   Cloudflare Pages Function
_headers                   caching and security headers
_redirects                 old URLs, kept alive
```

Clean URLs come from the folder-per-page layout, so `/work/tag-technologies/`
is a directory with an `index.html` rather than a rewritten route. Nothing needs
configuring for a new page to resolve.

## Adding a case study

The pattern is deliberate, so a new project drops in without touching the design
system:

1. **Create `work/<slug>/index.html`.** Copy an existing case study as the
   starting point. The page shell (head, sprite, header, footer, script tags) is
   identical on every page and should stay that way.
2. **Put imagery in `assets/img/<slug>/`.** A `feature.webp` at 16:10 for the
   grid and the page hero, plus whatever screenshots the write-up needs. WebP,
   sized to what it is painted at, `width` and `height` always set.
3. **Add the card** to `work/index.html` and, if it is one of the headline
   projects, to the home page. Tags come from the fixed discipline list below,
   and `data-tags` on the card is what the filter reads.
4. **Register the URL** in `sitemap.xml`.

Disciplines are a closed set, shared by the tags and the filter chips:
`brand`, `research`, `ui`, `web`, `dev`, `testing`, `ecom`, `seo`. Each has an
SVG symbol in the sprite at the top of every page. Adding a discipline means
adding a symbol and a filter chip, not inventing a one-off label.

Feature images sit on a paper-grain ground tinted from the project's own brand
colour, with the screenshot placed differently per project so a grid of them
does not read as six of the same picture.

## Running it

Any static server will do:

```bash
python3 -m http.server 4599
```

Pages Functions do not run under a plain static server. To exercise the contact form locally:

```bash
npx wrangler pages dev .
```

## Contact form

`functions/api/contact.js` posts to Resend. It needs one environment variable set in the Cloudflare
Pages dashboard:

```
RESEND_API_KEY
```

The sending domain has to be verified in Resend before mail leaves. Replies go to whoever filled in
the form, not to the site.

## Licence

The code is free to learn from. The writing, photography and project work are mine.
