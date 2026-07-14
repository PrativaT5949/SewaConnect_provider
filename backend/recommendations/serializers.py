from rest_framework import serializers
from .models import RecommendationScore
from providers.serializers import ProviderPublicSerializer


class RecommendationScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecommendationScore
        fields = [
            'id', 'provider', 'distance_score', 'rating_score',
            'experience_score', 'price_score', 'availability_score',
            'response_rate_score', 'favorites_score', 'activity_score',
            'total_score', 'last_calculated',
        ]


class RecommendedProviderSerializer(serializers.Serializer):
    provider = ProviderPublicSerializer()
    scores = RecommendationScoreSerializer()
    explanation = serializers.ListField(child=serializers.CharField())
    distance_km = serializers.FloatField()
