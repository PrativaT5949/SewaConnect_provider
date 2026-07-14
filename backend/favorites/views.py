from rest_framework import generics, permissions
from .models import Favorite
from .serializers import FavoriteSerializer
from providers.models import ProviderProfile
from common.responses import success_response, error_response


class FavoriteCreateView(generics.CreateAPIView):
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        provider_id = request.data.get('provider')
        if not provider_id:
            return error_response('Provider ID is required.', status=400)

        try:
            provider = ProviderProfile.objects.get(id=provider_id)
        except ProviderProfile.DoesNotExist:
            return error_response('Provider not found.', status=404)

        if Favorite.objects.filter(customer=request.user, provider=provider).exists():
            return error_response('Provider already in favorites.', status=400)

        favorite = Favorite.objects.create(customer=request.user, provider=provider)
        return success_response(
            data=FavoriteSerializer(favorite).data,
            message='Provider added to favorites.',
            status=201,
        )


class FavoriteListView(generics.ListAPIView):
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(
            customer=self.request.user
        ).select_related('provider', 'provider__user')


class FavoriteCheckView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        provider_id = request.data.get('provider_id')
        if not provider_id:
            return error_response('provider_id is required.', status=400)

        is_favorited = Favorite.objects.filter(
            customer=request.user,
            provider_id=provider_id
        ).exists()

        return success_response(data={'is_favorited': is_favorited})


class FavoriteToggleView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        provider_id = request.data.get('provider_id')
        if not provider_id:
            return error_response('provider_id is required.', status=400)

        try:
            provider = ProviderProfile.objects.get(id=provider_id)
        except ProviderProfile.DoesNotExist:
            return error_response('Provider not found.', status=404)

        favorite, created = Favorite.objects.get_or_create(
            customer=request.user, provider=provider
        )
        if not created:
            favorite.delete()
            return success_response(
                data={'is_favorited': False},
                message='Removed from favorites.',
            )

        return success_response(
            data={'is_favorited': True, 'id': favorite.id},
            message='Added to favorites.',
            status=201,
        )


class FavoriteDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(customer=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return success_response(message='Removed from favorites.', status=204)
