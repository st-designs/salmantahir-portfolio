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
index.html            home
about/                about
work/                 work index, filterable
work/<slug>/          one folder per case study
contact/              contact form
assets/css/site.css   the whole design system
assets/js/site.js     reveals, filtering, cursor, form
functions/api/        Pages Functions
_redirects            old URLs, kept alive
```

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
