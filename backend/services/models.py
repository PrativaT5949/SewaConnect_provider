from django.db import models


class Service(models.Model):
    PRICE_TYPE_CHOICES = [
        ('fixed', 'Fixed'),
        ('hourly', 'Hourly'),
        ('starting_at', 'Starting At'),
    ]

    provider = models.ForeignKey(
        'providers.ProviderProfile',
        on_delete=models.CASCADE,
        related_name='services'
    )
    category = models.ForeignKey(
        'categories.Category',
        on_delete=models.CASCADE,
        related_name='services'
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    price_type = models.CharField(
        max_length=12,
        choices=PRICE_TYPE_CHOICES,
        default='fixed'
    )
    estimated_duration = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text='Duration in minutes'
    )
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.provider.user.full_name}"
