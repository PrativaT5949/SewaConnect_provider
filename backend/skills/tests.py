from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from categories.models import Category
from .models import Skill

User = get_user_model()


class SkillListViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.cat = Category.objects.create(name='Plumbing', icon='🔧')
        self.skill1 = Skill.objects.create(category=self.cat, name='Pipe Repair')
        self.skill2 = Skill.objects.create(category=self.cat, name='Leak Fix', is_active=False)

    def test_list_active_skills(self):
        response = self.client.get('/api/skills/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_filter_by_category(self):
        cat2 = Category.objects.create(name='Electrical', icon='⚡')
        Skill.objects.create(category=cat2, name='Wiring')
        response = self.client.get(f'/api/skills/?category={self.cat.id}')
        self.assertEqual(len(response.data), 1)

    def test_skill_detail(self):
        response = self.client.get(f'/api/skills/{self.skill1.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['data']['name'], 'Pipe Repair')


class SkillAdminTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            email='admin@test.com', first_name='A', last_name='B',
            phone_number='9800000999', password='AdminPass123!'
        )
        self.cat = Category.objects.create(name='Plumbing', icon='🔧')
        login = self.client.post('/api/auth/login/', {
            'email': 'admin@test.com', 'password': 'AdminPass123!'
        }, format='json')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {login.data["access"]}')

    def test_admin_create_skill(self):
        response = self.client.post('/api/skills/create/', {
            'category': self.cat.id,
            'name': 'Drain Cleaning',
            'description': 'Clean and unclog drains',
        }, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Skill.objects.filter(name='Drain Cleaning').exists())

    def test_admin_delete_skill(self):
        skill = Skill.objects.create(category=self.cat, name='ToDelete')
        response = self.client.delete(f'/api/skills/{skill.id}/delete/')
        self.assertEqual(response.status_code, 204)

    def test_non_admin_cannot_create(self):
        user = User.objects.create_user(
            email='user@test.com', first_name='U', last_name='S',
            phone_number='9800000888', password='UserPass123!'
        )
        login = self.client.post('/api/auth/login/', {
            'email': 'user@test.com', 'password': 'UserPass123!'
        }, format='json')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {login.data["access"]}')
        response = self.client.post('/api/skills/create/', {
            'category': self.cat.id, 'name': 'Hack',
        }, format='json')
        self.assertEqual(response.status_code, 403)
