from django.db import models
from django.conf import settings


class Favorite(models.Model):
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='favorites'
    )
    provider = models.ForeignKey(
        'providers.ProviderProfile',
        on_delete=models.CASCADE,
        related_name='favorited_by'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['customer', 'provider']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.customer.full_name} - {self.provider.user.full_name}"
