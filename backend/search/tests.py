from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from categories.models import Category
from skills.models import Skill
from providers.models import ProviderProfile, ProviderSkill, ProviderWorkingDay
from services.models import Service

User = get_user_model()


class SearchTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.cat = Category.objects.create(name='Plumbing', icon='🔧')
        self.skill = Skill.objects.create(category=self.cat, name='Pipe Repair')

        self.user1 = User.objects.create_user(
            email='prov1@test.com', first_name='Rajan', last_name='Kumar',
            phone_number='9800000100', city='Kathmandu',
            latitude=27.7172, longitude=85.3240,
        )
        self.profile1 = ProviderProfile.objects.create(
            user=self.user1, hourly_rate=500, experience_years=5,
            average_rating=4.5, verification_status='approved',
        )
        ProviderSkill.objects.create(provider=self.profile1, skill=self.skill, years_of_experience=3)
        Service.objects.create(
            provider=self.profile1, category=self.cat,
            title='Pipe Repair Service', description='Fix pipes',
            price=500, price_type='fixed',
        )

        self.user2 = User.objects.create_user(
            email='prov2@test.com', first_name='Suresh', last_name='Sharma',
            phone_number='9800000200', city='Lalitpur',
            latitude=27.6600, longitude=85.3200,
        )
        self.profile2 = ProviderProfile.objects.create(
            user=self.user2, hourly_rate=700, experience_years=10,
            average_rating=4.8, verification_status='approved',
        )

    def test_search_by_keyword(self):
        response = self.client.get('/api/search/?q=Rajan')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['provider']['user_full_name'], 'Rajan Kumar')

    def test_search_by_service(self):
        response = self.client.get('/api/search/?q=Pipe')
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.data['count'], 1)

    def test_search_by_city(self):
        response = self.client.get('/api/search/?city=Kathmandu')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)

    def test_search_by_price_range(self):
        response = self.client.get('/api/search/?min_price=400&max_price=600')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)

    def test_search_by_category(self):
        response = self.client.get(f'/api/search/?category={self.cat.id}')
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.data['count'], 1)

    def test_empty_search(self):
        response = self.client.get('/api/search/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 2)

    def test_no_results(self):
        response = self.client.get('/api/search/?q=nonexistent')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 0)

    def test_search_sorted_by_score(self):
        response = self.client.get('/api/search/?lat=27.7172&lon=85.3240')
        self.assertEqual(response.status_code, 200)
        if response.data['count'] == 2:
            self.assertGreaterEqual(
                response.data['results'][0]['total_score'],
                response.data['results'][1]['total_score']
            )
