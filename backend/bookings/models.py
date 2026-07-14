import secrets
import string
from django.db import models
from django.conf import settings
from django.utils import timezone


class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('review_pending', 'Review Pending'),
    ]

    booking_code = models.CharField(max_length=20, unique=True)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='customer_bookings'
    )
    provider = models.ForeignKey(
        'providers.ProviderProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='provider_bookings'
    )
    service = models.ForeignKey(
        'services.Service',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    category = models.ForeignKey(
        'categories.Category',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        db_index=True
    )
    booking_date = models.DateField(db_index=True)
    booking_time = models.TimeField()
    estimated_end_time = models.TimeField(null=True, blank=True)
    address = models.TextField()
    latitude = models.DecimalField(max_digits=11, decimal_places=8)
    longitude = models.DecimalField(max_digits=11, decimal_places=8)
    note = models.TextField(blank=True, default='')
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    cancellation_reason = models.TextField(blank=True, default='')
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Booking {self.booking_code} - {self.customer.full_name}"

    def save(self, *args, **kwargs):
        if not self.booking_code:
            year = timezone.now().year
            chars = string.ascii_uppercase + string.digits
            code = ''.join(secrets.choice(chars) for _ in range(5))
            self.booking_code = f"SC-{year}-{code}"
        super().save(*args, **kwargs)


class BookingStatusLog(models.Model):
    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='status_logs'
    )
    status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    note = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.booking.booking_code} - {self.status}"
