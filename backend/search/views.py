# from rest_framework import generics
# from rest_framework.response import Response
# from django.db.models import Q
# from providers.models import ProviderProfile
# from providers.serializers import ProviderPublicSerializer
# from recommendations.services import calculate_recommendation_score


# class SearchView(generics.GenericAPIView):
#     permission_classes = []  # AllowAny

#     def get(self, request):
#         keyword = request.query_params.get('q', '').strip()
#         category_id = request.query_params.get('category')
#         skill_id = request.query_params.get('skill')
#         city = request.query_params.get('city', '').strip()
#         min_price = request.query_params.get('min_price')
#         max_price = request.query_params.get('max_price')
#         min_rating = request.query_params.get('min_rating')
#         lat = request.query_params.get('lat')
#         lon = request.query_params.get('lon')
#         availability = request.query_params.get('availability')
#         experience = request.query_params.get('experience')

#         queryset = ProviderProfile.objects.filter(
#             verification_status='approved',
#         ).select_related('user')

#         if keyword:
#             queryset = queryset.filter(
#                 Q(user__first_name__icontains=keyword) |
#                 Q(user__last_name__icontains=keyword) |
#                 Q(bio__icontains=keyword) |
#                 Q(tagline__icontains=keyword) |
#                 Q(user__address__icontains=keyword) |
#                 Q(user__city__icontains=keyword) |
#                 Q(services__title__icontains=keyword) |
#                 Q(provider_skills__skill__name__icontains=keyword)
#             ).distinct()

#         # if category_id:
#         #     queryset = queryset.filter(
#         #         Q(provider_skills__skill__category_id=category_id) |
#         #         Q(services__category_id=category_id)
#         #     ).distinct()
#         if category_id:
#             queryset = queryset.filter(
#                 services__category_id=category_id,
#                 services__is_available=True,
#             ).distinct()

#         if skill_id:
#             queryset = queryset.filter(provider_skills__skill_id=skill_id).distinct()

#         if city:
#             queryset = queryset.filter(user__city__icontains=city)

#         if min_price:
#             queryset = queryset.filter(hourly_rate__gte=float(min_price))
#         if max_price:
#             queryset = queryset.filter(hourly_rate__lte=float(max_price))

#         if min_rating:
#             queryset = queryset.filter(average_rating__gte=float(min_rating))

#         if experience:
#             queryset = queryset.filter(experience_years__gte=int(experience))

#         if availability == 'today':
#             from datetime import date
#             day_abbr = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][date.today().weekday()]
#             queryset = queryset.filter(
#                 working_days__day=day_abbr,
#                 working_days__is_available=True,
#             ).distinct()

#         user_lat = float(lat) if lat else None
#         user_lon = float(lon) if lon else None

#         results = []
#         for provider in queryset:
#             scores = calculate_recommendation_score(
#                 provider, user_lat, user_lon
#             )
#             provider_data = ProviderPublicSerializer(provider).data
#             results.append({
#                 'provider': provider_data,
#                 'total_score': float(scores['total_score']),
#                 'distance_km': scores['distance_km'],
#             })

#         results.sort(key=lambda x: x['total_score'], reverse=True)

#         return Response({
#             'status': 'success',
#             'count': len(results),
#             'results': results,
#         })

# added for debug
# from rest_framework import generics
# from rest_framework.response import Response
# from django.db.models import Q

# from providers.models import ProviderProfile
# from providers.serializers import ProviderPublicSerializer
# from recommendations.services import calculate_recommendation_score
# from services.models import Service


# class SearchView(generics.GenericAPIView):
#     permission_classes = []  # AllowAny

#     def get(self, request):
#         # ============================================================
#         # DEBUG 1: Show everything Django received from the frontend
#         # ============================================================
#         print("\n" + "=" * 80)
#         print("SEARCH REQUEST RECEIVED")
#         print("=" * 80)
#         print("QUERY PARAMETERS:", request.query_params)

