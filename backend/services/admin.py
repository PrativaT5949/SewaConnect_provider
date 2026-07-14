from django.contrib import admin
from .models import Service


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['title', 'provider', 'category', 'price', 'price_type', 'is_available', 'created_at']
    list_filter = ['category', 'price_type', 'is_available']
    search_fields = ['title', 'description']
