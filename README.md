# MGT 2010 Class Job Board

A simple, static job board (styled after Indeed) built for the MGT 2010 business
simulation. Each student group's company gets a listing on the homepage and a
detailed "About Us" page with its org chart and open positions. No build step —
plain HTML/CSS/JS, so it can be hosted for free on GitHub Pages and previewed
from a phone browser.

## Preview it

**Option A — GitHub Pages (recommended, works from your phone):**
1. Go to the repo's **Settings → Pages**.
2. Under "Build and deployment", set **Source: Deploy from a branch**.
3. Pick this branch (`claude/job-board-class-simulations-9qq2gz`, or `main` once merged) and folder `/ (root)`, then **Save**.
4. GitHub gives you a URL like `https://<username>.github.io/<repo>/` — open that on your phone.
5. Every time new commits are pushed to that branch, the live page updates automatically (usually within a minute).

**Option B — run it locally:**
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

Add an object to `data/jobs.json`:

```json
{
  "id": "unique-job-id",
  "companySlug": "unique-url-friendly-id",
  "title": "Job Title",
  "location": "City, ST",
  "type": "Part-time",
  "pay": "$12/hr",
  "summary": "One or two sentence summary shown on the job card.",
  "description": "Full job description.",
  "responsibilities": ["Task one", "Task two"],
  "requirements": ["Requirement one", "Requirement two"]
}
```

The job will show up in the homepage search results and on its company's page.

## Roadmap (not built yet)

- **Application forms + admin view:** GitHub Pages only serves static files, so
  accepting and storing form submissions will need a small external form
  backend (e.g., a Google Form/Sheet, Formspree, or a lightweight serverless
  function) rather than plain HTML forms. Flag this when you're ready to add
  it and we'll wire up a form + a private admin page to review submissions.
- **Stock ticker / performance metrics:** planned as another JSON-driven
  section (e.g., `data/metrics.json`) rendered on the homepage or company
  pages.
