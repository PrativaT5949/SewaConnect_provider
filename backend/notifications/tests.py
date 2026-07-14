from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from .models import Notification

User = get_user_model()


class NotificationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='user@test.com', first_name='U', last_name='S',
            phone_number='9800000100', password='TestPass123!',
        )
        self.sender = User.objects.create_user(
            email='sender@test.com', first_name='S', last_name='R',
            phone_number='9800000200', password='TestPass123!',
        )
        self.notif = Notification.objects.create(
            recipient=self.user, sender=self.sender,
            title='Test', message='Hello',
            type='system',
        )
        login = self.client.post('/api/auth/login/', {
            'email': 'user@test.com', 'password': 'TestPass123!'
        }, format='json')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {login.data["access"]}')

    def test_list_notifications(self):
        response = self.client.get('/api/notifications/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 1)

    def test_mark_read(self):
        response = self.client.patch(f'/api/notifications/{self.notif.id}/read/')
        self.assertEqual(response.status_code, 200)
        self.notif.refresh_from_db()
        self.assertTrue(self.notif.is_read)

    def test_mark_all_read(self):
        Notification.objects.create(
            recipient=self.user, title='N2', message='M2', type='system',
        )
        response = self.client.patch('/api/notifications/read-all/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.user.notifications.filter(is_read=False).count(), 0)

    def test_unread_count(self):
        Notification.objects.create(
            recipient=self.user, title='N2', message='M2', type='system',
        )
        response = self.client.get('/api/notifications/unread-count/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['data']['count'], 2)