#         keyword = request.query_params.get('q', '').strip()
#         category_id = request.query_params.get('category')
#         skill_id = request.query_params.get('skill')
#         city = request.query_params.get('city', '').strip()
#         min_price = request.query_params.get('min_price')
#         max_price = request.query_params.get('max_price')
#         min_rating = request.query_params.get('min_rating')
#         lat = request.query_params.get('lat')
#         lon = request.query_params.get('lon')
#         availability = request.query_params.get('availability')
#         experience = request.query_params.get('experience')

#         # ============================================================
#         # DEBUG 2: Show parsed parameters
#         # ============================================================
#         print("\n--- PARSED PARAMETERS ---")
#         print("keyword:", repr(keyword))
#         print("category_id:", repr(category_id))
#         print("skill_id:", repr(skill_id))
#         print("city:", repr(city))
#         print("min_price:", repr(min_price))
#         print("max_price:", repr(max_price))
#         print("min_rating:", repr(min_rating))
#         print("lat:", repr(lat))
#         print("lon:", repr(lon))
#         print("availability:", repr(availability))
#         print("experience:", repr(experience))

#         # ============================================================
#         # Base queryset
#         # ============================================================
#         queryset = ProviderProfile.objects.filter(
#             verification_status='approved',
#         ).select_related('user')

#         print("\n--- INITIAL PROVIDERS ---")
#         print("Initial provider count:", queryset.count())

#         for provider in queryset:
#             print(
#                 f"Provider ID={provider.id} | "
#                 f"Name={provider.user.full_name} | "
#                 f"Status={provider.verification_status}"
#             )

#         # ============================================================
#         # Keyword filter
#         # ============================================================
#         if keyword:
#             print("\n--- APPLYING KEYWORD FILTER ---")
#             print("Keyword:", keyword)

#             queryset = queryset.filter(
#                 Q(user__first_name__icontains=keyword) |
#                 Q(user__last_name__icontains=keyword) |
#                 Q(bio__icontains=keyword) |
#                 Q(tagline__icontains=keyword) |
#                 Q(user__address__icontains=keyword) |
#                 Q(user__city__icontains=keyword) |
#                 Q(services__title__icontains=keyword) |
#                 Q(provider_skills__skill__name__icontains=keyword)
#             ).distinct()

#             print("Providers after keyword filter:", queryset.count())

#         # ============================================================
#         # CATEGORY FILTER
#         # ============================================================
#         if category_id:
#             print("\n" + "-" * 80)
#             print("CATEGORY FILTER")
#             print("-" * 80)
#             print("Category ID received:", repr(category_id))

#             # Show all services matching this category
#             from services.models import Service

#             matching_services = Service.objects.filter(
#                 category_id=category_id,
#                 is_available=True,
#             ).select_related(
#                 'provider',
#                 'category',
#             )

#             print(
#                 "Available services for category",
#                 category_id,
#                 ":",
#                 matching_services.count()
#             )

#             for service in matching_services:
#                 print(
#                     f"  Service ID={service.id} | "
#                     f"Title={service.title} | "
#                     f"Provider ID={service.provider_id} | "
#                     f"Provider={service.provider.user.full_name} | "
#                     f"Category ID={service.category_id} | "
#                     f"Category={service.category.name} | "
#                     f"Available={service.is_available}"
#                 )

#             # Apply provider category filter
#             queryset = queryset.filter(
#                 services__category_id=category_id,
#                 services__is_available=True,
#             ).distinct()

#             print("\nProviders after CATEGORY FILTER:", queryset.count())

#             for provider in queryset:
#                 print(
#                     f"  MATCHED PROVIDER "
#                     f"ID={provider.id} | "
#                     f"Name={provider.user.full_name}"
#                 )

#                 provider_services = provider.services.filter(
#                     category_id=category_id,
#                     is_available=True,
#                 )

#                 for service in provider_services:
#                     print(
#                         f"      -> Service ID={service.id} | "
#                         f"{service.title} | "
#                         f"Category ID={service.category_id} | "
#                         f"Available={service.is_available}"
#                     )

#         else:
#             print("\n*** NO CATEGORY FILTER WAS RECEIVED ***")
#             print("category_id is empty, so ALL approved providers are eligible.")

#         # ============================================================
#         # SKILL FILTER
#         # ============================================================
#         if skill_id:
#             print("\n--- APPLYING SKILL FILTER ---")
#             print("Skill ID:", skill_id)

