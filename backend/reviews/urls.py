from django.urls import path
from .views import ReviewCreateView, ProviderReviewListView, ReviewReplyCreateView

app_name = 'reviews'

urlpatterns = [
    path('', ReviewCreateView.as_view(), name='review-create'),
    path('provider/<int:pk>/', ProviderReviewListView.as_view(), name='provider-reviews'),
    path('<int:pk>/reply/', ReviewReplyCreateView.as_view(), name='review-reply'),
]
