import logging
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def check_expired_assignments(self):
    """Check for bookings with expired provider assignments and auto-reassign."""
    from bookings.models import Booking
    from bookings.services import reassign_expired_provider

    now = timezone.now()
    expired_bookings = Booking.objects.filter(
        status='pending',
        provider__isnull=False,
        assignment_expiry__isnull=False,
        assignment_expiry__lte=now,
    ).select_related('provider', 'customer', 'category', 'service')

    count = 0
    for booking in expired_bookings:
        try:
            reassign_expired_provider(booking)
            count += 1
        except Exception as exc:
            logger.exception(
                'Failed to reassign expired booking %s: %s', booking.booking_code, exc
            )
            raise self.retry(exc=exc, countdown=60)

    logger.info('Reassigned %d expired bookings.', count)
    return count
