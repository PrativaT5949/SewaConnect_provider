/* ============================================================
   SewaConnect — Edit Provider Profile Page
   ============================================================ */

(function () {
  if (!requireAuth() || !requireRole("provider")) return;

  const loadingEl = document.getElementById("profile-loading");
  const formWrapper = document.getElementById("profile-form-wrapper");
  const firstNameInput = document.getElementById("ep-first-name");
  const lastNameInput = document.getElementById("ep-last-name");
  const phoneInput = document.getElementById("ep-phone");
  const bioInput = document.getElementById("ep-bio");
  const taglineInput = document.getElementById("ep-tagline");
  const experienceInput = document.getElementById("ep-experience");
  const hourlyRateInput = document.getElementById("ep-hourly-rate");
  const workStartInput = document.getElementById("ep-work-start");
  const workEndInput = document.getElementById("ep-work-end");
  const addressInput = document.getElementById("ep-address");
  const latInput = document.getElementById("ep-latitude");
  const lonInput = document.getElementById("ep-longitude");
  const avatarInput = document.getElementById("ep-avatar");
  const avatarPreview = document.getElementById("ep-avatar-preview");
  const citizenshipInput = document.getElementById("ep-citizenship");
  const certificateInput = document.getElementById("ep-certificate");
  const citizenshipPreview = document.getElementById("ep-citizenship-preview");
  const certificatePreview = document.getElementById("ep-certificate-preview");
  const saveBtn = document.getElementById("ep-save-btn");
  const saveText = document.getElementById("ep-save-text");
  const saveSpinner = document.getElementById("ep-save-spinner");
  const cancelBtn = document.getElementById("ep-cancel-btn");
  const getLocationBtn = document.getElementById("ep-get-location");
  const workdaysToggle = document.getElementById("workdays-toggle");

  let workingDays = new Set(["mon", "tue", "wed", "thu", "fri"]);
  let map;
  let marker;
  const locationSearch = document.getElementById("provider-location-search");

  async function init() {
    setupWorkdays();
    await loadProfile();
    initMap();
    setupEvents();
  }

  function setupWorkdays() {
    workdaysToggle.querySelectorAll(".chip").forEach((chip) => {
      const day = chip.dataset.day;
      if (workingDays.has(day)) chip.classList.add("chip-active");
      chip.addEventListener("click", () => {
        if (workingDays.has(day)) {
          workingDays.delete(day);
          chip.classList.remove("chip-active");
        } else {
          workingDays.add(day);
          chip.classList.add("chip-active");
        }
      });
    });
  }

  async function loadProfile() {
    const data = await apiFetch("/auth/me/");
    if (!data || data.error) {
      loadingEl.classList.add("hidden");
      formWrapper.classList.remove("hidden");
      return;
    }

    firstNameInput.value = data.first_name || "";
    lastNameInput.value = data.last_name || "";
    phoneInput.value = data.phone || data.phone_number || "";

    if (data.avatar) {
      avatarPreview.innerHTML = `<img src="${mediaUrl(data.avatar)}" style="width:120px;height:120px;border-radius:var(--radius-full);object-fit:cover;">`;
    } else {
      avatarPreview.innerHTML = `<div style="width:120px;height:120px;border-radius:var(--radius-full);display:flex;align-items:center;justify-content:center;font-size:2.5rem;">&#128100;</div>`;
    }

    const providerData = await apiFetch("/providers/profile/");
    if (providerData && !providerData.error) {
      bioInput.value = providerData.bio || providerData.about || "";
      taglineInput.value = providerData.tagline || "";
      experienceInput.value =
        providerData.experience_years || providerData.years_of_experience || "";
      hourlyRateInput.value = providerData.hourly_rate || "";
      workStartInput.value = providerData.working_start_time || "09:00";
      workEndInput.value = providerData.working_end_time || "17:00";
      addressInput.value = providerData.address || providerData.location || "";
      // if (providerData.latitude) latInput.value = providerData.latitude;
      // if (providerData.longitude) lonInput.value = providerData.longitude;
      if (providerData.latitude) {
        latInput.value = providerData.latitude;
      } else if (data.latitude) {
        latInput.value = data.latitude;
      }

      if (providerData.longitude) {
        lonInput.value = providerData.longitude;
      } else if (data.longitude) {
        lonInput.value = data.longitude;
      }

      if (providerData.citizenship_image) {
        citizenshipPreview.innerHTML = `<img src="${mediaUrl(providerData.citizenship_image)}" style="max-width:200px;border-radius:var(--radius-sm);">`;
      }
      if (providerData.certificate_image) {
        certificatePreview.innerHTML = `<img src="${mediaUrl(providerData.certificate_image)}" style="max-width:200px;border-radius:var(--radius-sm);">`;
      }

      const days = providerData.working_days || [];
      if (Array.isArray(days) && days.length) {
        workingDays = new Set(
          days.map((d) =>
            (typeof d === "string" ? d : d.day || "").toLowerCase().slice(0, 3),
          ),
        );
        workdaysToggle.querySelectorAll(".chip").forEach((chip) => {
          chip.classList.toggle(
            "chip-active",
            workingDays.has(chip.dataset.day),
          );
        });
      }
    }

    loadingEl.classList.add("hidden");
    formWrapper.classList.remove("hidden");
  }

  function setupEvents() {
    saveBtn.addEventListener("click", handleSave);
    cancelBtn.addEventListener("click", () => window.history.back());
    getLocationBtn.addEventListener("click", handleGetLocation);
    citizenshipInput.addEventListener("change", () =>
      handleFilePreview(citizenshipInput, citizenshipPreview),
    );
    certificateInput.addEventListener("change", () =>
      handleFilePreview(certificateInput, certificatePreview),
    );
    avatarInput.addEventListener("change", () => {
      if (avatarInput.files && avatarInput.files[0]) {
        const url = URL.createObjectURL(avatarInput.files[0]);
        avatarPreview.innerHTML = `<img src="${url}" style="width:120px;height:120px;border-radius:var(--radius-full);object-fit:cover;">`;
      }
    });
    locationSearch.addEventListener("keypress", async function (e) {
      if (e.key === "Enter") {
        e.preventDefault();

        const query = locationSearch.value.trim();

        if (!query) return;

        await searchLocation(query);
      }
    });
  }

  function handleFilePreview(input, container) {
    if (input.files && input.files[0]) {
      const url = URL.createObjectURL(input.files[0]);
      container.innerHTML = `<img src="${url}" style="max-width:200px;border-radius:var(--radius-sm);margin-top:var(--sp-2);">`;
    }
  }

  // async function handleGetLocation() {
  //   getLocationBtn.disabled = true;
  //   getLocationBtn.textContent = 'Getting location...';
  //   const pos = await getCurrentPosition();
  //   if (pos) {
  //     latInput.value = pos.lat;
  //     lonInput.value = pos.lon;
  //     const addr = await reverseGeocode(pos.lat, pos.lon);
  //     if (addr) addressInput.value = addr;
  //     showToast('Location retrieved.', 'success');
  //   } else {
  //     showToast('Could not get location.', 'warning');
  //   }
  //   getLocationBtn.disabled = false;
  //   getLocationBtn.innerHTML = '&#128205; Use My Current Location';
  // }
  async function handleGetLocation() {
    getLocationBtn.disabled = true;

    getLocationBtn.textContent = "Getting location...";

    const pos = await getCurrentPosition();

    if (pos) {
      latInput.value = pos.lat.toFixed(6);

      lonInput.value = pos.lon.toFixed(6);

      if (marker) {
        marker.setLatLng([pos.lat, pos.lon]);
      } else {
        marker = L.marker([pos.lat, pos.lon], {
          draggable: true,
        }).addTo(map);
      }

      map.setView([pos.lat, pos.lon], 16);

      const addr = await reverseGeocode(pos.lat, pos.lon);

      if (addr) addressInput.value = addr;

      showToast("Location updated", "success");
    } else {
      showToast("Could not get location", "warning");
    }

    getLocationBtn.disabled = false;

    getLocationBtn.innerHTML = "&#128205; Use My Current Location";
  }

  async function handleSave() {
    if (!firstNameInput.value.trim() || !lastNameInput.value.trim()) {
      showToast("First and last name are required.", "error");
      return;
    }

    setSaving(true);

    const payload = {
      first_name: firstNameInput.value.trim(),
      last_name: lastNameInput.value.trim(),
      phone_number: phoneInput.value.trim(),
      bio: bioInput.value.trim(),
      tagline: taglineInput.value.trim(),
      experience_years: experienceInput.value
        ? Number(experienceInput.value)
        : null,
      hourly_rate: hourlyRateInput.value ? Number(hourlyRateInput.value) : null,
      working_start_time: workStartInput.value,
      working_end_time: workEndInput.value,
      address: addressInput.value.trim(),
      working_days: Array.from(workingDays),
    };

    if (latInput.value) payload.latitude = Number(latInput.value);
    if (lonInput.value) payload.longitude = Number(lonInput.value);

    const data = await apiFetch("/providers/profile/", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    if (data && !data.error) {
      if (
        avatarInput.files.length ||
        citizenshipInput.files.length ||
        certificateInput.files.length
      ) {
        const formData = new FormData();
        if (avatarInput.files.length)
          formData.append("avatar", avatarInput.files[0]);
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
      showToast("Profile updated successfully!", "success");
      setTimeout(() => (window.location.href = "profile.html"), 800);
    }

    setSaving(false);
  }

  function setSaving(saving) {
    saveBtn.disabled = saving;
    saveText.textContent = saving ? "Saving..." : "Save Profile";
    saveSpinner.classList.toggle("hidden", !saving);
  }

  init();
  async function searchLocation(query) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;

      const response = await fetch(url, {
        headers: {
          "Accept-Language": "en",
        },
      });

      const results = await response.json();

      if (!results.length) {
        showToast("Location not found", "warning");
        return;
      }

      const place = results[0];

      const lat = Number(place.lat);
      const lon = Number(place.lon);

      // update hidden fields

      latInput.value = lat.toFixed(6);
      lonInput.value = lon.toFixed(6);

      // move map

      map.setView([lat, lon], 16);

      // update marker

      if (marker) {
        marker.setLatLng([lat, lon]);
      } else {
        marker = L.marker([lat, lon], {
          draggable: true,
        }).addTo(map);

        setupMarkerDrag();
      }

      // update address

      addressInput.value = place.display_name;

      showToast("Location found", "success");
    } catch (error) {
      console.error(error);

      showToast("Search failed", "error");
    }
  }

  function setupMarkerDrag() {
    marker.on("dragend", async function () {
      const pos = marker.getLatLng();

      latInput.value = pos.lat.toFixed(6);
      lonInput.value = pos.lng.toFixed(6);

      const addr = await reverseGeocode(pos.lat, pos.lng);

      if (addr) {
        addressInput.value = addr;
      }
    });
  }

  function initMap() {
    let lat = latInput.value ? Number(latInput.value) : 27.7172;

    let lon = lonInput.value ? Number(lonInput.value) : 85.324;

    map = L.map("provider-map").setView([lat, lon], 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    // show registered location
    if (latInput.value && lonInput.value) {
      marker = L.marker([lat, lon], {
        draggable: true,
      }).addTo(map);

      // marker.on("dragend", async function () {
      //   const pos = marker.getLatLng();

      //   latInput.value = pos.lat.toFixed(6);

      //   lonInput.value = pos.lng.toFixed(6);

      //   const addr = await reverseGeocode(pos.lat, pos.lng);

      //   if (addr) addressInput.value = addr;
      // });
      setupMarkerDrag();
    }

    // click map to change location

    map.on("click", async function (e) {
      const lat = e.latlng.lat;
      const lon = e.latlng.lng;

      if (marker) {
        marker.setLatLng([lat, lon]);
      } else {
        marker = L.marker([lat, lon], {
          draggable: true,
        }).addTo(map);

        setupMarkerDrag();
      }

      latInput.value = lat.toFixed(6);

      lonInput.value = lon.toFixed(6);

      const addr = await reverseGeocode(lat, lon);

      if (addr) addressInput.value = addr;
    });
  }
})();
