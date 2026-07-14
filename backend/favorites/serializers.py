from rest_framework import serializers
from .models import Favorite
from providers.serializers import ProviderPublicSerializer


class FavoriteSerializer(serializers.ModelSerializer):
    provider_detail = ProviderPublicSerializer(source='provider', read_only=True)

    class Meta:
        model = Favorite
        fields = ['id', 'customer', 'provider', 'provider_detail', 'created_at']
        read_only_fields = ['id', 'customer', 'created_at']
