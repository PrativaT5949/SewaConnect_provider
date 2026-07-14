from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from categories.models import Category
from skills.models import Skill
from .models import ProviderProfile, ProviderSkill, ProviderWorkingDay

User = get_user_model()


class ProviderRegistrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='prov@test.com', first_name='Pro', last_name='Vider',
            phone_number='9800000100', password='ProviderPass123!', role='provider'
        )
        login = self.client.post('/api/auth/login/', {
            'email': 'prov@test.com', 'password': 'ProviderPass123!'
        }, format='json')
        self.token = login.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_create_provider_profile(self):
        response = self.client.post('/api/providers/profile/create/', {
            'bio': 'Expert plumber',
            'tagline': 'I fix pipes',
            'experience_years': 5,
            'hourly_rate': 500.00,
            'working_start_time': '08:00',
            'working_end_time': '18:00',
        }, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertTrue(ProviderProfile.objects.filter(user=self.user).exists())
        self.assertEqual(ProviderWorkingDay.objects.filter(provider__user=self.user).count(), 7)

    def test_cannot_create_duplicate_profile(self):
        ProviderProfile.objects.create(user=self.user, hourly_rate=500)
        response = self.client.post('/api/providers/profile/create/', {
            'bio': 'Second profile', 'hourly_rate': 600,
        }, format='json')
        self.assertEqual(response.status_code, 400)

    def test_update_provider_profile(self):
        profile = ProviderProfile.objects.create(user=self.user, hourly_rate=500)
        response = self.client.patch('/api/providers/profile/', {
            'bio': 'Updated bio',
            'hourly_rate': 750,
        }, format='json')
        self.assertEqual(response.status_code, 200)
        profile.refresh_from_db()
        self.assertEqual(profile.bio, 'Updated bio')
        self.assertEqual(float(profile.hourly_rate), 750)

    def test_get_provider_profile(self):
        ProviderProfile.objects.create(user=self.user, hourly_rate=500)
        response = self.client.get('/api/providers/profile/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['data']['user_full_name'], 'Pro Vider')


class ProviderSkillTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='prov@test.com', first_name='Pro', last_name='Vider',
            phone_number='9800000100', password='ProviderPass123!', role='provider'
        )
        self.profile = ProviderProfile.objects.create(user=self.user, hourly_rate=500)
        self.category = Category.objects.create(name='Plumbing', icon='🔧')
        self.skill = Skill.objects.create(category=self.category, name='Pipe Repair')
        login = self.client.post('/api/auth/login/', {
            'email': 'prov@test.com', 'password': 'ProviderPass123!'
        }, format='json')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {login.data["access"]}')

    def test_add_skill(self):
        response = self.client.post('/api/providers/skills/', {
            'skill': self.skill.id,
            'years_of_experience': 3,
        }, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertTrue(ProviderSkill.objects.filter(provider=self.profile, skill=self.skill).exists())

    def test_delete_skill(self):
        ps = ProviderSkill.objects.create(provider=self.profile, skill=self.skill, years_of_experience=3)
        response = self.client.delete(f'/api/providers/skills/{ps.id}/')
        self.assertEqual(response.status_code, 204)

    def test_no_profile_cannot_add_skill(self):
        user2 = User.objects.create_user(
            email='noprof@test.com', first_name='No', last_name='Prof',
            phone_number='9800000200', password='Pass123!'
        )
        login = self.client.post('/api/auth/login/', {
            'email': 'noprof@test.com', 'password': 'Pass123!'
        }, format='json')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {login.data["access"]}')
        response = self.client.post('/api/providers/skills/', {
            'skill': self.skill.id, 'years_of_experience': 1,
        }, format='json')
        self.assertEqual(response.status_code, 404)


class ProviderPublicViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='prov@test.com', first_name='Pro', last_name='Vider',
            phone_number='9800000100', password='ProviderPass123!'
        )
        self.approved = ProviderProfile.objects.create(
            user=self.user, hourly_rate=500, verification_status='approved'
        )

    def test_list_approved_providers(self):
        response = self.client.get('/api/providers/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 1)

    def test_provider_detail(self):
        response = self.client.get(f'/api/providers/{self.approved.id}/')
        self.assertEqual(response.status_code, 200)


class AdminProviderTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            email='admin@test.com', first_name='A', last_name='B',
            phone_number='9800000999', password='AdminPass123!'
        )
        self.user = User.objects.create_user(
            email='prov@test.com', first_name='Pro', last_name='Vider',
            phone_number='9800000100', password='ProviderPass123!'
        )
        self.profile = ProviderProfile.objects.create(user=self.user, hourly_rate=500)
        login = self.client.post('/api/auth/login/', {
            'email': 'admin@test.com', 'password': 'AdminPass123!'
        }, format='json')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {login.data["access"]}')

    def test_admin_list_providers(self):
        response = self.client.get('/api/providers/admin/')
        self.assertEqual(response.status_code, 200)

    def test_admin_approve_provider(self):
        response = self.client.patch(f'/api/providers/admin/{self.profile.id}/approve/', {
            'notes': 'Documents verified'
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.verification_status, 'approved')

    def test_admin_reject_provider(self):
        response = self.client.patch(f'/api/providers/admin/{self.profile.id}/reject/', {
            'notes': 'Invalid documents'
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.verification_status, 'rejected')
