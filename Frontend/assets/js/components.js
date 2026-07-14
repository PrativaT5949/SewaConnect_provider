/* ============================================================
   SewaConnect — UI Components & Navigation
   Vanilla JS (ES6) · No Frameworks
   ============================================================ */

/* ============================================================
   1. TOPBAR NAVIGATION
   ============================================================ */

function renderTopbar() {
  const topbar = document.getElementById('app-topbar');
  if (!topbar) return;

  const user = getCurrentUser();
  const role = user ? user.role : null;
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  const isActive = (page) => currentPage === page ? 'active' : '';

  let navLinks = '';
  let authActions = '';

  if (!role) {
    navLinks = `
      <a href="/index.html" class="nav-link ${isActive('index.html')}">Home</a>
      <a href="/pages/categories.html" class="nav-link ${isActive('categories.html')}">Categories</a>
      <a href="/pages/find-providers.html" class="nav-link ${isActive('find-providers.html')}">Find Providers</a>
    `;
    authActions = `
      <a href="/pages/login.html" class="btn-login">Login</a>
      <a href="/pages/register.html" class="btn-register">Register</a>
    `;
  } else if (role === 'customer') {
    navLinks = `
      <a href="/index.html" class="nav-link ${isActive('index.html')}">Home</a>
      <a href="/pages/find-providers.html" class="nav-link ${isActive('find-providers.html')}">Find Providers</a>
      <a href="/pages/customer-dashboard.html" class="nav-link ${isActive('customer-dashboard.html')}">Dashboard</a>
      <a href="/pages/customer-bookings.html" class="nav-link ${isActive('customer-bookings.html')}">Bookings</a>
      <a href="/pages/favorites.html" class="nav-link ${isActive('favorites.html')}">Favorites</a>
      <a href="/pages/notifications.html" class="nav-link notification-dot ${isActive('notifications.html')}">Notifications</a>
    `;
    authActions = `
      <div class="dropdown">
        <button class="btn-login" id="user-menu-toggle">
          ${user.first_name}
          <span style="margin-left:4px;font-size:0.7em">&#9662;</span>
        </button>
        <div class="dropdown-menu" id="user-dropdown">
          <a href="/pages/profile.html" class="dropdown-item">&#128100; Profile</a>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item" id="logout-btn" style="color:var(--danger)">&#10140; Logout</button>
        </div>
      </div>
    `;
  } else if (role === 'provider') {
    navLinks = `
      <a href="/index.html" class="nav-link ${isActive('index.html')}">Home</a>
      <a href="/pages/provider-dashboard.html" class="nav-link ${isActive('provider-dashboard.html')}">Dashboard</a>
      <a href="/pages/provider-bookings.html" class="nav-link ${isActive('provider-bookings.html')}">Bookings</a>
      <a href="/pages/add-service.html" class="nav-link ${isActive('add-service.html')}">Services</a>
      <a href="/pages/notifications.html" class="nav-link notification-dot ${isActive('notifications.html')}">Notifications</a>
    `;
    authActions = `
      <div class="dropdown">
        <button class="btn-login" id="user-menu-toggle">
          ${user.first_name}
          <span style="margin-left:4px;font-size:0.7em">&#9662;</span>
        </button>
        <div class="dropdown-menu" id="user-dropdown">
          <a href="/pages/profile.html" class="dropdown-item">&#128100; Profile</a>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item" id="logout-btn" style="color:var(--danger)">&#10140; Logout</button>
        </div>
      </div>
    `;
  } else if (role === 'admin') {
    navLinks = `
      <a href="/index.html" class="nav-link ${isActive('index.html')}">Home</a>
      <a href="/pages/admin-dashboard.html" class="nav-link ${isActive('admin-dashboard.html')}">Dashboard</a>
      <a href="/pages/admin-providers.html" class="nav-link ${isActive('admin-providers.html')}">Providers</a>
      <a href="/pages/admin-users.html" class="nav-link ${isActive('admin-users.html')}">Users</a>
      <a href="/pages/admin-bookings.html" class="nav-link ${isActive('admin-bookings.html')}">Bookings</a>
      <a href="/pages/admin-categories.html" class="nav-link ${isActive('admin-categories.html')}">Categories</a>
      <a href="/pages/admin-reports.html" class="nav-link ${isActive('admin-reports.html')}">Reports</a>
    `;
    authActions = `
      <div class="dropdown">
        <button class="btn-login" id="user-menu-toggle">
          ${user.first_name}
          <span style="margin-left:4px;font-size:0.7em">&#9662;</span>
        </button>
        <div class="dropdown-menu" id="user-dropdown">
          <a href="/pages/profile.html" class="dropdown-item">&#128100; Profile</a>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item" id="logout-btn" style="color:var(--danger)">&#10140; Logout</button>
        </div>
      </div>
    `;
  }

  topbar.innerHTML = `
    <div class="topbar">
      <div class="container">
        <a href="/index.html" class="topbar-brand">
          Sewa<span class="brand-highlight">Connect</span>
        </a>
        <nav class="topbar-nav">
          ${navLinks}
        </nav>
        <div class="topbar-actions">
          ${authActions}
        </div>
        <div class="hamburger" id="hamburger-toggle" aria-label="Toggle navigation">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
    <div class="mobile-nav" id="mobile-nav">
      ${navLinks.split('\n').filter(l => l.trim()).map(l =>
        l.replace(/class="nav-link/g, 'class="nav-link')
      ).join('\n')}
      <div class="mobile-auth">
        ${authActions}
      </div>
    </div>
  `;

  const spacer = document.createElement('div');
  spacer.className = 'nav-spacer';
  topbar.parentNode.insertBefore(spacer, topbar.nextSibling);

  setupTopbarEvents();
}

