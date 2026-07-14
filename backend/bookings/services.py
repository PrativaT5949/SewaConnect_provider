from datetime import datetime, timedelta
from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from providers.models import ProviderProfile
from recommendations.services import get_recommended_providers
from notifications.utils import create_notification


ASSIGNMENT_TIMEOUT_MINUTES = getattr(settings, 'BOOKING_ASSIGNMENT_TIMEOUT_MINUTES', 30)


def check_booking_conflict(provider, booking_date, booking_time, exclude_booking_id=None):
    """Check if a provider has overlapping bookings for the given date and time."""
    active_statuses = ['accepted', 'in_progress', 'pending']
    conflicts = Q(provider=provider, status__in=active_statuses, booking_date=booking_date)

    if exclude_booking_id:
        conflicts &= ~Q(id=exclude_booking_id)

    existing_bookings = provider.provider_bookings.filter(conflicts)

    for booking in existing_bookings:
        existing_start = datetime.combine(booking.booking_date, booking.booking_time)
        existing_end = booking.estimated_end_time
        if existing_end:
            existing_end_dt = datetime.combine(booking.booking_date, existing_end)
        else:
            existing_end_dt = existing_start + timedelta(hours=2)

        new_start = datetime.combine(booking_date, booking_time)
        new_end = new_start + timedelta(hours=2)

        if new_start < existing_end_dt and new_end > existing_start:
            return True, booking

    return False, None


def has_active_booking_with_provider(customer, provider):
    """Check if customer already has an active booking with this provider."""
    active_statuses = ['pending', 'accepted', 'in_progress']
    return customer.customer_bookings.filter(
        provider=provider,
        status__in=active_statuses,
    ).exists()


@transaction.atomic
def assign_best_provider(booking, customer_lat=None, customer_lon=None):
    """Find and assign the best available provider for a booking."""
    category_id = booking.category_id if booking.category_id else None
    tried_ids = booking.tried_provider_ids or []

    recommended = get_recommended_providers(
        category_id=category_id,
        user_lat=customer_lat,
        user_lon=customer_lon,
        limit=50,
    )

    for rec in recommended:
        provider = rec['provider']

        if provider.id in tried_ids:
            continue

        if provider.id == getattr(booking, '_excluded_provider_id', None):
            continue

        has_active = has_active_booking_with_provider(booking.customer, provider)
        if has_active:
            continue

        has_conflict, _ = check_booking_conflict(
            provider, booking.booking_date, booking.booking_time
        )
        if has_conflict:
            continue

        booking.provider = provider
        if provider.hourly_rate:
            booking.total_price = provider.hourly_rate
        booking.assignment_attempt += 1
        booking.assigned_at = timezone.now()
        booking.assignment_expiry = timezone.now() + timedelta(minutes=ASSIGNMENT_TIMEOUT_MINUTES)
        booking.status = 'pending'
        booking.save()

        create_notification(
            recipient=provider.user,
            sender=booking.customer,
            title='New Booking Request',
            message=f'You have a new booking request for {booking.booking_date}.',
            type='booking',
            reference_id=booking.id,
        )
        return True

    return False


@transaction.atomic
def reassign_expired_provider(booking):
    """Handle a booking whose provider assignment has expired. Find next provider."""
    if booking.provider_id:
        tried = list(booking.tried_provider_ids or [])
        if booking.provider_id not in tried:
            tried.append(booking.provider_id)
        booking.tried_provider_ids = tried

    BookingStatusLog.objects.create(
        booking=booking,
        status='expired',
        note=f'Provider assignment expired (attempt #{booking.assignment_attempt}).',
    )

    old_provider = booking.provider
    booking.provider = None
    booking.save()

    create_notification(
        recipient=booking.customer,
        title='Provider Assignment Expired',
        message=(
            f'Provider {old_provider.user.full_name} did not respond to booking '
            f'{booking.booking_code}. Finding a new provider...'
        ),
        type='booking',
        reference_id=booking.id,
    )

    assigned = assign_best_provider(booking)

    if not assigned:
        booking.status = 'waiting'
        booking.assignment_expiry = None
        booking.save()

        BookingStatusLog.objects.create(
            booking=booking,
            status='waiting',
            note='No more providers available after timeout.',
        )

        create_notification(
            recipient=booking.customer,
            title='No Provider Available',
            message=(
                f'No more providers could be assigned for booking '
                f'{booking.booking_code}. Your booking is now waiting.'
            ),
            type='system',
            reference_id=booking.id,
        )


