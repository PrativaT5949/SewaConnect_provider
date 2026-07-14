from rest_framework import generics, permissions
from .models import Category
from .serializers import CategorySerializer, CategoryListSerializer
from common.permissions import IsAdmin
from common.responses import success_response


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategoryListSerializer
    pagination_class = None


class CategoryDetailView(generics.RetrieveAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    lookup_field = 'slug'

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return success_response(data=serializer.data)


class CategoryCreateView(generics.CreateAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAdmin]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        category = serializer.save()
        return success_response(
            data=CategorySerializer(category).data,
            message='Category created successfully.',
            status=201,
        )


class CategoryUpdateView(generics.UpdateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdmin]
    lookup_field = 'slug'

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        category = serializer.save()
        return success_response(
            data=CategorySerializer(category).data,
            message='Category updated successfully.',
        )


class CategoryDeleteView(generics.DestroyAPIView):
    queryset = Category.objects.all()
    permission_classes = [IsAdmin]
    lookup_field = 'slug'

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return success_response(message='Category deleted successfully.', status=204)

class AdminCategoryListView(generics.ListAPIView):
    """Full category list for admin panel — includes inactive categories and all fields."""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdmin]
    pagination_class = None