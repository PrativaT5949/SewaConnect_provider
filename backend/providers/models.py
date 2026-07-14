from django.db import models
from django.conf import settings


class ProviderProfile(models.Model):
    VERIFICATION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='provider_profile'
    )
    bio = models.TextField(blank=True, default='')
    tagline = models.CharField(max_length=150, blank=True, default='')
    experience_years = models.PositiveIntegerField(default=0)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2)
    min_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    max_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    citizenship_image = models.ImageField(upload_to='providers/citizenship/', blank=True, null=True)
    certificate_image = models.ImageField(upload_to='providers/certificate/', blank=True, null=True)
    verification_status = models.CharField(
        max_length=10,
        choices=VERIFICATION_STATUS_CHOICES,
        default='pending',
        db_index=True
    )
    verification_notes = models.TextField(blank=True, default='')
    verified_at = models.DateTimeField(null=True, blank=True)
    working_start_time = models.TimeField(default='09:00')
    working_end_time = models.TimeField(default='18:00')
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_reviews = models.PositiveIntegerField(default=0)
    total_bookings = models.PositiveIntegerField(default=0)
    completed_bookings = models.PositiveIntegerField(default=0)
    response_rate = models.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.full_name} - Provider"


class ProviderSkill(models.Model):
    provider = models.ForeignKey(
        ProviderProfile,
        on_delete=models.CASCADE,
        related_name='provider_skills'
    )
    skill = models.ForeignKey('skills.Skill', on_delete=models.CASCADE)
    years_of_experience = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ['provider', 'skill']

    def __str__(self):
        return f"{self.provider.user.full_name} - {self.skill.name}"


class ProviderWorkingDay(models.Model):
    DAY_CHOICES = [
        ('mon', 'Monday'),
        ('tue', 'Tuesday'),
        ('wed', 'Wednesday'),
        ('thu', 'Thursday'),
        ('fri', 'Friday'),
        ('sat', 'Saturday'),
        ('sun', 'Sunday'),
    ]

    provider = models.ForeignKey(
        ProviderProfile,
        on_delete=models.CASCADE,
        related_name='working_days'
    )
    day = models.CharField(max_length=3, choices=DAY_CHOICES)
    is_available = models.BooleanField(default=True)
    start_time = models.TimeField(default='09:00')
    end_time = models.TimeField(default='18:00')

    class Meta:
        unique_together = ['provider', 'day']

    def __str__(self):
        return f"{self.provider.user.full_name} - {self.get_day_display()}"
