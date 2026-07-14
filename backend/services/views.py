from rest_framework import generics, permissions
from .models import Service
from .serializers import ServiceSerializer, ServiceListSerializer
from providers.models import ProviderProfile
from common.responses import success_response, error_response


class ServiceListView(generics.ListAPIView):
    serializer_class = ServiceListSerializer
    filterset_fields = ['category', 'provider', 'is_available']

    def get_queryset(self):
        return Service.objects.filter(
            provider__verification_status='approved',
            is_available=True,
        ).select_related('category')


class ServiceDetailView(generics.RetrieveAPIView):
    queryset = Service.objects.select_related('category', 'provider', 'provider__user')
    serializer_class = ServiceSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return success_response(data=serializer.data)


class MyServiceListView(generics.ListAPIView):
    serializer_class = ServiceSerializer
    pagination_class = None
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        try:
            profile = ProviderProfile.objects.get(user=self.request.user)
        except ProviderProfile.DoesNotExist:
            return Service.objects.none()
        return Service.objects.filter(provider=profile).select_related('category')


class ServiceCreateView(generics.CreateAPIView):
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        try:
            profile = ProviderProfile.objects.get(user=request.user)
        except ProviderProfile.DoesNotExist:
            return error_response('Provider profile not found.', status=404)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = serializer.save(provider=profile)
        return success_response(
            data=ServiceSerializer(service).data,
            message='Service created successfully.',
            status=201,
        )


class ServiceUpdateView(generics.UpdateAPIView):
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        try:
            profile = ProviderProfile.objects.get(user=self.request.user)
        except ProviderProfile.DoesNotExist:
            return Service.objects.none()
        return Service.objects.filter(provider=profile)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        service = serializer.save()
        return success_response(
            data=ServiceSerializer(service).data,
            message='Service updated successfully.',
        )


class ServiceDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        try:
            profile = ProviderProfile.objects.get(user=self.request.user)
        except ProviderProfile.DoesNotExist:
            return Service.objects.none()
        return Service.objects.filter(provider=profile)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return success_response(message='Service deleted successfully.', status=204)


class TrendingServicesView(generics.ListAPIView):
    serializer_class = ServiceListSerializer
    pagination_class = None

    def get_queryset(self):
        from django.db.models import Count, Avg
        return Service.objects.filter(
            provider__verification_status='approved',
            is_available=True,
        ).annotate(
            booking_count=Count('booking'),
        ).order_by('-booking_count')[:10]
