/* ============================================================
   SewaConnect — Notifications Page
   ============================================================ */

(function () {
  if (!requireAuth()) return;

  const listEl = document.getElementById('notifications-list');
  const emptyEl = document.getElementById('empty-state');
  const markAllBtn = document.getElementById('mark-all-read-btn');

  async function init() {
    await loadNotifications();
    markAllBtn.addEventListener('click', handleMarkAllRead);
  }

  async function loadNotifications() {
    showLoading();

    const data = await apiFetch('/notifications/');
    if (!data || data.error) {
      renderEmpty();
      return;
    }

    const notifications = data.results || data.data || data || [];
    if (!Array.isArray(notifications) || !notifications.length) {
      renderEmpty();
      return;
    }

    renderNotifications(notifications);
  }

  function renderNotifications(notifications) {
    emptyEl.classList.add('hidden');
    listEl.classList.remove('hidden');

    listEl.innerHTML = notifications.map((n) => {
      const id = n.id || '';
      const type = (n.type || n.notification_type || 'info').toLowerCase();
      const title = n.title || n.subject || 'Notification';
      const message = n.message || n.body || n.text || '';
      const isRead = n.is_read || n.read || false;
      const date = n.created_at || n.date || '';

      const typeIcons = {
        booking: '&#128197;',
        payment: '&#128176;',
        review: '&#9733;',
        system: '&#9881;',
        info: '&#8505;',
        warning: '&#9888;',
        success: '&#10003;',
      };
      const icon = typeIcons[type] || typeIcons.info;

      return `
        <div class="card mb-3 notification-item ${isRead ? '' : 'unread'}" data-id="${id}" style="cursor:pointer;border-left:3px solid ${isRead ? 'var(--border)' : 'var(--accent)'};">
          <div class="card-body" style="padding:var(--sp-4) var(--sp-5);">
            <div class="flex items-center gap-4">
              <div style="font-size:1.5rem;flex-shrink:0;">${icon}</div>
              <div style="flex:1;min-width:0;">
                <div class="flex justify-between items-center gap-2 mb-1">
                  <span class="fw-600 ${isRead ? 'text-muted' : ''}">${title}</span>
                  <span class="fs-sm text-muted" style="flex-shrink:0;">${date ? timeAgo(date) : ''}</span>
                </div>
                <p class="text-secondary fs-sm" style="margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${message}</p>
              </div>
              ${!isRead ? '<div style="width:8px;height:8px;border-radius:50%;background:var(--accent);flex-shrink:0;"></div>' : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.notification-item').forEach((item) => {
      item.addEventListener('click', () => markAsRead(item.dataset.id, item));
    });
  }

  function timeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return formatDate(dateStr);
  }

  async function markAsRead(id, element) {
    if (!id) return;
    const data = await apiFetch(`/notifications/${id}/read/`, { method: 'PATCH' });
    if (data && !data.error) {
      element.classList.remove('unread');
      element.style.borderLeftColor = 'var(--border)';
    }
  }

  async function handleMarkAllRead() {
    const data = await apiFetch('/notifications/read-all/', { method: 'PATCH' });
    if (data && !data.error) {
      showToast('All notifications marked as read.', 'success');
      await loadNotifications();
    }
  }

  function renderEmpty() {
    listEl.innerHTML = '';
    listEl.classList.add('hidden');
    emptyEl.classList.remove('hidden');
  }

  function showLoading() {
    listEl.innerHTML = `
      <div class="skeleton skeleton-card" style="height:80px;margin-bottom:var(--sp-3)"></div>
      <div class="skeleton skeleton-card" style="height:80px;margin-bottom:var(--sp-3)"></div>
      <div class="skeleton skeleton-card" style="height:80px;margin-bottom:var(--sp-3)"></div>
      <div class="skeleton skeleton-card" style="height:80px"></div>
    `;
    listEl.classList.remove('hidden');
    emptyEl.classList.add('hidden');
  }

  init();
})();
