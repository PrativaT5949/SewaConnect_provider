from datetime import date, timedelta, time
from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from categories.models import Category
from providers.models import ProviderProfile, ProviderWorkingDay
from services.models import Service
from .models import Booking, BookingStatusLog
from .services import (
    check_booking_conflict, has_active_booking_with_provider,
    accept_booking, reject_booking, complete_booking, cancel_booking,
)

User = get_user_model()


class BookingConflictTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='cust@test.com', first_name='C', last_name='U',
            phone_number='9800000100', password='TestPass123!',
            latitude=27.7172, longitude=85.3240,
        )
        self.provider_user = User.objects.create_user(
            email='prov@test.com', first_name='P', last_name='R',
            phone_number='9800000200', password='TestPass123!',
            latitude=27.7172, longitude=85.3240,
        )
        self.profile = ProviderProfile.objects.create(
            user=self.provider_user, hourly_rate=500, verification_status='approved',
        )
        self.category = Category.objects.create(name='Plumbing', icon='🔧')
        self.service = Service.objects.create(
            provider=self.profile, category=self.category,
            title='Fix Pipe', price=500,
        )
        self.today = date.today()
        self.time1 = time(10, 0)

    def test_no_conflict_when_none(self):
        has_conflict, _ = check_booking_conflict(self.profile, self.today, self.time1)
        self.assertFalse(has_conflict)

    def test_conflict_detects_overlap(self):
        Booking.objects.create(
            booking_code='SC-2026-TEST1', customer=self.user, provider=self.profile,
            category=self.category, status='accepted',
            booking_date=self.today, booking_time=self.time1,
            address='Test', latitude=27.7172, longitude=85.3240, total_price=500,
        )
        has_conflict, _ = check_booking_conflict(self.profile, self.today, self.time1)
        self.assertTrue(has_conflict)

    def test_no_conflict_different_time(self):
        Booking.objects.create(
            booking_code='SC-2026-TEST2', customer=self.user, provider=self.profile,
            category=self.category, status='accepted',
            booking_date=self.today, booking_time=time(10, 0),
            address='Test', latitude=27.7172, longitude=85.3240, total_price=500,
        )
        has_conflict, _ = check_booking_conflict(self.profile, self.today, time(14, 0))
        self.assertFalse(has_conflict)

    def test_one_active_booking_rule(self):
        Booking.objects.create(
            booking_code='SC-2026-TEST3', customer=self.user, provider=self.profile,
            category=self.category, status='pending',
            booking_date=self.today + timedelta(days=1), booking_time=time(10, 0),
            address='Test', latitude=27.7172, longitude=85.3240, total_price=500,
        )
        self.assertTrue(has_active_booking_with_provider(self.user, self.profile))

    def test_no_active_booking_after_completion(self):
        Booking.objects.create(
            booking_code='SC-2026-TEST4', customer=self.user, provider=self.profile,
            category=self.category, status='completed',
            booking_date=self.today - timedelta(days=1), booking_time=time(10, 0),
            address='Test', latitude=27.7172, longitude=85.3240, total_price=500,
        )
        self.assertFalse(has_active_booking_with_provider(self.user, self.profile))


class BookingLifecycleTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = User.objects.create_user(
            email='cust2@test.com', first_name='C', last_name='U',
            phone_number='9800000100', password='TestPass123!',
            latitude=27.7172, longitude=85.3240,
        )
        self.provider_user = User.objects.create_user(
            email='prov2@test.com', first_name='P', last_name='R',
            phone_number='9800000200', password='TestPass123!',
            latitude=27.7172, longitude=85.3240,
        )
        self.profile = ProviderProfile.objects.create(
            user=self.provider_user, hourly_rate=500, verification_status='approved',
        )
        self.category = Category.objects.create(name='Plumbing', icon='🔧')

        for day in ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']:
            ProviderWorkingDay.objects.create(provider=self.profile, day=day, is_available=True)

        self.today = date.today() + timedelta(days=1)
        while self.today.weekday() >= 5:
            self.today += timedelta(days=1)

        self.booking = Booking.objects.create(
            booking_code='SC-2026-LIFE1', customer=self.customer, provider=self.profile,
            category=self.category, status='pending',
            booking_date=self.today, booking_time=time(10, 0),
            address='Kathmandu', latitude=27.7172, longitude=85.3240, total_price=500,
        )

    def test_full_lifecycle(self):
        login = self.client.post('/api/auth/login/', {
            'email': 'prov2@test.com', 'password': 'TestPass123!'
        }, format='json')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {login.data["access"]}')

        response = self.client.patch(f'/api/bookings/{self.booking.id}/accept/', format='json')
        self.assertEqual(response.status_code, 200)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'accepted')

        response = self.client.patch(f'/api/bookings/{self.booking.id}/start/', format='json')
        self.assertEqual(response.status_code, 200)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'in_progress')

        response = self.client.patch(f'/api/bookings/{self.booking.id}/complete/', format='json')
        self.assertEqual(response.status_code, 200)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'completed')

        self.profile.refresh_from_db()
        self.assertEqual(self.profile.completed_bookings, 1)

    def test_customer_cancel(self):
        login = self.client.post('/api/auth/login/', {
            'email': 'cust2@test.com', 'password': 'TestPass123!'
        }, format='json')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {login.data["access"]}')

        response = self.client.patch(f'/api/bookings/{self.booking.id}/cancel/', format='json')
        self.assertEqual(response.status_code, 200)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'cancelled')

    def test_provider_reject_and_reassign(self):
        new_user = User.objects.create_user(
            email='prov3@test.com', first_name='P3', last_name='R3',
            phone_number='9800000300', password='TestPass123!',
            latitude=27.7172, longitude=85.3240,
        )
        new_profile = ProviderProfile.objects.create(
            user=new_user, hourly_rate=400, verification_status='approved',
        )
        for day in ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']:
            ProviderWorkingDay.objects.create(provider=new_profile, day=day, is_available=True)

        login = self.client.post('/api/auth/login/', {
            'email': 'prov2@test.com', 'password': 'TestPass123!'
        }, format='json')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {login.data["access"]}')

        response = self.client.patch(f'/api/bookings/{self.booking.id}/reject/', format='json')
        self.assertEqual(response.status_code, 200)

        self.booking.refresh_from_db()
        self.assertNotEqual(self.booking.status, 'rejected')
