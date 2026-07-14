from rest_framework import generics, permissions
from rest_framework.response import Response
from .services import get_recommended_providers, calculate_recommendation_score, get_recommendation_explanation
from .serializers import RecommendedProviderSerializer
from providers.models import ProviderProfile
from providers.serializers import ProviderPublicSerializer


class RecommendationListView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        category_id = request.query_params.get('category')
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')
        target_price = request.query_params.get('target_price')
        limit = request.query_params.get('limit', 20)

        user_lat = float(lat) if lat else None
        user_lon = float(lon) if lon else None
        target_price = float(target_price) if target_price else None

        customer = request.user if request.user.is_authenticated else None

        results = get_recommended_providers(
            category_id=category_id,
            user_lat=user_lat,
            user_lon=user_lon,
            customer=customer,
            target_price=target_price,
            limit=int(limit),
        )

        data = []
        for result in results:
            provider = result['provider']
            scores = result['scores']
            explanation = result['explanation']

            provider_data = ProviderPublicSerializer(provider).data
            data.append({
                'provider': provider_data,
                'scores': {
                    'total_score': scores['total_score'],
                    'distance_score': float(scores['distance_score']),
                    'rating_score': float(scores['rating_score']),
                    'experience_score': float(scores['experience_score']),
                    'price_score': float(scores['price_score']),
                    'availability_score': float(scores['availability_score']),
                },
                'explanation': explanation,
                'distance_km': scores['distance_km'],
            })

        return Response({
            'status': 'success',
            'count': len(data),
            'results': data,
        })
