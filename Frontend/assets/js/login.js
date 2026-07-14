/* ============================================================
   SewaConnect — Login Page
   ============================================================ */

(function () {
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const errorBox = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-submit');
  const btnText = document.getElementById('login-btn-text');
  const btnSpinner = document.getElementById('login-btn-spinner');

  function setLoading(loading) {
    submitBtn.disabled = loading;
    btnText.textContent = loading ? 'Logging in...' : 'Login';
    if (loading) {
      btnSpinner.classList.remove('hidden');
    } else {
      btnSpinner.classList.add('hidden');
    }
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.remove('hidden');
  }

  function hideError() {
    errorBox.classList.add('hidden');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email) {
      showError('Please enter your email address.');
      emailInput.focus();
      return;
    }

    if (!password) {
      showError('Please enter your password.');
      passwordInput.focus();
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const message = data.detail || data.message || data.error || 'Invalid email or password.';
        showError(message);
        setLoading(false);
        return;
      }

      setTokens(data.access, data.refresh);
      showToast('Login successful! Redirecting...', 'success');

      const user = getCurrentUser();
      const role = user ? user.role : null;

      setTimeout(() => {
        switch (role) {
          case 'admin':
            window.location.href = '/pages/admin-dashboard.html';
            break;
          case 'provider':
            window.location.href = '/pages/provider-dashboard.html';
            break;
          case 'customer':
            window.location.href = '/pages/customer-dashboard.html';
            break;
          default:
            window.location.href = '/index.html';
        }
      }, 800);
    } catch (err) {
      showError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  });

  /* Redirect if already logged in */
  if (isLoggedIn()) {
    redirectToDashboard();
  }
})();
