from django.db import models


class Skill(models.Model):
    category = models.ForeignKey(
        'categories.Category',
        on_delete=models.CASCADE,
        related_name='skills'
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ['category', 'name']

    def __str__(self):
        return f"{self.name} ({self.category.name})"
