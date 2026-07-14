/* ============================================================
   SewaConnect — Provider Dashboard Page
   ============================================================ */

(function () {
  if (!requireAuth() || !requireRole('provider')) return;

  const welcomeText = document.getElementById('welcome-text');
  const statsGrid = document.getElementById('stats-grid');
  const recentBookingsEl = document.getElementById('recent-bookings');
  const recentReviewsEl = document.getElementById('recent-reviews');

  async function init() {
    await loadDashboard();
  }

  async function loadDashboard() {
    const data = await apiFetch('/providers/dashboard/');

    if (!data || data.error) {
      const user = getCurrentUser();
      if (user) welcomeText.textContent = `Hello, ${user.first_name || 'there'}!`;
      statsGrid.innerHTML = '<p class="text-muted">Could not load dashboard data.</p>';
      recentBookingsEl.innerHTML = '';
      recentReviewsEl.innerHTML = '';
      return;
    }

    const user = getCurrentUser();
    const firstName = data.first_name || user?.first_name || 'there';
    welcomeText.textContent = `Hello, ${firstName}!`;

    const stats = data.stats || data;
    const totalBookings = stats.total_bookings || 0;
    const pending = stats.pending_bookings || 0;
    const completed = stats.completed_bookings || 0;
    const totalEarnings = stats.total_earnings || stats.total_revenue || 0;
    const monthlyEarnings = stats.monthly_earnings || stats.monthly_revenue || 0;
    const avgRating = stats.average_rating || stats.avg_rating || 0;
    const responseRate = stats.response_rate || 0;

    statsGrid.innerHTML = `
      ${buildStatCard('Total Bookings', totalBookings, '&#128197;', 'accent')}
      ${buildStatCard('Pending', pending, '&#9203;', 'warning')}
      ${buildStatCard('Completed', completed, '&#10003;', 'success')}
      ${buildStatCard('Total Earnings', formatCurrency(totalEarnings), '&#128176;', 'info')}
      ${buildStatCard('Monthly Earnings', formatCurrency(monthlyEarnings), '&#128198;', 'accent')}
      ${buildStatCard('Avg Rating', avgRating ? Number(avgRating).toFixed(1) : 'N/A', '&#9733;', 'warning')}
      ${buildStatCard('Response Rate', responseRate ? responseRate + '%' : 'N/A', '&#128172;', 'info')}
    `;

    const bookings = data.recent_bookings || data.bookings || [];
    renderRecentBookings(bookings);

    const reviews = data.recent_reviews || data.reviews || [];
    renderRecentReviews(reviews);
  }

  function renderRecentBookings(bookings) {
    if (!bookings || !bookings.length) {
      recentBookingsEl.innerHTML = `
        <div class="card card-body text-center" style="padding:var(--sp-6);">
          <p class="text-muted">No bookings yet.</p>
        </div>
      `;
      return;
    }

    recentBookingsEl.innerHTML = bookings.slice(0, 5).map((b) => {
      const id = b.id || b.booking_id || '';
      const code = b.booking_code || b.code || `SC-${id}`;
      const customer = b.customer_name || '';
      const service = b.service_name || b.service?.name || 'Service';
      const date = b.scheduled_date || b.date || '';
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
              ${customer ? `Customer: ${customer}` : ''}
              ${date ? ` &middot; ${formatDate(date)}` : ''}
              &middot; ${formatCurrency(price)}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderRecentReviews(reviews) {
    if (!reviews || !reviews.length) {
      recentReviewsEl.innerHTML = `
        <div class="card card-body text-center" style="padding:var(--sp-6);">
          <p class="text-muted">No reviews yet.</p>
        </div>
      `;
      return;
    }

    recentReviewsEl.innerHTML = `<div class="reviews-list">${reviews.slice(0, 5).map(r => buildReviewCard(r)).join('')}</div>`;
  }

  init();
})();
