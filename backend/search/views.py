from rest_framework import generics
from rest_framework.response import Response
from django.db.models import Q
from providers.models import ProviderProfile
from providers.serializers import ProviderPublicSerializer
from recommendations.services import calculate_recommendation_score


class SearchView(generics.GenericAPIView):
    permission_classes = []  # AllowAny

    def get(self, request):
        keyword = request.query_params.get('q', '').strip()
        category_id = request.query_params.get('category')
        skill_id = request.query_params.get('skill')
        city = request.query_params.get('city', '').strip()
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        min_rating = request.query_params.get('min_rating')
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')
        availability = request.query_params.get('availability')
        experience = request.query_params.get('experience')

        queryset = ProviderProfile.objects.filter(
            verification_status='approved',
        ).select_related('user')

        if keyword:
            queryset = queryset.filter(
                Q(user__first_name__icontains=keyword) |
                Q(user__last_name__icontains=keyword) |
                Q(bio__icontains=keyword) |
                Q(tagline__icontains=keyword) |
                Q(user__address__icontains=keyword) |
                Q(user__city__icontains=keyword) |
                Q(services__title__icontains=keyword) |
                Q(provider_skills__skill__name__icontains=keyword)
            ).distinct()

        if category_id:
            queryset = queryset.filter(
                Q(provider_skills__skill__category_id=category_id) |
                Q(services__category_id=category_id)
            ).distinct()

        if skill_id:
            queryset = queryset.filter(provider_skills__skill_id=skill_id).distinct()

        if city:
            queryset = queryset.filter(user__city__icontains=city)

        if min_price:
            queryset = queryset.filter(hourly_rate__gte=float(min_price))
        if max_price:
            queryset = queryset.filter(hourly_rate__lte=float(max_price))

        if min_rating:
            queryset = queryset.filter(average_rating__gte=float(min_rating))

        if experience:
            queryset = queryset.filter(experience_years__gte=int(experience))

        if availability == 'today':
            from datetime import date
            day_abbr = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][date.today().weekday()]
            queryset = queryset.filter(
                working_days__day=day_abbr,
                working_days__is_available=True,
            ).distinct()

        user_lat = float(lat) if lat else None
        user_lon = float(lon) if lon else None

        results = []
        for provider in queryset:
            scores = calculate_recommendation_score(
                provider, user_lat, user_lon
            )
            provider_data = ProviderPublicSerializer(provider).data
            results.append({
                'provider': provider_data,
                'total_score': float(scores['total_score']),
                'distance_km': scores['distance_km'],
            })

        results.sort(key=lambda x: x['total_score'], reverse=True)

        return Response({
            'status': 'success',
            'count': len(results),
            'results': results,
        })
