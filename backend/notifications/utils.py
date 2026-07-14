from .models import Notification


def create_notification(recipient, title, message, type='system', sender=None, reference_id=None):
    """Create a notification."""
    return Notification.objects.create(
        recipient=recipient,
        sender=sender,
        title=title,
        message=message,
        type=type,
        reference_id=reference_id,
    )
