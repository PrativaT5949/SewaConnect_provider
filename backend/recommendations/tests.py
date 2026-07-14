from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from categories.models import Category
from skills.models import Skill
from providers.models import ProviderProfile, ProviderSkill, ProviderWorkingDay
from .services import haversine_distance, calculate_recommendation_score
from .models import RecommendationScore

User = get_user_model()


class HaversineTests(TestCase):
    def test_same_point_distance_zero(self):
        dist = haversine_distance(27.7172, 85.3240, 27.7172, 85.3240)
        self.assertAlmostEqual(dist, 0, places=1)

    def test_known_distance(self):
        dist = haversine_distance(27.7172, 85.3240, 28.2096, 84.0000)
        self.assertGreater(dist, 50)
        self.assertLess(dist, 200)

    def test_none_coordinates(self):
        dist = haversine_distance(None, None, 27.7172, 85.3240)
        self.assertEqual(dist, 50.0)


class RecommendationAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.cat = Category.objects.create(name='Plumbing', icon='🔧')

        self.user1 = User.objects.create_user(
            email='prov1@test.com', first_name='P1', last_name='Provider',
            phone_number='9800000100', latitude=27.7172, longitude=85.3240,
        )
        self.profile1 = ProviderProfile.objects.create(
            user=self.user1, hourly_rate=500, experience_years=5,
            average_rating=4.5, completed_bookings=50,
            verification_status='approved', response_rate=95,
        )

        self.user2 = User.objects.create_user(
            email='prov2@test.com', first_name='P2', last_name='Provider',
            phone_number='9800000200', latitude=27.7200, longitude=85.3300,
        )
        self.profile2 = ProviderProfile.objects.create(
            user=self.user2, hourly_rate=300, experience_years=10,
            average_rating=4.8, completed_bookings=100,
            verification_status='approved', response_rate=98,
        )

        for p in [self.profile1, self.profile2]:
            for day in ['mon', 'tue', 'wed', 'thu', 'fri']:
                ProviderWorkingDay.objects.create(provider=p, day=day, is_available=True)

    def test_recommendation_list(self):
        response = self.client.get('/api/recommendations/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 2)
        self.assertGreater(
            response.data['results'][0]['scores']['total_score'],
            response.data['results'][1]['scores']['total_score']
        )

    def test_recommendation_with_category_filter(self):
        Skill.objects.create(category=self.cat, name='Pipes')
        ProviderSkill.objects.create(provider=self.profile1, skill=Skill.objects.first())
        response = self.client.get(f'/api/recommendations/?category={self.cat.id}')
        self.assertEqual(response.status_code, 200)

    def test_score_calculation(self):
        scores = calculate_recommendation_score(
            self.profile1, user_lat=27.7172, user_lon=85.3240
        )
        self.assertIn('total_score', scores)
        self.assertGreater(float(scores['total_score']), 0)

    def test_recommendation_explanation(self):
        scores = calculate_recommendation_score(
            self.profile2, user_lat=27.7200, user_lon=85.3300
        )
        from .services import get_recommendation_explanation
        reasons = get_recommendation_explanation(self.profile2, scores)
        self.assertIsInstance(reasons, list)
        self.assertGreater(len(reasons), 0)
