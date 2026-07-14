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

  async function init() {
    await loadCategories();
    form.addEventListener("submit", handleSubmit);
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
      description: description,
      price: Number(price),
      price_type: priceType,
      estimated_duration: duration ? Number(duration) : null,
    };

    console.log(payload);

    const data = await apiFetch("/services/create/", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (data && !data.error) {
      showToast("Service added successfully!", "success");
      setTimeout(() => {
        window.location.href = "profile.html";
      }, 1000);
    }
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitText.textContent = loading ? "Adding..." : "Add Service";
    submitSpinner.classList.toggle("hidden", !loading);
  }

  init();
})();
