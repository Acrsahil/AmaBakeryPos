export function isLoggedIn() {
  return !!localStorage.getItem("access");
}

export function getCurrentUser() {
  const u = localStorage.getItem("currentUser");
  return u ? JSON.parse(u) : null;
}

export function logout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("currentUser");
  localStorage.removeItem("currentWaiter");
  window.location.href = "/login";
}