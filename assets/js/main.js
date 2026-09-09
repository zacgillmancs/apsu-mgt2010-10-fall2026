// Shared data loading + rendering for the class job board.
// Data lives in /data/*.json so new companies, jobs, stock prices, and news
// can be added without touching any HTML.

async function loadData() {
  const [companies, jobs, stocks, news] = await Promise.all([
    fetch("data/companies.json").then((r) => r.json()),
    fetch("data/jobs.json").then((r) => r.json()),
    fetch("data/stocks.json").then((r) => r.json()),
    fetch("data/news.json").then((r) => r.json()),
  ]);
  return { companies, jobs, stocks, news };
}

function companyBySlug(companies, slug) {
  return companies.find((c) => c.slug === slug);
}

function stockBySlug(stocks, slug) {
  return stocks.find((s) => s.companySlug === slug);
}

function jobCardHTML(job, company) {
  const tags = [job.department, job.type, job.pay, job.location].filter(Boolean);
  return `
    <article class="job-card">
      <div class="job-card-top">
        <img class="job-card-logo" src="${company ? company.logo : ""}" alt="${company ? company.name : ""} logo" />
        <div>
          <h3 class="job-title"><a href="job.html?id=${job.id}">${job.title}</a></h3>
          <p class="job-meta">${company ? company.name : "Unknown company"}${job.location ? " · " + job.location : ""}</p>
        </div>
      </div>
      ${tags.length ? `<div class="job-tags">${tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>` : ""}
      ${job.summary ? `<p class="job-snippet">${job.summary}</p>` : ""}
      <a href="job.html?id=${job.id}"><button class="apply-btn">View Details</button></a>
    </article>
  `;
}

function jobBulletsHTML(heading, items) {
  if (!items || !items.length) return "";
  return `
    <div class="job-section">
      <h4>${heading}</h4>
      <ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>
    </div>
  `;
}

function jobDetailHTML(job) {
  const metaParts = [
    job.department,
    job.reportsTo ? `Reports to: ${job.reportsTo}` : null,
    job.location,
    job.type,
    job.pay,
  ].filter(Boolean);

  return `
    <div class="job-detail-head">
      <h1 class="job-detail-title">${job.title}</h1>
      ${metaParts.length ? `<p class="job-detail-meta">${metaParts.join(" · ")}</p>` : ""}
    </div>
    ${job.summary ? `<div class="job-section"><h4>Job Summary</h4><p>${job.summary}</p></div>` : ""}
    ${jobBulletsHTML("Key Responsibilities", job.responsibilities)}
    ${jobBulletsHTML("Required Qualifications", job.requiredQualifications)}
    ${jobBulletsHTML("Preferred Qualifications", job.preferredQualifications)}
    ${jobBulletsHTML("Compensation & Benefits", job.benefits)}
    ${job.whyJoinUs ? `<div class="job-section"><h4>Why Join Us?</h4><p>${job.whyJoinUs}</p></div>` : ""}
  `;
}

function companyCardHTML(company) {
  return `
    <a class="company-card" href="company.html?slug=${company.slug}">
      <img src="${company.logo}" alt="${company.name} logo" />
      <span class="cname">${company.name}</span>
      <span class="cindustry">${company.industry}</span>
    </a>
  `;
}

function emptyStateHTML(message) {
  return `<div class="empty-state"><span class="emoji">🗂️</span>${message}</div>`;
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

// ---------------- Home page (job search) ----------------
async function initHomePage() {
  const jobListEl = document.getElementById("job-list");
  const resultCountEl = document.getElementById("result-count");
  if (!jobListEl) return;

  const { companies, jobs } = await loadData();

  const input = document.getElementById("search-input");
  const industrySelect = document.getElementById("filter-industry");
  const typeSelect = document.getElementById("filter-type");
  const companySelect = document.getElementById("filter-company");
  const clearBtn = document.getElementById("filter-clear");

  const industries = uniqueSorted(companies.map((c) => c.industry));
  const types = uniqueSorted(jobs.flatMap((j) => (j.type ? j.type.split("/").map((t) => t.trim()) : [])));

  if (industrySelect) {
    industrySelect.innerHTML =
      `<option value="">All Industries</option>` +
      industries.map((i) => `<option value="${i}">${i}</option>`).join("");
  }
  if (typeSelect) {
    typeSelect.innerHTML =
      `<option value="">All Job Types</option>` + types.map((t) => `<option value="${t}">${t}</option>`).join("");
  }
  if (companySelect) {
    companySelect.innerHTML =
      `<option value="">All Companies</option>` +
      companies.map((c) => `<option value="${c.slug}">${c.name}</option>`).join("");
  }

  function render() {
    const term = (input && input.value ? input.value : "").trim().toLowerCase();
    const industry = industrySelect ? industrySelect.value : "";
    const type = typeSelect ? typeSelect.value : "";
    const companySlug = companySelect ? companySelect.value : "";
    const filtersActive = Boolean(term || industry || type || companySlug);

    const filtered = jobs.filter((j) => {
      const company = companyBySlug(companies, j.companySlug);
      if (companySlug && j.companySlug !== companySlug) return false;
      if (industry && (!company || company.industry !== industry)) return false;
      if (type && !(j.type && j.type.includes(type))) return false;
      if (term) {
        const haystack = [j.title, j.location, j.type, company && company.name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });

    if (jobs.length === 0) {
      jobListEl.innerHTML = emptyStateHTML(
        "No job postings yet. Check back soon — companies are still setting up shop!"
      );
      resultCountEl.textContent = "";
    } else if (filtered.length === 0) {
      jobListEl.innerHTML = emptyStateHTML(
        filtersActive ? "No jobs match your search and filters." : "No job postings yet."
      );
      resultCountEl.textContent = "";
    } else {
      resultCountEl.textContent = `${filtered.length} job${filtered.length === 1 ? "" : "s"} found`;
      jobListEl.innerHTML = filtered
        .map((j) => jobCardHTML(j, companyBySlug(companies, j.companySlug)))
        .join("");
    }
  }

  render();

  const form = document.getElementById("search-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      render();
    });
  }
  [industrySelect, typeSelect, companySelect].forEach((el) => {
    if (el) el.addEventListener("change", render);
  });
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (input) input.value = "";
      if (industrySelect) industrySelect.value = "";
      if (typeSelect) typeSelect.value = "";
      if (companySelect) companySelect.value = "";
      render();
    });
  }
}

