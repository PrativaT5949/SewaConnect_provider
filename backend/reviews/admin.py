from django.contrib import admin
from .models import Review, ReviewReply


class ReviewReplyInline(admin.TabularInline):
    model = ReviewReply
    extra = 0


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['customer', 'provider', 'rating', 'created_at']
    list_filter = ['rating']
    search_fields = ['customer__first_name', 'provider__user__first_name', 'comment']
    inlines = [ReviewReplyInline]


@admin.register(ReviewReply)
class ReviewReplyAdmin(admin.ModelAdmin):
    list_display = ['review', 'provider', 'created_at']
    search_fields = ['comment']
