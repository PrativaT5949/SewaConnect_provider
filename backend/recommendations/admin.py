from django.contrib import admin
from .models import RecommendationScore


@admin.register(RecommendationScore)
class RecommendationScoreAdmin(admin.ModelAdmin):
    list_display = ['provider', 'total_score', 'last_calculated', 'created_at']
    search_fields = ['provider__user__first_name', 'provider__user__last_name']
    ordering = ['-total_score']
