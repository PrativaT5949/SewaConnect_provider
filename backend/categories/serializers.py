from rest_framework import serializers
from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    services_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "icon",
            "image",
            "is_active",
            "sort_order",
            "services_count",
            "created_at",
        ]
        read_only_fields = ["id", "slug", "created_at"]

    def get_services_count(self, obj):
        return obj.services.filter(is_available=True).count()


class CategoryListSerializer(serializers.ModelSerializer):
    services_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "icon",
            "image",
            "sort_order",
            "services_count",
        ]

    def get_services_count(self, obj):
        return obj.services.filter(is_available=True).count()