#             queryset = queryset.filter(
#                 provider_skills__skill_id=skill_id
#             ).distinct()

#             print("Providers after skill filter:", queryset.count())

#         # ============================================================
#         # CITY FILTER
#         # ============================================================
#         if city:
#             print("\n--- APPLYING CITY FILTER ---")
#             print("City:", city)

#             queryset = queryset.filter(
#                 user__city__icontains=city
#             )

#             print("Providers after city filter:", queryset.count())

#         # ============================================================
#         # PRICE FILTERS
#         # ============================================================
#         if min_price:
#             print("\n--- APPLYING MIN PRICE FILTER ---")
#             print("Min price:", min_price)

#             queryset = queryset.filter(
#                 hourly_rate__gte=float(min_price)
#             )

#             print("Providers after min price:", queryset.count())

#         if max_price:
#             print("\n--- APPLYING MAX PRICE FILTER ---")
#             print("Max price:", max_price)

#             queryset = queryset.filter(
#                 hourly_rate__lte=float(max_price)
#             )

#             print("Providers after max price:", queryset.count())

#         # ============================================================
#         # RATING FILTER
#         # ============================================================
#         if min_rating:
#             print("\n--- APPLYING RATING FILTER ---")
#             print("Min rating:", min_rating)

#             queryset = queryset.filter(
#                 average_rating__gte=float(min_rating)
#             )

#             print("Providers after rating:", queryset.count())

#         # ============================================================
#         # EXPERIENCE FILTER
#         # ============================================================
#         if experience:
#             print("\n--- APPLYING EXPERIENCE FILTER ---")
#             print("Minimum experience:", experience)

#             queryset = queryset.filter(
#                 experience_years__gte=int(experience)
#             )

#             print("Providers after experience:", queryset.count())

#         # ============================================================
#         # AVAILABILITY FILTER
#         # ============================================================
#         if availability == 'today':
#             print("\n--- APPLYING TODAY AVAILABILITY FILTER ---")

#             from datetime import date

#             day_abbr = [
#                 'mon',
#                 'tue',
#                 'wed',
#                 'thu',
#                 'fri',
#                 'sat',
#                 'sun'
#             ][date.today().weekday()]

#             print("Today's day:", day_abbr)

#             queryset = queryset.filter(
#                 working_days__day=day_abbr,
#                 working_days__is_available=True,
#             ).distinct()

#             print(
#                 "Providers after availability filter:",
#                 queryset.count()
#             )

#         # ============================================================
#         # LOCATION
#         # ============================================================
#         user_lat = float(lat) if lat else None
#         user_lon = float(lon) if lon else None

#         print("\n--- LOCATION ---")
#         print("User latitude:", user_lat)
#         print("User longitude:", user_lon)

#         # ============================================================
#         # FINAL PROVIDER LIST BEFORE SERIALIZATION
#         # ============================================================
#         print("\n" + "=" * 80)
#         print("FINAL PROVIDER QUERYSET")
#         print("=" * 80)
#         print("FINAL PROVIDER COUNT:", queryset.count())

#         for provider in queryset:
#             print(
#                 f"FINAL PROVIDER -> "
#                 f"ID={provider.id} | "
#                 f"Name={provider.user.full_name}"
#             )

#         # ============================================================
#         # BUILD RESULTS
#         # ============================================================
#         results = []

#         for provider in queryset:
#             scores = calculate_recommendation_score(
#                 provider,
#                 user_lat,
#                 user_lon
#             )

#             provider_data = ProviderPublicSerializer(provider).data

#             results.append({
#                 'provider': provider_data,
#                 'total_score': float(scores['total_score']),
#                 'distance_km': scores['distance_km'],
#             })

#         # ============================================================
#         # SORT
#         # ============================================================
#         results.sort(
#             key=lambda x: x['total_score'],
#             reverse=True
#         )

#         # ============================================================
#         # FINAL DEBUG
#         # ============================================================
#         print("\n" + "=" * 80)
#         print("FINAL SEARCH RESULT")
#         print("=" * 80)
#         print("Number of results:", len(results))

#         for item in results:
#             provider = item['provider']

