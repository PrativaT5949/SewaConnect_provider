from django.contrib import admin
from .models import Booking, BookingStatusLog


class BookingStatusLogInline(admin.TabularInline):
    model = BookingStatusLog
    extra = 0
    readonly_fields = ['status', 'changed_by', 'note', 'created_at']


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['booking_code', 'customer', 'provider', 'status', 'booking_date', 'total_price', 'assignment_attempt', 'created_at']
    list_filter = ['status', 'booking_date']
    search_fields = ['booking_code', 'customer__first_name', 'customer__last_name']
    readonly_fields = ['booking_code', 'created_at', 'updated_at', 'assigned_at', 'assignment_expiry', 'assignment_attempt', 'tried_provider_ids']
    inlines = [BookingStatusLogInline]


@admin.register(BookingStatusLog)
class BookingStatusLogAdmin(admin.ModelAdmin):
    list_display = ['booking', 'status', 'changed_by', 'created_at']
    list_filter = ['status']
