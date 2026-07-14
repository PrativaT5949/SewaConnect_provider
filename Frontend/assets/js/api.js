/* ============================================================
   SewaConnect — API Core & Utilities
   Vanilla JS (ES6) · No Frameworks
   ============================================================ */

const API_BASE = "http://127.0.0.1:8000/api";

/* ============================================================
   1. TOKEN MANAGEMENT
   ============================================================ */

function getToken() {
  return localStorage.getItem("access_token");
}

function getRefreshToken() {
  return localStorage.getItem("refresh_token");
}

function setTokens(access, refresh) {
  localStorage.setItem("access_token", access);
  if (refresh) localStorage.setItem("refresh_token", refresh);
}

function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp ? payload.exp < now : true;
  } catch {
    return true;
  }
}

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    setTokens(data.access, data.refresh || refresh);
    return data.access;
  } catch {
    return null;
  }
}

/* ============================================================
   2. API FETCH WRAPPER
   ============================================================ */

async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token && !isTokenExpired(token)) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    let res = await fetch(url, { ...options, headers });

    if (res.status === 401 && getRefreshToken()) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
        res = await fetch(url, { ...options, headers });
      } else {
        clearTokens();
        showToast("Session expired. Please log in again.", "error");
        setTimeout(() => {
          window.location.href = "/pages/login.html";
        }, 1500);
        return null;
      }
    }

    if (res.status === 401) {
      clearTokens();
      showToast("Session expired. Please log in again.", "error");
      setTimeout(() => {
        window.location.href = "/pages/login.html";
      }, 1500);
      return null;
    }

    if (res.status === 204) return null;

    const text = await res.text();
    const data = text ? JSON.parse(text) : {};

    if (!res.ok) {
      const message =
        data.detail ||
        data.message ||
        Object.values(data).flat().join(", ") ||
        "Request failed";
      showToast(message, "error");
      return { error: true, status: res.status, data };
    }

    if (data && data.status === "success" && data.data !== undefined) {
      return data.data;
    }

    return data;
  } catch (err) {
    showToast("Network error. Please check your connection.", "error");
    return { error: true, status: 0, data: null };
  }
}

/* ============================================================
   3. TOAST NOTIFICATION SYSTEM
   ============================================================ */

function showToast(message, type = "success", duration = 3000) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const icons = {
    success: "&#10003;",
    error: "&#10007;",
    warning: "&#9888;",
    info: "&#8505;",
  };

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <div class="toast-content">
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" aria-label="Close">&times;</button>
  `;

  const closeBtn = toast.querySelector(".toast-close");
  const remove = () => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(20px)";
    toast.style.transition = "opacity 0.3s, transform 0.3s";
    setTimeout(() => toast.remove(), 300);
  };

  closeBtn.addEventListener("click", remove);
  container.appendChild(toast);

  setTimeout(remove, duration);
}

/* ============================================================
   4. GEOLOCATION HELPERS
   ============================================================ */

function getCurrentPosition() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}

async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
      { headers: { "Accept-Language": "en" } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.display_name || null;
  } catch {
    return null;
  }
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ============================================================
   5. UI HELPERS — MODALS & DIALOGS
   ============================================================ */

function showModal(title, body, onConfirm) {
  hideModal();

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.id = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="modal-close" aria-label="Close">&times;</button>
      </div>
      <div class="modal-body">
        ${typeof body === "string" ? body : ""}
      </div>
      ${
        onConfirm !== undefined
          ? `
      <div class="modal-footer">
        <button class="btn btn-ghost modal-cancel-btn">Cancel</button>
        <button class="btn btn-primary modal-confirm-btn">Confirm</button>
      </div>`
          : ""
      }
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("open"));

  overlay.querySelector(".modal-close").addEventListener("click", hideModal);

  if (onConfirm === undefined) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) hideModal();
    });
  } else {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) hideModal();
    });
    overlay
      .querySelector(".modal-cancel-btn")
      .addEventListener("click", hideModal);
    overlay
      .querySelector(".modal-confirm-btn")
      .addEventListener("click", () => {
        onConfirm();
        hideModal();
      });
  }

  if (typeof body !== "string" && body instanceof HTMLElement) {
    overlay.querySelector(".modal-body").appendChild(body);
  }

  return overlay;
}

function hideModal() {
  const overlay = document.getElementById("modal-overlay");
  if (overlay) overlay.remove();
}

function showConfirm(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.id = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>Confirm</h3>
          <button class="modal-close" aria-label="Close">&times;</button>
        </div>
        <div class="modal-body">
          <p>${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost confirm-cancel">Cancel</button>
          <button class="btn btn-primary confirm-ok">Confirm</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("open"));

    const cleanup = (result) => {
      overlay.remove();
      resolve(result);
    };

    overlay
      .querySelector(".modal-close")
      .addEventListener("click", () => cleanup(false));
    overlay
      .querySelector(".confirm-cancel")
      .addEventListener("click", () => cleanup(false));
    overlay
      .querySelector(".confirm-ok")
      .addEventListener("click", () => cleanup(true));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) cleanup(false);
    });
  });
}

/* ============================================================
   6. FORMATTING HELPERS
   ============================================================ */

function formatCurrency(amount) {
  if (amount === null || amount === undefined) return "Rs. 0";
  const num = Number(amount);
  if (isNaN(num)) return "Rs. 0";
  return `Rs. ${num.toLocaleString("en-NP", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  try {
    if (timeStr.includes("T")) {
      const d = new Date(timeStr);
      return d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
    const [h, m] = timeStr.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  } catch {
    return timeStr;
  }
}

function formatDateTime(dtStr) {
  if (!dtStr) return "";
  return `${formatDate(dtStr)} at ${formatTime(dtStr)}`;
}

/* ============================================================
   7. LOADING STATE
   ============================================================ */

function showLoading(container) {
  if (!container) return;
  container.innerHTML = `
    <div class="skeleton skeleton-card"></div>
    <div class="skeleton skeleton-card" style="height:160px;margin-top:var(--sp-4)"></div>
    <div class="skeleton skeleton-text w-75" style="margin-top:var(--sp-4)"></div>
    <div class="skeleton skeleton-text w-50"></div>
  `;
}

function hideLoading(container) {
  if (!container) return;
  const skeletons = container.querySelectorAll(".skeleton");
  skeletons.forEach((s) => s.remove());
}

/* ============================================================
   8. DEBOUNCE
   ============================================================ */

function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/* ============================================================
   9. AUTH STATE
   ============================================================ */

function getCurrentUser() {
  const token = getToken();
  if (!token || isTokenExpired(token)) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      email: payload.email,
      role: payload.role,
      user_id: payload.user_id,
      first_name: payload.first_name,
      last_name: payload.last_name,
    };
  } catch {
    return null;
  }
}

