from django.db.models.signals import post_save, post_delete
from django.core.cache import cache
from django.dispatch import receiver
from .models import Category, Service
from .context_processors import clear_services_navigation_cache
import logging

logger = logging.getLogger(__name__)


@receiver([post_save, post_delete], sender=Service)
@receiver([post_save, post_delete], sender=Category)
def invalidate_navigation_cache(sender, instance, **kwargs):
    """
    Automatically clear navigation cache when services or categories are modified.
    Ensures navigation always displays current data.
    """
    clear_services_navigation_cache()
    
    # Also clear any service/category specific caches if using template tags
    if hasattr(instance, 'slug'):
        cache_key = f"{sender.__name__.lower()}_{instance.slug}"
        cache.delete(cache_key)
    
    logger.debug(f"Invalidated navigation cache after {sender.__name__} change")