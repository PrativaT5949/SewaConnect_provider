from django.contrib import admin
from .models import Favorite


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ['customer', 'provider', 'created_at']
    search_fields = ['customer__first_name', 'provider__user__first_name']
