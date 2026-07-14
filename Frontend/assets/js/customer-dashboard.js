/* ============================================================
   SewaConnect — Customer Dashboard Page
   ============================================================ */

(function () {
  if (!requireAuth() || !requireRole('customer')) return;

  const welcomeText = document.getElementById('welcome-text');
  const statsGrid = document.getElementById('stats-grid');
  const recentBookingsEl = document.getElementById('recent-bookings');

  async function init() {
    await loadDashboard();
  }

  async function loadDashboard() {
    const data = await apiFetch('/auth/dashboard/customer/');

    if (!data || data.error) {
      const user = getCurrentUser();
      if (user) welcomeText.textContent = `Hello, ${user.first_name || 'there'}!`;
      statsGrid.innerHTML = '<p class="text-muted">Could not load dashboard data.</p>';
      recentBookingsEl.innerHTML = '';
      return;
    }

    const user = getCurrentUser();
    const firstName = data.first_name || user?.first_name || 'there';
    welcomeText.textContent = `Hello, ${firstName}!`;

    const stats = data.stats || data;
    const totalBookings = stats.total_bookings || 0;
    const pending = stats.pending_bookings || 0;
    const completed = stats.completed_bookings || 0;
    const totalSpent = stats.total_spent || 0;
    const favorites = stats.favorites_count || stats.total_favorites || 0;

    statsGrid.innerHTML = `
      ${buildStatCard('Total Bookings', totalBookings, '&#128197;', 'accent')}
      ${buildStatCard('Pending', pending, '&#9203;', 'warning')}
      ${buildStatCard('Completed', completed, '&#10003;', 'success')}
      ${buildStatCard('Total Spent', formatCurrency(totalSpent), '&#128176;', 'info')}
      ${buildStatCard('Favorites', favorites, '&#9829;', 'accent')}
    `;

    const bookings = data.recent_bookings || data.bookings || [];
    renderRecentBookings(bookings);
  }

  function renderRecentBookings(bookings) {
    if (!bookings || !bookings.length) {
      recentBookingsEl.innerHTML = `
        <div class="card card-body text-center" style="padding:var(--sp-8);">
          <p class="text-muted">No bookings yet. <a href="find-providers.html">Find a provider</a> to get started!</p>
        </div>
      `;
      return;
    }

    recentBookingsEl.innerHTML = bookings.slice(0, 5).map((b) => {
      const id = b.id || b.booking_id || '';
      const code = b.booking_code || b.code || `SC-${id}`;
      const service = b.service_name || b.service?.name || b.category_name || 'Service';
      const provider = b.provider_name || '';
      const date = b.scheduled_date || b.date || '';
      const time = b.scheduled_time || b.time || '';
      const status = (b.status || 'pending').toLowerCase().replace(/\s+/g, '_');
      const statusLabel = status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
      const price = b.price || b.total_price || 0;

      return `
        <div class="booking-card mb-3">
          <div class="booking-details" style="flex:1;">
            <div class="flex justify-between items-center flex-wrap gap-2 mb-1">
              <span class="fw-600">${code}</span>
              <span class="status-badge ${status}">${statusLabel}</span>
            </div>
            <div class="booking-title">${service}</div>
            <div class="booking-meta">
              ${provider ? `${provider}` : ''}
              ${date ? ` &middot; ${formatDate(date)}` : ''}
              ${time ? ` at ${formatTime(time)}` : ''}
              &middot; ${formatCurrency(price)}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  init();
})();
