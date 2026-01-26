const RAW_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const apiBaseUrl = RAW_BASE.replace(/\/+$/, ""); // remove trailing /


// Helper to save tokens to localStorage
function saveTokens(tokens) {
  localStorage.setItem("access", tokens.access);
  localStorage.setItem("refresh", tokens.refresh);
}

function safePreview(text, n = 300) {
  return (text || "").slice(0, n).replace(/\s+/g, " ").trim();
}

async function safeJson(res) {
  const text = await res.text();
  const contentType = res.headers.get("content-type") || "";

  // If server says JSON, parse it (even if empty)
  if (contentType.includes("application/json")) {
    return text ? JSON.parse(text) : null;
  }

  // If not JSON, try parse anyway (some servers don't set header)
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    throw new Error(
      `Server did not return JSON.\n` +
        `Status: ${res.status}\n` +
        `Content-Type: ${contentType}\n` +
        `Preview: ${safePreview(text)}`
    );
  }
}

export async function loginUsers(username, password) {
  const url = apiBaseUrl + "/api/token/";

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  console.log("LOGIN:", res.status, res.headers.get("content-type"));

  const data = await safeJson(res);

  if (!res.ok) {
    throw new Error(data?.detail || data?.message || "Invalid username or password");
  }
  
  // expected: {access, refresh}
  if (!data?.access || !data?.refresh) {
    throw new Error("Login response missing tokens. Check backend response format.");
  }

  saveTokens(data);
  return data;
}

// Optional: if you already have an endpoint that returns role/user details.
// If you don't have it, don't call it.
export async function fetchMe() {
  const token = localStorage.getItem("access");
  if (!token) throw new Error("No access token found");

  const url = apiBaseUrl + "/api/me/";

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  console.log("ME:", res.status, res.headers.get("content-type"));

  const data = await safeJson(res);

  if (!res.ok) {
    throw new Error(data?.detail || "Failed to fetch user profile");
  }
  console(data)

  return data; // should include role, name, etc (if backend supports)
}