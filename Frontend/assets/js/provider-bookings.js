/* ============================================================
   SewaConnect — Provider Bookings Page
   ============================================================ */

(function () {
  if (!requireAuth() || !requireRole('provider')) return;

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

    let url = '/bookings/provider/';
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
      const customer = b.customer_name || '';
      const service = b.service_name || b.service?.name || '';
      const date = b.scheduled_date || b.date || '';
      const time = b.scheduled_time || b.time || '';
      const address = b.address || '';
      const status = (b.status || 'pending').toLowerCase().replace(/\s+/g, '_');
      const statusLabel = status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
      const price = b.price || b.total_price || 0;

      let actions = '';
      if (status === 'pending') {
        actions += `<button class="btn btn-success btn-sm action-btn" data-id="${id}" data-action="accept">Accept</button>`;
        actions += `<button class="btn btn-danger btn-sm action-btn" data-id="${id}" data-action="reject">Reject</button>`;
      } else if (status === 'accepted') {
        actions += `<button class="btn btn-primary btn-sm action-btn" data-id="${id}" data-action="start">Start</button>`;
      } else if (status === 'in_progress') {
        actions += `<button class="btn btn-success btn-sm action-btn" data-id="${id}" data-action="complete">Complete</button>`;
      }

      return `
        <div class="booking-card mb-4">
          <div class="booking-details" style="flex:1;">
            <div class="flex justify-between items-center flex-wrap gap-2 mb-2">
              <span class="fw-600">${code}</span>
              <span class="status-badge ${status}">${statusLabel}</span>
            </div>
            <div class="booking-title">${service || 'Service'}</div>
            <div class="booking-meta">
              ${customer ? `Customer: ${customer}` : ''}
              ${date ? ` &middot; ${formatDate(date)}` : ''}
              ${time ? ` at ${formatTime(time)}` : ''}
            </div>
            ${address ? `<div class="booking-meta mt-1">&#128205; ${address}</div>` : ''}
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

    listEl.querySelectorAll('.action-btn').forEach((btn) => {
      btn.addEventListener('click', () => handleAction(btn.dataset.id, btn.dataset.action));
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

  async function handleAction(bookingId, action) {
    const actionLabels = {
      accept: 'accept this booking',
      reject: 'reject this booking',
      start: 'start this booking',
      complete: 'mark this booking as completed',
    };

    const confirmed = await showConfirm(`Are you sure you want to ${actionLabels[action] || action}?`);
    if (!confirmed) return;

    const endpointMap = {
      accept: `/bookings/${bookingId}/accept/`,
      reject: `/bookings/${bookingId}/reject/`,
      start: `/bookings/${bookingId}/start/`,
      complete: `/bookings/${bookingId}/complete/`,
    };

    const endpoint = endpointMap[action];
    if (!endpoint) return;

    const data = await apiFetch(endpoint, { method: 'PATCH' });
    if (data && !data.error) {
      showToast(`Booking ${action}ed successfully.`, 'success');
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