@transaction.atomic
def accept_booking(booking, provider_user):
    """Provider accepts a booking."""
    if booking.status != 'pending':
        return False, 'Booking is not in pending status.'

    if booking.provider.user != provider_user:
        return False, 'You are not assigned to this booking.'

    has_conflict, conflict_booking = check_booking_conflict(
        booking.provider, booking.booking_date, booking.booking_time, exclude_booking_id=booking.id
    )
    if has_conflict:
        return False, f'Conflicting booking exists (Booking #{conflict_booking.booking_code}).'

    booking.status = 'accepted'
    booking.assignment_expiry = None
    booking.save()

    BookingStatusLog.objects.create(
        booking=booking,
        status='accepted',
        changed_by=provider_user,
    )

    create_notification(
        recipient=booking.customer,
        sender=provider_user,
        title='Booking Accepted',
        message=f'Your booking {booking.booking_code} has been accepted.',
        type='booking',
        reference_id=booking.id,
    )
    return True, 'Booking accepted successfully.'


@transaction.atomic
def reject_booking(booking, provider_user, reason=''):
    """Provider rejects a booking. Auto-assigns next best provider."""
    if booking.status != 'pending':
        return False, 'Booking is not in pending status.'

    if booking.provider.user != provider_user:
        return False, 'You are not assigned to this booking.'

    booking.status = 'rejected'
    booking.save()

    BookingStatusLog.objects.create(
        booking=booking,
        status='rejected',
        changed_by=provider_user,
        note=reason,
    )

    create_notification(
        recipient=booking.customer,
        sender=provider_user,
        title='Booking Rejected',
        message=f'Your booking {booking.booking_code} was rejected. Finding new provider...',
        type='booking',
        reference_id=booking.id,
    )

    excluded_id = booking.provider_id
    tried = list(booking.tried_provider_ids or [])
    if excluded_id and excluded_id not in tried:
        tried.append(excluded_id)
    booking.tried_provider_ids = tried
    booking._excluded_provider_id = excluded_id
    booking.status = 'pending'
    booking.provider = None
    booking.save()

    assigned = assign_best_provider(booking)

    if not assigned:
        booking.status = 'waiting'
        booking.assignment_expiry = None
        booking.save()

        BookingStatusLog.objects.create(
            booking=booking,
            status='waiting',
            note='No more providers available.',
        )

        create_notification(
            recipient=booking.customer,
            title='No Provider Available',
            message=f'No provider could be assigned for booking {booking.booking_code}.',
            type='system',
            reference_id=booking.id,
        )

    return True, 'Booking rejected and reassignment attempted.'


@transaction.atomic
def start_booking(booking, provider_user):
    """Provider starts the service."""
    if booking.status != 'accepted':
        return False, 'Booking must be accepted first.'

    if booking.provider.user != provider_user:
        return False, 'You are not assigned to this booking.'

    booking.status = 'in_progress'
    booking.save()

    BookingStatusLog.objects.create(
        booking=booking,
        status='in_progress',
        changed_by=provider_user,
    )

    create_notification(
        recipient=booking.customer,
        sender=provider_user,
        title='Service Started',
        message=f'Service for booking {booking.booking_code} has started.',
        type='booking',
        reference_id=booking.id,
    )
    return True, 'Booking started.'


@transaction.atomic
def complete_booking(booking, provider_user):
    """Provider completes the service."""
    if booking.status != 'in_progress':
        return False, 'Booking must be in progress.'

    if booking.provider.user != provider_user:
        return False, 'You are not assigned to this booking.'

    booking.status = 'completed'
    booking.completed_at = timezone.now()
    booking.save()

    provider = booking.provider
    provider.completed_bookings += 1
    provider.total_bookings += 1
    provider.save()

    BookingStatusLog.objects.create(
        booking=booking,
        status='completed',
        changed_by=provider_user,
    )

    create_notification(
        recipient=booking.customer,
        sender=provider_user,
        title='Booking Completed',
        message=f'Booking {booking.booking_code} has been completed. Leave a review!',
        type='booking',
        reference_id=booking.id,
    )
    return True, 'Booking completed.'


@transaction.atomic
def cancel_booking(booking, user, reason=''):
    """Cancel a booking (customer or provider)."""
    cancelable_statuses = ['pending', 'accepted', 'waiting']
    if booking.status not in cancelable_statuses:
        return False, f'Cannot cancel booking in {booking.status} status.'

    booking.status = 'cancelled'
    booking.cancellation_reason = reason
    booking.save()

    BookingStatusLog.objects.create(
        booking=booking,
        status='cancelled',
        changed_by=user,
        note=reason,
    )

    if booking.provider and booking.provider.user != user:
        create_notification(
            recipient=booking.provider.user,
            sender=user,
            title='Booking Cancelled',
            message=f'Booking {booking.booking_code} has been cancelled.',
            type='booking',
            reference_id=booking.id,
        )

    if booking.customer != user and booking.provider:
        create_notification(
            recipient=booking.customer,
            sender=user,
            title='Booking Cancelled',
            message=f'Booking {booking.booking_code} has been cancelled.',
            type='booking',
            reference_id=booking.id,
        )

    return True, 'Booking cancelled.'


from bookings.models import BookingStatusLog
