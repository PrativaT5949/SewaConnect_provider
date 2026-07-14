/* ============================================================
   SewaConnect — Favorites Page
   ============================================================ */

(function () {
  if (!requireAuth() || !requireRole('customer')) return;

  const listEl = document.getElementById('favorites-list');
  const emptyEl = document.getElementById('empty-state');

  async function init() {
    await loadFavorites();
  }

  async function loadFavorites() {
    showLoading();

    const data = await apiFetch('/favorites/');
    if (!data || data.error) {
      renderEmpty();
      return;
    }

    const favorites = data.results || data.data || data || [];
    if (!Array.isArray(favorites) || !favorites.length) {
      renderEmpty();
      return;
    }

    const providers = favorites.map((fav) => {
      const provider = fav.provider_detail || fav.provider || fav;
      return { ...provider, _favoriteId: fav.id };
    });

    renderGrid(providers);
  }

  function renderGrid(providers) {
    emptyEl.classList.add('hidden');
    listEl.classList.remove('hidden');

    listEl.innerHTML = `
      <div class="d-grid gap-6" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr));">
        ${providers.map((p) => {
          const name = p.user_full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Provider';
          const avatar = p.user_avatar || p.avatar || '';
          const rating = Number(p.average_rating) || 0;
          const reviews = p.total_reviews || 0;
          const price = p.hourly_rate || 0;
          const tagline = p.tagline || '';
          const skills = p.provider_skills || p.skills || [];
          const providerId = p.id || p.user_id || '';

          return `
            <div class="provider-card" data-provider-id="${providerId}">
              ${avatar
                ? `<img class="provider-avatar" src="${mediaUrl(avatar)}" alt="${name}" loading="lazy">`
                : `<div class="provider-avatar img-placeholder" style="font-size:2.5rem;display:flex;align-items:center;justify-content:center;height:200px;">&#128100;</div>`
              }
              <div class="provider-info">
                <div class="provider-name">${name}</div>
                ${tagline ? `<div class="provider-title">${tagline}</div>` : ''}
                <div class="provider-rating">
                  ${'&#9733;'.repeat(Math.round(rating))}${'&#9734;'.repeat(5 - Math.round(rating))}
                  <span style="color:var(--text-muted);margin-left:4px">${rating.toFixed(1)} (${reviews})</span>
                </div>
                ${skills.length ? `
                  <div class="skill-list" style="margin-bottom:var(--sp-3)">
                    ${skills.slice(0, 3).map(s => `<span class="skill-tag">${typeof s === 'string' ? s : s.skill_name || s.name || ''}</span>`).join('')}
                  </div>
                ` : ''}
                ${price ? `<div class="provider-price">${formatCurrency(price)} <span>/hr</span></div>` : ''}
                <div style="margin-top:var(--sp-3);display:flex;gap:var(--sp-2);">
                  <a href="provider-detail.html?id=${providerId}" class="btn btn-primary btn-sm" style="flex:1;">View Profile</a>
                  <button class="btn btn-danger btn-sm remove-fav-btn" data-id="${p._favoriteId || providerId}">&#9829;</button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    listEl.querySelectorAll('.remove-fav-btn').forEach((btn) => {
      btn.addEventListener('click', () => removeFavorite(btn.dataset.id));
    });

    initScrollAnimations();
  }

  async function removeFavorite(favoriteId) {
    const confirmed = await showConfirm('Remove this provider from your favorites?');
    if (!confirmed) return;

    const data = await apiFetch(`/favorites/${favoriteId}/`, {
      method: 'DELETE',
    });

    if (data && !data.error) {
      showToast('Removed from favorites.', 'success');
      await loadFavorites();
    }
  }

  function renderEmpty() {
    listEl.innerHTML = '';
    listEl.classList.add('hidden');
    emptyEl.classList.remove('hidden');
  }

  function showLoading() {
    listEl.innerHTML = `
      <div class="d-grid gap-6" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr));">
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton skeleton-card"></div>
      </div>
    `;
    listEl.classList.remove('hidden');
    emptyEl.classList.add('hidden');
  }

  init();
})();
