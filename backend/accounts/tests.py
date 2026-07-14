from django.test import TestCase, override_settings
from django.test.utils import setup_test_environment
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


class RegisterTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.valid_data = {
            'email': 'newuser@test.com',
            'first_name': 'New',
            'last_name': 'User',
            'phone_number': '9800000010',
            'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
        }

    def test_register_success(self):
        response = self.client.post('/api/auth/register/', self.valid_data, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['status'], 'success')
        self.assertTrue(User.objects.filter(email='newuser@test.com').exists())

    def test_register_duplicate_email(self):
        User.objects.create_user(
            email='dup@test.com', first_name='D', last_name='U',
            phone_number='9800000011', password='TestPass123!'
        )
        data = self.valid_data.copy()
        data['email'] = 'dup@test.com'
        response = self.client.post('/api/auth/register/', data, format='json')
        self.assertEqual(response.status_code, 400)

    def test_register_password_mismatch(self):
        data = self.valid_data.copy()
        data['password_confirm'] = 'DifferentPass123!'
        response = self.client.post('/api/auth/register/', data, format='json')
        self.assertEqual(response.status_code, 400)

    def test_register_missing_fields(self):
        response = self.client.post('/api/auth/register/', {}, format='json')
        self.assertEqual(response.status_code, 400)


class LoginTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='login@test.com', first_name='Login', last_name='User',
            phone_number='9800000020', password='TestPass123!'
        )

    def test_login_success(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'login@test.com', 'password': 'TestPass123!'
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_wrong_password(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'login@test.com', 'password': 'WrongPass'
        }, format='json')
        self.assertEqual(response.status_code, 401)

    def test_login_nonexistent_user(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'noone@test.com', 'password': 'TestPass123!'
        }, format='json')
        self.assertEqual(response.status_code, 401)


class MeTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='me@test.com', first_name='Me', last_name='User',
            phone_number='9800000030', password='TestPass123!'
        )
        login_response = self.client.post('/api/auth/login/', {
            'email': 'me@test.com', 'password': 'TestPass123!'
        }, format='json')
        self.token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_get_me(self):
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['data']['email'], 'me@test.com')

    def test_update_me(self):
        response = self.client.patch('/api/auth/me/', {
            'first_name': 'Updated'
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Updated')

    def test_unauthenticated_access(self):
        client = APIClient()
        response = client.get('/api/auth/me/')
        self.assertEqual(response.status_code, 401)