function isLoggedIn() {
  const token = getToken();
  return token !== null && !isTokenExpired(token);
}

function getUserRole() {
  const user = getCurrentUser();
  return user ? user.role : null;
}

/* ============================================================
   10. REDIRECT HELPERS
   ============================================================ */

function requireAuth() {
  if (!isLoggedIn()) {
    showToast("Please log in to continue.", "warning");
    window.location.href = "/pages/login.html";
    return false;
  }
  return true;
}

function requireRole(role) {
  const user = getCurrentUser();
  if (!user) {
    showToast("Please log in to continue.", "warning");
    window.location.href = "/pages/login.html";
    return false;
  }
  if (user.role !== role) {
    showToast("You do not have access to this page.", "error");
    redirectToDashboard();
    return false;
  }
  return true;
}

function redirectToDashboard() {
  const role = getUserRole();
  switch (role) {
    case "admin":
      window.location.href = "/pages/admin-dashboard.html";
      break;
    case "provider":
      window.location.href = "/pages/provider-dashboard.html";
      break;
    case "customer":
      window.location.href = "/pages/customer-dashboard.html";
      break;
    default:
      window.location.href = "/pages/login.html";
  }
}

/* ============================================================
   11. PAGINATION
   ============================================================ */

function renderPagination(pagination, onPageClick) {
  const container = document.getElementById("pagination");
  if (!container || !pagination) return;

  const { count, next, previous, current_page, total_pages } = pagination;
  const page = current_page || 1;
  const total = total_pages || Math.ceil((count || 0) / 12) || 1;

  if (total <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = "";

  html += `<button class="page-btn" ${!previous ? "disabled" : ""} data-page="${page - 1}">&laquo; Prev</button>`;

  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  let end = Math.min(total, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

  if (start > 1) {
    html += `<button class="page-btn" data-page="1">1</button>`;
    if (start > 2) html += `<span class="page-ellipsis">...</span>`;
  }

  for (let i = start; i <= end; i++) {
    html += `<button class="page-btn ${i === page ? "active" : ""}" data-page="${i}">${i}</button>`;
  }

  if (end < total) {
    if (end < total - 1) html += `<span class="page-ellipsis">...</span>`;
    html += `<button class="page-btn" data-page="${total}">${total}</button>`;
  }

  html += `<button class="page-btn" ${!next ? "disabled" : ""} data-page="${page + 1}">Next &raquo;</button>`;

  container.innerHTML = html;

  container.querySelectorAll(".page-btn:not(:disabled)").forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = parseInt(btn.dataset.page, 10);
      if (p && p !== page && p >= 1 && p <= total) {
        onPageClick(p);
      }
    });
  });
}

const MEDIA_BASE = "http://127.0.0.1:8000";

function mediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${MEDIA_BASE}${url}`;
}
