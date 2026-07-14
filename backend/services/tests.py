from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from categories.models import Category
from providers.models import ProviderProfile
from .models import Service

User = get_user_model()


class ServiceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.provider_user = User.objects.create_user(
            email='prov@test.com', first_name='Pro', last_name='Vider',
            phone_number='9800000100', password='ProviderPass123!', role='provider'
        )
        self.profile = ProviderProfile.objects.create(
            user=self.provider_user, hourly_rate=500, verification_status='approved'
        )
        self.category = Category.objects.create(name='Plumbing', icon='🔧')
        self.service = Service.objects.create(
            provider=self.profile, category=self.category,
            title='Pipe Repair', description='Fix pipes',
            price=500, price_type='fixed',
        )
        login = self.client.post('/api/auth/login/', {
            'email': 'prov@test.com', 'password': 'ProviderPass123!'
        }, format='json')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {login.data["access"]}')

    def test_list_services(self):
        client = APIClient()
        response = client.get('/api/services/')
        self.assertEqual(response.status_code, 200)

    def test_create_service(self):
        response = self.client.post('/api/services/create/', {
            'category': self.category.id,
            'title': 'Drain Cleaning',
            'description': 'Clean drains',
            'price': 300,
            'price_type': 'fixed',
        }, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Service.objects.filter(title='Drain Cleaning').exists())

    def test_my_services(self):
        response = self.client.get('/api/services/my/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_update_service(self):
        response = self.client.patch(f'/api/services/{self.service.id}/update/', {
            'price': 600,
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.service.refresh_from_db()
        self.assertEqual(float(self.service.price), 600)

    def test_delete_service(self):
        response = self.client.delete(f'/api/services/{self.service.id}/delete/')
        self.assertEqual(response.status_code, 204)

    def test_provider_cannot_manage_other_service(self):
        other_user = User.objects.create_user(
            email='other@test.com', first_name='O', last_name='T',
            phone_number='9800000300', password='Pass123!'
        )
        other_profile = ProviderProfile.objects.create(user=other_user, hourly_rate=400)
        other_service = Service.objects.create(
            provider=other_profile, category=self.category,
            title='Other Service', price=100,
        )
        response = self.client.delete(f'/api/services/{other_service.id}/delete/')
        self.assertEqual(response.status_code, 404)
