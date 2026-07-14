from rest_framework import generics, permissions
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from .models import Booking, BookingStatusLog
from .serializers import BookingSerializer, BookingCreateSerializer, BookingActionSerializer
from .services import (
    assign_best_provider, accept_booking, reject_booking,
    start_booking, complete_booking, cancel_booking,
    has_active_booking_with_provider, check_booking_conflict,
)
from categories.models import Category
from services.models import Service
from providers.models import ProviderProfile
from common.permissions import IsCustomer
from common.responses import success_response, error_response


class BookingCreateView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = BookingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            category = Category.objects.get(id=data['category_id'])
        except Category.DoesNotExist:
            return error_response('Category not found.', status=404)

        service = None
        if data.get('service_id'):
            try:
                service = Service.objects.get(id=data['service_id'])
            except Service.DoesNotExist:
                return error_response('Service not found.', status=404)

        provider = None
        if data.get('provider_id'):
            try:
                provider = ProviderProfile.objects.get(id=data['provider_id'], verification_status='approved')
            except ProviderProfile.DoesNotExist:
                return error_response('Provider not found.', status=404)

            if has_active_booking_with_provider(request.user, provider):
                return error_response('You already have an active booking with this provider.', status=400)

            has_conflict, conflict = check_booking_conflict(provider, data['booking_date'], data['booking_time'])
            if has_conflict:
                return error_response('This time slot is already booked.', status=400)

        total_price = 0
        if provider:
            total_price = provider.hourly_rate
        elif service:
            total_price = service.price

        booking = Booking(
            customer=request.user,
            provider=provider,
            service=service,
            category=category,
            booking_date=data['booking_date'],
            booking_time=data['booking_time'],
            address=data['address'],
            latitude=data['latitude'],
            longitude=data['longitude'],
            note=data.get('note', ''),
            total_price=total_price,
        )
        booking.save()

        BookingStatusLog.objects.create(
            booking=booking,
            status='pending',
            changed_by=request.user,
        )

        timeout_minutes = getattr(settings, 'BOOKING_ASSIGNMENT_TIMEOUT_MINUTES', 30)

        if provider:
            booking.assignment_attempt = 1
            booking.assigned_at = timezone.now()
            booking.assignment_expiry = timezone.now() + timedelta(minutes=timeout_minutes)
            booking.save()

            from notifications.utils import create_notification
            create_notification(
                recipient=provider.user,
                sender=request.user,
                title='New Booking Request',
                message=f'New booking request for {booking.booking_date}.',
                type='booking',
                reference_id=booking.id,
            )
        else:
            assigned = assign_best_provider(
                booking,
                customer_lat=float(data['latitude']),
                customer_lon=float(data['longitude']),
            )
            if not assigned:
                return error_response(
                    'No available providers found for this service. Please try again later.',
                    status=404,
                )

        return success_response(
            data=BookingSerializer(booking).data,
            message='Booking created successfully.',
            status=201,
        )


class CustomerBookingListView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Booking.objects.filter(
            customer=self.request.user
        ).select_related('provider', 'provider__user', 'category', 'service', 'customer')

        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)

        return queryset


class ProviderBookingListView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        try:
            profile = ProviderProfile.objects.get(user=self.request.user)
        except ProviderProfile.DoesNotExist:
            return Booking.objects.none()

        queryset = Booking.objects.filter(
            provider=profile
        ).select_related('provider', 'provider__user', 'category', 'service', 'customer')

        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)

        return queryset


class BookingDetailView(generics.RetrieveAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'provider':
            try:
                profile = ProviderProfile.objects.get(user=user)
                return Booking.objects.filter(provider=profile)
            except ProviderProfile.DoesNotExist:
                return Booking.objects.none()
        elif user.role == 'admin':
            return Booking.objects.all()
        return Booking.objects.filter(customer=user)


class BookingAcceptView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk)
        except Booking.DoesNotExist:
            return error_response('Booking not found.', status=404)

        success, message = accept_booking(booking, request.user)
        if not success:
            return error_response(message, status=400)

        return success_response(data=BookingSerializer(booking).data, message=message)


class BookingRejectView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk)
        except Booking.DoesNotExist:
            return error_response('Booking not found.', status=404)

        serializer = BookingActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        success, message = reject_booking(booking, request.user, serializer.validated_data.get('reason', ''))
        if not success:
            return error_response(message, status=400)

        booking.refresh_from_db()
        return success_response(data=BookingSerializer(booking).data, message=message)


class BookingStartView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk)
        except Booking.DoesNotExist:
            return error_response('Booking not found.', status=404)

        success, message = start_booking(booking, request.user)
        if not success:
            return error_response(message, status=400)

        return success_response(data=BookingSerializer(booking).data, message=message)


class BookingCompleteView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk)
        except Booking.DoesNotExist:
            return error_response('Booking not found.', status=404)

        success, message = complete_booking(booking, request.user)
        if not success:
            return error_response(message, status=400)

        return success_response(data=BookingSerializer(booking).data, message=message)


class BookingCancelView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk)
        except Booking.DoesNotExist:
            return error_response('Booking not found.', status=404)

        serializer = BookingActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        success, message = cancel_booking(booking, request.user, serializer.validated_data.get('reason', ''))
        if not success:
            return error_response(message, status=400)

        booking.refresh_from_db()
        return success_response(data=BookingSerializer(booking).data, message=message)
