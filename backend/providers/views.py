from rest_framework import generics, status, permissions
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from .models import ProviderProfile, ProviderSkill, ProviderWorkingDay
from .serializers import (
    ProviderProfileSerializer, ProviderProfileCreateSerializer,
    ProviderProfileUpdateSerializer, ProviderPublicSerializer,
    ProviderSkillSerializer, ProviderWorkingDaySerializer,
    AdminApprovalSerializer,
)
from common.permissions import IsAdmin
from common.responses import success_response, error_response


class ProviderListView(generics.ListAPIView):
    serializer_class = ProviderPublicSerializer
    filterset_fields = ['verification_status']

    def get_queryset(self):
        qs = ProviderProfile.objects.filter(
            verification_status='approved'
        ).select_related('user')
        category_id = self.request.query_params.get('category')
        if category_id:
            qs = qs.filter(
                Q(provider_skills__skill__category_id=category_id) |
                Q(services__category_id=category_id)
            ).distinct()
        return qs


class ProviderDetailView(generics.RetrieveAPIView):
    queryset = ProviderProfile.objects.filter(
        verification_status='approved'
    ).select_related('user')
    serializer_class = ProviderPublicSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return success_response(data=serializer.data)


class MyProviderProfileView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return ProviderProfileUpdateSerializer
        return ProviderProfileSerializer

    def get(self, request):
        try:
            profile = ProviderProfile.objects.select_related('user').get(user=request.user)
        except ProviderProfile.DoesNotExist:
            return error_response('Provider profile not found.', status=404)
        serializer = ProviderProfileSerializer(profile)
        return success_response(data=serializer.data)

    def patch(self, request):
        try:
            profile = ProviderProfile.objects.get(user=request.user)
        except ProviderProfile.DoesNotExist:
            return error_response('Provider profile not found.', status=404)

        user_fields = ['first_name', 'last_name', 'phone_number', 'address', 'latitude', 'longitude', 'city', 'district', 'avatar']
        user_data = {k: v for k, v in request.data.items() if k in user_fields and v is not None}
        if user_data:
            user = request.user
            for key, value in user_data.items():
                setattr(user, key, value)
            user.save()

        working_days_data = request.data.get('working_days')
        if working_days_data and isinstance(working_days_data, list):
            from .models import ProviderWorkingDay
            for day in working_days_data:
                ProviderWorkingDay.objects.update_or_create(
                    provider=profile,
                    day=day,
                    defaults={'is_available': True}
                )

        profile_fields = ['bio', 'tagline', 'experience_years', 'hourly_rate',
                          'min_price', 'max_price', 'citizenship_image', 'certificate_image',
                          'working_start_time', 'working_end_time']
        profile_data = {k: v for k, v in request.data.items() if k in profile_fields}
        if profile_data:
            serializer = ProviderProfileUpdateSerializer(profile, data=profile_data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()

        profile.refresh_from_db()
        return success_response(
            data=ProviderProfileSerializer(profile).data,
            message='Profile updated successfully.',
        )

    def put(self, request):
        try:
            profile = ProviderProfile.objects.get(user=request.user)
        except ProviderProfile.DoesNotExist:
            return error_response('Provider profile not found.', status=404)
        serializer = ProviderProfileUpdateSerializer(profile, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(
            data=ProviderProfileSerializer(profile).data,
            message='Profile updated successfully.',
        )


class CreateProviderProfileView(generics.CreateAPIView):
    serializer_class = ProviderProfileCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        if ProviderProfile.objects.filter(user=request.user).exists():
            return error_response('Provider profile already exists.', status=400)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save(user=request.user)

        days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
        for day in days:
            ProviderWorkingDay.objects.create(
                provider=profile,
                day=day,
                is_available=day not in ('sat', 'sun'),
                start_time=profile.working_start_time,
                end_time=profile.working_end_time,
            )

        return success_response(
            data=ProviderProfileSerializer(profile).data,
            message='Provider profile created successfully.',
            status=201,
        )


class ProviderSkillCreateView(generics.CreateAPIView):
    serializer_class = ProviderSkillSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        try:
            profile = ProviderProfile.objects.get(user=request.user)
        except ProviderProfile.DoesNotExist:
            return error_response('Provider profile not found.', status=404)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        provider_skill = serializer.save(provider=profile)
        return success_response(
            data=ProviderSkillSerializer(provider_skill).data,
            message='Skill added successfully.',
            status=201,
        )


class ProviderSkillDeleteView(generics.DestroyAPIView):
    serializer_class = ProviderSkillSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        try:
            profile = ProviderProfile.objects.get(user=self.request.user)
        except ProviderProfile.DoesNotExist:
            return ProviderSkill.objects.none()
        return ProviderSkill.objects.filter(provider=profile)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return success_response(message='Skill removed successfully.', status=204)


class ProviderWorkingDayUpdateView(generics.UpdateAPIView):
    serializer_class = ProviderWorkingDaySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        try:
            profile = ProviderProfile.objects.get(user=self.request.user)
        except ProviderProfile.DoesNotExist:
            return ProviderWorkingDay.objects.none()
        return ProviderWorkingDay.objects.filter(provider=profile)


class AdminProviderListView(generics.ListAPIView):
    serializer_class = ProviderProfileSerializer
    permission_classes = [IsAdmin]
    queryset = ProviderProfile.objects.select_related('user')
    filterset_fields = ['verification_status']


class AdminProviderApproveView(generics.GenericAPIView):
    permission_classes = [IsAdmin]
    queryset = ProviderProfile.objects.all()

    def patch(self, request, pk):
        profile = self.get_object()
        serializer = AdminApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        profile.verification_status = 'approved'
        profile.verification_notes = serializer.validated_data.get('notes', '')
        profile.verified_at = timezone.now()
        profile.save()

        return success_response(
            data=ProviderProfileSerializer(profile).data,
            message='Provider approved successfully.',
        )


class AdminProviderRejectView(generics.GenericAPIView):
    permission_classes = [IsAdmin]
    queryset = ProviderProfile.objects.all()

    def patch(self, request, pk):
        profile = self.get_object()
        serializer = AdminApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        profile.verification_status = 'rejected'
        profile.verification_notes = serializer.validated_data.get('notes', '')
        profile.save()

        return success_response(
            data=ProviderProfileSerializer(profile).data,
            message='Provider rejected.',
        )


class ProviderDashboardView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            profile = ProviderProfile.objects.get(user=request.user)
        except ProviderProfile.DoesNotExist:
            return error_response('Provider profile not found.', status=404)

        from bookings.models import Booking
        from reviews.models import Review
        from django.db.models import Sum

        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        bookings = profile.provider_bookings.all()
        monthly_bookings = bookings.filter(created_at__gte=month_start)

        total_earnings = bookings.filter(
            status='completed'
        ).aggregate(total=Sum('total_price'))['total'] or 0

        monthly_earnings = monthly_bookings.filter(
            status='completed'
        ).aggregate(total=Sum('total_price'))['total'] or 0

        recent_bookings = bookings.select_related('customer')[:5]
        recent_reviews = Review.objects.filter(
            provider=profile
        ).select_related('customer')[:5]

        from bookings.serializers import BookingSerializer
        from reviews.serializers import ReviewSerializer

        return success_response(data={
            'stats': {
                'total_bookings': profile.total_bookings,
                'completed_bookings': profile.completed_bookings,
                'pending_bookings': bookings.filter(status='pending').count(),
                'accepted_bookings': bookings.filter(status='accepted').count(),
                'total_earnings': float(total_earnings),
                'monthly_earnings': float(monthly_earnings),
                'average_rating': float(profile.average_rating),
                'total_reviews': profile.total_reviews,
                'response_rate': float(profile.response_rate),
            },
            'recent_bookings': BookingSerializer(recent_bookings, many=True).data,
            'recent_reviews': ReviewSerializer(recent_reviews, many=True).data,
        })
