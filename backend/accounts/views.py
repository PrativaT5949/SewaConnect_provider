from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Sum, Count
from django.utils import timezone

from .serializers import (
    UserSerializer, RegisterSerializer, RegisterProviderSerializer,
    ChangePasswordSerializer,
)
from common.permissions import IsAdmin
from common.responses import success_response

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return success_response(
            data=UserSerializer(user).data,
            message='Registration successful.',
            status=status.HTTP_201_CREATED,
        )


class RegisterProviderView(generics.CreateAPIView):
    serializer_class = RegisterProviderSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return success_response(
            data=UserSerializer(user).data,
            message='Provider registration successful. Please complete your profile.',
            status=status.HTTP_201_CREATED,
        )


class MeView(generics.GenericAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = self.get_serializer(request.user)
        return success_response(data=serializer.data)

    def patch(self, request):
        serializer = self.get_serializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(
            data=serializer.data,
            message='Profile updated successfully.',
        )

    def put(self, request):
        serializer = self.get_serializer(request.user, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(
            data=serializer.data,
            message='Profile updated successfully.',
        )


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return success_response(message='Password changed successfully.')


class CustomerDashboardView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from bookings.models import Booking
        from favorites.models import Favorite

        bookings = Booking.objects.filter(customer=request.user)
        now = timezone.now()

        total_spent = bookings.filter(
            status='completed'
        ).aggregate(total=Sum('total_price'))['total'] or 0

        recent_bookings = bookings.select_related(
            'provider', 'provider__user', 'category'
        )[:5]

        from bookings.serializers import BookingSerializer

        return success_response(data={
            'stats': {
                'total_bookings': bookings.count(),
                'pending_bookings': bookings.filter(status='pending').count(),
                'accepted_bookings': bookings.filter(status='accepted').count(),
                'completed_bookings': bookings.filter(status='completed').count(),
                'cancelled_bookings': bookings.filter(status='cancelled').count(),
                'total_spent': float(total_spent),
                'total_favorites': Favorite.objects.filter(customer=request.user).count(),
            },
            'recent_bookings': BookingSerializer(recent_bookings, many=True).data,
        })


class AdminDashboardView(generics.GenericAPIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        from bookings.models import Booking
        from providers.models import ProviderProfile
        from reviews.models import Review
        from categories.models import Category
        from django.db.models import Sum, Count

        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        bookings_qs = Booking.objects.all()
        total_revenue = bookings_qs.filter(
            status='completed'
        ).aggregate(total=Sum('total_price'))['total'] or 0

        monthly_revenue = bookings_qs.filter(
            status='completed', completed_at__gte=month_start
        ).aggregate(total=Sum('total_price'))['total'] or 0

        top_categories = list(
            Category.objects.annotate(
                booking_count=Count('booking')
            ).order_by('-booking_count')[:10].values('id', 'name', 'booking_count')
        )

        top_providers = list(
            ProviderProfile.objects.filter(
                verification_status='approved'
            ).select_related('user').annotate(
                booking_count=Count('provider_bookings')
            ).order_by('-booking_count')[:10].values(
                'id', 'user__first_name', 'user__last_name', 'average_rating', 'booking_count'
            )
        )
        for p in top_providers:
            p['user_full_name'] = f"{p.pop('user__first_name')} {p.pop('user__last_name')}"

        pending_providers_qs = ProviderProfile.objects.filter(
            verification_status='pending'
        ).select_related('user')[:5]
        pending_providers_list = [
            {
                'id': p.id,
                'user_full_name': p.user.full_name,
                'email': p.user.email,
                'created_at': p.created_at,
            }
            for p in pending_providers_qs
        ]

        from bookings.serializers import BookingSerializer
        recent_bookings = BookingSerializer(
            bookings_qs.select_related(
                'customer', 'provider', 'provider__user', 'category'
            )[:5],
            many=True,
        ).data

        return success_response(data={
            'total_users': User.objects.count(),
            'total_customers': User.objects.filter(role='customer').count(),
            'total_providers': ProviderProfile.objects.count(),
            'approved_providers': ProviderProfile.objects.filter(verification_status='approved').count(),
            'pending_providers': ProviderProfile.objects.filter(verification_status='pending').count(),
            'total_bookings': bookings_qs.count(),
            'completed_bookings': bookings_qs.filter(status='completed').count(),
            'pending_bookings': bookings_qs.filter(status='pending').count(),
            'cancelled_bookings': bookings_qs.filter(status='cancelled').count(),
            'total_revenue': float(total_revenue),
            'monthly_revenue': float(monthly_revenue),
            'total_reviews': Review.objects.count(),
            'total_categories': Category.objects.count(),
            'top_categories': top_categories,
            'top_providers': top_providers,
            'pending_providers_list': pending_providers_list,
            'recent_bookings': recent_bookings,
        })


class AdminUserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]
    queryset = User.objects.all()
    filterset_fields = ['role', 'is_active']


class AdminBookingListView(generics.ListAPIView):
    permission_classes = [IsAdmin]

    def get_queryset(self):
        from bookings.models import Booking
        return Booking.objects.select_related(
            'customer', 'provider', 'provider__user', 'category'
        )

    def get_serializer_class(self):
        from bookings.serializers import BookingSerializer
        return BookingSerializer
