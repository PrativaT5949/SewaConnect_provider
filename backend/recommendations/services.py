import math
from datetime import date, timedelta
from decimal import Decimal
from django.db.models import Q, Count, F
from django.conf import settings

from providers.models import ProviderProfile, ProviderWorkingDay
from favorites.models import Favorite
from reviews.models import Review
from .models import RecommendationScore


# Configurable weights — can be overridden via Django settings
RECOMMENDATION_WEIGHTS = getattr(settings, 'RECOMMENDATION_WEIGHTS', {
    'distance': 0.20,
    'rating': 0.25,
    'experience': 0.15,
    'price': 0.10,
    'availability': 0.10,
    'response_rate': 0.10,
    'favorites': 0.05,
    'activity': 0.05,
})

MAX_DISTANCE_KM = 50.0
MAX_EXPERIENCE_YEARS = 20
MAX_PRICE = 10000.0
MAX_COMPLETED_JOBS = 500


def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate distance in km between two points using Haversine formula."""
    if None in (lat1, lon1, lat2, lon2):
        return MAX_DISTANCE_KM

    R = 6371.0
    lat1_r = math.radians(float(lat1))
    lat2_r = math.radians(float(lat2))
    dlat = math.radians(float(lat2) - float(lat1))
    dlon = math.radians(float(lon2) - float(lon1))

    a = math.sin(dlat / 2) ** 2 + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def score_distance(distance_km):
    """Closer = higher score. 0km = 100, >=50km = 0."""
    return max(0, (1 - distance_km / MAX_DISTANCE_KM)) * 100


def score_rating(average_rating):
    """Rating 0-5 mapped to 0-100."""
    return (float(average_rating) / 5.0) * 100


def score_experience(years):
    """More experience = higher score, capped at 20 years."""
    return min(years / MAX_EXPERIENCE_YEARS, 1.0) * 100


def score_price(hourly_rate, target_price=None):
    """Lower price = higher score. If target_price provided, closest to target wins."""
    rate = float(hourly_rate)
    if target_price and target_price > 0:
        diff = abs(rate - target_price) / target_price
        return max(0, (1 - diff)) * 100
    return max(0, (1 - rate / MAX_PRICE)) * 100


def score_availability(provider):
    """Check if provider is available today and has working days configured."""
    today = date.today()
    day_abbr = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][today.weekday()]

    try:
        working_day = provider.working_days.get(day=day_abbr)
        if working_day.is_available:
            return 100.0
        return 20.0
    except ProviderWorkingDay.DoesNotExist:
        return 50.0


def score_response_rate(rate):
    """Response rate percentage mapped to 0-100."""
    return float(rate)


def score_favorites(provider, customer=None):
    """More favorites = higher score. Boost if current customer favorited."""
    fav_count = provider.favorited_by.count()
    base_score = min(fav_count / 50.0, 1.0) * 80

    if customer and Favorite.objects.filter(customer=customer, provider=provider).exists():
        base_score += 20

    return min(base_score, 100.0)


def score_activity(provider):
    """Recent bookings and reviews indicate activity."""
    recent_bookings = provider.provider_bookings.filter(
        created_at__gte=timezone_now() - timedelta(days=30)
    ).count()
    recent_reviews = provider.reviews_received.filter(
        created_at__gte=timezone_now() - timedelta(days=30)
    ).count()
    activity = recent_bookings + recent_reviews * 2
    return min(activity / 10.0, 1.0) * 100


def timezone_now():
    from django.utils import timezone
    return timezone.now()


def calculate_recommendation_score(provider, user_lat=None, user_lon=None, customer=None, target_price=None):
    """Calculate total recommendation score for a provider."""
    distance = haversine_distance(user_lat, user_lon, provider.user.latitude, provider.user.longitude)

    scores = {
        'distance_score': score_distance(distance),
        'rating_score': score_rating(provider.average_rating),
        'experience_score': score_experience(provider.experience_years),
        'price_score': score_price(provider.hourly_rate, target_price),
        'availability_score': score_availability(provider),
        'response_rate_score': score_response_rate(provider.response_rate),
        'favorites_score': score_favorites(provider, customer),
        'activity_score': score_activity(provider),
    }

    score_weight_map = {
        'distance_score': 'distance',
        'rating_score': 'rating',
        'experience_score': 'experience',
        'price_score': 'price',
        'availability_score': 'availability',
        'response_rate_score': 'response_rate',
        'favorites_score': 'favorites',
        'activity_score': 'activity',
    }

    total = sum(
        scores[key] * RECOMMENDATION_WEIGHTS[score_weight_map[key]]
        for key in scores
    )

    scores['total_score'] = round(total, 2)
    scores['distance_km'] = round(distance, 2)

    return scores


def get_recommendation_explanation(provider, scores):
    """Generate human-readable recommendation reasons."""
    reasons = []
    distance = scores.get('distance_km', 0)
    if distance < MAX_DISTANCE_KM:
        reasons.append(f'{distance} km away')

    rating = float(provider.average_rating)
    if rating > 0:
        reasons.append(f'Rated {rating}/5')

    if provider.completed_bookings > 0:
        reasons.append(f'Completed {provider.completed_bookings} jobs')

    if provider.experience_years > 0:
        reasons.append(f'{provider.experience_years} years experience')

    if scores.get('availability_score', 0) == 100:
        reasons.append('Available today')

    return reasons


def get_recommended_providers(
    category_id=None, user_lat=None, user_lon=None,
    customer=None, target_price=None, limit=20
):
    """Get top recommended providers with scores and explanations."""
    queryset = ProviderProfile.objects.filter(
        verification_status='approved',
    ).select_related('user')

    if category_id:
        queryset = queryset.filter(
            Q(provider_skills__skill__category_id=category_id) |
            Q(services__category_id=category_id)
        ).distinct()

    results = []
    for provider in queryset:
        scores = calculate_recommendation_score(
            provider, user_lat, user_lon, customer, target_price
        )
        explanation = get_recommendation_explanation(provider, scores)
        results.append({
            'provider': provider,
            'scores': scores,
            'explanation': explanation,
        })

    results.sort(key=lambda x: x['scores']['total_score'], reverse=True)

    return results[:limit]


def update_provider_score(provider):
    """Recalculate and cache a provider's recommendation score."""
    scores = calculate_recommendation_score(provider)

    score_obj, created = RecommendationScore.objects.update_or_create(
        provider=provider,
        defaults={
            'distance_score': scores['distance_score'],
            'rating_score': scores['rating_score'],
            'experience_score': scores['experience_score'],
            'price_score': scores['price_score'],
            'availability_score': scores['availability_score'],
            'response_rate_score': scores['response_rate_score'],
            'favorites_score': scores['favorites_score'],
            'activity_score': scores['activity_score'],
            'total_score': scores['total_score'],
            'last_calculated': timezone_now(),
        }
    )
    return score_obj


def update_all_scores():
    """Recalculate scores for all approved providers."""
    providers = ProviderProfile.objects.filter(verification_status='approved')
    for provider in providers:
        update_provider_score(provider)
    return providers.count()
