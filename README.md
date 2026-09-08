# MGT 2010 Class Job Board

A simple, static job board (styled after Indeed) built for MGT 2010.
Each student group's company gets a listing on the homepage and a
detailed "About Us" page with its org chart and open positions. No build step —
plain HTML/CSS/JS, so it can be hosted for free on GitHub Pages and previewed
from a phone browser.

## Preview it

**Option A — Netlify (required for application forms to actually work):**
The site is connected to a Netlify project, which auto-deploys on every push
and is the only place [Netlify Forms](https://docs.netlify.com/manage/forms/setup/)
submissions get captured (see [Applications](#applications) below). Open the
site's Netlify URL from your phone — it updates automatically within a minute
or two of a push.

**Option B — GitHub Pages (browsing only — applications won't be captured here):**
1. Go to the repo's **Settings → Pages**.
2. Under "Build and deployment", set **Source: Deploy from a branch**.
3. Pick this branch (`claude/job-board-class-simulations-9qq2gz`, or `main` once merged) and folder `/ (root)`, then **Save**.
4. GitHub gives you a URL like `https://<username>.github.io/<repo>/` — open that on your phone.
5. Every time new commits are pushed to that branch, the live page updates automatically (usually within a minute).

**Option C — run it locally:**
```bash
python3 -m http.server 8000
# then open http://localhost:8000 in a browser
```
(You must use a local server, not double-clicking the HTML file — the browser
blocks the `fetch()` calls that load the JSON data over the `file://` protocol.)

## How the site is organized

```
index.html            Homepage — search bar + job listings + company directory
company.html           Company "About Us" template (reads ?slug=... from the URL)
data/companies.json    One entry per company (logo, description, team/org chart)
data/jobs.json         One entry per job posting, tagged with a companySlug
assets/logos/          Company logo image files
assets/css/styles.css  All styling
assets/js/main.js      Loads the JSON and renders both pages
```

Nothing is hardcoded into the HTML — add a company or a job by editing the
JSON files, and both pages update automatically.

## Adding a new company

Add an object to `data/companies.json`:

```json
{
  "slug": "unique-url-friendly-id",
  "name": "Company Name",
  "logo": "assets/logos/company-name.png",
  "industry": "e.g. Retail — Coffee Shop",
  "tagline": "Short tagline shown under the name",
  "services": ["Service A", "Service B"],
  "description": "Longer About Us paragraph.",
  "team": [
    { "id": "person1", "name": "First Name", "title": "Job Title", "level": 1, "description": "What they do." },
    { "id": "person2", "name": "First Name", "title": "Job Title", "level": 2, "reportsTo": "person1", "description": "What they do." }
  ]
}
```

- `level: 1` is drawn at the top of the org chart (usually the general
  manager/owner). Everyone else should be `level: 2` and will be drawn as
  peers reporting up to the top box.
- Drop the logo image file in `assets/logos/`.
- The company will automatically appear on the homepage directory and get its
  own page at `company.html?slug=unique-url-friendly-id`.

## Adding a job posting

All job postings share the same standardized template so they look
consistent from company to company. Add an object to `data/jobs.json`:

```json
{
  "id": "unique-job-id",
  "companySlug": "unique-url-friendly-id",
  "title": "Job Title",
  "department": "Department name",
  "reportsTo": "Manager Name, Manager Title",
  "location": "City, ST (optional)",
  "type": "Part-Time / Full-Time (optional)",
  "pay": "$12 - $15/hr (optional)",
  "summary": "One or two sentence job summary.",
  "responsibilities": ["Key responsibility one", "Key responsibility two"],
  "requiredQualifications": ["Required qualification one", "Required qualification two"],
  "preferredQualifications": ["Preferred qualification one (optional)"],
  "benefits": ["Compensation & benefits bullet (optional)"],
  "whyJoinUs": "Short pitch for why someone should apply (optional)."
}
```

Only `id`, `companySlug`, `title`, and `summary` are required — every other
field is optional and simply won't render its section if left out, so
postings with less information (e.g. no listed pay or benefits) still look
clean. The job will show up as a card in the homepage search results and as
a full standardized posting on its company's page.

## Applications

Each job page (`job.html?id=...`) has a real application form (name, email,
phone, availability, and a "why are you a good fit" message). It submits via
[Netlify Forms](https://docs.netlify.com/manage/forms/setup/) — no custom
backend or database to run. This only works on the site's **Netlify** deploy
(Netlify scans the site at build time to register the form); a GitHub Pages
copy of the same files will show the form but submissions won't go anywhere.

**Viewing submissions (admin view):** log in to the Netlify dashboard for this
site → **Forms** tab. Every application shows up there as "job-application",
with hidden fields `job-id`, `job-title`, and `company` on each submission so
you can tell which posting it's for. You can export everything to CSV from
that same tab.

## Roadmap (not built yet)

- **Stock ticker / performance metrics:** planned as another JSON-driven
  section (e.g., `data/metrics.json`) rendered on the homepage or company
  pages.
