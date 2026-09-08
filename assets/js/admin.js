// Admin page: password-gates a call to the submissions Netlify Function,
// which is the only place the real Netlify API token is used (server-side).

(function () {
  const gate = document.getElementById("admin-gate");
  const resultsEl = document.getElementById("admin-results");
  const loginForm = document.getElementById("admin-login-form");
  const loginStatus = document.getElementById("admin-login-status");
  const tableBody = document.getElementById("admin-table-body");
  const countEl = document.getElementById("admin-count");
  const refreshBtn = document.getElementById("admin-refresh");

  let password = "";

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function renderRows(submissions) {
    if (!submissions.length) {
      tableBody.innerHTML = `<tr><td colspan="7">No applications submitted yet.</td></tr>`;
      countEl.textContent = "0 applications";
      return;
    }
    countEl.textContent = `${submissions.length} application${submissions.length === 1 ? "" : "s"}`;
    tableBody.innerHTML = submissions
      .map((s) => {
        const d = s.data || {};
        const date = s.createdAt ? new Date(s.createdAt).toLocaleString() : "";
        return `
          <tr>
            <td>${escapeHTML(date)}</td>
            <td>${escapeHTML(d.name)}</td>
            <td>${escapeHTML(d.email)}${d.phone ? "<br>" + escapeHTML(d.phone) : ""}</td>
            <td>${escapeHTML(d.company)}</td>
            <td>${escapeHTML(d["job-title"])}</td>
            <td>${escapeHTML(d.availability)}</td>
            <td>${escapeHTML(d.message)}</td>
          </tr>
        `;
      })
      .join("");
  }

  function loadSubmissions() {
    loginStatus.hidden = true;
    return fetch("/.netlify/functions/submissions", {
      headers: { Authorization: "Bearer " + password },
    })
      .then(async (res) => {
        if (res.status === 401) throw new Error("Incorrect password.");
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Could not load applications.");
        }
        return res.json();
      })
      .then((body) => {
        gate.hidden = true;
        resultsEl.hidden = false;
        renderRows(body.submissions || []);
      })
      .catch((err) => {
        loginStatus.textContent = err.message;
        loginStatus.hidden = false;
      });
  }

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    password = document.getElementById("admin-password").value;
    loadSubmissions();
  });

  refreshBtn.addEventListener("click", () => {
    loadSubmissions();
  });
})();
