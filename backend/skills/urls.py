from django.urls import path
from .views import SkillListView, SkillDetailView, SkillCreateView, SkillUpdateView, SkillDeleteView

app_name = 'skills'

urlpatterns = [
    path('', SkillListView.as_view(), name='skill-list'),
    path('create/', SkillCreateView.as_view(), name='skill-create'),
    path('<int:pk>/', SkillDetailView.as_view(), name='skill-detail'),
    path('<int:pk>/update/', SkillUpdateView.as_view(), name='skill-update'),
    path('<int:pk>/delete/', SkillDeleteView.as_view(), name='skill-delete'),
]