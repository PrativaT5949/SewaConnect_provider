from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/categories/', include('categories.urls')),
    path('api/skills/', include('skills.urls')),
    path('api/providers/', include('providers.urls')),
    path('api/services/', include('services.urls')),
    path('api/bookings/', include('bookings.urls')),
    path('api/reviews/', include('reviews.urls')),
    path('api/favorites/', include('favorites.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/search/', include('search.urls')),
    path('api/recommendations/', include('recommendations.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
