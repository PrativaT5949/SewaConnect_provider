/* ============================================================
   SewaConnect — Leave Review Page
   ============================================================ */

(function () {
  if (!requireAuth() || !requireRole('customer')) return;

  const loadingEl = document.getElementById('booking-info-loading');
  const contentEl = document.getElementById('review-content');
  const bookingInfoBody = document.getElementById('booking-info-body');
  const form = document.getElementById('review-form');
  const starSelector = document.getElementById('star-selector');
  const ratingInput = document.getElementById('review-rating');
  const commentInput = document.getElementById('review-comment');
  const submitBtn = document.getElementById('review-submit');
  const submitText = document.getElementById('review-submit-text');
  const submitSpinner = document.getElementById('review-submit-spinner');

  let bookingId = null;

  function getBookingId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('booking');
  }

  async function init() {
    bookingId = getBookingId();
    if (!bookingId) {
      showToast('No booking specified.', 'error');
      setTimeout(() => window.location.href = 'customer-bookings.html', 1000);
      return;
    }
    setupStars();
    await loadBooking();
    form.addEventListener('submit', handleSubmit);
  }

  function setupStars() {
    const stars = starSelector.querySelectorAll('.star-btn');
    stars.forEach((star) => {
      star.addEventListener('click', () => {
        const rating = parseInt(star.dataset.rating, 10);
        ratingInput.value = rating;
        stars.forEach((s) => {
          const r = parseInt(s.dataset.rating, 10);
          s.style.color = r <= rating ? 'var(--secondary)' : 'var(--border)';
        });
      });

      star.addEventListener('mouseenter', () => {
        const rating = parseInt(star.dataset.rating, 10);
        stars.forEach((s) => {
          const r = parseInt(s.dataset.rating, 10);
          s.style.color = r <= rating ? 'var(--secondary)' : 'var(--border)';
        });
      });
    });

    starSelector.addEventListener('mouseleave', () => {
      const rating = parseInt(ratingInput.value, 10) || 0;
      stars.forEach((s) => {
        const r = parseInt(s.dataset.rating, 10);
        s.style.color = r <= rating ? 'var(--secondary)' : 'var(--border)';
      });
    });
  }

  async function loadBooking() {
    const data = await apiFetch(`/bookings/${bookingId}/`);
    if (!data || data.error) {
      showToast('Could not load booking details.', 'error');
      loadingEl.classList.add('hidden');
      contentEl.classList.remove('hidden');
      bookingInfoBody.innerHTML = '<p class="text-muted">Booking not found.</p>';
      return;
    }

    const code = data.booking_code || data.code || `SC-${bookingId}`;
    const service = data.service_name || data.service?.name || 'Service';
    const provider = data.provider_name || '';
    const date = data.scheduled_date || data.date || '';
    const time = data.scheduled_time || data.time || '';
    const status = data.status || '';

    bookingInfoBody.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4);">
        <div>
          <div class="text-muted fs-sm mb-1">Booking Code</div>
          <div class="fw-600">${code}</div>
        </div>
        <div>
          <div class="text-muted fs-sm mb-1">Service</div>
          <div class="fw-600">${service}</div>
        </div>
        <div>
          <div class="text-muted fs-sm mb-1">Provider</div>
          <div class="fw-600">${provider || 'N/A'}</div>
        </div>
        <div>
          <div class="text-muted fs-sm mb-1">Date & Time</div>
          <div class="fw-600">${date ? formatDate(date) : ''} ${time ? 'at ' + formatTime(time) : ''}</div>
        </div>
      </div>
    `;

    loadingEl.classList.add('hidden');
    contentEl.classList.remove('hidden');
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const rating = parseInt(ratingInput.value, 10);
    const comment = commentInput.value.trim();

    if (!rating || rating < 1) {
      showToast('Please select a rating.', 'error');
      return;
    }

    if (!comment) {
      showToast('Please write a review comment.', 'error');
      commentInput.focus();
      return;
    }

    setLoading(true);

    const data = await apiFetch('/reviews/', {
      method: 'POST',
      body: JSON.stringify({ booking_id: Number(bookingId), rating, comment }),
    });

    setLoading(false);

    if (data && !data.error) {
      showToast('Review submitted successfully!', 'success');
      setTimeout(() => {
        window.location.href = 'customer-bookings.html';
      }, 1000);
    }
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitText.textContent = loading ? 'Submitting...' : 'Submit Review';
    submitSpinner.classList.toggle('hidden', !loading);
  }

  init();
})();
