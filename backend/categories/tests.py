from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from .models import Category

User = get_user_model()


class CategoryListViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.cat1 = Category.objects.create(name='Plumbing', icon='🔧', sort_order=1)
        self.cat2 = Category.objects.create(name='Electrical', icon='⚡', sort_order=2, is_active=False)

    def test_list_active_categories(self):
        response = self.client.get('/api/categories/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Plumbing')

    def test_category_detail_by_slug(self):
        response = self.client.get(f'/api/categories/{self.cat1.slug}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['data']['name'], 'Plumbing')

    def test_inactive_category_not_in_detail(self):
        response = self.client.get(f'/api/categories/{self.cat2.slug}/')
        self.assertEqual(response.status_code, 404)


class CategoryAdminTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            email='admin@test.com', first_name='A', last_name='B',
            phone_number='9800000999', password='AdminPass123!'
        )
        login = self.client.post('/api/auth/login/', {
            'email': 'admin@test.com', 'password': 'AdminPass123!'
        }, format='json')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {login.data["access"]}')

    def test_admin_create_category(self):
        response = self.client.post('/api/categories/create/', {
            'name': 'Carpentry',
            'icon': '🪚',
            'description': 'Wood work services',
        }, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Category.objects.filter(name='Carpentry').exists())

    def test_admin_update_category(self):
        cat = Category.objects.create(name='Old Name')
        response = self.client.put(f'/api/categories/{cat.slug}/update/', {
            'name': 'New Name',
            'icon': '🔧',
            'sort_order': 5,
            'is_active': True,
        }, format='json')
        self.assertEqual(response.status_code, 200)
        cat.refresh_from_db()
        self.assertEqual(cat.name, 'New Name')

    def test_admin_delete_category(self):
        cat = Category.objects.create(name='ToDelete')
        response = self.client.delete(f'/api/categories/{cat.slug}/delete/')
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Category.objects.filter(name='ToDelete').exists())

    def test_non_admin_cannot_create(self):
        user = User.objects.create_user(
            email='user@test.com', first_name='U', last_name='S',
            phone_number='9800000888', password='UserPass123!'
        )
        login = self.client.post('/api/auth/login/', {
            'email': 'user@test.com', 'password': 'UserPass123!'
        }, format='json')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {login.data["access"]}')
        response = self.client.post('/api/categories/create/', {
            'name': 'Hacking', 'icon': '💀',
        }, format='json')
        self.assertEqual(response.status_code, 403)
