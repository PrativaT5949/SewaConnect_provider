from django.urls import path
from .views import (
    BookingCreateView, BookingDetailView,
    CustomerBookingListView, ProviderBookingListView,
    BookingAcceptView, BookingRejectView,
    BookingStartView, BookingCompleteView, BookingCancelView,
)

app_name = 'bookings'

urlpatterns = [
    path('', BookingCreateView.as_view(), name='booking-create'),
    path('my/', CustomerBookingListView.as_view(), name='customer-bookings'),
    path('provider/', ProviderBookingListView.as_view(), name='provider-bookings'),
    path('<int:pk>/', BookingDetailView.as_view(), name='booking-detail'),
    path('<int:pk>/accept/', BookingAcceptView.as_view(), name='booking-accept'),
    path('<int:pk>/reject/', BookingRejectView.as_view(), name='booking-reject'),
    path('<int:pk>/start/', BookingStartView.as_view(), name='booking-start'),
    path('<int:pk>/complete/', BookingCompleteView.as_view(), name='booking-complete'),
    path('<int:pk>/cancel/', BookingCancelView.as_view(), name='booking-cancel'),
]
