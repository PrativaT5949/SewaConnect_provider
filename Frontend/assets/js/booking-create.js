/* ============================================================
   SewaConnect — Booking Create Page
   ============================================================ */

(function () {
  if (!requireAuth() || !requireRole("customer")) return;

  const form = document.getElementById("booking-form");
  const categorySelect = document.getElementById("booking-category");
  const serviceSelect = document.getElementById("booking-service");
  const providerSelect = document.getElementById("booking-provider");
  const dateInput = document.getElementById("booking-date");
  const timeInput = document.getElementById("booking-time");
  const addressInput = document.getElementById("booking-address");
  const latInput = document.getElementById("booking-latitude");
  const lonInput = document.getElementById("booking-longitude");
  const notesInput = document.getElementById("booking-notes");
  const priceDisplay = document.getElementById("booking-price");
  const submitBtn = document.getElementById("booking-submit");
  const submitText = document.getElementById("submit-text");
  const submitSpinner = document.getElementById("submit-spinner");
  const getLocationBtn = document.getElementById("get-location-btn");

  let categories = [];
  let services = [];
  let providers = [];
  let selectedServicePrice = 0;

  async function init() {
    setMinDate();
    loadUrlParams();
    await loadCategories();
    setupEvents();
  }

  function setMinDate() {
    const today = new Date().toISOString().split("T")[0];
    dateInput.min = today;
    dateInput.value = today;
  }

  function loadUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const providerId = params.get("provider");
    const categoryId = params.get("category");
    if (categoryId) {
      categorySelect.value = categoryId;
    }
  }

  async function loadCategories() {
    const data = await apiFetch("/categories/");
    if (!data || data.error) return;

    categories = data.results || data.data || data;
    if (!Array.isArray(categories)) return;

    categories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.id;
      option.textContent = cat.name;
      categorySelect.appendChild(option);
    });

    const params = new URLSearchParams(window.location.search);
    const categoryId = params.get("category");
    if (categoryId) {
      categorySelect.value = categoryId;
      await loadServices(categoryId);
    }
  }

  async function loadServices(categoryId) {
    serviceSelect.innerHTML = '<option value="">Loading services...</option>';
    serviceSelect.disabled = true;
    providerSelect.innerHTML =
      '<option value="">Any available provider</option>';

    const data = await apiFetch(`/services/?category=${categoryId}`);
    if (!data || data.error) {
      serviceSelect.innerHTML =
        '<option value="">No services available</option>';
      return;
    }

    services = data.results || data.data || data;
    if (!Array.isArray(services)) services = [];

    serviceSelect.innerHTML = '<option value="">Select a service</option>';
    services.forEach((s) => {
      const option = document.createElement("option");
      option.value = s.id;
      option.textContent = `${s.title || s.name}${s.price ? ` — ${formatCurrency(s.price)}` : ""}`;
      serviceSelect.appendChild(option);
    });
    serviceSelect.disabled = false;

    await loadProviders(categoryId);
  }

  async function loadProviders(categoryId) {
    providerSelect.innerHTML = '<option value="">Loading providers...</option>';

    const data = await apiFetch(`/providers/?category=${categoryId}`);
    if (!data || data.error) {
      providerSelect.innerHTML =
        '<option value="">Any available provider</option>';
      return;
    }

    providers = data.results || data.data || data;
    if (!Array.isArray(providers)) providers = [];

    providerSelect.innerHTML =
      '<option value="">Any available provider</option>';
    providers.forEach((p) => {
      const name = p.user_full_name || "Provider";
      const option = document.createElement("option");
      option.value = p.id;
      option.textContent = `${name} — ${formatCurrency(p.hourly_rate || 0)}/hr`;
      providerSelect.appendChild(option);
    });

    const params = new URLSearchParams(window.location.search);
    const providerId = params.get("provider");
    if (providerId) {
      providerSelect.value = providerId;
    }
  }

  function updatePrice() {
    const serviceId = serviceSelect.value;
    if (!serviceId) {
      selectedServicePrice = 0;
      priceDisplay.textContent = "Rs. 0";
      return;
    }
    const service = services.find((s) => String(s.id) === String(serviceId));
    selectedServicePrice = service
      ? Number(service.price || service.base_price || 0)
      : 0;
    priceDisplay.textContent = formatCurrency(selectedServicePrice);
  }

  function setupEvents() {
    categorySelect.addEventListener("change", async () => {
      const categoryId = categorySelect.value;
      if (categoryId) {
        await loadServices(categoryId);
      } else {
        serviceSelect.innerHTML = '<option value="">Select a service</option>';
        serviceSelect.disabled = true;
        providerSelect.innerHTML =
          '<option value="">Any available provider</option>';
      }
      updatePrice();
    });

    serviceSelect.addEventListener("change", updatePrice);

    getLocationBtn.addEventListener("click", async () => {
      getLocationBtn.disabled = true;
      getLocationBtn.textContent = "Getting location...";

      const pos = await getCurrentPosition();
      if (pos) {
        latInput.value = pos.lat;
        lonInput.value = pos.lon;
        const address = await reverseGeocode(pos.lat, pos.lon);
        if (address) {
          addressInput.value = address;
        }
        showToast("Location retrieved successfully.", "success");
      } else {
        showToast(
          "Could not get your location. Please enter your address manually.",
          "warning",
        );
      }

      getLocationBtn.disabled = false;
      getLocationBtn.innerHTML = "&#128205; Get My Location";
    });

    form.addEventListener("submit", handleSubmit);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const categoryId = categorySelect.value;
    const serviceId = serviceSelect.value;
    const providerId = providerSelect.value;
    const date = dateInput.value;
    const time = timeInput.value;
    const address = addressInput.value.trim();
    const notes = notesInput.value.trim();

    if (!categoryId || !date || !time || !address) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    if (!latInput.value || !lonInput.value) {
      showToast("Please get your location or enter coordinates.", "error");
      return;
    }

    setLoading(true);

    const payload = {
      category_id: Number(categoryId),
      service_id: serviceId ? Number(serviceId) : null,
      provider_id: providerId ? Number(providerId) : null,
      booking_date: date,
      booking_time: time,
      address,
      latitude: latInput.value ? Number(Number(latInput.value).toFixed(6)) : 0,

      longitude: lonInput.value ? Number(Number(lonInput.value).toFixed(6)) : 0,
      note: notes,
    };

    const data = await apiFetch("/bookings/", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (data && !data.error) {
      showToast("Booking created successfully!", "success");
      setTimeout(() => {
        window.location.href = "customer-bookings.html";
      }, 1000);
    }
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitText.textContent = isLoading ? "Booking..." : "Book Now";
    submitSpinner.classList.toggle("hidden", !isLoading);
  }

  init();
})();
