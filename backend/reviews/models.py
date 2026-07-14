from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.conf import settings


class Review(models.Model):
    booking = models.OneToOneField('bookings.Booking', on_delete=models.CASCADE)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews_given'
    )
    provider = models.ForeignKey(
        'providers.ProviderProfile',
        on_delete=models.CASCADE,
        related_name='reviews_received'
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Review by {self.customer.full_name} for {self.provider.user.full_name} - {self.rating}/5"


class ReviewReply(models.Model):
    review = models.ForeignKey(
        Review,
        on_delete=models.CASCADE,
        related_name='replies'
    )
    provider = models.ForeignKey(
        'providers.ProviderProfile',
        on_delete=models.CASCADE
    )
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Reply by {self.provider.user.full_name} on review #{self.review.id}"
