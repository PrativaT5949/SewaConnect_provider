from rest_framework import serializers
from .models import Service


class ServiceSerializer(serializers.ModelSerializer):
    provider_name = serializers.CharField(source='provider.user.full_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Service
        fields = [
            'id', 'provider', 'provider_name', 'category', 'category_name',
            'title', 'description', 'price', 'price_type',
            'estimated_duration', 'is_available', 'created_at',
        ]
        read_only_fields = ['id', 'provider', 'created_at']


class ServiceListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Service
        fields = ['id', 'title', 'category', 'category_name', 'price', 'price_type', 'is_available']
