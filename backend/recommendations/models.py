from django.db import models


class RecommendationScore(models.Model):
    provider = models.OneToOneField(
        'providers.ProviderProfile',
        on_delete=models.CASCADE,
        related_name='recommendation_score'
    )
    distance_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    rating_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    experience_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    price_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    availability_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    response_rate_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    favorites_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    activity_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total_score = models.DecimalField(max_digits=7, decimal_places=2, default=0, db_index=True)
    last_calculated = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Score for {self.provider.user.full_name}: {self.total_score}"