function setupTopbarEvents() {
  const hamburger = document.getElementById('hamburger-toggle');
  const mobileNav = document.getElementById('mobile-nav');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileNav.classList.toggle('open');
    });

    mobileNav.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileNav.classList.remove('open');
      });
    });
  }

  const menuToggle = document.getElementById('user-menu-toggle');
  const dropdown = document.getElementById('user-dropdown');
  if (menuToggle && dropdown) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });
    document.addEventListener('click', () => dropdown.classList.remove('open'));
  }

  const logoutBtns = document.querySelectorAll('#logout-btn');
  logoutBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      clearTokens();
      showToast('Logged out successfully.', 'success');
      setTimeout(() => { window.location.href = '/index.html'; }, 800);
    });
  });
}

/* ============================================================
   2. FOOTER
   ============================================================ */

function renderFooter() {
  const footer = document.getElementById('app-footer');
  if (!footer) return;

  const year = new Date().getFullYear();

  footer.innerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <div class="footer-brand">
              Sewa<span class="brand-highlight">Connect</span>
            </div>
            <p class="footer-desc">
              Your Neighborhood Service Hub. Find trusted local service providers for all your everyday needs &mdash; from home repairs to personal care.
            </p>
            <div class="footer-social">
              <a href="#" aria-label="Facebook">&#102;</a>
              <a href="#" aria-label="Twitter">&#120143;</a>
              <a href="#" aria-label="Instagram">&#9737;</a>
              <a href="#" aria-label="LinkedIn">&#105;</a>
            </div>
          </div>
          <div>
            <h4 class="footer-heading">Quick Links</h4>
            <div class="footer-links">
              <a href="/index.html">Home</a>
              <a href="/pages/categories.html">Categories</a>
              <a href="/pages/find-providers.html">Find Providers</a>
              <a href="/pages/register.html">Become a Provider</a>
              <a href="/pages/login.html">Login</a>
            </div>
          </div>
          <div>
            <h4 class="footer-heading">Categories</h4>
            <div class="footer-links">
              <a href="/pages/categories.html">Home Repair</a>
              <a href="/pages/categories.html">Cleaning</a>
              <a href="/pages/categories.html">Plumbing</a>
              <a href="/pages/categories.html">Electrical</a>
              <a href="/pages/categories.html">Painting</a>
            </div>
          </div>
          <div>
            <h4 class="footer-heading">Contact</h4>
            <div class="footer-links">
              <span>Kathmandu, Nepal</span>
              <span>+977-1-456789</span>
              <span>info@sewaconnect.com</span>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; ${year} SewaConnect. All rights reserved.</p>
          <div class="footer-bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Support</a>
          </div>
        </div>
      </div>
    </footer>
  `;
}

/* ============================================================
   3. PAGE INITIALIZATION
   ============================================================ */

function initPage() {
  renderTopbar();
  renderFooter();
  initScrollAnimations();
}

function initScrollAnimations() {
  const targets = document.querySelectorAll(
    '.card, .provider-card, .category-card, .stat-card, .service-card, .booking-card, .testimonial-card, .step-card'
  );

  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-slideUp');
          entry.target.style.opacity = '1';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  targets.forEach((el) => {
    el.style.opacity = '0';
    observer.observe(el);
  });
}

/* ============================================================
   4. COMPONENT BUILDERS
   ============================================================ */

function buildProviderCard(provider) {
  const name = provider.user_full_name || `${provider.first_name || ''} ${provider.last_name || ''}`.trim() || 'Provider';
  const avatar = provider.user_avatar || provider.avatar || provider.profile_image || '';
  const rating = provider.average_rating || provider.rating || 0;
  const reviews = provider.total_reviews || provider.review_count || 0;
  const price = provider.hourly_rate || provider.price || 0;
  const title = provider.tagline || provider.business_name || provider.service_title || '';
  const skills = provider.provider_skills || provider.skills || [];

  return `
    <div class="provider-card" data-provider-id="${provider.id || provider.user_id || ''}">
      ${avatar
        ? `<img class="provider-avatar" src="${avatar}" alt="${name}" loading="lazy">`
        : `<div class="provider-avatar img-placeholder" style="font-size:2.5rem;display:flex;align-items:center;justify-content:center;height:200px;">&#128100;</div>`
      }
      <div class="provider-info">
        <div class="provider-name">${name}</div>
        ${title ? `<div class="provider-title">${title}</div>` : ''}
        <div class="provider-rating">
          ${'&#9733;'.repeat(Math.round(rating))}${'&#9734;'.repeat(5 - Math.round(rating))}
          <span style="color:var(--text-muted);margin-left:4px">${Number(rating).toFixed(1)} (${reviews})</span>
        </div>
        ${skills.length ? `
          <div class="skill-list" style="margin-bottom:var(--sp-3)">
            ${skills.slice(0, 3).map(s => `<span class="skill-tag">${typeof s === 'string' ? s : s.skill_name || s.name || ''}</span>`).join('')}
          </div>
        ` : ''}
        ${price ? `
          <div class="provider-price">
            ${formatCurrency(price)} <span>/hr</span>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function buildBookingCard(booking, role) {
  const service = booking.service_name || booking.service?.name || booking.title || 'Service';
  const provider = booking.provider_name || booking.customer_name || '';
  const date = booking.date || booking.scheduled_date || '';
  const time = booking.time || booking.scheduled_time || '';
  const status = (booking.status || 'pending').toLowerCase().replace(/\s+/g, '_');
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  const id = booking.id || booking.booking_id || '';

  return `
    <div class="booking-card" data-booking-id="${id}">
      <div class="booking-details">
        <div class="booking-title">${service}</div>
        <div class="booking-meta">
          ${provider ? `${provider}` : ''}
          ${date ? ` &middot; ${formatDate(date)}` : ''}
          ${time ? ` at ${formatTime(time)}` : ''}
        </div>
      </div>
      <div class="booking-actions" style="display:flex;align-items:center;gap:var(--sp-3)">
        <span class="status-badge ${status}">${statusLabel}</span>
      </div>
    </div>
  `;
}

function buildCategoryCard(category) {
  const name = category.name || 'Category';
  const icon = category.icon || '&#128295;';
  const count = category.service_count || category.provider_count || 0;

  return `
    <div class="category-card" data-category-id="${category.id || ''}">
      <div class="category-icon" style="background:linear-gradient(135deg, rgba(232,80,91,0.1), rgba(249,168,38,0.1));color:var(--accent);">
        ${icon}
      </div>
      <div class="category-name">${name}</div>
      <div class="category-count">${count} ${count === 1 ? 'provider' : 'providers'}</div>
    </div>
  `;
}

function buildStatCard(label, value, icon, color) {
  const colorClass = color || 'accent';
  return `
    <div class="stat-card">
      <div class="stat-icon ${colorClass}">${icon || '&#9889;'}</div>
      <div>
        <div class="stat-value">${value}</div>
        <div class="stat-label">${label}</div>
      </div>
    </div>
  `;
}

function buildReviewCard(review) {
  const name = review.reviewer_name || review.author_name || 'User';
  const avatar = review.reviewer_avatar || review.author_avatar || '';
  const rating = review.rating || 0;
  const text = review.comment || review.text || review.review_text || '';
  const date = review.created_at || review.date || '';

  return `
    <div class="review-item">
      <div class="review-header">
        <div class="review-author">
          ${avatar
            ? `<img class="review-avatar" src="${avatar}" alt="${name}" loading="lazy">`
            : `<div class="review-avatar img-placeholder" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:1rem;">&#128100;</div>`
          }
          <div>
            <div class="review-name">${name}</div>
            <div class="review-date">${formatDate(date)}</div>
          </div>
        </div>
        <div class="review-stars">
          ${'&#9733;'.repeat(Math.round(rating))}${'&#9734;'.repeat(5 - Math.round(rating))}
        </div>
      </div>
      <p class="review-text">${text}</p>
    </div>
  `;
}

function buildEmptyState(icon, message, actionText, actionUrl) {
  return `
    <div class="empty-state">
      <div class="empty-icon">${icon || '&#128269;'}</div>
      <h3 class="empty-title">${message || 'Nothing here yet'}</h3>
      ${actionText && actionUrl
        ? `<a href="${actionUrl}" class="btn btn-primary" style="margin-top:var(--sp-4)">${actionText}</a>`
        : actionText
          ? `<button class="btn btn-primary" style="margin-top:var(--sp-4)">${actionText}</button>`
          : ''
      }
    </div>
  `;
}

/* ============================================================
   5. DOMContentLoaded INIT
   ============================================================ */

document.addEventListener('DOMContentLoaded', initPage);
