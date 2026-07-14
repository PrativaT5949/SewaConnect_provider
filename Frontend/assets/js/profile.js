/* ============================================================
   SewaConnect — Profile Page
   ============================================================ */

(function () {
  if (!requireAuth()) return;

  const loadingEl = document.getElementById("profile-loading");
  const contentEl = document.getElementById("profile-content");
  const avatarEl = document.getElementById("profile-avatar");
  const nameEl = document.getElementById("profile-name");
  const emailEl = document.getElementById("profile-email");
  const phoneEl = document.getElementById("profile-phone");
  const roleBadge = document.getElementById("profile-role-badge");
  const providerSection = document.getElementById("provider-section");
  const providerInfoBody = document.getElementById("provider-info-body");
  const providerSkillsBody = document.getElementById("provider-skills-body");
  const providerServicesBody = document.getElementById(
    "provider-services-body",
  );

  async function init() {
    await loadProfile();
  }

  async function loadProfile() {
    const data = await apiFetch("/auth/me/");

    if (!data || data.error) {
      const user = getCurrentUser();
      if (user) {
        renderBasicInfo(user);
      } else {
        showToast("Could not load profile.", "error");
      }
      loadingEl.classList.add("hidden");
      contentEl.classList.remove("hidden");
      return;
    }

    renderBasicInfo(data);

    const role = data.role || getUserRole();
    if (role === "provider") {
      await loadProviderInfo(data);
    }

    loadingEl.classList.add("hidden");
    contentEl.classList.remove("hidden");
  }

  function renderBasicInfo(user) {
    const name =
      user.user_full_name ||
      `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
      "User";
    const avatar = user.avatar || user.profile_image || user.user_avatar || "";
    const email = user.email || "";
    const phone = user.phone || user.phone_number || "";
    const role = user.role || "";

    avatarEl.innerHTML = avatar
      ? `<img src="${mediaUrl(avatar)}" alt="${name}" class="avatar xl" style="width:100px;height:100px;margin:0 auto;border-radius:var(--radius-full);object-fit:cover;">`
      : `<div class="avatar xl" style="width:100px;height:100px;margin:0 auto;font-size:2.5rem;display:flex;align-items:center;justify-content:center;border-radius:var(--radius-full);">&#128100;</div>`;

    nameEl.textContent = name;
    emailEl.textContent = email;
    phoneEl.textContent = phone || "No phone number";

    const roleLabels = {
      customer: "Customer",
      provider: "Service Provider",
      admin: "Administrator",
    };
    const roleBadgeClass =
      role === "provider"
        ? "badge-accent"
        : role === "admin"
          ? "badge-danger"
          : "badge-info";
    roleBadge.textContent = roleLabels[role] || role;
    roleBadge.className = `badge ${roleBadgeClass}`;
  }

  async function loadProviderInfo(userData) {
    const data = await apiFetch("/providers/profile/");
    if (!data || data.error) {
      providerSection.classList.add("hidden");
      return;
    }

    providerSection.classList.remove("hidden");

    const bio =
      data.bio || data.about || data.description || "No bio provided.";
    const rating = Number(data.average_rating) || 0;
    const reviews = data.total_reviews || 0;
    const experience = data.years_of_experience || data.experience_years || 0;
    const hourlyRate = data.hourly_rate || 0;
    const verified = data.verification_status === "approved";
    providerInfoBody.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4);margin-bottom:var(--sp-4);">
        <div>
          <div class="text-muted fs-sm mb-1">Rating</div>
          <div class="fw-600">
            ${"&#9733;".repeat(Math.round(rating))}${"&#9734;".repeat(5 - Math.round(rating))}
            <span class="text-muted fs-sm" style="margin-left:4px;">${rating.toFixed(1)} (${reviews})</span>
          </div>
        </div>
        <div>
          <div class="text-muted fs-sm mb-1">Experience</div>
          <div class="fw-600">${experience ? experience + " years" : "N/A"}</div>
        </div>
        <div>
          <div class="text-muted fs-sm mb-1">Hourly Rate</div>
          <div class="fw-600">${hourlyRate ? formatCurrency(hourlyRate) : "N/A"}</div>
        </div>
        <div>
          <div class="text-muted fs-sm mb-1">Verified</div>
          <div class="fw-600">${verified ? '<span class="text-success">&#10003; Yes</span>' : "No"}</div>
        </div>
      </div>
      <div class="divider"></div>
      <div>
        <div class="text-muted fs-sm mb-2">About</div>
        <p style="line-height:1.8;">${bio}</p>
      </div>
    `;

    const skills = data.provider_skills || data.skills || [];
    if (skills.length) {
      providerSkillsBody.innerHTML = `
        <div class="skill-list">
          ${skills.map((s) => `<span class="skill-tag">${typeof s === "string" ? s : s.skill_name || s.name || ""}</span>`).join("")}
        </div>
      `;
    } else {
      providerSkillsBody.innerHTML =
        '<p class="text-muted">No skills added yet.</p>';
    }

    const services = data.services || [];
    if (services.length) {
      providerServicesBody.innerHTML = services
        .map(
          (s) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--sp-3) 0;border-bottom:1px solid var(--border);">
          <div>
            <div class="fw-600">${s.name || s.title || "Service"}</div>
            <div class="text-muted fs-sm">${s.description || ""}</div>
          </div>
          <span class="fw-600">${formatCurrency(s.price || s.base_price || 0)}</span>
        </div>
      `,
        )
        .join("");
    } else {
      providerServicesBody.innerHTML =
        '<p class="text-muted">No services added yet.</p>';
    }
  }

  init();
})();
