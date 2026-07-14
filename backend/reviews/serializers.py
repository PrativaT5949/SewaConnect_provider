from rest_framework import serializers
from .models import Review, ReviewReply


class ReviewReplySerializer(serializers.ModelSerializer):
    provider_name = serializers.CharField(source='provider.user.full_name', read_only=True)

    class Meta:
        model = ReviewReply
        fields = ['id', 'review', 'provider', 'provider_name', 'comment', 'created_at']
        read_only_fields = ['id', 'provider', 'created_at']


class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    provider_name = serializers.SerializerMethodField()
    replies = ReviewReplySerializer(many=True, read_only=True)
    booking_code = serializers.CharField(source='booking.booking_code', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'booking', 'booking_code', 'customer', 'customer_name',
            'provider', 'provider_name', 'rating', 'comment', 'replies', 'created_at',
        ]
        read_only_fields = ['id', 'customer', 'provider', 'created_at']

    def get_provider_name(self, obj):
        if obj.provider:
            return obj.provider.user.full_name
        return ''


class ReviewCreateSerializer(serializers.Serializer):
    booking_id = serializers.IntegerField()
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField()
