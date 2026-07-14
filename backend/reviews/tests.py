from datetime import date, timedelta, time
from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from categories.models import Category
from providers.models import ProviderProfile
from bookings.models import Booking
from .models import Review
from .views import recalculate_provider_rating

User = get_user_model()


class ReviewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = User.objects.create_user(
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
        self.category = Category.objects.create(name='Plumbing', icon='🔧')

        self.completed_booking = Booking.objects.create(
            booking_code='SC-2026-REV1', customer=self.customer, provider=self.profile,
            category=self.category, status='completed',
            booking_date=date.today(), booking_time=time(10, 0),
            address='Test', latitude=27.7172, longitude=85.3240, total_price=500,
        )
        self.pending_booking = Booking.objects.create(
            booking_code='SC-2026-REV2', customer=self.customer, provider=self.profile,
            category=self.category, status='pending',
            booking_date=date.today(), booking_time=time(14, 0),
            address='Test', latitude=27.7172, longitude=85.3240, total_price=500,
        )

        login = self.client.post('/api/auth/login/', {
            'email': 'cust@test.com', 'password': 'TestPass123!'
        }, format='json')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {login.data["access"]}')

    def test_create_review(self):
        response = self.client.post('/api/reviews/', {
            'booking_id': self.completed_booking.id,
            'rating': 5,
            'comment': 'Excellent service!',
        }, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Review.objects.filter(booking=self.completed_booking).exists())

    def test_cannot_review_pending_booking(self):
        response = self.client.post('/api/reviews/', {
            'booking_id': self.pending_booking.id,
            'rating': 5,
            'comment': 'Great!',
        }, format='json')
        self.assertEqual(response.status_code, 400)

    def test_cannot_review_twice(self):
        Review.objects.create(
            booking=self.completed_booking, customer=self.customer,
            provider=self.profile, rating=5, comment='Already reviewed',
        )
        response = self.client.post('/api/reviews/', {
            'booking_id': self.completed_booking.id,
            'rating': 4,
            'comment': 'Second review',
        }, format='json')
        self.assertEqual(response.status_code, 400)

    def test_rating_recalculation(self):
        Review.objects.create(
            booking=self.completed_booking, customer=self.customer,
            provider=self.profile, rating=4, comment='Good',
        )
        recalculate_provider_rating(self.profile)
        self.profile.refresh_from_db()
        self.assertEqual(float(self.profile.average_rating), 4.0)
        self.assertEqual(self.profile.total_reviews, 1)

    def test_provider_reviews_list(self):
        Review.objects.create(
            booking=self.completed_booking, customer=self.customer,
            provider=self.profile, rating=5, comment='Great',
        )
        response = self.client.get(f'/api/reviews/provider/{self.profile.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
