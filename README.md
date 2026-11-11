# TrendingRepos — Progressive Web App (PWA)

Works on **any iPhone** (any iOS version) via Safari — no Xcode, no sideloading, no expiry.

## Use it today (no hosting)

1. Open Safari on your iPhone.
2. Go to a hosted URL (see below), OR open the `index.html` file from Files (limited offline).
3. Tap the Share button → **Add to Home Screen**.

## Host it for free (2 minutes)

### Option A — GitHub Pages (recommended)
1. Create a free GitHub account/repo.
2. Upload all files in this folder to the repo root.
3. Repo → Settings → Pages → Source: `main` branch, `/ (root)` → Save.
4. Your app URL: `https://<your-username>.github.io/<repo-name>/`

### Option B — Netlify Drop (no account needed)
1. Go to https://app.netlify.com/drop
2. Drag this entire folder onto the page.
3. You get an instant HTTPS URL. Open it on your iPhone → Add to Home Screen.

## Features
- Trending repos: Today / This Week / This Month
- Importance rating (0–100, Low/Medium/High/Top)
- Sort by Stars or Importance, filter by language, search
- Favorites saved in your browser (localStorage)
- Detail view with stats + Open on GitHub
- Pull-to-refresh, 5-min cache
- Works offline (cached shell)