// ---------------- Companies page ----------------
async function initCompaniesPage() {
  const gridEl = document.getElementById("company-grid");
  if (!gridEl) return;

  const { companies } = await loadData();
  const industrySelect = document.getElementById("company-filter-industry");
  const countEl = document.getElementById("company-result-count");

  const industries = uniqueSorted(companies.map((c) => c.industry));
  if (industrySelect) {
    industrySelect.innerHTML =
      `<option value="">All Industries</option>` +
      industries.map((i) => `<option value="${i}">${i}</option>`).join("");
  }

  function render() {
    const industry = industrySelect ? industrySelect.value : "";
    const filtered = industry ? companies.filter((c) => c.industry === industry) : companies;

    if (countEl) {
      countEl.textContent = `${filtered.length} compan${filtered.length === 1 ? "y" : "ies"}`;
    }
    gridEl.innerHTML = filtered.length
      ? filtered.map(companyCardHTML).join("")
      : emptyStateHTML("No companies match that filter.");
  }

  render();

  if (industrySelect) industrySelect.addEventListener("change", render);
}

// ---------------- Company page ----------------
function orgChartHTML(team) {
  const top = team.filter((m) => m.level === 1);
  const rest = team.filter((m) => m.level !== 1);
  const initials = (name) => name.slice(0, 2).toUpperCase();

  const cardHTML = (m, isTop) => `
    <div class="org-card ${isTop ? "top" : ""}">
      <div class="org-avatar">${initials(m.name)}</div>
      <p class="name">${m.name}</p>
      <p class="title">${m.title}</p>
      <p class="desc">${m.description}</p>
    </div>
  `;

  return `
    <div class="org-chart">
      <div class="org-tier tier-1">
        ${top.map((m) => cardHTML(m, true)).join("")}
      </div>
      ${rest.length ? `<div class="org-connector"></div>` : ""}
      ${rest.length ? `<div class="org-tier tier-2">${rest.map((m) => cardHTML(m, false)).join("")}</div>` : ""}
    </div>
  `;
}

