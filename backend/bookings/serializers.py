from rest_framework import serializers
from .models import Booking, BookingStatusLog


class BookingStatusLogSerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.full_name', read_only=True, default='')

    class Meta:
        model = BookingStatusLog
        fields = ['id', 'status', 'changed_by', 'changed_by_name', 'note', 'created_at']
        read_only_fields = ['id', 'created_at']


class BookingSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    provider_name = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True, default='')
    service_title = serializers.CharField(source='service.title', read_only=True, default='')
    status_logs = BookingStatusLogSerializer(many=True, read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'booking_code', 'customer', 'customer_name',
            'provider', 'provider_name',
            'service', 'service_title',
            'category', 'category_name',
            'status', 'booking_date', 'booking_time', 'estimated_end_time',
            'address', 'latitude', 'longitude', 'note',
            'total_price', 'cancellation_reason',
            'completed_at', 'created_at', 'updated_at',
            'status_logs',
        ]
        read_only_fields = [
            'id', 'booking_code', 'customer', 'provider',
            'status', 'total_price', 'cancellation_reason',
            'completed_at', 'created_at', 'updated_at',
        ]

    def get_provider_name(self, obj):
        if obj.provider:
            return obj.provider.user.full_name
        return ''


class BookingCreateSerializer(serializers.Serializer):
    category_id = serializers.IntegerField()
    service_id = serializers.IntegerField(required=False, allow_null=True)
    provider_id = serializers.IntegerField(required=False, allow_null=True)
    booking_date = serializers.DateField()
    booking_time = serializers.TimeField()
    address = serializers.CharField()
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    note = serializers.CharField(required=False, allow_blank=True, default='')


class BookingActionSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True, default='')
