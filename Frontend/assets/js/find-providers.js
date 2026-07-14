/* ============================================================
   SewaConnect — Find Providers Page
   ============================================================ */

(function () {
  /* DOM refs */
  const searchInput = document.getElementById("search-keyword");
  const searchBtn = document.getElementById("search-btn");
  const toggleFiltersBtn = document.getElementById("toggle-filters");
  const filterPanel = document.getElementById("filter-panel");
  const filterCategory = document.getElementById("filter-category");
  const filterCity = document.getElementById("filter-city");
  const filterMaxPrice = document.getElementById("filter-max-price");
  const filterPriceLabel = document.getElementById("filter-price-label");
  const filterExperience = document.getElementById("filter-experience");
  const filterAvailability = document.getElementById("filter-availability");
  const sortSelect = document.getElementById("sort-select");
  const resultsGrid = document.getElementById("results-grid");
  const resultsCount = document.getElementById("results-count");
  const emptyState = document.getElementById("empty-state");
  const clearFiltersBtn = document.getElementById("clear-filters-btn");

  let userLat = null;
  let userLon = null;
  let allResults = [];
  let currentPage = 1;
  const PAGE_SIZE = 12;

  /* --------------------------------
     Init
  -------------------------------- */
  async function init() {
    loadCategoriesFromUrl();
    await getUserLocation();
    loadFromUrlParams();
    performSearch();
  }

  function loadCategoriesFromUrl() {
    loadCategoriesForFilter();
  }

  async function loadCategoriesForFilter() {
    const data = await apiFetch("/categories/");
    if (!data || data.error) return;

    const categories = data.results || data.data || data;
    if (!Array.isArray(categories)) return;

    categories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.id;
      option.textContent = cat.name;
      filterCategory.appendChild(option);
    });
  }

  async function getUserLocation() {
    const pos = await getCurrentPosition();
    if (pos) {
      userLat = pos.lat;
      userLon = pos.lon;
    }
  }

  function loadFromUrlParams() {
    const params = new URLSearchParams(window.location.search);

    if (params.get("q")) {
      searchInput.value = params.get("q");
    }
    if (params.get("category")) {
      filterCategory.value = params.get("category");
    }
    if (params.get("city")) {
      filterCity.value = params.get("city");
    }
  }

  /* --------------------------------
     Search
  -------------------------------- */
  async function performSearch() {
    showLoading();

    const params = new URLSearchParams();
    const q = searchInput.value.trim();
    const category = filterCategory.value;
    const city = filterCity.value.trim();
    const maxPrice = filterMaxPrice.value;
    const experience = filterExperience.value;
    const availability = filterAvailability.value;

    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (city) params.set("city", city);
    if (maxPrice && Number(maxPrice) < 5000) params.set("max_price", maxPrice);
    if (experience) params.set("experience", experience);
    if (availability) params.set("availability", availability);
    if (userLat) params.set("lat", userLat);
    if (userLon) params.set("lon", userLon);

    const data = await apiFetch(`/search/?${params.toString()}`);

    if (!data || data.error) {
      allResults = [];
      renderResults([]);
      return;
    }

    allResults = data.results || [];
    currentPage = 1;
    sortResults();
    renderResults(allResults);
  }

  /* --------------------------------
     Sort
  -------------------------------- */
  function sortResults() {
    const sortBy = sortSelect.value;

    switch (sortBy) {
      case "rating":
        allResults.sort((a, b) => {
          const ra = Number(a.provider.average_rating) || 0;
          const rb = Number(b.provider.average_rating) || 0;
          return rb - ra;
        });
        break;
      case "price_low":
        allResults.sort((a, b) => {
          const pa = Number(a.provider.hourly_rate) || 0;
          const pb = Number(b.provider.hourly_rate) || 0;
          return pa - pb;
        });
        break;
      case "price_high":
        allResults.sort((a, b) => {
          const pa = Number(a.provider.hourly_rate) || 0;
          const pb = Number(b.provider.hourly_rate) || 0;
          return pb - pa;
        });
        break;
      case "distance":
        allResults.sort((a, b) => {
          const da = a.distance_km != null ? a.distance_km : Infinity;
          const db = b.distance_km != null ? b.distance_km : Infinity;
          return da - db;
        });
        break;
      case "recommended":
      default:
        allResults.sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
        break;
    }
  }

  /* --------------------------------
     Render
  -------------------------------- */
  function renderResults(results) {
    const total = results.length;

    if (total === 0) {
      resultsGrid.innerHTML = "";
      resultsGrid.classList.add("hidden");
      emptyState.classList.remove("hidden");
      resultsCount.textContent = "No providers found";
      document.getElementById("pagination").innerHTML = "";
      return;
    }

    emptyState.classList.add("hidden");
    resultsGrid.classList.remove("hidden");
    resultsCount.textContent = `${total} provider${total !== 1 ? "s" : ""} found`;

    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageResults = results.slice(start, end);

    resultsGrid.innerHTML = pageResults
      .map((item) => {
        const p = item.provider;
        const name = p.user_full_name || "Provider";
        const avatar = p.user_avatar || "";
        const rating = Number(p.average_rating) || 0;
        const reviews = p.total_reviews || 0;
        const price = p.hourly_rate || 0;
        const tagline = p.tagline || "";
        const skills = p.provider_skills || [];
        const distance = item.distance_km;
        const providerId = p.id || "";
        console.log("Provider Object:", p);
        console.log("Provider ID:", providerId);

        const distanceText =
          distance != null
            ? `<span class="fs-sm text-muted" style="margin-left:auto;">${Number(distance).toFixed(1)} km</span>`
            : "";

        return `
          <div class="provider-card"
     data-provider-id="${providerId}"
     onclick="window.location.href='provider-detail.html?id=${providerId}'"
     style="cursor:pointer;">
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
              ${distanceText}
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

    renderPagination();
    initScrollAnimations();
  }

  /* --------------------------------
     Pagination
  -------------------------------- */
  function renderPagination() {
    const total = allResults.length;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const container = document.getElementById("pagination");

    if (totalPages <= 1) {
      container.innerHTML = "";
      return;
    }

    let html = "";
    html += `<button class="page-btn" ${currentPage <= 1 ? "disabled" : ""} data-page="${currentPage - 1}">&laquo; Prev</button>`;

    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

    if (start > 1) {
      html += `<button class="page-btn" data-page="1">1</button>`;
      if (start > 2) html += `<span class="page-ellipsis">...</span>`;
    }

    for (let i = start; i <= end; i++) {
      html += `<button class="page-btn ${i === currentPage ? "active" : ""}" data-page="${i}">${i}</button>`;
    }

    if (end < totalPages) {
      if (end < totalPages - 1)
        html += `<span class="page-ellipsis">...</span>`;
      html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    html += `<button class="page-btn" ${currentPage >= totalPages ? "disabled" : ""} data-page="${currentPage + 1}">Next &raquo;</button>`;

    container.innerHTML = html;

    container.querySelectorAll(".page-btn:not(:disabled)").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = parseInt(btn.dataset.page, 10);
        if (p >= 1 && p <= totalPages) {
          currentPage = p;
          renderResults(allResults);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    });
  }

  /* --------------------------------
     Loading State
  -------------------------------- */
  function showLoading() {
    resultsGrid.innerHTML = `
      <div class="skeleton skeleton-card"></div>
      <div class="skeleton skeleton-card"></div>
      <div class="skeleton skeleton-card"></div>
      <div class="skeleton skeleton-card"></div>
      <div class="skeleton skeleton-card"></div>
      <div class="skeleton skeleton-card"></div>
    `;
    resultsGrid.classList.remove("hidden");
    emptyState.classList.add("hidden");
    resultsCount.textContent = "Searching...";
    document.getElementById("pagination").innerHTML = "";
  }

  /* --------------------------------
     Event Listeners
  -------------------------------- */
  const debouncedSearch = debounce(() => {
    currentPage = 1;
    performSearch();
  }, 400);

  searchInput.addEventListener("input", debouncedSearch);
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      currentPage = 1;
      performSearch();
    }
  });

  searchBtn.addEventListener("click", () => {
    currentPage = 1;
    performSearch();
  });

  toggleFiltersBtn.addEventListener("click", () => {
    filterPanel.classList.toggle("open");
    const isOpen = filterPanel.classList.contains("open");
    toggleFiltersBtn.innerHTML = isOpen
      ? "&#9650; Hide Filters"
      : "&#9660; Filters";
  });

  filterMaxPrice.addEventListener("input", () => {
    const val = Number(filterMaxPrice.value);
    filterPriceLabel.textContent = val >= 5000 ? "No limit" : `Rs. ${val}`;
  });

  filterMaxPrice.addEventListener("change", () => {
    currentPage = 1;
    performSearch();
  });

  filterCategory.addEventListener("change", () => {
    currentPage = 1;
    performSearch();
  });

  filterCity.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      currentPage = 1;
      performSearch();
    }
  });

  filterExperience.addEventListener("change", () => {
    currentPage = 1;
    performSearch();
  });

  filterAvailability.addEventListener("change", () => {
    currentPage = 1;
    performSearch();
  });

  sortSelect.addEventListener("change", () => {
    currentPage = 1;
    sortResults();
    renderResults(allResults);
  });

  clearFiltersBtn.addEventListener("click", () => {
    searchInput.value = "";
    filterCategory.value = "";
    filterCity.value = "";
    filterMaxPrice.value = 5000;
    filterPriceLabel.textContent = "No limit";
    filterExperience.value = "";
    filterAvailability.value = "";
    sortSelect.value = "recommended";
    currentPage = 1;
    performSearch();
  });

  /* --------------------------------
     Start
  -------------------------------- */
  init();
})();