// ---------------- Stock ticker ----------------
const STOCK_RANGES = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "MAX"];

function formatMoney(n) {
  return "$" + n.toFixed(2);
}

function formatShortDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function filterHistoryByRange(sortedHistory, rangeKey) {
  if (!sortedHistory.length) return [];
  const latestDate = new Date(sortedHistory[sortedHistory.length - 1].date);
  let cutoff = null;

  switch (rangeKey) {
    case "1D":
      return sortedHistory.slice(-1);
    case "5D":
      return sortedHistory.slice(-5);
    case "1M":
      cutoff = new Date(latestDate);
      cutoff.setDate(cutoff.getDate() - 30);
      break;
    case "6M":
      cutoff = new Date(latestDate);
      cutoff.setMonth(cutoff.getMonth() - 6);
      break;
    case "YTD":
      cutoff = new Date(latestDate.getFullYear(), 0, 1);
      break;
    case "1Y":
      cutoff = new Date(latestDate);
      cutoff.setFullYear(cutoff.getFullYear() - 1);
      break;
    case "5Y":
      cutoff = new Date(latestDate);
      cutoff.setFullYear(cutoff.getFullYear() - 5);
      break;
    case "MAX":
    default:
      return sortedHistory;
  }

  const filtered = sortedHistory.filter((p) => new Date(p.date) >= cutoff);
  return filtered.length ? filtered : sortedHistory.slice(-1);
}

function buildStockChartSVG(points) {
  const width = 640;
  const height = 220;
  const padLeft = 58;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 26;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const prices = points.map((p) => p.price);
  let min = Math.min(...prices);
  let max = Math.max(...prices);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const priceRange = max - min;

  const yFor = (price) => padTop + plotH - ((price - min) / priceRange) * plotH;

  // A single point can't show a trend line — draw it as a flat reference
  // line with one dot instead of a misleading triangle.
  if (points.length === 1) {
    const y = yFor(points[0].price);
    return `
      <svg viewBox="0 0 ${width} ${height}" class="stock-chart-svg" preserveAspectRatio="none">
        <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="#5b7fb5" stroke-width="2.5" />
        <circle cx="${padLeft + plotW / 2}" cy="${y}" r="4" fill="#5b7fb5" />
        <text x="4" y="${padTop + 8}" class="chart-axis-label">${formatMoney(max)}</text>
        <text x="4" y="${padTop + plotH}" class="chart-axis-label">${formatMoney(min)}</text>
        <text x="${padLeft}" y="${height - 6}" class="chart-axis-label">${formatShortDate(points[0].date)}</text>
      </svg>
    `;
  }

  const xFor = (i) => padLeft + (i / (points.length - 1)) * plotW;

  const isUp = points[points.length - 1].price >= points[0].price;
  const lineColor = isUp ? "#1e8e3e" : "#d93025";
  const fillColor = isUp ? "rgba(30,142,62,0.12)" : "rgba(217,48,37,0.12)";

  const linePoints = points.map((p, i) => `${xFor(i)},${yFor(p.price)}`).join(" ");
  const areaPoints = `${padLeft},${padTop + plotH} ${linePoints} ${padLeft + plotW},${padTop + plotH}`;
  const refY = yFor(points[0].price);

  const dots =
    points.length <= 20
      ? points.map((p, i) => `<circle cx="${xFor(i)}" cy="${yFor(p.price)}" r="3" fill="${lineColor}" />`).join("")
      : `<circle cx="${xFor(points.length - 1)}" cy="${yFor(points[points.length - 1].price)}" r="4" fill="${lineColor}" />`;

  return `
    <svg viewBox="0 0 ${width} ${height}" class="stock-chart-svg" preserveAspectRatio="none">
      <line x1="${padLeft}" y1="${refY}" x2="${width - padRight}" y2="${refY}" stroke="#9aa5b1" stroke-width="1" stroke-dasharray="4 4" />
      <polygon points="${areaPoints}" fill="${fillColor}" />
      <polyline points="${linePoints}" fill="none" stroke="${lineColor}" stroke-width="2.5" />
      ${dots}
      <text x="4" y="${padTop + 8}" class="chart-axis-label">${formatMoney(max)}</text>
      <text x="4" y="${padTop + plotH}" class="chart-axis-label">${formatMoney(min)}</text>
      <text x="${padLeft}" y="${height - 6}" class="chart-axis-label">${formatShortDate(points[0].date)}</text>
      <text x="${width - padRight}" y="${height - 6}" text-anchor="end" class="chart-axis-label">${formatShortDate(points[points.length - 1].date)}</text>
    </svg>
  `;
}

