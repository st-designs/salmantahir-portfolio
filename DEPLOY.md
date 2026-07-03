# Deploy guide: salmantahir.net on Cloudflare Pages

The local Git repo is already initialized and committed. Three parts: get it on GitHub, connect Cloudflare Pages, point the domain.

## Part A: Put the code on GitHub

You need a free GitHub account (github.com). Two ways to push; pick one.

### Easiest: GitHub Desktop (no command line)
1. Download GitHub Desktop (desktop.github.com), install, sign in.
2. File → **Add Local Repository** → choose this folder (`.../salmantahir.net`).
3. Click **Publish repository**. Name it e.g. `salmantahir-portfolio`. Public is fine (nice for a designer-developer) or Private, both work. Publish.

### Or: command line
1. On github.com, click **+ → New repository**. Name it `salmantahir-portfolio`. **Do NOT** add a README/.gitignore (we already have files). Create.
2. GitHub shows commands. Run these in the project root (`salmantahir.net`):
   ```
   git remote add origin https://github.com/<your-username>/salmantahir-portfolio.git
   git push -u origin main
   ```
3. First push will ask you to sign in to GitHub via the browser, approve it.

## Part B: Connect Cloudflare Pages
1. Create a free account at dash.cloudflare.com.
2. Left sidebar → **Workers & Pages** → **Create** → **Pages** tab → **Connect to Git**.
3. Authorize GitHub, then select your `salmantahir-portfolio` repo.
4. Build settings:
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/`
5. **Save and Deploy.** In ~30 seconds you get a live URL like `salmantahir-portfolio.pages.dev`. Open it, the site is live.

## Part C: Point your domain (salmantahir.net)
1. In the Pages project → **Custom domains** → **Set up a custom domain** → enter `salmantahir.net`. Add `www.salmantahir.net` too.
2. Cloudflare will ask to manage your DNS. The clean way: **add the domain to Cloudflare** and change your nameservers at your domain registrar to the two Cloudflare gives you. (This is free and also handles the apex/root domain correctly.)
3. Wait for DNS to propagate (minutes to a couple of hours). SSL/HTTPS is automatic.
   - The moment DNS points to Cloudflare, your domain serves the new site instead of WordPress.

## Part D: Archive WordPress
- Before/after switching: log into your old host (cPanel) and download a backup of the WordPress files + database, keep it somewhere safe. Then you can leave it dormant or cancel that hosting.

## Ongoing workflow (after setup)
- Make a change → `git commit` → `git push` → Cloudflare auto-deploys in ~20s. (Claude can run the commit/push once GitHub auth is stored on this machine from your first push.)
- Roll back anytime from the Cloudflare Pages "Deployments" list.

## Notes
- Site root is this folder; `index.html` is the home page. No build step.
- If you ever move hosting again, it's just static files, fully portable, zero lock-in.
- The site uses clean URLs (`/about/`, `/work/`, `/work/<slug>/`, etc.), each a folder with its own `index.html`. Cloudflare Pages serves these automatically. A root-level `_redirects` file 301-redirects the old flat `.html` URLs to the new paths, don't delete it.
- A handful of older projects (Fxcubict, Stofficials, eVendor) intentionally still link out to legacy WordPress posts still live at `salmantahir.net/2023/...`, that's expected, not a broken migration.
