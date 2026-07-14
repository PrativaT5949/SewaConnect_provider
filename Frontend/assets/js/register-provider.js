/* ============================================================
   SewaConnect — Provider Registration
   ============================================================ */

(function () {
  const form = document.getElementById("provider-register-form");
  const firstName = document.getElementById("prov-first-name");
  const lastName = document.getElementById("prov-last-name");
  const email = document.getElementById("prov-email");
  const phone = document.getElementById("prov-phone");
  const password = document.getElementById("prov-password");
  const confirmPassword = document.getElementById("prov-confirm-password");
  const tagline = document.getElementById("prov-tagline");
  const bio = document.getElementById("prov-bio");
  const experience = document.getElementById("prov-experience");
  const rate = document.getElementById("prov-rate");
  const address = document.getElementById("prov-address");
  const latInput = document.getElementById("prov-lat");
  const lonInput = document.getElementById("prov-lon");
  const locationStatus = document.getElementById("prov-location-status");
  const citizenship = document.getElementById("prov-citizenship");
  const certificate = document.getElementById("prov-certificate");
  const terms = document.getElementById("prov-terms");
  const errorBox = document.getElementById("provider-error");
  const submitBtn = document.getElementById("prov-submit");
  const btnText = document.getElementById("prov-btn-text");
  const btnSpinner = document.getElementById("prov-btn-spinner");
  const strengthFill = document.getElementById("prov-strength-fill");
  const strengthText = document.getElementById("prov-strength-text");
  const locationBtn = document.getElementById("prov-get-location");

  function setLoading(loading) {
    submitBtn.disabled = loading;
    btnText.textContent = loading ? "Creating Account..." : "Become a Provider";
    if (loading) {
      btnSpinner.classList.remove("hidden");
    } else {
      btnSpinner.classList.add("hidden");
    }
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.remove("hidden");
    errorBox.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function hideError() {
    errorBox.classList.add("hidden");
  }

  /* Password Strength */
  function getPasswordStrength(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    return score;
  }

  password.addEventListener("input", () => {
    const val = password.value;
    const strength = getPasswordStrength(val);
    const percent = (strength / 5) * 100;

    strengthFill.style.width = percent + "%";
    strengthFill.className = "progress-bar";

    if (val.length === 0) {
      strengthFill.style.width = "0%";
      strengthText.textContent = "";
    } else if (strength <= 1) {
      strengthFill.style.background = "var(--danger)";
      strengthText.textContent = "Weak";
      strengthText.style.color = "var(--danger)";
    } else if (strength <= 2) {
      strengthFill.style.background = "var(--warning)";
      strengthText.textContent = "Fair";
      strengthText.style.color = "var(--warning)";
    } else if (strength <= 3) {
      strengthFill.style.background = "var(--secondary)";
      strengthText.textContent = "Good";
      strengthText.style.color = "var(--secondary)";
    } else {
      strengthFill.classList.add("success");
      strengthText.textContent = "Strong";
      strengthText.style.color = "var(--success)";
    }
  });

  /* Geolocation */
  locationBtn.addEventListener("click", async () => {
    locationBtn.disabled = true;
    locationBtn.textContent = "Locating...";
    locationStatus.textContent = "Getting your location...";
    locationStatus.style.color = "var(--text-muted)";

    const pos = await getCurrentPosition();

    if (pos) {
      latInput.value = pos.lat;
      lonInput.value = pos.lon;
      locationStatus.textContent = `Location captured (${pos.lat.toFixed(4)}, ${pos.lon.toFixed(4)})`;
      locationStatus.style.color = "var(--success)";

      const resolved = await reverseGeocode(pos.lat, pos.lon);
      if (resolved && !address.value.trim()) {
        address.value = resolved;
      }
    } else {
      locationStatus.textContent =
        "Could not get location. Please enter your address manually.";
      locationStatus.style.color = "var(--danger)";
    }

    locationBtn.disabled = false;
    locationBtn.innerHTML = "&#128205; Get My Location";
  });

  /* Form Submit */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();

    /* Validate */
    if (!firstName.value.trim()) {
      showError("Please enter your first name.");
      firstName.focus();
      return;
    }
    if (!lastName.value.trim()) {
      showError("Please enter your last name.");
      lastName.focus();
      return;
    }
    if (!email.value.trim()) {
      showError("Please enter your email address.");
      email.focus();
      return;
    }
    if (!phone.value.trim()) {
      showError("Please enter your phone number.");
      phone.focus();
      return;
    }
    if (!password.value) {
      showError("Please enter a password.");
      password.focus();
      return;
    }
    if (password.value.length < 8) {
      showError("Password must be at least 8 characters long.");
      password.focus();
      return;
    }
    if (password.value !== confirmPassword.value) {
      showError("Passwords do not match.");
      confirmPassword.focus();
      return;
    }
    if (!rate.value || Number(rate.value) <= 0) {
      showError("Please enter your hourly rate.");
      rate.focus();
      return;
    }
    if (!terms.checked) {
      showError("Please agree to the Terms of Service.");
      return;
    }

    setLoading(true);

    try {
      /* Step 1: Register user account */
      const regRes = await fetch(`${API_BASE}/auth/register/provider/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName.value.trim(),
          last_name: lastName.value.trim(),
          email: email.value.trim(),
          phone_number: phone.value.trim(),
          password: password.value,
          password_confirm: confirmPassword.value,
        }),
      });

      const regData = await regRes.json();

      if (!regRes.ok) {
        const message = regData.detail || regData.message || "";
        const errors = regData.errors || regData.data || {};
        let errorMsg = message;
        if (!errorMsg && typeof errors === "object") {
          errorMsg = Object.values(errors).flat().join(" ");
        }
        showError(errorMsg || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      /* Step 2: Auto-login */
      const loginRes = await fetch(`${API_BASE}/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.value.trim(),
          password: password.value,
        }),
      });

      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        showToast("Account created! Please log in manually.", "success");
        setTimeout(() => {
          window.location.href = "login.html";
        }, 1500);
        return;
      }

      setTokens(loginData.access, loginData.refresh);

      /* Step 3: Create provider profile */
      const profileFormData = new FormData();
      if (bio.value.trim()) profileFormData.append("bio", bio.value.trim());
      if (tagline.value.trim())
        profileFormData.append("tagline", tagline.value.trim());
      profileFormData.append("experience_years", experience.value || "0");
      profileFormData.append("hourly_rate", rate.value);
      if (address.value.trim())
        profileFormData.append("address", address.value.trim());
      if (latInput.value) profileFormData.append("latitude", latInput.value);
      if (lonInput.value) profileFormData.append("longitude", lonInput.value);
      if (citizenship.files[0])
        profileFormData.append("citizenship_image", citizenship.files[0]);
      if (certificate.files[0])
        profileFormData.append("certificate_image", certificate.files[0]);

      const profileRes = await fetch(`${API_BASE}/providers/profile/create/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${loginData.access}`,
        },
        body: profileFormData,
      });

      const profileData = await profileRes.json();

      if (!profileRes.ok) {
        showToast(
          "Account created! Please complete your profile from the dashboard.",
          "info",
        );
        setTimeout(() => {
          window.location.href = "/pages/provider-dashboard.html";
        }, 1500);
        return;
      }

      /* Step 4: Update user location fields */
      const userPayload = {};
      if (address.value.trim()) userPayload.address = address.value.trim();
      if (latInput.value) userPayload.latitude = parseFloat(latInput.value);
      if (lonInput.value) userPayload.longitude = parseFloat(lonInput.value);

      if (Object.keys(userPayload).length > 0) {
        await apiFetch("/auth/me/", {
          method: "PATCH",
          body: JSON.stringify(userPayload),
        });
      }

      showToast(
        "Registration successful! Your profile is pending verification.",
        "success",
      );
      setTimeout(() => {
        window.location.href = "/pages/provider-dashboard.html";
      }, 1200);
    } catch (err) {
      showError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  });

  /* Redirect if already logged in */
  if (isLoggedIn()) {
    redirectToDashboard();
  }
})();
