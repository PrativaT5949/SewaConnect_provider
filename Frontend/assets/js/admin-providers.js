/* ============================================================
   SewaConnect — Admin Providers Page
   ============================================================ */

(function () {
  if (!requireAuth() || !requireRole('admin')) return;

  const listEl = document.getElementById('providers-list');
  const emptyEl = document.getElementById('empty-state');
  const tabsEl = document.getElementById('filter-tabs');

  let allProviders = [];
  let currentFilter = '';
  let currentPage = 1;
  const PAGE_SIZE = 10;

  async function init() {
    setupTabs();
    loadFilterFromUrl();
    await loadProviders();
  }

  function loadFilterFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const filterParam = params.get('filter');
    if (filterParam) {
      currentFilter = filterParam;
      tabsEl.querySelectorAll('.tab-link').forEach((tab) => {
        tab.classList.toggle('active', tab.dataset.filter === currentFilter);
      });
    }
  }

  async function loadProviders() {
    showLoading();

    const params = new URLSearchParams();
    if (currentFilter) params.set('status', currentFilter);
    const url = `/providers/admin/${params.toString() ? '?' + params.toString() : ''}`;

    const data = await apiFetch(url);

    if (!data || data.error) {
      allProviders = [];
      renderProviders();
      return;
    }

    allProviders = data.results || data.data || data || [];
    if (!Array.isArray(allProviders)) allProviders = [];
    currentPage = 1;
    renderProviders();
  }

  function renderProviders() {
    const filtered = currentFilter
      ? allProviders.filter(p => (p.verification_status || p.status || '').toLowerCase() === currentFilter)
      : allProviders;

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

    listEl.innerHTML = pageItems.map((p) => {
      const id = p.id || p.user_id || '';
      const name = p.user_full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Provider';
      const email = p.email || '';
      const status = (p.verification_status || p.status || 'pending').toLowerCase();
      const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
      const citizenship = p.citizenship_image || '';
      const certificate = p.certificate_image || '';
      const notes = p.admin_notes || p.notes || '';

      return `
        <div class="card mb-4">
          <div class="card-body">
            <div class="flex justify-between items-start flex-wrap gap-4">
              <div style="flex:1;min-width:200px;">
                <div class="flex items-center gap-3 mb-2">
                  <h4 style="margin:0;">${name}</h4>
                  <span class="badge ${status === 'approved' ? 'badge-success' : status === 'rejected' ? 'badge-danger' : 'badge-warning'}">${statusLabel}</span>
                </div>
                <p class="text-muted fs-sm mb-2">${email}</p>
                <div class="flex gap-3 flex-wrap mt-2">
                  ${citizenship ? `<a href="${citizenship}" target="_blank" class="btn btn-ghost btn-sm">&#128196; Citizenship</a>` : ''}
                  ${certificate ? `<a href="${certificate}" target="_blank" class="btn btn-ghost btn-sm">&#127891; Certificate</a>` : ''}
                </div>
              </div>
              <div class="flex gap-2 flex-wrap" style="flex-shrink:0;">
                ${status === 'pending' ? `
                  <button class="btn btn-success btn-sm approve-btn" data-id="${id}">Approve</button>
                  <button class="btn btn-danger btn-sm reject-btn" data-id="${id}">Reject</button>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    renderPagination(totalPages);

    listEl.querySelectorAll('.approve-btn').forEach((btn) => {
      btn.addEventListener('click', () => handleApprove(btn.dataset.id));
    });

    listEl.querySelectorAll('.reject-btn').forEach((btn) => {
      btn.addEventListener('click', () => handleReject(btn.dataset.id));
    });
  }

  async function handleApprove(id) {
    const confirmed = await showConfirm('Approve this provider?');
    if (!confirmed) return;

    const data = await apiFetch(`/providers/admin/${id}/approve/`, { method: 'PATCH' });
    if (data && !data.error) {
      showToast('Provider approved successfully.', 'success');
      await loadProviders();
    }
  }

  function handleReject(id) {
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="form-group">
        <label for="reject-reason">Reason for rejection</label>
        <textarea id="reject-reason" class="form-textarea" rows="3" placeholder="Provide a reason..."></textarea>
      </div>
    `;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>Reject Provider</h3>
          <button class="modal-close" aria-label="Close">&times;</button>
        </div>
        <div class="modal-body"></div>
        <div class="modal-footer">
          <button class="btn btn-ghost reject-cancel">Cancel</button>
          <button class="btn btn-danger reject-confirm">Reject</button>
        </div>
      </div>
    `;

    overlay.querySelector('.modal-body').appendChild(body);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));

    const cleanup = () => overlay.remove();
    overlay.querySelector('.modal-close').addEventListener('click', cleanup);
    overlay.querySelector('.reject-cancel').addEventListener('click', cleanup);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) cleanup(); });

    overlay.querySelector('.reject-confirm').addEventListener('click', async () => {
      const reason = document.getElementById('reject-reason').value.trim();
      cleanup();

      const data = await apiFetch(`/providers/admin/${id}/reject/`, {
        method: 'PATCH',
        body: JSON.stringify({ notes: reason }),
      });

      if (data && !data.error) {
        showToast('Provider rejected.', 'success');
        await loadProviders();
      }
    });
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
          renderProviders();
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
        renderProviders();
      });
    });
  }

  function showLoading() {
    listEl.innerHTML = `
      <div class="skeleton skeleton-card" style="height:120px;margin-bottom:var(--sp-4)"></div>
      <div class="skeleton skeleton-card" style="height:120px;margin-bottom:var(--sp-4)"></div>
      <div class="skeleton skeleton-card" style="height:120px"></div>
    `;
    listEl.classList.remove('hidden');
    emptyEl.classList.add('hidden');
  }

  init();
})();
