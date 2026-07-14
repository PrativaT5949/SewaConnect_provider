/* ============================================================
   SewaConnect — Edit Profile Page
   ============================================================ */

(function () {
  if (!requireAuth()) return;

  const loadingEl = document.getElementById("profile-loading");
  const formWrapper = document.getElementById("profile-form-wrapper");
  const form = document.getElementById("edit-profile-form");
  const firstNameInput = document.getElementById("edit-first-name");
  const lastNameInput = document.getElementById("edit-last-name");
  const phoneInput = document.getElementById("edit-phone");
  const addressInput = document.getElementById("edit-address");
  const cityInput = document.getElementById("edit-city");
  const districtInput = document.getElementById("edit-district");
  const latInput = document.getElementById("edit-latitude");
  const lonInput = document.getElementById("edit-longitude");
  const providerFields = document.getElementById("provider-fields");
  const bioInput = document.getElementById("edit-bio");
  const taglineInput = document.getElementById("edit-tagline");
  const experienceInput = document.getElementById("edit-experience");
  const hourlyRateInput = document.getElementById("edit-hourly-rate");
  const workStartInput = document.getElementById("edit-work-start");
  const workEndInput = document.getElementById("edit-work-end");
  const citizenshipInput = document.getElementById("edit-citizenship");
  const certificateInput = document.getElementById("edit-certificate");
  const citizenshipPreview = document.getElementById("citizenship-preview");
  const certificatePreview = document.getElementById("certificate-preview");
  const saveBtn = document.getElementById("save-btn");
  const saveText = document.getElementById("save-text");
  const saveSpinner = document.getElementById("save-spinner");
  const cancelBtn = document.getElementById("cancel-btn");
  const getLocationBtn = document.getElementById("get-location-btn");

  let userRole = null;

  async function init() {
    await loadProfile();
    setupEvents();
  }

  async function loadProfile() {
    const data = await apiFetch("/auth/me/");
    if (!data || data.error) {
      const user = getCurrentUser();
      if (user) {
        firstNameInput.value = user.first_name || "";
        lastNameInput.value = user.last_name || "";
        userRole = user.role;
        if (userRole === "provider") providerFields.classList.remove("hidden");
      }
      loadingEl.classList.add("hidden");
      formWrapper.classList.remove("hidden");
      return;
    }

    userRole = data.role || getUserRole();

    firstNameInput.value = data.first_name || "";
    lastNameInput.value = data.last_name || "";
    phoneInput.value = data.phone || data.phone_number || "";
    addressInput.value = data.address || "";
    cityInput.value = data.city || "";
    districtInput.value = data.district || "";

    if (data.latitude) latInput.value = data.latitude;
    if (data.longitude) lonInput.value = data.longitude;

    if (userRole === "provider") {
      providerFields.classList.remove("hidden");
      await loadProviderData();
    }

    loadingEl.classList.add("hidden");
    formWrapper.classList.remove("hidden");
  }

  async function loadProviderData() {
    const data = await apiFetch("/providers/profile/");
    if (!data || data.error) return;

    bioInput.value = data.bio || data.about || "";
    taglineInput.value = data.tagline || "";
    experienceInput.value =
      data.experience_years || data.years_of_experience || "";
    hourlyRateInput.value = data.hourly_rate || "";
    workStartInput.value = data.working_start_time || "09:00";
    workEndInput.value = data.working_end_time || "17:00";

    if (data.citizenship_image) {
      citizenshipPreview.innerHTML = `<img src="${mediaUrl(data.citizenship_image)}" style="max-width:200px;border-radius:var(--radius-sm);margin-top:var(--sp-2);">`;
    }
    if (data.certificate_image) {
      certificatePreview.innerHTML = `<img src="${mediaUrl(data.certificate_image)}" style="max-width:200px;border-radius:var(--radius-sm);margin-top:var(--sp-2);">`;
    }
  }

  function setupEvents() {
    form.addEventListener("submit", handleSubmit);
    cancelBtn.addEventListener("click", () => window.history.back());
    getLocationBtn.addEventListener("click", handleGetLocation);
    citizenshipInput.addEventListener("change", () =>
      handleFilePreview(citizenshipInput, citizenshipPreview),
    );
    certificateInput.addEventListener("change", () =>
      handleFilePreview(certificateInput, certificatePreview),
    );
  }

  function handleFilePreview(input, container) {
    if (input.files && input.files[0]) {
      const url = URL.createObjectURL(input.files[0]);
      container.innerHTML = `<img src="${url}" style="max-width:200px;border-radius:var(--radius-sm);margin-top:var(--sp-2);">`;
    }
  }

  async function handleGetLocation() {
    getLocationBtn.disabled = true;
    getLocationBtn.textContent = "Getting location...";
    const pos = await getCurrentPosition();
    if (pos) {
      latInput.value = pos.lat;
      lonInput.value = pos.lon;
      const addr = await reverseGeocode(pos.lat, pos.lon);
      if (addr) addressInput.value = addr;
      showToast("Location retrieved.", "success");
    } else {
      showToast("Could not get location.", "warning");
    }
    getLocationBtn.disabled = false;
    getLocationBtn.innerHTML = "&#128205; Use My Current Location";
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      first_name: firstNameInput.value.trim(),
      last_name: lastNameInput.value.trim(),
      phone_number: phoneInput.value.trim(),
      address: addressInput.value.trim(),
      city: cityInput.value.trim(),
      district: districtInput.value.trim(),
    };

    if (latInput.value) payload.latitude = Number(latInput.value);
    if (lonInput.value) payload.longitude = Number(lonInput.value);

    if (!payload.first_name || !payload.last_name) {
      showToast("First and last name are required.", "error");
      return;
    }

    setSaving(true);

    let data;
    if (userRole === "provider") {
      data = await apiFetch("/providers/profile/", {
        method: "PATCH",
        body: JSON.stringify({
          first_name: firstNameInput.value.trim(),
          last_name: lastNameInput.value.trim(),
          phone_number: phoneInput.value.trim(),
          address: addressInput.value.trim(),
          latitude: latInput.value ? Number(latInput.value) : null,
          longitude: lonInput.value ? Number(lonInput.value) : null,
          bio: bioInput.value.trim(),
          tagline: taglineInput.value.trim(),
          experience_years: experienceInput.value
            ? Number(experienceInput.value)
            : null,
          hourly_rate: hourlyRateInput.value
            ? Number(hourlyRateInput.value)
            : null,
          working_start_time: workStartInput.value,
          working_end_time: workEndInput.value,
        }),
      });
    } else {
      data = await apiFetch("/auth/me/", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    }

    if (data && !data.error) {
      if (citizenshipInput.files.length || certificateInput.files.length) {
        await uploadDocuments();
      }
      showToast("Profile updated successfully!", "success");
      setTimeout(() => window.history.back(), 800);
    }

    setSaving(false);
  }

  async function uploadDocuments() {
    const formData = new FormData();
    if (citizenshipInput.files.length)
      formData.append("citizenship_image", citizenshipInput.files[0]);
    if (certificateInput.files.length)
      formData.append("certificate_image", certificateInput.files[0]);

    const token = getToken();
    await fetch(`${API_BASE}/providers/profile/`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  }

  function setSaving(saving) {
    saveBtn.disabled = saving;
    saveText.textContent = saving ? "Saving..." : "Save Changes";
    saveSpinner.classList.toggle("hidden", !saving);
  }

  init();
})();
