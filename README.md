Hexistenz — Official band site (static)

Files:
	- `index.html` — homepage
	- `about.html`, `music.html`, `tour.html`, `contact.html` — additional pages
	- `css/styles.css` — styles
	- `js/script.js` — small UI helpers
	- `assets/images/` — AI SVG placeholders and generics

Logo: currently referenced from `../.vscode/copilot/Hexistenz.jpeg`.
AI artwork: several SVG placeholders were added under `assets/images/` (`ai1.svg`, `ai2.svg`, `ai3.svg`, `generic1.svg`, `generic2.svg`).

Preview locally:

1) Serve with Python (quick):

```bash
cd hexistenz-site
python -m http.server 8000
# open http://localhost:8000
```

GitHub Pages — deployment options
---------------------------------
You can publish this site to GitHub Pages in two common ways. Choose one:

Option A — Publish from the `docs/` folder on `main`

- Copy the contents of `hexistenz-site/` into a top-level `docs/` folder, commit and push to `main`.
- In the repository Settings > Pages, set Source to "main branch / docs folder".

Commands:

```bash
# from repo root
cp -r hexistenz-site docs
git add docs
git commit -m "Add site to docs for GitHub Pages"
git push origin main
```

Option B — Deploy via GitHub Actions to `gh-pages` branch (recommended for keeping site in its own folder)

- A GitHub Actions workflow has been added at `.github/workflows/deploy-gh-pages.yml`. On push to `main` it will publish the `hexistenz-site/` folder to the `gh-pages` branch.
- In the repository Settings > Pages, set Source to "gh-pages branch".

Notes about the workflow:

- The workflow uses the built-in `GITHUB_TOKEN` to publish. No extra secrets are needed.
- If you prefer a custom domain, add a `CNAME` file to `hexistenz-site/` with your domain and the action will publish it.

Initialize repo and push (if not already a git repo)
-------------------------------------------------
If your `C:/GitRepo/AI` folder is not a git repo yet, run these commands (replace the remote URL):

```bash
cd C:/GitRepo/AI
git init
git add .
git commit -m "Initial import: Hexistenz site"
git remote add origin git@github.com:yourusername/yourrepo.git
git push -u origin main
```

If you already have a repo with an existing remote, simply add and commit the new site files and push.

Helpful tips
------------
- To make the site the root of a Pages site (no `hexistenz-site/` path in the URL), use Option A or configure the Pages site to use the `gh-pages` branch's root.
- To use a custom domain, add `CNAME` to `hexistenz-site/` and configure DNS for the domain to point to GitHub Pages.

Questions or next steps
----------------------
- I can initialize git here and (optionally) add a remote if you provide it.
- I can also copy `Hexistenz.jpeg` into `hexistenz-site/assets/images/` so the site is fully self-contained. Would you like that?

