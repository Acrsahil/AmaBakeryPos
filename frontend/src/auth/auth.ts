import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  user_id: string;
  username: string;
  user_type: string;
  is_superuser: boolean;
  is_staff: boolean;
  branch_id?: number;
  branch_name?: string;
  exp: number;
}

export function isLoggedIn() {
  const token = localStorage.getItem("access");
  if (!token) return false;

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    // Check if token is expired
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function getDecodedToken(): DecodedToken | null {
  const token = localStorage.getItem("access");
  if (!token) return null;
  try {
    return jwtDecode<DecodedToken>(token);
  } catch {
    return null;
  }
}

export function getCurrentUser() {
  const decoded = getDecodedToken();
  if (decoded) {
    return {
      id: decoded.user_id,
      username: decoded.username,
      role: decoded.user_type, // This should match our expected roles
      is_superuser: decoded.is_superuser,
      is_staff: decoded.is_staff,
      branch_id: decoded.branch_id,
      branch_name: decoded.branch_name,
    };
  }

  // Fallback for legacy data (if any)
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