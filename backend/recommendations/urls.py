from django.urls import path
from .views import RecommendationListView

app_name = 'recommendations'

urlpatterns = [
    path('', RecommendationListView.as_view(), name='recommendation-list'),
]
