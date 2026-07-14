from django.urls import path
from .views import (
    CategoryListView, CategoryDetailView,
    CategoryCreateView, CategoryUpdateView, CategoryDeleteView,  AdminCategoryListView,
)

app_name = 'categories'

urlpatterns = [
    path('', CategoryListView.as_view(), name='category-list'),
     path('admin/', AdminCategoryListView.as_view(), name='category-admin-list'),
    path('create/', CategoryCreateView.as_view(), name='category-create'),
    path('<slug:slug>/', CategoryDetailView.as_view(), name='category-detail'),
    path('<slug:slug>/update/', CategoryUpdateView.as_view(), name='category-update'),
    path('<slug:slug>/delete/', CategoryDeleteView.as_view(), name='category-delete'),
]
