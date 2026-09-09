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
index.html             Homepage — search bar, filters, and job listings
companies.html          Company directory with an industry filter
company.html            Company "About Us" template (reads ?slug=... from the URL)
job.html                Job detail + application template (reads ?id=... from the URL)
admin.html              Password-gated table of submitted applications
data/companies.json     One entry per company (logo, description, team/org chart)
data/jobs.json          One entry per job posting, tagged with a companySlug
data/stocks.json        One entry per company's simulated stock (ticker + price history)
data/news.json          Fictional news articles, tagged with a companySlug
assets/logos/           Company logo image files
assets/css/styles.css   All styling
assets/js/main.js       Loads the JSON and renders every page
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
- The company will automatically appear on the **Companies** page and get its
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

Job listings on the homepage can be filtered by industry (from the
company's `industry` field), job type, and company. The type filter options
are built by splitting every job's `type` value on `/` — so a job typed
`"Part-Time / Full-Time"` shows up under both the "Part-Time" and "Full-Time"
filter options automatically.

## Stock ticker

Every company gets a simulated stock on its profile page, styled after
Google's stock cards — ticker, price, up/down change, and a chart with
1D/5D/1M/6M/YTD/1Y/5Y/Max range tabs. It's driven by `data/stocks.json`:

```json
{
  "companySlug": "unique-url-friendly-id",
  "ticker": "ABCD",
  "history": [
    { "date": "2026-09-09", "price": 15.00 },
    { "date": "2026-10-01", "price": 16.25 }
  ]
}
```

Every company starts at **$15.00/share** with a single history entry (its
"IPO"). **To move a company's valuation** (e.g., after a team makes a good or
bad business decision), just append a new `{ "date": ..., "price": ... }`
entry to that company's `history` array — the chart, current price, and
percent change all update automatically from whatever the most recent two
entries are. Since updates are added by hand rather than streamed in real
time, the range tabs filter by how old each entry is relative to the latest
one, not by intraday ticks — with only one or two entries so far, most tabs
will look the same until more price history builds up over the semester.

## News

Fictional news articles can be attached to any company via `data/news.json`:

```json
{
  "id": "unique-article-id",
  "companySlug": "unique-url-friendly-id",
  "headline": "Headline text",
  "date": "2026-09-09",
  "byline": "MGT 2010 Business Wire",
  "body": ["First paragraph.", "Second paragraph.", "..."]
}
```

Every company currently has one auto-generated "launch" article. Add more
entries with the same `companySlug` (e.g., after a stock price update, a new
product launch, or an award) and they'll show up under "In the News" at the
bottom of that company's page, newest listed last — reorder the array if you
want a different display order.

## Applications

Each job page (`job.html?id=...`) has a real application form (name, email,
phone, availability, and a "why are you a good fit" message). It submits via
[Netlify Forms](https://docs.netlify.com/manage/forms/setup/) — no custom
backend or database to run. This only works on the site's **Netlify** deploy
(Netlify scans the site at build time to register the form); a GitHub Pages
copy of the same files will show the form but submissions won't go anywhere.

**Viewing submissions:** Netlify's own dashboard → **Forms** tab always has
every submission (exportable to CSV) as a fallback. There's also a built-in
admin page at **`/admin`** on the site that lists every application in a
table (name, contact info, company, job, availability, and their message)
behind a password — no need to log in to Netlify at all for day-to-day use.

### One-time setup for `/admin`

`/admin` is a static page that calls a small serverless function
(`netlify/functions/submissions.js`) to fetch submissions from Netlify's API.
The function keeps your Netlify API token out of the page source — it never
reaches the browser. To turn it on, set three environment variables in the
Netlify dashboard for this site (**Site configuration → Environment
variables → Add a variable**):

| Variable | Where to get it |
| --- | --- |
| `NETLIFY_API_TOKEN` | Netlify **User settings → Applications → Personal access tokens → New access token**. Treat it like a password — never commit it to the repo. |
| `NETLIFY_SITE_ID` | This site's **Site configuration → General → Site details → Site ID**. |
| `ADMIN_PASSWORD` | Any password you choose — this is what you'll type at `/admin` to view applications. Pick something non-trivial; anyone with it can see applicant names/emails. |

After adding the variables, trigger a new deploy (Netlify only picks up new
environment variables on the next build) — then `/admin` will prompt for the
password and show the table.
