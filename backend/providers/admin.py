from django.contrib import admin
from .models import ProviderProfile, ProviderSkill, ProviderWorkingDay


class ProviderSkillInline(admin.TabularInline):
    model = ProviderSkill
    extra = 0


class ProviderWorkingDayInline(admin.TabularInline):
    model = ProviderWorkingDay
    extra = 0


@admin.register(ProviderProfile)
class ProviderProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'verification_status', 'average_rating', 'completed_bookings']
    list_filter = ['verification_status', 'is_featured']
    search_fields = ['user__first_name', 'user__last_name', 'user__email']
    inlines = [ProviderSkillInline, ProviderWorkingDayInline]


@admin.register(ProviderSkill)
class ProviderSkillAdmin(admin.ModelAdmin):
    list_display = ['provider', 'skill', 'years_of_experience']
    search_fields = ['provider__user__first_name', 'skill__name']


@admin.register(ProviderWorkingDay)
class ProviderWorkingDayAdmin(admin.ModelAdmin):
    list_display = ['provider', 'day', 'is_available', 'start_time', 'end_time']
    list_filter = ['day', 'is_available']
