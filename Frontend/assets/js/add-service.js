/* ============================================================
   SewaConnect — Add Service Page
   ============================================================ */

(function () {
  if (!requireAuth() || !requireRole("provider")) return;

  const form = document.getElementById("add-service-form");
  const categorySelect = document.getElementById("svc-category");
  const titleInput = document.getElementById("svc-title");
  const descriptionInput = document.getElementById("svc-description");
  const priceInput = document.getElementById("svc-price");
  const priceTypeSelect = document.getElementById("svc-price-type");
  const durationInput = document.getElementById("svc-duration");
  const submitBtn = document.getElementById("svc-submit");
  const submitText = document.getElementById("svc-submit-text");
  const submitSpinner = document.getElementById("svc-submit-spinner");
  const listEl = document.getElementById("my-services-list");
  const emptyEl = document.getElementById("my-services-empty");

  async function init() {
    await loadCategories();
    await loadMyServices();
    form.addEventListener("submit", handleSubmit);
  }

  async function loadMyServices() {
    const data = await apiFetch("/services/my/");

    if (!data || data.error) {
      listEl.innerHTML = "";
      listEl.classList.add("hidden");
      emptyEl.classList.remove("hidden");
      return;
    }

    const services = data.results || data.data || data || [];
    if (!Array.isArray(services) || services.length === 0) {
      listEl.innerHTML = "";
      listEl.classList.add("hidden");
      emptyEl.classList.remove("hidden");
      return;
    }

    emptyEl.classList.add("hidden");
    listEl.classList.remove("hidden");

    listEl.innerHTML = services
      .map(
        (s) => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--sp-3) 0;border-bottom:1px solid var(--border);">
        <div>
          <div class="fw-600">${s.title || "Service"}</div>
          <div class="text-muted fs-sm">${s.category_name || ""} &middot; ${formatCurrency(s.price)}${s.price_type === "hourly" ? "/hr" : ""}</div>
        </div>
        <button class="btn btn-sm btn-danger delete-service-btn" data-id="${s.id}">Delete</button>
      </div>
    `,
      )
      .join("");

    document.querySelectorAll(".delete-service-btn").forEach((btn) => {
      btn.onclick = () => handleDelete(Number(btn.dataset.id));
    });
  }

  async function handleDelete(id) {
    const ok = await showConfirm("Delete this service? This cannot be undone.");
    if (!ok) return;

    const data = await apiFetch(`/services/${id}/delete/`, {
      method: "DELETE",
    });

    if (data === null || (data && !data.error)) {
      showToast("Service deleted.", "success");
      await loadMyServices();
    }
  }

  async function loadCategories() {
    const data = await apiFetch("/categories/");
    if (!data || data.error) return;

    const categories = data.results || data.data || data;
    if (!Array.isArray(categories)) return;

    categories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.id;
      option.textContent = cat.name;
      categorySelect.appendChild(option);
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const category = categorySelect.value;
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const price = priceInput.value;
    const priceType = priceTypeSelect.value;
    const duration = durationInput.value;

    if (!category || !title || !description || !price) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    setLoading(true);

    const payload = {
      category: Number(category),
      title: title,
      description,
      price: Number(price),
      price_type: priceType,
      estimated_duration: duration ? Number(duration) : null,
    };

    const data = await apiFetch("/services/", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (data && !data.error) {
      showToast("Service added successfully!", "success");
      form.reset();
      await loadMyServices();
    }
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitText.textContent = loading ? "Adding..." : "Add Service";
    submitSpinner.classList.toggle("hidden", !loading);
  }

  init();
})();
