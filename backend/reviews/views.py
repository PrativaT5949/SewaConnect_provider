from django.db.models import Avg, Count
from rest_framework import generics, permissions
from .models import Review, ReviewReply
from .serializers import ReviewSerializer, ReviewCreateSerializer, ReviewReplySerializer
from bookings.models import Booking
from providers.models import ProviderProfile
from common.responses import success_response, error_response


def recalculate_provider_rating(provider):
    """Recalculate and update provider's average rating and total reviews."""
    stats = Review.objects.filter(provider=provider).aggregate(
        avg_rating=Avg('rating'),
        total=Count('id'),
    )
    provider.average_rating = round(stats['avg_rating'] or 0, 2)
    provider.total_reviews = stats['total']
    provider.save(update_fields=['average_rating', 'total_reviews'])


class ReviewCreateView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = ReviewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            booking = Booking.objects.get(id=data['booking_id'])
        except Booking.DoesNotExist:
            return error_response('Booking not found.', status=404)

        if booking.customer != request.user:
            return error_response('You can only review your own bookings.', status=403)

        if booking.status not in ('completed',):
            return error_response('You can only review completed bookings.', status=400)

        if Review.objects.filter(booking=booking).exists():
            return error_response('A review already exists for this booking.', status=400)

        if not booking.provider:
            return error_response('No provider assigned to this booking.', status=400)

        review = Review.objects.create(
            booking=booking,
            customer=request.user,
            provider=booking.provider,
            rating=data['rating'],
            comment=data['comment'],
        )

        recalculate_provider_rating(booking.provider)

        return success_response(
            data=ReviewSerializer(review).data,
            message='Review submitted successfully.',
            status=201,
        )


class ProviderReviewListView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    pagination_class = None

    def get_queryset(self):
        provider_id = self.kwargs.get('pk')
        return Review.objects.filter(
            provider_id=provider_id
        ).select_related('customer', 'provider', 'provider__user', 'booking')


class ReviewReplyCreateView(generics.CreateAPIView):
    serializer_class = ReviewReplySerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        review_id = self.kwargs.get('pk')
        try:
            review = Review.objects.get(id=review_id)
        except Review.DoesNotExist:
            return error_response('Review not found.', status=404)

        if review.provider.user != request.user:
            return error_response('You can only reply to reviews on your profile.', status=403)

        serializer = ReviewReplySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reply = serializer.save(provider=review.provider, review=review)

        return success_response(
            data=ReviewReplySerializer(reply).data,
            message='Reply submitted successfully.',
            status=201,
        )
