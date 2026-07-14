from django.urls import path
from .views import (
    NotificationListView, NotificationMarkReadView,
    NotificationMarkAllReadView, UnreadCountView,
)

app_name = 'notifications'

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification-list'),
    path('<int:pk>/read/', NotificationMarkReadView.as_view(), name='notification-mark-read'),
    path('read-all/', NotificationMarkAllReadView.as_view(), name='notification-mark-all-read'),
    path('unread-count/', UnreadCountView.as_view(), name='notification-unread-count'),
]
