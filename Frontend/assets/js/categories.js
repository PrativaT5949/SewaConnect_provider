/* ============================================================
   SewaConnect — Categories Page
   ============================================================ */

(function () {
  const grid = document.getElementById('categories-grid');
  const emptyState = document.getElementById('categories-empty');

  const bgColors = [
    'linear-gradient(135deg, rgba(232,80,91,0.12), rgba(249,168,38,0.08))',
    'linear-gradient(135deg, rgba(52,152,219,0.12), rgba(39,174,96,0.08))',
    'linear-gradient(135deg, rgba(243,156,18,0.12), rgba(232,80,91,0.08))',
    'linear-gradient(135deg, rgba(39,174,96,0.12), rgba(52,152,219,0.08))',
    'linear-gradient(135deg, rgba(155,89,182,0.12), rgba(232,80,91,0.08))',
    'linear-gradient(135deg, rgba(249,168,38,0.12), rgba(52,152,219,0.08))',
    'linear-gradient(135deg, rgba(231,76,60,0.12), rgba(243,156,18,0.08))',
    'linear-gradient(135deg, rgba(52,152,219,0.12), rgba(155,89,182,0.08))',
  ];

  async function loadCategories() {
    const data = await apiFetch('/categories/');

    if (!data || data.error) {
      grid.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    const categories = data.results || data.data || data;
    if (!Array.isArray(categories) || categories.length === 0) {
      grid.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    grid.innerHTML = categories.map((cat) => {
      const icon = cat.icon || '&#128295;';
      const name = cat.name || 'Category';
      const slug = cat.slug || '';
      const description = cat.description || '';
      const skillsCount = cat.skills_count || 0;

      return `
        <div class="category-card" onclick="window.location.href='find-providers.html?category=${cat.id}'">
          <div class="category-icon" style="background:${bgColors[cat.id % bgColors.length]};color:var(--accent);">
            ${icon}
          </div>
          <div class="category-name">${name}</div>
          ${description ? `<p class="fs-sm text-muted mt-1 mb-2 line-clamp-2">${description}</p>` : ''}
          <div class="category-count">${skillsCount} service${skillsCount !== 1 ? 's' : ''}</div>
        </div>
      `;
    }).join('');

    initScrollAnimations();
  }

  loadCategories();
})();
