/* ============================================================
   SewaConnect — Admin Dashboard Page
   ============================================================ */

(function () {
  if (!requireAuth() || !requireRole('admin')) return;

  const welcomeText = document.getElementById('welcome-text');
  const statsGrid = document.getElementById('stats-grid');
  const pendingProvidersEl = document.getElementById('pending-providers');
  const recentBookingsEl = document.getElementById('recent-bookings');

  async function init() {
    await loadDashboard();
  }

  async function loadDashboard() {
    const data = await apiFetch('/auth/dashboard/admin/');
    if (!data || data.error) {
      statsGrid.innerHTML = '<p class="text-muted">Could not load dashboard data.</p>';
      pendingProvidersEl.innerHTML = '';
      recentBookingsEl.innerHTML = '';
      return;
    }

    const user = getCurrentUser();
    const firstName = user?.first_name || 'Admin';
    welcomeText.textContent = `Hello, ${firstName}!`;

    const totalUsers = data.total_users || 0;
    const totalCustomers = data.total_customers || data.customers || 0;
    const totalProviders = data.total_providers || data.providers || 0;
    const pendingProviders = data.pending_providers || 0;
    const totalBookings = data.total_bookings || 0;
    const completedBookings = data.completed_bookings || 0;
    const totalRevenue = data.total_revenue || 0;
    const monthlyRevenue = data.monthly_revenue || 0;
    const totalReviews = data.total_reviews || data.reviews || 0;
    const totalCategories = data.total_categories || data.categories || 0;

    statsGrid.innerHTML = `
      ${buildStatCard('Total Users', totalUsers, '&#128101;', 'info')}
      ${buildStatCard('Customers', totalCustomers, '&#128100;', 'success')}
      ${buildStatCard('Providers', totalProviders, '&#9881;', 'accent')}
      ${buildStatCard('Pending Providers', pendingProviders, '&#9203;', 'warning')}
      ${buildStatCard('Total Bookings', totalBookings, '&#128197;', 'info')}
      ${buildStatCard('Completed', completedBookings, '&#10003;', 'success')}
      ${buildStatCard('Total Revenue', formatCurrency(totalRevenue), '&#128176;', 'accent')}
      ${buildStatCard('Monthly Revenue', formatCurrency(monthlyRevenue), '&#128198;', 'info')}
      ${buildStatCard('Reviews', totalReviews, '&#9733;', 'warning')}
      ${buildStatCard('Categories', totalCategories, '&#128194;', 'info')}
    `;

    const pendingProvidersList = data.pending_providers_list || data.recent_pending_providers || [];
    renderPendingProviders(pendingProvidersList);

    const recentBookings = data.recent_bookings || [];
    renderRecentBookings(recentBookings);
  }

  function renderPendingProviders(providers) {
    if (!providers || !providers.length) {
      pendingProvidersEl.innerHTML = '<div class="card card-body text-center" style="padding:var(--sp-6);"><p class="text-muted">No pending providers.</p></div>';
      return;
    }

    pendingProvidersEl.innerHTML = providers.slice(0, 5).map((p) => {
      const name = p.user_full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Provider';
      const email = p.email || '';

      return `
        <div class="booking-card mb-3">
          <div class="booking-details" style="flex:1;">
            <div class="fw-600">${name}</div>
            <div class="booking-meta">${email}</div>
          </div>
          <a href="admin-providers.html?filter=pending" class="btn btn-primary btn-sm">Review</a>
        </div>
      `;
    }).join('');
  }

  function renderRecentBookings(bookings) {
    if (!bookings || !bookings.length) {
      recentBookingsEl.innerHTML = '<div class="card card-body text-center" style="padding:var(--sp-6);"><p class="text-muted">No recent bookings.</p></div>';
      return;
    }

    recentBookingsEl.innerHTML = bookings.slice(0, 5).map((b) => {
      const code = b.booking_code || b.code || `SC-${b.id || ''}`;
      const service = b.service_name || b.category_name || 'Service';
      const status = (b.status || 'pending').toLowerCase().replace(/\s+/g, '_');
      const statusLabel = status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
      const price = b.price || b.total_price || 0;

      return `
        <div class="booking-card mb-3">
          <div class="booking-details" style="flex:1;">
            <div class="flex justify-between items-center mb-1">
              <span class="fw-600">${code}</span>
              <span class="status-badge ${status}">${statusLabel}</span>
            </div>
            <div class="booking-meta">${service} &middot; ${formatCurrency(price)}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  init();
})();
