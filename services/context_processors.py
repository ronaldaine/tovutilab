"""
Context processors for services app.
Makes service categories and services available globally across all templates,
particularly useful for navigation menus.

Add to settings.py TEMPLATES configuration:
    'context_processors': [
        ...
        'services.context_processors.services_navigation',
    ]
"""

from django.core.cache import cache
from django.db.models import Prefetch
from services.models import Service, Category
import logging

logger = logging.getLogger(__name__)


def services_navigation(request):
    """
    Global context processor that provides service categories and featured services
    to all templates. Results are heavily cached for performance.
    
    Available in all templates as:
        - {{ service_categories }}: All active categories with their services
        - {{ featured_services }}: Featured services (up to 3)
        - {{ service_count }}: Total count of active services
        
    Args:
        request: Django request object
        
    Returns:
        dict: Context data for templates
    """
    cache_key = 'global_services_navigation'
    context = cache.get(cache_key)
    
    if context is None:
        try:
            # Prefetch active services for each category to minimize queries
            active_services_prefetch = Service.objects.filter(
                is_active=True
            ).order_by('display_order', 'title')
            
            # Get all active categories with their services
            service_categories = Category.objects.filter(
                is_active=True
            ).prefetch_related(
                Prefetch(
                    'services',
                    queryset=active_services_prefetch,
                    to_attr='active_services'
                )
            ).order_by('display_order', 'name')
            
            # Convert to list to cache the evaluated queryset
            service_categories = list(service_categories)
            
            # Filter out categories with no active services
            service_categories = [
                cat for cat in service_categories 
                if cat.active_services
            ]
            
            # Get featured services for homepage/promotional sections
            featured_services = Service.objects.filter(
                is_active=True,
                is_featured=True
            ).select_related('category').order_by('display_order', 'title')[:3]
            
            featured_services = list(featured_services)
            
            # Get total service count
            service_count = Service.objects.filter(is_active=True).count()
            
            # Build context dictionary
            context = {
                'service_categories': service_categories,
                'featured_services': featured_services,
                'service_count': service_count,
            }
            
            # Cache for 30 minutes (1800 seconds)
            cache.set(cache_key, context, 1800)
            
            logger.debug(
                f"Cached global services navigation: "
                f"{len(service_categories)} categories, "
                f"{len(featured_services)} featured services"
            )
            
        except Exception as e:
            logger.error(
                f"Error in services_navigation context processor: {e}",
                exc_info=True
            )
            # Return empty context on error to prevent template breakage
            context = {
                'service_categories': [],
                'featured_services': [],
                'service_count': 0,
            }
    
    return context


def clear_services_navigation_cache():
    """
    Helper function to clear the services navigation cache.
    Called by signal handlers when services or categories are modified.
    """
    cache.delete('global_services_navigation')
    logger.info("Cleared global services navigation cache")


