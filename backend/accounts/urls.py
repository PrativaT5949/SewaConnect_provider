from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views
from .serializers import CustomTokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


app_name = 'accounts'

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('register/provider/', views.RegisterProviderView.as_view(), name='register-provider'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', views.MeView.as_view(), name='me'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('dashboard/customer/', views.CustomerDashboardView.as_view(), name='customer-dashboard'),
    path('dashboard/admin/', views.AdminDashboardView.as_view(), name='admin-dashboard'),
    path('dashboard/admin/users/', views.AdminUserListView.as_view(), name='admin-users'),
    path('dashboard/admin/bookings/', views.AdminBookingListView.as_view(), name='admin-bookings'),
]
