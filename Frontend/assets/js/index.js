/* ============================================================
   SewaConnect — Home Page
   ============================================================ */

(function () {
  const categoriesGrid = document.getElementById("home-categories-grid");
  const providersGrid = document.getElementById("featured-providers-grid");
  const heroSearchInput = document.getElementById("hero-search-input");
  const heroSearchBtn = document.getElementById("hero-search-btn");

  /* --------------------------------
     Categories
  -------------------------------- */
  async function loadCategories() {
    const data = await apiFetch("/categories/");
    if (!data || data.error) {
      categoriesGrid.innerHTML =
        '<p class="text-muted text-center">Could not load categories.</p>';
      return;
    }

    const categories = data.results || data.data || data;
    if (!Array.isArray(categories) || categories.length === 0) {
      categoriesGrid.innerHTML =
        '<p class="text-muted text-center">No categories available.</p>';
      return;
    }

    const displayed = categories.slice(0, 8);
    categoriesGrid.innerHTML = displayed
      .map((cat) => {
        const icon = cat.icon || "&#128295;";
        const name = cat.name || "Category";
        const slug = cat.slug || "";
        const servicesCount = cat.services_count || 0;

        const bgColors = [
          "linear-gradient(135deg, rgba(232,80,91,0.12), rgba(249,168,38,0.08))",
          "linear-gradient(135deg, rgba(52,152,219,0.12), rgba(39,174,96,0.08))",
          "linear-gradient(135deg, rgba(243,156,18,0.12), rgba(232,80,91,0.08))",
          "linear-gradient(135deg, rgba(39,174,96,0.12), rgba(52,152,219,0.08))",
          "linear-gradient(135deg, rgba(155,89,182,0.12), rgba(232,80,91,0.08))",
          "linear-gradient(135deg, rgba(249,168,38,0.12), rgba(52,152,219,0.08))",
          "linear-gradient(135deg, rgba(231,76,60,0.12), rgba(243,156,18,0.08))",
          "linear-gradient(135deg, rgba(52,152,219,0.12), rgba(155,89,182,0.08))",
        ];

        return `
        <div class="category-card" data-category-id="${cat.id}" onclick="window.location.href='pages/find-providers.html?category=${cat.id}'">
          <div class="category-icon" style="background:${bgColors[cat.id % bgColors.length]};color:var(--accent);">
            ${icon}
          </div>
          <div class="category-name">${name}</div>
          <div class="category-count">${servicesCount} service${servicesCount !== 1 ? "s" : ""}</div>
        </div>
      `;
      })
      .join("");

    initScrollAnimations();
  }

  /* --------------------------------
     Featured Providers
  -------------------------------- */
  async function loadFeaturedProviders() {
    const pos = await getCurrentPosition();
    let url = "/recommendations/?limit=4";
    if (pos) {
      url += `&lat=${pos.lat}&lon=${pos.lon}`;
    }

    const data = await apiFetch(url);
    if (!data || data.error) {
      providersGrid.innerHTML =
        '<p class="text-muted text-center">Could not load providers.</p>';
      return;
    }

    const results = data.results || [];
    if (results.length === 0) {
      providersGrid.innerHTML =
        '<p class="text-muted text-center">No providers available yet.</p>';
      return;
    }

    providersGrid.innerHTML = results
      .map((item) => {
        const provider = item.provider;
        const name = provider.user_full_name || "Provider";
        const avatar = provider.user_avatar || "";
        const rating = Number(provider.average_rating) || 0;
        const reviews = provider.total_reviews || 0;
        const price = provider.hourly_rate || 0;
        const tagline = provider.tagline || "";
        const skills = provider.provider_skills || [];

        return `
        <div class="provider-card" onclick="window.location.href='pages/provider-detail.html?id=${provider.id || ""}'" style="cursor:pointer;">
          ${
            avatar
              ? `<img class="provider-avatar" src="${avatar}" alt="${name}" loading="lazy">`
              : `<div class="provider-avatar img-placeholder" style="font-size:2.5rem;display:flex;align-items:center;justify-content:center;height:200px;">&#128100;</div>`
          }
          <div class="provider-info">
            <div class="provider-name">${name}</div>
            ${tagline ? `<div class="provider-title">${tagline}</div>` : ""}
            <div class="provider-rating">
              ${"&#9733;".repeat(Math.round(rating))}${"&#9734;".repeat(5 - Math.round(rating))}
              <span style="color:var(--text-muted);margin-left:4px">${rating.toFixed(1)} (${reviews})</span>
            </div>
            ${
              skills.length > 0
                ? `
              <div class="skill-list" style="margin-bottom:var(--sp-3)">
                ${skills
                  .slice(0, 3)
                  .map(
                    (s) =>
                      `<span class="skill-tag">${s.skill_name || ""}</span>`,
                  )
                  .join("")}
              </div>
            `
                : ""
            }
            ${
              price
                ? `
              <div class="provider-price">
                ${formatCurrency(price)} <span>/hr</span>
              </div>
            `
                : ""
            }
          </div>
        </div>
      `;
      })
      .join("");

    initScrollAnimations();
  }

  /* --------------------------------
     Hero Search
  -------------------------------- */
  function handleHeroSearch() {
    const query = heroSearchInput.value.trim();
    if (query) {
      window.location.href = `pages/find-providers.html?q=${encodeURIComponent(query)}`;
    } else {
      window.location.href = "pages/find-providers.html";
    }
  }

  heroSearchBtn.addEventListener("click", handleHeroSearch);
  heroSearchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleHeroSearch();
  });

  /* --------------------------------
     Init
  -------------------------------- */
  loadCategories();
  loadFeaturedProviders();
})();
