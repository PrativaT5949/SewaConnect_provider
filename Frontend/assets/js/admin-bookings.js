/* ============================================================
   SewaConnect — Admin Bookings Page
   ============================================================ */

(function () {
  if (!requireAuth() || !requireRole('admin')) return;

  const tbodyEl = document.getElementById('bookings-tbody');
  const emptyEl = document.getElementById('empty-state');
  const tableWrapper = document.getElementById('bookings-table-wrapper');
  const tabsEl = document.getElementById('filter-tabs');
  const countEl = document.getElementById('bookings-count');

  let allBookings = [];
  let currentFilter = '';
  let currentPage = 1;
  const PAGE_SIZE = 15;

  async function init() {
    setupTabs();
    await loadBookings();
  }

  async function loadBookings() {
    showLoading();

    const params = new URLSearchParams();
    if (currentFilter) params.set('status', currentFilter);
    const url = `/auth/dashboard/admin/bookings/${params.toString() ? '?' + params.toString() : ''}`;

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

    const total = filtered.length;
    countEl.textContent = `${total} booking${total !== 1 ? 's' : ''} found`;

    if (!filtered.length) {
      tableWrapper.classList.add('hidden');
      emptyEl.classList.remove('hidden');
      document.getElementById('pagination').innerHTML = '';
      return;
    }

    emptyEl.classList.add('hidden');
    tableWrapper.classList.remove('hidden');

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);

    tbodyEl.innerHTML = pageItems.map((b) => {
      const code = b.booking_code || b.code || `SC-${b.id || ''}`;
      const customer = b.customer_name || '';
      const provider = b.provider_name || '';
      const category = b.category_name || '';
      const status = (b.status || 'pending').toLowerCase().replace(/\s+/g, '_');
      const statusLabel = status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
      const date = b.scheduled_date || b.date || b.created_at || '';
      const price = b.price || b.total_price || 0;

      return `
        <tr>
          <td class="fw-600">${code}</td>
          <td>${customer}</td>
          <td>${provider}</td>
          <td>${category}</td>
          <td><span class="status-badge ${status}">${statusLabel}</span></td>
          <td>${date ? formatDate(date) : '-'}</td>
          <td class="fw-600">${formatCurrency(price)}</td>
        </tr>
      `;
    }).join('');

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    const container = document.getElementById('pagination');
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

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
    tbodyEl.innerHTML = `
      <tr><td colspan="7" class="skeleton skeleton-card" style="height:50px"></td></tr>
      <tr><td colspan="7" class="skeleton skeleton-card" style="height:50px"></td></tr>
      <tr><td colspan="7" class="skeleton skeleton-card" style="height:50px"></td></tr>
    `;
    tableWrapper.classList.remove('hidden');
    emptyEl.classList.add('hidden');
  }

  init();
})();
