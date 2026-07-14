/* ============================================================
   SewaConnect — Customer Registration
   ============================================================ */

(function () {
  const form = document.getElementById("register-form");
  const firstName = document.getElementById("reg-first-name");
  const lastName = document.getElementById("reg-last-name");
  const email = document.getElementById("reg-email");
  const phone = document.getElementById("reg-phone");
  const password = document.getElementById("reg-password");
  const confirmPassword = document.getElementById("reg-confirm-password");
  const terms = document.getElementById("reg-terms");
  const errorBox = document.getElementById("register-error");
  const submitBtn = document.getElementById("register-submit");
  const btnText = document.getElementById("reg-btn-text");
  const btnSpinner = document.getElementById("reg-btn-spinner");
  const strengthFill = document.getElementById("password-strength-fill");
  const strengthText = document.getElementById("password-strength-text");

  function setLoading(loading) {
    submitBtn.disabled = loading;
    btnText.textContent = loading ? "Creating Account..." : "Create Account";
    if (loading) {
      btnSpinner.classList.remove("hidden");
    } else {
      btnSpinner.classList.add("hidden");
    }
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.remove("hidden");
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
      strengthFill.classList.add("");
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

  /* Form Submit */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();

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
    if (!terms.checked) {
      showError("Please agree to the Terms of Service.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/register/`, {
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

      const data = await res.json();

      if (!res.ok) {
        const message = data.detail || data.message || "";
        const errors = data.errors || data.data || {};
        let errorMsg = message;

        if (!errorMsg && typeof errors === "object") {
          errorMsg = Object.values(errors).flat().join(" ");
        }

        showError(errorMsg || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      showToast("Account created successfully! Please log in.", "success");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1200);
    } catch (err) {
      console.error("REGISTER ERROR:", err);

      showError(err.message || "Network error");

      setLoading(false);
    }
  });

  /* Redirect if already logged in */
  if (isLoggedIn()) {
    redirectToDashboard();
  }
})();
