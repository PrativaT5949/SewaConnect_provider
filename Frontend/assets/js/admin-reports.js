/* ============================================================
   SewaConnect — Admin Reports Page
   ============================================================ */

(function () {
  if (!requireAuth() || !requireRole('admin')) return;

  const revenueStatsEl = document.getElementById('revenue-stats');
  const topCategoriesEl = document.getElementById('top-categories');
  const topProvidersEl = document.getElementById('top-providers');
  const userGrowthEl = document.getElementById('user-growth');
  const bookingTrendsEl = document.getElementById('booking-trends');

  async function init() {
    await loadReport();
  }

  async function loadReport() {
    const data = await apiFetch('/auth/dashboard/admin/');
    if (!data || data.error) {
      revenueStatsEl.innerHTML = '<p class="text-muted">Could not load report data.</p>';
      topCategoriesEl.innerHTML = '';
      topProvidersEl.innerHTML = '';
      userGrowthEl.innerHTML = '';
      bookingTrendsEl.innerHTML = '';
      return;
    }

    renderRevenueStats(data);
    renderTopCategories(data.top_categories || data.categories_list || []);
    renderTopProviders(data.top_providers || data.providers_list || []);
    renderUserGrowth(data);
    renderBookingTrends(data);
  }

  function renderRevenueStats(data) {
    const totalRevenue = data.total_revenue || 0;
    const monthlyRevenue = data.monthly_revenue || 0;
    const totalBookings = data.total_bookings || 0;
    const avgBookingValue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

    revenueStatsEl.innerHTML = `
      ${buildStatCard('Total Revenue', formatCurrency(totalRevenue), '&#128176;', 'accent')}
      ${buildStatCard('Monthly Revenue', formatCurrency(monthlyRevenue), '&#128198;', 'info')}
      ${buildStatCard('Total Bookings', totalBookings, '&#128197;', 'success')}
      ${buildStatCard('Avg Booking Value', formatCurrency(avgBookingValue), '&#128200;', 'warning')}
    `;
  }

  function renderTopCategories(categories) {
    if (!categories || !categories.length) {
      topCategoriesEl.innerHTML = '<p class="text-muted">No category data available.</p>';
      return;
    }

    topCategoriesEl.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:var(--sp-3);">
        ${categories.slice(0, 10).map((cat, i) => {
          const name = cat.name || cat.category_name || `Category ${i + 1}`;
          const count = cat.booking_count || cat.count || cat.total || 0;
          const revenue = cat.revenue || cat.total_revenue || 0;

          return `
            <div class="flex justify-between items-center" style="padding:var(--sp-2) 0;border-bottom:1px solid var(--border);">
              <div>
                <span class="fw-600">${i + 1}. ${name}</span>
              </div>
              <div class="text-right">
                <span class="fw-600">${count} bookings</span>
                ${revenue ? `<span class="text-muted fs-sm" style="margin-left:var(--sp-2);">${formatCurrency(revenue)}</span>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderTopProviders(providers) {
    if (!providers || !providers.length) {
      topProvidersEl.innerHTML = '<p class="text-muted">No provider data available.</p>';
      return;
    }

    topProvidersEl.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:var(--sp-3);">
        ${providers.slice(0, 10).map((p, i) => {
          const name = p.user_full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || `Provider ${i + 1}`;
          const bookings = p.booking_count || p.total_bookings || p.count || 0;
          const rating = Number(p.average_rating || p.rating || 0);
          const revenue = p.revenue || p.total_earnings || 0;

          return `
            <div class="flex justify-between items-center" style="padding:var(--sp-2) 0;border-bottom:1px solid var(--border);">
              <div>
                <span class="fw-600">${i + 1}. ${name}</span>
                ${rating ? `<span class="text-muted fs-sm" style="margin-left:var(--sp-2);">&#9733; ${rating.toFixed(1)}</span>` : ''}
              </div>
              <div class="text-right">
                <span class="fw-600">${bookings} bookings</span>
                ${revenue ? `<span class="text-muted fs-sm" style="margin-left:var(--sp-2);">${formatCurrency(revenue)}</span>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderUserGrowth(data) {
    const totalUsers = data.total_users || 0;
    const totalCustomers = data.total_customers || data.customers || 0;
    const totalProviders = data.total_providers || data.providers || 0;
    const recentUsers = data.recent_users || data.new_users || 0;

    userGrowthEl.innerHTML = `
      <div class="dashboard-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr));">
        <div class="card card-body text-center">
          <div class="stat-value" style="font-size:1.5rem;">${totalUsers}</div>
          <div class="stat-label">Total Users</div>
        </div>
        <div class="card card-body text-center">
          <div class="stat-value" style="font-size:1.5rem;color:var(--info);">${totalCustomers}</div>
          <div class="stat-label">Customers</div>
        </div>
        <div class="card card-body text-center">
          <div class="stat-value" style="font-size:1.5rem;color:var(--accent);">${totalProviders}</div>
          <div class="stat-label">Providers</div>
        </div>
        <div class="card card-body text-center">
          <div class="stat-value" style="font-size:1.5rem;color:var(--success);">${recentUsers}</div>
          <div class="stat-label">Recent Signups</div>
        </div>
      </div>
    `;
  }

  function renderBookingTrends(data) {
    const totalBookings = data.total_bookings || 0;
    const completedBookings = data.completed_bookings || 0;
    const pendingBookings = data.pending_bookings || 0;
    const cancelledBookings = data.cancelled_bookings || 0;
    const completionRate = totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0;

    bookingTrendsEl.innerHTML = `
      <div class="dashboard-grid mb-6" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr));">
        <div class="card card-body text-center">
          <div class="stat-value" style="font-size:1.5rem;">${totalBookings}</div>
          <div class="stat-label">Total</div>
        </div>
        <div class="card card-body text-center">
          <div class="stat-value" style="font-size:1.5rem;color:var(--success);">${completedBookings}</div>
          <div class="stat-label">Completed</div>
        </div>
        <div class="card card-body text-center">
          <div class="stat-value" style="font-size:1.5rem;color:var(--warning);">${pendingBookings}</div>
          <div class="stat-label">Pending</div>
        </div>
        <div class="card card-body text-center">
          <div class="stat-value" style="font-size:1.5rem;color:var(--danger);">${cancelledBookings}</div>
          <div class="stat-label">Cancelled</div>
        </div>
      </div>
      <div>
        <div class="flex justify-between items-center mb-2">
          <span class="fs-sm text-muted">Completion Rate</span>
          <span class="fs-sm fw-600">${completionRate}%</span>
        </div>
        <div class="progress">
          <div class="progress-bar success" style="width:${completionRate}%;"></div>
        </div>
      </div>
    `;
  }

  init();
})();
