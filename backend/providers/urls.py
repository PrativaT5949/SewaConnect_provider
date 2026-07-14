from django.urls import path
from .views import (
    ProviderListView, ProviderDetailView,
    MyProviderProfileView, CreateProviderProfileView,
    ProviderSkillCreateView, ProviderSkillDeleteView,
    ProviderWorkingDayUpdateView,
    AdminProviderListView, AdminProviderApproveView, AdminProviderRejectView,
    ProviderDashboardView,
)

app_name = 'providers'

urlpatterns = [
    path('', ProviderListView.as_view(), name='provider-list'),
    path('<int:pk>/', ProviderDetailView.as_view(), name='provider-detail'),
    path('profile/create/', CreateProviderProfileView.as_view(), name='provider-profile-create'),
    path('profile/', MyProviderProfileView.as_view(), name='provider-profile'),
    path('skills/', ProviderSkillCreateView.as_view(), name='provider-skill-create'),
    path('skills/<int:pk>/', ProviderSkillDeleteView.as_view(), name='provider-skill-delete'),
    path('working-days/<int:pk>/', ProviderWorkingDayUpdateView.as_view(), name='provider-working-day'),
    path('dashboard/', ProviderDashboardView.as_view(), name='provider-dashboard'),
    path('admin/', AdminProviderListView.as_view(), name='admin-provider-list'),
    path('admin/<int:pk>/approve/', AdminProviderApproveView.as_view(), name='admin-provider-approve'),
    path('admin/<int:pk>/reject/', AdminProviderRejectView.as_view(), name='admin-provider-reject'),
]
