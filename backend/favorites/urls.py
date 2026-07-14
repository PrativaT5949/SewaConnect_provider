from django.urls import path
from .views import FavoriteCreateView, FavoriteListView, FavoriteCheckView, FavoriteToggleView, FavoriteDeleteView

app_name = 'favorites'

urlpatterns = [
    path('', FavoriteListView.as_view(), name='favorite-list'),
    path('add/', FavoriteCreateView.as_view(), name='favorite-add'),
    path('check/', FavoriteCheckView.as_view(), name='favorite-check'),
    path('toggle/', FavoriteToggleView.as_view(), name='favorite-toggle'),
    path('<int:pk>/', FavoriteDeleteView.as_view(), name='favorite-delete'),
]
