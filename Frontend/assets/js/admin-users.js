/* ============================================================
   SewaConnect — Admin Users Page
   ============================================================ */

(function () {
  if (!requireAuth() || !requireRole('admin')) return;

  const tbodyEl = document.getElementById('users-tbody');
  const emptyEl = document.getElementById('empty-state');
  const tableWrapper = document.getElementById('users-table-wrapper');
  const tabsEl = document.getElementById('filter-tabs');
  const countEl = document.getElementById('users-count');

  let allUsers = [];
  let currentFilter = '';
  let currentPage = 1;
  const PAGE_SIZE = 15;

  async function init() {
    setupTabs();
    await loadUsers();
  }

  async function loadUsers() {
    showLoading();

    const params = new URLSearchParams();
    if (currentFilter) params.set('role', currentFilter);
    const url = `/auth/dashboard/admin/users/${params.toString() ? '?' + params.toString() : ''}`;

    const data = await apiFetch(url);

    if (!data || data.error) {
      allUsers = [];
      renderUsers();
      return;
    }

    allUsers = data.results || data.data || data || [];
    if (!Array.isArray(allUsers)) allUsers = [];
    currentPage = 1;
    renderUsers();
  }

  function renderUsers() {
    const filtered = currentFilter
      ? allUsers.filter(u => (u.role || '').toLowerCase() === currentFilter)
      : allUsers;

    const total = filtered.length;
    countEl.textContent = `${total} user${total !== 1 ? 's' : ''} found`;

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

    const roleBadgeClass = (role) => {
      switch (role) {
        case 'admin': return 'badge-danger';
        case 'provider': return 'badge-accent';
        case 'customer': return 'badge-info';
        default: return 'badge-primary';
      }
    };

    tbodyEl.innerHTML = pageItems.map((u) => {
      const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'User';
      const email = u.email || '';
      const phone = u.phone || u.phone_number || '-';
      const role = u.role || '';
      const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
      const joined = u.date_joined || u.created_at || '';
      const isActive = u.is_active !== false;

      return `
        <tr>
          <td class="fw-600">${name}</td>
          <td>${email}</td>
          <td>${phone}</td>
          <td><span class="badge ${roleBadgeClass(role)}">${roleLabel}</span></td>
          <td>${joined ? formatDate(joined) : '-'}</td>
          <td>
            <span class="badge ${isActive ? 'badge-success' : 'badge-danger'}">
              ${isActive ? 'Active' : 'Inactive'}
            </span>
          </td>
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
          renderUsers();
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
        renderUsers();
      });
    });
  }

  function showLoading() {
    tbodyEl.innerHTML = `
      <tr><td colspan="6" class="skeleton skeleton-card" style="height:50px"></td></tr>
      <tr><td colspan="6" class="skeleton skeleton-card" style="height:50px"></td></tr>
      <tr><td colspan="6" class="skeleton skeleton-card" style="height:50px"></td></tr>
    `;
    tableWrapper.classList.remove('hidden');
    emptyEl.classList.add('hidden');
  }

  init();
})();
