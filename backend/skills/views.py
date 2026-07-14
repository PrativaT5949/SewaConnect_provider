from rest_framework import generics
from .models import Skill
from .serializers import SkillSerializer, SkillListSerializer
from common.permissions import IsAdmin
from common.responses import success_response


class SkillListView(generics.ListAPIView):
    serializer_class = SkillListSerializer
    pagination_class = None

    def get_queryset(self):
        queryset = Skill.objects.filter(is_active=True)
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        return queryset


class SkillDetailView(generics.RetrieveAPIView):
    queryset = Skill.objects.filter(is_active=True)
    serializer_class = SkillSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return success_response(data=serializer.data)


class SkillCreateView(generics.CreateAPIView):
    serializer_class = SkillSerializer
    permission_classes = [IsAdmin]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        skill = serializer.save()
        return success_response(
            data=SkillSerializer(skill).data,
            message='Skill created successfully.',
            status=201,
        )


class SkillUpdateView(generics.UpdateAPIView):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    permission_classes = [IsAdmin]

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        skill = serializer.save()
        return success_response(
            data=SkillSerializer(skill).data,
            message='Skill updated successfully.',
        )


class SkillDeleteView(generics.DestroyAPIView):
    queryset = Skill.objects.all()
    permission_classes = [IsAdmin]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return success_response(message='Skill deleted successfully.', status=204)