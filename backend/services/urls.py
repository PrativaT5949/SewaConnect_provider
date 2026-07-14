from django.urls import path
from .views import (
    ServiceListView, ServiceDetailView,
    MyServiceListView, ServiceCreateView,
    ServiceUpdateView, ServiceDeleteView,
    TrendingServicesView,
)

app_name = 'services'

urlpatterns = [
    path('', ServiceListView.as_view(), name='service-list'),
    path('trending/', TrendingServicesView.as_view(), name='service-trending'),
    path('my/', MyServiceListView.as_view(), name='my-service-list'),
    path('create/', ServiceCreateView.as_view(), name='service-create'),
    path('<int:pk>/', ServiceDetailView.as_view(), name='service-detail'),
    path('<int:pk>/update/', ServiceUpdateView.as_view(), name='service-update'),
    path('<int:pk>/delete/', ServiceDeleteView.as_view(), name='service-delete'),
]
