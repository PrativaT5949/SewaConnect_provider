from rest_framework import serializers
from .models import ProviderProfile, ProviderSkill, ProviderWorkingDay


class ProviderSkillSerializer(serializers.ModelSerializer):
    skill_name = serializers.CharField(source='skill.name', read_only=True)
    category_name = serializers.CharField(source='skill.category.name', read_only=True)

    class Meta:
        model = ProviderSkill
        fields = ['id', 'skill', 'skill_name', 'category_name', 'years_of_experience']
        read_only_fields = ['id']


class ProviderWorkingDaySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProviderWorkingDay
        fields = ['id', 'day', 'is_available', 'start_time', 'end_time']
        read_only_fields = ['id']


class ProviderProfileCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProviderProfile
        fields = [
            'bio', 'tagline', 'experience_years', 'hourly_rate',
            'min_price', 'max_price', 'citizenship_image', 'certificate_image',
            'working_start_time', 'working_end_time',
        ]


class ProviderProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProviderProfile
        fields = [
            'bio', 'tagline', 'experience_years', 'hourly_rate',
            'min_price', 'max_price', 'citizenship_image', 'certificate_image',
            'working_start_time', 'working_end_time',
        ]


class ProviderProfileSerializer(serializers.ModelSerializer):
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_phone = serializers.CharField(source='user.phone_number', read_only=True)
    user_avatar = serializers.ImageField(source='user.avatar', read_only=True)
    is_verified = serializers.BooleanField(source='user.is_verified', read_only=True)
    address = serializers.CharField(source='user.address', read_only=True, default='')
    latitude = serializers.DecimalField(source='user.latitude', max_digits=9, decimal_places=6, read_only=True, allow_null=True)
    longitude = serializers.DecimalField(source='user.longitude', max_digits=9, decimal_places=6, read_only=True, allow_null=True)
    provider_skills = ProviderSkillSerializer(many=True, read_only=True)
    working_days = ProviderWorkingDaySerializer(many=True, read_only=True)
    favorite_count = serializers.SerializerMethodField()
    services = serializers.SerializerMethodField()

    class Meta:
        model = ProviderProfile
        fields = [
            'id', 'user', 'user_full_name', 'user_email', 'user_phone', 'user_avatar',
            'is_verified', 'address', 'latitude', 'longitude',
            'bio', 'tagline', 'experience_years', 'hourly_rate', 'min_price', 'max_price',
            'citizenship_image', 'certificate_image',
            'verification_status', 'verification_notes', 'verified_at',
            'working_start_time', 'working_end_time',
            'average_rating', 'total_reviews', 'total_bookings',
            'completed_bookings', 'response_rate', 'is_featured',
            'provider_skills', 'working_days', 'favorite_count', 'services',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'user', 'verification_status', 'verification_notes', 'verified_at',
            'average_rating', 'total_reviews', 'total_bookings',
            'completed_bookings', 'response_rate', 'is_featured',
            'created_at', 'updated_at',
        ]

    def get_favorite_count(self, obj):
        return obj.favorited_by.count()

    def get_services(self, obj):
        from services.serializers import ServiceListSerializer
        return ServiceListSerializer(obj.services.all(), many=True).data


class ProviderPublicSerializer(serializers.ModelSerializer):
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    user_avatar = serializers.ImageField(source='user.avatar', read_only=True)
    is_verified = serializers.BooleanField(source='user.is_verified', read_only=True)
    provider_skills = ProviderSkillSerializer(many=True, read_only=True)
    working_days = ProviderWorkingDaySerializer(many=True, read_only=True)
    favorite_count = serializers.SerializerMethodField()
    services = serializers.SerializerMethodField()

    class Meta:
        model = ProviderProfile
        fields = [
            'id', 'user_full_name', 'user_avatar', 'is_verified',
            'bio', 'tagline', 'experience_years', 'hourly_rate',
            'min_price', 'max_price',
            'average_rating', 'total_reviews', 'total_bookings',
            'completed_bookings', 'response_rate', 'is_featured',
            'working_start_time', 'working_end_time',
            'provider_skills', 'working_days', 'favorite_count', 'services',
            'created_at',
        ]

    def get_favorite_count(self, obj):
        return obj.favorited_by.count()

    def get_services(self, obj):
        from services.serializers import ServiceListSerializer
        return ServiceListSerializer(obj.services.all(), many=True).data


class AdminApprovalSerializer(serializers.Serializer):
    notes = serializers.CharField(required=False, allow_blank=True, default='')