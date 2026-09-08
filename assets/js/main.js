// Shared data loading + rendering for the class job board.
// Data lives in /data/companies.json and /data/jobs.json so new companies
// and job postings can be added without touching any HTML.

async function loadData() {
  const [companies, jobs] = await Promise.all([
    fetch("data/companies.json").then((r) => r.json()),
    fetch("data/jobs.json").then((r) => r.json()),
  ]);
  return { companies, jobs };
}

function companyBySlug(companies, slug) {
  return companies.find((c) => c.slug === slug);
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

// ---------------- Home page ----------------
async function initHomePage() {
  const jobListEl = document.getElementById("job-list");
  const resultCountEl = document.getElementById("result-count");
  const companyGridEl = document.getElementById("company-grid");
  if (!jobListEl) return;

  const { companies, jobs } = await loadData();

  function render(filterText) {
    const term = (filterText || "").trim().toLowerCase();
    const filtered = !term
      ? jobs
      : jobs.filter((j) => {
          const company = companyBySlug(companies, j.companySlug);
          const haystack = [j.title, j.location, j.type, company && company.name]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(term);
        });

    if (jobs.length === 0) {
      jobListEl.innerHTML = emptyStateHTML(
        "No job postings yet. Check back soon — companies are still setting up shop!"
      );
      resultCountEl.textContent = "";
    } else if (filtered.length === 0) {
      jobListEl.innerHTML = emptyStateHTML(`No jobs match "${filterText}".`);
      resultCountEl.textContent = "";
    } else {
      resultCountEl.textContent = `${filtered.length} job${filtered.length === 1 ? "" : "s"} found`;
      jobListEl.innerHTML = filtered
        .map((j) => jobCardHTML(j, companyBySlug(companies, j.companySlug)))
        .join("");
    }
  }

  render("");

  if (companyGridEl) {
    companyGridEl.innerHTML = companies.map(companyCardHTML).join("");
  }

  const form = document.getElementById("search-form");
  const input = document.getElementById("search-input");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      render(input.value);
    });
  }
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

async function initCompanyPage() {
  const rootEl = document.getElementById("company-page");
  if (!rootEl) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const { companies, jobs } = await loadData();
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
  initCompanyPage();
  initJobPage();
});