#             print(
#                 f"RESULT -> "
#                 f"ID={provider.get('id')} | "
#                 f"Name={provider.get('user_full_name')}"
#             )

#         print("=" * 80 + "\n")

#         # ============================================================
#         # RESPONSE
#         # ============================================================
#         return Response({
#             'status': 'success',
#             'count': len(results),
#             'results': results,
#         })

# below is the clean code
from datetime import date

from django.db.models import Q
from rest_framework import generics
from rest_framework.response import Response

from providers.models import ProviderProfile
from providers.serializers import ProviderPublicSerializer
from recommendations.services import calculate_recommendation_score
from services.models import Service


class SearchView(generics.GenericAPIView):
    permission_classes = []

    def get(self, request):
        keyword = request.query_params.get('q', '').strip()
        category_id = request.query_params.get('category')
        skill_id = request.query_params.get('skill')
        city = request.query_params.get('city', '').strip()
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        min_rating = request.query_params.get('min_rating')
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')
        availability = request.query_params.get('availability')
        experience = request.query_params.get('experience')

        # Base queryset
        queryset = ProviderProfile.objects.filter(
            verification_status='approved'
        ).select_related('user')

        # ------------------------------------------------------------
        # Keyword
        # ------------------------------------------------------------
        if keyword:
            queryset = queryset.filter(
                Q(user__first_name__icontains=keyword) |
                Q(user__last_name__icontains=keyword) |
                Q(bio__icontains=keyword) |
                Q(tagline__icontains=keyword) |
                Q(user__address__icontains=keyword) |
                Q(user__city__icontains=keyword) |
                Q(services__title__icontains=keyword) |
                Q(provider_skills__skill__name__icontains=keyword)
            ).distinct()

        # ------------------------------------------------------------
        # Category
        # Only providers who have an AVAILABLE service
        # belonging to the selected category
        # ------------------------------------------------------------
        if category_id:
            queryset = queryset.filter(
                services__category_id=category_id,
                services__is_available=True,
            ).distinct()

        # ------------------------------------------------------------
        # Skill
        # ------------------------------------------------------------
        if skill_id:
            queryset = queryset.filter(
                provider_skills__skill_id=skill_id
            ).distinct()

        # ------------------------------------------------------------
        # City
        # ------------------------------------------------------------
        if city:
            queryset = queryset.filter(
                user__city__icontains=city
            )

        # ------------------------------------------------------------
        # Price
        # ------------------------------------------------------------
        if min_price:
            queryset = queryset.filter(
                hourly_rate__gte=float(min_price)
            )

        if max_price:
            queryset = queryset.filter(
                hourly_rate__lte=float(max_price)
            )

        # ------------------------------------------------------------
        # Rating
        # ------------------------------------------------------------
        if min_rating:
            queryset = queryset.filter(
                average_rating__gte=float(min_rating)
            )

        # ------------------------------------------------------------
        # Experience
        # ------------------------------------------------------------
        if experience:
            queryset = queryset.filter(
                experience_years__gte=int(experience)
            )

        # ------------------------------------------------------------
        # Availability
        # ------------------------------------------------------------
        if availability == 'today':
            day_abbr = [
                'mon',
                'tue',
                'wed',
                'thu',
                'fri',
                'sat',
                'sun'
            ][date.today().weekday()]

            queryset = queryset.filter(
                working_days__day=day_abbr,
                working_days__is_available=True,
            ).distinct()

        # ------------------------------------------------------------
        # Location
        # ------------------------------------------------------------
        user_lat = float(lat) if lat else None
        user_lon = float(lon) if lon else None

        # ------------------------------------------------------------
        # Build results
        # ------------------------------------------------------------
        results = []

        for provider in queryset:
            scores = calculate_recommendation_score(
                provider,
                user_lat,
                user_lon
            )

            provider_data = ProviderPublicSerializer(provider).data

            results.append({
                'provider': provider_data,
                'total_score': float(scores['total_score']),
                'distance_km': scores['distance_km'],
            })

        # Highest recommendation score first
        results.sort(
            key=lambda x: x['total_score'],
            reverse=True
        )

        return Response({
            'status': 'success',
            'count': len(results),
            'results': results,
        })