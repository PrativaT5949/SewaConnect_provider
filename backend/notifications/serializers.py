from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'sender', 'sender_name', 'title', 'message',
            'type', 'reference_id', 'is_read', 'created_at',
        ]
        read_only_fields = ['id', 'recipient', 'sender', 'created_at']

    def get_sender_name(self, obj):
        if obj.sender:
            return obj.sender.full_name
        return 'System'


class UnreadCountSerializer(serializers.Serializer):
    count = serializers.IntegerField()
