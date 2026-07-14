from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from providers.models import ProviderProfile
from .models import Favorite

User = get_user_model()


class FavoriteTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='cust@test.com', first_name='C', last_name='U',
            phone_number='9800000100', password='TestPass123!',
        )
        self.provider_user = User.objects.create_user(
            email='prov@test.com', first_name='P', last_name='R',
            phone_number='9800000200', password='TestPass123!',
        )
        self.profile = ProviderProfile.objects.create(
            user=self.provider_user, hourly_rate=500, verification_status='approved',
        )
        login = self.client.post('/api/auth/login/', {
            'email': 'cust@test.com', 'password': 'TestPass123!'
        }, format='json')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {login.data["access"]}')

    def test_add_favorite(self):
        response = self.client.post('/api/favorites/add/', {'provider': self.profile.id}, format='json')
        self.assertEqual(response.status_code, 201)

    def test_duplicate_favorite(self):
        Favorite.objects.create(customer=self.user, provider=self.profile)
        response = self.client.post('/api/favorites/add/', {'provider': self.profile.id}, format='json')
        self.assertEqual(response.status_code, 400)

    def test_list_favorites(self):
        Favorite.objects.create(customer=self.user, provider=self.profile)
        response = self.client.get('/api/favorites/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 1)

    def test_remove_favorite(self):
        fav = Favorite.objects.create(customer=self.user, provider=self.profile)
        response = self.client.delete(f'/api/favorites/{fav.id}/')
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Favorite.objects.filter(id=fav.id).exists())
