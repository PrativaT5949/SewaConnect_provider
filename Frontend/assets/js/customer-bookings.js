/* ============================================================
   SewaConnect — Customer Bookings Page
   ============================================================ */

(function () {
  if (!requireAuth() || !requireRole('customer')) return;

  const listEl = document.getElementById('bookings-list');
  const emptyEl = document.getElementById('empty-state');
  const tabsEl = document.getElementById('filter-tabs');

  let allBookings = [];
  let currentFilter = '';
  let currentPage = 1;
  const PAGE_SIZE = 10;

  async function init() {
    setupTabs();
    await loadBookings();
  }

  async function loadBookings() {
    showLoading();

    let url = '/bookings/my/';
    const params = new URLSearchParams();
    if (currentFilter) params.set('status', currentFilter);
    if (params.toString()) url += `?${params.toString()}`;

    const data = await apiFetch(url);

    if (!data || data.error) {
      allBookings = [];
      renderBookings();
      return;
    }

    allBookings = data.results || data.data || data || [];
    if (!Array.isArray(allBookings)) allBookings = [];
    currentPage = 1;
    renderBookings();
  }

  function renderBookings() {
    const filtered = currentFilter
      ? allBookings.filter(b => (b.status || '').toLowerCase().replace(/\s+/g, '_') === currentFilter)
      : allBookings;

    if (!filtered.length) {
      listEl.innerHTML = '';
      listEl.classList.add('hidden');
      emptyEl.classList.remove('hidden');
      document.getElementById('pagination').innerHTML = '';
      return;
    }

    emptyEl.classList.add('hidden');
    listEl.classList.remove('hidden');

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);

    listEl.innerHTML = pageItems.map((b) => {
      const id = b.id || b.booking_id || '';
      const code = b.booking_code || b.code || `SC-${id}`;
      const provider = b.provider_name || '';
      const category = b.category_name || '';
      const service = b.service_name || b.service?.name || '';
      const date = b.scheduled_date || b.date || '';
      const time = b.scheduled_time || b.time || '';
      const status = (b.status || 'pending').toLowerCase().replace(/\s+/g, '_');
      const statusLabel = status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
      const price = b.price || b.total_price || 0;
      const hasReview = b.has_review || b.reviewed || false;

      let actions = '';
      if (status === 'pending' || status === 'accepted') {
        actions += `<button class="btn btn-danger btn-sm cancel-btn" data-id="${id}">Cancel</button>`;
      }
      if (status === 'completed' && !hasReview) {
        actions += `<a href="leave-review.html?booking=${id}" class="btn btn-primary btn-sm">Leave Review</a>`;
      }

      return `
        <div class="booking-card mb-4">
          <div class="booking-details" style="flex:1;">
            <div class="flex justify-between items-center flex-wrap gap-2 mb-2">
              <span class="fw-600">${code}</span>
              <span class="status-badge ${status}">${statusLabel}</span>
            </div>
            <div class="booking-title">${service || category || 'Service'}</div>
            <div class="booking-meta">
              ${provider ? `Provider: ${provider}` : ''}
              ${date ? ` &middot; ${formatDate(date)}` : ''}
              ${time ? ` at ${formatTime(time)}` : ''}
            </div>
            <div style="margin-top:var(--sp-2);">
              <span class="fw-600">${formatCurrency(price)}</span>
            </div>
          </div>
          <div class="booking-actions" style="display:flex;gap:var(--sp-2);flex-wrap:wrap;">
            ${actions}
          </div>
        </div>
      `;
    }).join('');

    document.getElementById('pagination').innerHTML = '';
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    if (totalPages > 1) {
      renderBookingPagination(totalPages);
    }

    listEl.querySelectorAll('.cancel-btn').forEach((btn) => {
      btn.addEventListener('click', () => handleCancel(btn.dataset.id));
    });
  }

  function renderBookingPagination(totalPages) {
    const container = document.getElementById('pagination');
    let html = '';
    html += `<button class="page-btn" ${currentPage <= 1 ? 'disabled' : ''} data-page="${currentPage - 1}">&laquo; Prev</button>`;
    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    html += `<button class="page-btn" ${currentPage >= totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">Next &raquo;</button>`;
    container.innerHTML = html;

    container.querySelectorAll('.page-btn:not(:disabled)').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = parseInt(btn.dataset.page, 10);
        if (p >= 1 && p <= totalPages) {
          currentPage = p;
          renderBookings();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });
  }

  async function handleCancel(bookingId) {
    const confirmed = await showConfirm('Are you sure you want to cancel this booking?');
    if (!confirmed) return;

    const data = await apiFetch(`/bookings/${bookingId}/cancel/`, { method: 'PATCH' });
    if (data && !data.error) {
      showToast('Booking cancelled successfully.', 'success');
      await loadBookings();
    }
  }

  function setupTabs() {
    tabsEl.querySelectorAll('.tab-link').forEach((tab) => {
      tab.addEventListener('click', () => {
        tabsEl.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.dataset.filter;
        currentPage = 1;
        renderBookings();
      });
    });
  }

  function showLoading() {
    listEl.innerHTML = `
      <div class="skeleton skeleton-card" style="height:100px;margin-bottom:var(--sp-4)"></div>
      <div class="skeleton skeleton-card" style="height:100px;margin-bottom:var(--sp-4)"></div>
      <div class="skeleton skeleton-card" style="height:100px"></div>
    `;
    listEl.classList.remove('hidden');
    emptyEl.classList.add('hidden');
  }

  init();
})();
