from rest_framework import serializers
from .models import Skill


class SkillSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Skill
        fields = ['id', 'category', 'category_name', 'name', 'description', 'is_active']
        read_only_fields = ['id']


class SkillListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Skill
        fields = ['id', 'category', 'category_name', 'name']