function initStockSection(container, company, stockEntry) {
  if (!container) return;
  if (!stockEntry || !stockEntry.history || !stockEntry.history.length) {
    container.hidden = true;
    return;
  }

  const sorted = [...stockEntry.history].sort((a, b) => new Date(a.date) - new Date(b.date));
  const latest = sorted[sorted.length - 1];
  const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;
  const change = previous ? latest.price - previous.price : 0;
  const pct = previous ? (change / previous.price) * 100 : 0;
  const isUp = change >= 0;

  container.innerHTML = `
    <div class="stock-head">
      <h2>${company.name} <span class="stock-ticker">${stockEntry.ticker}</span></h2>
      <p class="stock-subtitle">Simulated classroom market · not real trading</p>
    </div>
    <div class="stock-price-row">
      <span class="stock-price">${formatMoney(latest.price)}</span>
      <span class="stock-currency">USD</span>
      ${
        previous
          ? `<span class="stock-change-badge ${isUp ? "up" : "down"}">${isUp ? "▲" : "▼"} ${Math.abs(pct).toFixed(2)}%</span>
             <span class="stock-change-abs ${isUp ? "up" : "down"}">${isUp ? "+" : "−"}${formatMoney(Math.abs(change))} since last update</span>`
          : `<span class="stock-change-badge new-listing">New Listing</span>`
      }
    </div>
    <p class="stock-asof">As of ${formatShortDate(latest.date)}${previous ? "" : " · IPO price " + formatMoney(latest.price)}</p>
    <div class="stock-range-tabs"></div>
    <div class="stock-chart-wrap"></div>
    ${
      sorted.length < 2
        ? `<p class="stock-note">This company just launched, so there's only one price point so far. Its valuation will move up or down over the semester based on the team's business decisions.</p>`
        : ""
    }
  `;

  const tabsEl = container.querySelector(".stock-range-tabs");
  const chartWrap = container.querySelector(".stock-chart-wrap");

  function renderRange(rangeKey) {
    tabsEl.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.range === rangeKey));
    const points = filterHistoryByRange(sorted, rangeKey);
    chartWrap.innerHTML = buildStockChartSVG(points);
  }

  tabsEl.innerHTML = STOCK_RANGES.map(
    (r) => `<button type="button" data-range="${r}" class="${r === "MAX" ? "active" : ""}">${r}</button>`
  ).join("");
  tabsEl.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => renderRange(btn.dataset.range));
  });

  renderRange("MAX");
}

// ---------------- News ----------------
function newsArticleHTML(article) {
  return `
    <article class="news-article">
      <h3 class="news-headline">${article.headline}</h3>
      <p class="news-meta">${formatShortDate(article.date)} · ${article.byline}</p>
      ${article.body.map((p) => `<p>${p}</p>`).join("")}
    </article>
  `;
}

function initNewsSection(container, articles) {
  if (!container) return;
  if (!articles.length) {
    container.hidden = true;
    return;
  }
  container.innerHTML = `
    <h2>In the News</h2>
    <div class="news-list">${articles.map(newsArticleHTML).join("")}</div>
  `;
}

