// Serverless function backing /admin. Keeps the Netlify API token server-side
// (never shipped to the browser) and requires a shared admin password before
// returning any applicant data.
//
// Requires these environment variables, set in the Netlify dashboard under
// Site configuration -> Environment variables (never commit them to git):
//   NETLIFY_API_TOKEN  - a Netlify personal access token (User settings -> Applications)
//   NETLIFY_SITE_ID    - this site's Site ID (Site configuration -> General -> Site details)
//   ADMIN_PASSWORD     - the password required to view /admin

const NETLIFY_API = "https://api.netlify.com/api/v1";

exports.handler = async (event) => {
  const { ADMIN_PASSWORD, NETLIFY_API_TOKEN, NETLIFY_SITE_ID } = process.env;

  if (!ADMIN_PASSWORD || !NETLIFY_API_TOKEN || !NETLIFY_SITE_ID) {
    return jsonResponse(500, {
      error:
        "Admin page isn't configured yet. Set ADMIN_PASSWORD, NETLIFY_API_TOKEN, and NETLIFY_SITE_ID in the Netlify site's environment variables.",
    });
  }

  const authHeader = event.headers.authorization || event.headers.Authorization || "";
  const providedPassword = authHeader.replace(/^Bearer\s+/i, "");
  if (providedPassword !== ADMIN_PASSWORD) {
    return jsonResponse(401, { error: "Incorrect password." });
  }

  try {
    const formsRes = await fetch(`${NETLIFY_API}/sites/${NETLIFY_SITE_ID}/forms`, {
      headers: { Authorization: `Bearer ${NETLIFY_API_TOKEN}` },
    });
    if (!formsRes.ok) {
      return jsonResponse(502, {
        error: "Could not load forms from Netlify.",
        detail: await formsRes.text(),
      });
    }
    const forms = await formsRes.json();

    const submissions = [];
    for (const form of forms) {
      const subRes = await fetch(`${NETLIFY_API}/forms/${form.id}/submissions`, {
        headers: { Authorization: `Bearer ${NETLIFY_API_TOKEN}` },
      });
      if (!subRes.ok) continue;
      const subs = await subRes.json();
      for (const s of subs) {
        submissions.push({
          id: s.id,
          formName: form.name,
          createdAt: s.created_at,
          data: s.data || {},
        });
      }
    }

    submissions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return jsonResponse(200, { submissions });
  } catch (err) {
    return jsonResponse(500, { error: "Unexpected error fetching applications.", detail: String(err) });
  }
};

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
