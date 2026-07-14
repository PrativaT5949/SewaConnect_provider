/* ============================================================
   SewaConnect — Provider Detail Page
   ============================================================ */

(function () {
  const loadingEl = document.getElementById("provider-loading");
  const contentEl = document.getElementById("provider-content");
  const errorEl = document.getElementById("provider-error");
  const headerEl = document.getElementById("provider-header");
  const statsEl = document.getElementById("provider-stats");
  const aboutBody = document.getElementById("about-body");
  const skillsBody = document.getElementById("skills-body");
  const servicesBody = document.getElementById("services-body");
  const reviewsBody = document.getElementById("reviews-body");
  const sidebarContent = document.getElementById("sidebar-content");

  let providerId = null;
  let providerData = null;
  let isFavorited = false;

  function getProviderId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
  }

  async function init() {
    providerId = getProviderId();
    if (!providerId) {
      showError();
      return;
    }
    await loadProvider();
  }

  async function loadProvider() {
    const data = await apiFetch(`/providers/${providerId}/`);
    if (!data || data.error) {
      showError();
      return;
    }

    providerData = data;
    renderHeader(data);
    renderStats(data);
    renderAbout(data);
    renderSkills(data);
    renderServices(data);
    await loadReviews();
    renderSidebar(data);
    checkFavorite();

    loadingEl.classList.add("hidden");
    contentEl.classList.remove("hidden");
  }

  function showError() {
    loadingEl.classList.add("hidden");
    errorEl.classList.remove("hidden");
  }

  function renderHeader(p) {
    const name =
      p.user_full_name ||
      `${p.first_name || ""} ${p.last_name || ""}`.trim() ||
      "Provider";
    const avatar = mediaUrl(p.user_avatar || p.avatar || "");
    const tagline = p.tagline || "";
    const rating = Number(p.average_rating) || 0;
    const reviews = p.total_reviews || 0;
    const verified = p.is_verified;
    const location = p.location || p.city || "";
    const district = p.district || "";

    headerEl.innerHTML = `
      ${
        avatar
          ? `<img class="provider-avatar-lg" src="${avatar}" alt="${name}" loading="lazy">`
          : `<div class="provider-avatar-lg img-placeholder" style="font-size:2.5rem;display:flex;align-items:center;justify-content:center;">&#128100;</div>`
      }
      <div class="provider-info" style="flex:1;">
        <div class="flex items-center gap-3 flex-wrap">
          <h2 class="provider-name" style="margin:0;">${name}</h2>
          ${verified ? '<span class="badge badge-success">&#10003; Verified</span>' : ""}
        </div>
        ${tagline ? `<div class="provider-tagline">${tagline}</div>` : ""}
        <div class="provider-rating" style="margin-bottom:var(--sp-2);">
          ${"&#9733;".repeat(Math.round(rating))}${"&#9734;".repeat(5 - Math.round(rating))}
          <span style="color:var(--text-muted);margin-left:4px">${rating.toFixed(1)} (${reviews} reviews)</span>
        </div>
        ${
          location
            ? `
          <div class="provider-location">
            &#128205; ${location}${district ? `, ${district}` : ""}
          </div>
        `
            : ""
        }
        <div class="provider-actions">
          <a href="booking-create.html?provider=${providerId}" class="btn btn-primary">Book Now</a>
          <button class="btn btn-outline" id="favorite-btn">&#9825; Add to Favorites</button>
        </div>
      </div>
    `;
  }

  function renderStats(p) {
    const completed =
      p.completed_bookings ||
      p.completed_jobs ||
      p.total_completed_bookings ||
      0;
    const responseRate = p.response_rate || 0;
    const experience = p.years_of_experience || p.experience_years || 0;
    const reviews = p.total_reviews || 0;

    statsEl.innerHTML = `
      <div class="ps-item">
        <div class="ps-value">${completed}</div>
        <div class="ps-label">Completed Jobs</div>
      </div>
      <div class="ps-item">
        <div class="ps-value">${responseRate ? responseRate + "%" : "N/A"}</div>
        <div class="ps-label">Response Rate</div>
      </div>
      <div class="ps-item">
        <div class="ps-value">${experience ? experience + " yrs" : "N/A"}</div>
        <div class="ps-label">Experience</div>
      </div>
      <div class="ps-item">
        <div class="ps-value">${reviews}</div>
        <div class="ps-label">Reviews</div>
      </div>
    `;
  }

  function renderAbout(p) {
    const bio = p.bio || p.about || p.description || "";
    aboutBody.innerHTML = bio
      ? `<p style="line-height:1.8;">${bio}</p>`
      : '<p class="text-muted">No bio provided.</p>';
  }

  function renderSkills(p) {
    const skills = p.provider_skills || p.skills || [];
    if (!skills.length) {
      skillsBody.innerHTML = '<p class="text-muted">No skills listed.</p>';
      return;
    }
    skillsBody.innerHTML = `
      <div class="skill-list">
        ${skills.map((s) => `<span class="skill-tag">${typeof s === "string" ? s : s.skill_name || s.name || ""}</span>`).join("")}
      </div>
    `;
  }

  function renderServices(p) {
    const services = p.services || [];
    if (!services.length) {
      servicesBody.innerHTML = '<p class="text-muted">No services listed.</p>';
      return;
    }
    servicesBody.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:var(--sp-4);">
        ${services
          .map(
            (s) => `
          <div class="service-card">
            <div class="service-title">${s.name || s.title || "Service"}</div>
            <div class="service-desc">${s.description || ""}</div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:var(--sp-3);">
              <span style="font-family:var(--font-heading);font-weight:700;color:var(--primary);">${formatCurrency(s.price || s.base_price || 0)}</span>
              ${s.duration ? `<span class="text-muted fs-sm">${s.duration} min</span>` : ""}
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    `;
  }

  async function loadReviews() {
    const data = await apiFetch(`/reviews/provider/${providerId}/`);
    if (!data || data.error) {
      reviewsBody.innerHTML =
        '<p class="text-muted">Could not load reviews.</p>';
      return;
    }

    const reviews = data.results || data.data || data || [];
    if (!Array.isArray(reviews) || reviews.length === 0) {
      reviewsBody.innerHTML = '<p class="text-muted">No reviews yet.</p>';
      return;
    }

    reviewsBody.innerHTML = `
      <div class="reviews-list">
        ${reviews
          .map((r) => {
            const reviewData = {
              reviewer_name: r.customer_name || "User",
              rating: r.rating || 0,
              comment: r.comment || "",
              created_at: r.created_at || "",
            };
            return buildReviewCard(reviewData);
          })
          .join("")}
      </div>
    `;
  }

  function renderSidebar(p) {
    const price = p.hourly_rate || p.min_price || 0;
    sidebarContent.innerHTML = `
      <h4 style="margin-bottom:var(--sp-4);">Interested?</h4>
      ${price ? `<p style="font-size:1.2rem;font-weight:700;color:var(--primary);margin-bottom:var(--sp-4);">${formatCurrency(price)} <span class="fs-sm fw-400 text-muted">/hr</span></p>` : ""}
      <a href="booking-create.html?provider=${providerId}" class="btn btn-primary w-full btn-lg mb-3">Book Now</a>
      <button class="btn btn-outline w-full" id="sidebar-fav-btn">&#9825; Add to Favorites</button>
      <div style="margin-top:var(--sp-6);padding-top:var(--sp-4);border-top:1px solid var(--border);text-align:left;">
        <div class="fs-sm text-muted mb-2"><strong>Response time:</strong> Usually within 1 hour</div>
        <div class="fs-sm text-muted mb-2"><strong>Member since:</strong> ${formatDate(p.created_at || "")}</div>
      </div>
    `;

    const sidebarFavBtn = document.getElementById("sidebar-fav-btn");
    sidebarFavBtn.addEventListener("click", toggleFavorite);
  }

  async function checkFavorite() {
    const user = getCurrentUser();
    if (!user || user.role !== "customer") return;

    const data = await apiFetch("/favorites/check/", {
      method: "POST",
      body: JSON.stringify({ provider_id: Number(providerId) }),
    });

    if (data && !data.error) {
      isFavorited = data.is_favorited || false;
      updateFavoriteButtons();
    }
  }

  function updateFavoriteButtons() {
    const headerFavBtn = document.getElementById("favorite-btn");
    const sidebarFavBtn = document.getElementById("sidebar-fav-btn");
    const label = isFavorited
      ? "&#9829; Favorited"
      : "&#9825; Add to Favorites";
    if (headerFavBtn) headerFavBtn.innerHTML = label;
    if (sidebarFavBtn) sidebarFavBtn.innerHTML = label;
  }

  async function toggleFavorite() {
    const user = getCurrentUser();
    if (!user) {
      showToast("Please log in to add favorites.", "warning");
      window.location.href = "login.html";
      return;
    }
    if (user.role !== "customer") {
      showToast("Only customers can add favorites.", "warning");
      return;
    }

    const data = await apiFetch("/favorites/toggle/", {
      method: "POST",
      body: JSON.stringify({ provider_id: Number(providerId) }),
    });

    if (data && !data.error) {
      isFavorited = data.is_favorited || false;
      updateFavoriteButtons();
      showToast(
        isFavorited ? "Added to favorites." : "Removed from favorites.",
        "success",
      );
    }
  }

  init();
})();