async function initCompanyPage() {
  const rootEl = document.getElementById("company-page");
  if (!rootEl) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const { companies, jobs, stocks, news } = await loadData();
  const company = slug ? companyBySlug(companies, slug) : companies[0];

  if (!company) {
    rootEl.innerHTML = emptyStateHTML("We couldn't find that company. Head back to the job board.");
    return;
  }

  document.title = `${company.name} — Class Job Board`;

  document.getElementById("company-hero").innerHTML = `
    <img src="${company.logo}" alt="${company.name} logo" />
    <div class="company-hero-info">
      <span class="industry">${company.industry}</span>
      <h1>${company.name}</h1>
      <p class="tagline">${company.tagline || ""}</p>
    </div>
  `;

  document.getElementById("company-about").innerHTML = `
    <h2>About ${company.name}</h2>
    <p>${company.description}</p>
    ${
      company.services && company.services.length
        ? `<div class="service-pills">${company.services.map((s) => `<span class="tag">${s}</span>`).join("")}</div>`
        : ""
    }
  `;

  initStockSection(document.getElementById("company-stock"), company, stockBySlug(stocks, company.slug));

  document.getElementById("company-team").innerHTML = `
    <h2>Meet the Team</h2>
    ${orgChartHTML(company.team)}
  `;

  const companyJobs = jobs.filter((j) => j.companySlug === company.slug);
  const jobsEl = document.getElementById("company-jobs");
  jobsEl.innerHTML = `
    <h2>Open Positions at ${company.name}</h2>
    ${
      companyJobs.length
        ? `<div class="job-list">${companyJobs.map((j) => jobCardHTML(j, company)).join("")}</div>`
        : emptyStateHTML("No open positions posted yet.")
    }
  `;

  const companyNews = news.filter((n) => n.companySlug === company.slug);
  initNewsSection(document.getElementById("company-news"), companyNews);
}

// ---------------- Job detail + application page ----------------
async function initJobPage() {
  const rootEl = document.getElementById("job-page");
  if (!rootEl) return;

  const params = new URLSearchParams(window.location.search);
  const jobId = params.get("id");
  const { companies, jobs } = await loadData();
  const job = jobs.find((j) => j.id === jobId);

  if (!job) {
    rootEl.innerHTML = emptyStateHTML("We couldn't find that job posting. Head back to the job board.");
    return;
  }

  const company = companyBySlug(companies, job.companySlug);
  document.title = `${job.title} at ${company ? company.name : "Unknown company"} — Class Job Board`;

  document.getElementById("job-back-link").innerHTML = `&larr; Back to ${company ? company.name : "Company"}`;
  document.getElementById("job-back-link").href = company ? `company.html?slug=${company.slug}` : "index.html";

  document.getElementById("job-company-strip").innerHTML = company
    ? `
      <a class="job-company-strip-link" href="company.html?slug=${company.slug}">
        <img src="${company.logo}" alt="${company.name} logo" />
        <span>${company.name}</span>
      </a>
    `
    : "";

  document.getElementById("job-detail").innerHTML = jobDetailHTML(job);

  const form = document.getElementById("apply-form");
  const statusEl = document.getElementById("apply-status");

  function tagApplicationWithJob() {
    document.getElementById("apply-job-id").value = job.id;
    document.getElementById("apply-job-title").value = job.title;
    document.getElementById("apply-company").value = company ? company.name : "";
  }

  if (form) {
    tagApplicationWithJob();

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      statusEl.hidden = true;
      statusEl.classList.remove("apply-status-error");

      const body = new URLSearchParams(new FormData(form)).toString();

      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      })
        .then((res) => {
          if (!res.ok) throw new Error("Submission failed");
          form.reset();
          tagApplicationWithJob();
          statusEl.textContent = "Thanks! Your application has been submitted.";
          statusEl.hidden = false;
        })
        .catch(() => {
          statusEl.textContent =
            "Something went wrong submitting your application. Please try again in a moment.";
          statusEl.classList.add("apply-status-error");
          statusEl.hidden = false;
        })
        .finally(() => {
          submitBtn.disabled = false;
        });
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initHomePage();
  initCompaniesPage();
  initCompanyPage();
  initJobPage();
});
