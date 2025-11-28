from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.templatetags.static import static
from django.utils.html import strip_tags
from django.http import JsonResponse
from django.views.decorators.cache import cache_page
from django.views.decorators.http import require_http_methods, require_POST
from django.views.decorators.csrf import csrf_protect
from django.conf import settings
from django.db.models import Prefetch, Q
from django.http import Http404
from services.models import Service, Category, ServiceInquiry
from services.forms import ServiceInquiryForm
import logging
import json

logger = logging.getLogger(__name__)


@require_http_methods(["GET"])
@cache_page(60 * 15)  # Cache for 15 minutes
def service_detail(request, slug):
    """
    Service detail view with comprehensive optimization and inquiry form.
    
    Features:
    - Single query optimization with select_related
    - Intelligent related services suggestions
    - SEO-optimized with structured data
    - Pre-populated inquiry form
    
    Args:
        request: HTTP request object
        slug: URL-friendly service identifier
        
    Returns:
        Rendered service detail template with context
        
    Raises:
        Http404: If service doesn't exist or is inactive
    """
    # Fetch the service with its category in a single query
    service = get_object_or_404(
        Service.objects.select_related('category'),
        slug=slug,
        is_active=True
    )
    
    # Get related services from the same category (excluding current service)
    related_services = Service.objects.filter(
        category=service.category,
        is_active=True
    ).exclude(
        id=service.id
    ).select_related('category').order_by('display_order')[:3]
    
    # Get featured services from other categories as alternatives if needed
    other_services = []
    if related_services.count() < 3:
        other_services = Service.objects.filter(
            is_featured=True,
            is_active=True
        ).exclude(
            Q(id=service.id) | Q(category=service.category)
        ).select_related('category').order_by('?')[:3 - related_services.count()]
    
    # Combine related and other services
    suggested_services = list(related_services) + list(other_services)
    
    # Get all active categories for navigation
    categories = Category.objects.filter(
        is_active=True
    ).order_by('display_order', 'name')
    
    # Build breadcrumb data for structured navigation
    breadcrumbs = [
        {'title': 'Home', 'url': '/'},
        {'title': 'Services', 'url': '/services/'},
        {'title': service.category.name, 'url': f'/services/category/{service.category.slug}/'},
        {'title': service.title, 'url': None}
    ]
    
    # Prepare structured data for SEO (JSON-LD)
    structured_data = {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": service.title,
        "description": service.short_description,
        "provider": {
            "@type": "Organization",
            "name": "Cascade Digital"
        },
        "serviceType": service.category.name,
    }
    
    # Add price if available
    if service.price_starting_at:
        structured_data["offers"] = {
            "@type": "Offer",
            "price": str(service.price_starting_at),
            "priceCurrency": "USD"
        }
    
    # Convert structured data to JSON string for template
    structured_data_json = json.dumps(structured_data)
    
    # Initialize inquiry form with service pre-selected
    inquiry_form = ServiceInquiryForm(initial={
        'service': service.id,
        'project_type': service.title  # Pre-fill with service name
    })
    
    context = {
        'service': service,
        'suggested_services': suggested_services,
        'related_services': suggested_services,  # Alias for template compatibility
        'categories': categories,
        'breadcrumbs': breadcrumbs,
        'structured_data': structured_data_json,
        'inquiry_form': inquiry_form,
        
        # SEO Meta tags (override base template defaults)
        'meta_title': service.meta_title or f"{service.title} | Cascade Digital",
        'meta_description': service.meta_description or service.short_description,
        'og_title': f"{service.title} - {service.category.name}",
        'og_description': service.short_description,
        'og_image': service.image_url,
        'canonical_url': request.build_absolute_uri(),
    }
    
    return render(request, 'services/service_detail.html', context)


@require_http_methods(["GET"])
@cache_page(60 * 30)  # Cache for 30 minutes
def services_list(request):
    """
    Services listing page with optional category filtering.
    Optimized for performance with select_related and proper indexing.
    
    Query Parameters:
        category (optional): Filter by category slug
        
    Returns:
        Rendered services list template with filtered services
    """
    # Get category filter from query params
    category_slug = request.GET.get('category')
    
    # Base queryset with optimization
    services = Service.objects.filter(
        is_active=True
    ).select_related('category').order_by('display_order', 'title')
    
    # Apply category filter if provided
    selected_category = None
    if category_slug:
        selected_category = get_object_or_404(
            Category,
            slug=category_slug,
            is_active=True
        )
        services = services.filter(category=selected_category)
    
    # Get all active categories for filter UI
    categories = Category.objects.filter(
        is_active=True
    ).order_by('display_order', 'name')
    
    # Add service count to each category for UI display
    for category in categories:
        category.service_count = category.get_active_services_count()
    
    context = {
        'services': services,
        'categories': categories,
        'selected_category': selected_category,
        'meta_title': f"{selected_category.name} Services | Cascade Digital" if selected_category else "Our Services | Cascade Digital",
        'meta_description': selected_category.description if selected_category else "Explore our comprehensive range of web development and digital services.",
    }
    
    return render(request, 'services/services_list.html', context)


@require_http_methods(["GET"])
@cache_page(60 * 30)  # Cache for 30 minutes
def category_services(request, category_slug):
    """
    Category-specific services listing page.
    SEO-friendly URLs for better indexing and user experience.
    
    Args:
        category_slug: URL-friendly category identifier
        
    Returns:
        Rendered category services template
        
    Raises:
        Http404: If category doesn't exist or is inactive
    """
    # Fetch category with error handling
    category = get_object_or_404(
        Category,
        slug=category_slug,
        is_active=True
    )
    
    # Get all services in this category
    services = Service.objects.filter(
        category=category,
        is_active=True
    ).select_related('category').order_by('display_order', 'title')
    
    # Get all categories for navigation
    categories = Category.objects.filter(
        is_active=True
    ).order_by('display_order', 'name')
    
    # Breadcrumbs
    breadcrumbs = [
        {'title': 'Home', 'url': '/'},
        {'title': 'Services', 'url': '/services/'},
        {'title': category.name, 'url': None}
    ]
    
    context = {
        'category': category,
        'services': services,
        'categories': categories,
        'breadcrumbs': breadcrumbs,
        'meta_title': f"{category.name} Services | Cascade Digital",
        'meta_description': category.description or f"Explore our {category.name.lower()} services and solutions.",
    }
    
    return render(request, 'services/services_list.html', context)

@require_POST
@csrf_protect
def service_inquiry_submit(request, service_slug):
    """
    Handle service inquiry form submission via AJAX.
    This view ONLY processes POST requests from the form on service_detail.html.
    
    The form itself is rendered by service_detail view.
    
    Args:
        request: Django request object (POST only)
        service_slug: Slug of the service being inquired about
    
    Returns:
        JSON response with success/error status and messages
    """
    # Get the service
    service = get_object_or_404(
        Service.objects.select_related('category'),
        slug=service_slug,
        is_active=True
    )
    
    # Check if request is AJAX
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
    
    # Initialize form with POST data
    form = ServiceInquiryForm(request.POST)
    
    # Pre-populate service field
    form.instance.service = service
    
    if form.is_valid():
        try:
            # Save form with request metadata
            inquiry = form.save(commit=False, request=request)
            
            # Calculate spam score (for internal logging/review)
            spam_score = _calculate_spam_score(inquiry)
            
            # Mark as spam if score exceeds threshold
            if spam_score > 7:
                inquiry.is_spam = True
                logger.warning(
                    f"Potential spam inquiry detected from {inquiry.email} "
                    f"(score: {spam_score})"
                )
            
            # Save the inquiry
            inquiry.save()
            
            # Send notification emails - PASS REQUEST HERE
            try:
                _send_inquiry_notifications(request, inquiry, service)
            except Exception as email_error:
                # Log email error but don't fail the submission
                logger.error(
                    f"Failed to send inquiry notification emails: {email_error}",
                    exc_info=True
                )
            
            # Prepare success response
            success_message = (
                "Thank you for your inquiry! We'll review your project details "
                "and get back to you within 24 hours."
            )
            
            if is_ajax:
                return JsonResponse({
                    'success': True,
                    'message': success_message,
                    'inquiry_id': inquiry.id,
                    'redirect_url': '/services/inquiry/success/'
                })
            else:
                # Non-AJAX fallback (redirect to success page)
                messages.success(request, success_message)
                return redirect('services:inquiry_success')
        
        except Exception as e:
            # Log unexpected errors
            logger.error(
                f"Error processing service inquiry: {e}",
                exc_info=True
            )
            
            error_message = (
                "We encountered an error processing your inquiry. "
                "Please try again or contact us directly."
            )
            
            if is_ajax:
                return JsonResponse({
                    'success': False,
                    'message': error_message
                }, status=500)
            else:
                messages.error(request, error_message)
                return redirect('services:service_detail', slug=service_slug)
    
    else:
        # Form validation failed
        if is_ajax:
            # Return field-specific errors for AJAX requests
            return JsonResponse({
                'success': False,
                'message': 'Please correct the errors below.',
                'errors': form.errors.get_json_data()
            }, status=400)
        else:
            # Non-AJAX fallback
            messages.error(request, "Please correct the errors in the form below.")
            return redirect('services:service_detail', slug=service_slug)


def _calculate_spam_score(inquiry):
    """
    Calculate spam probability score (0-10 scale).
    Higher score = more likely spam.
    
    This is used for internal logging and review, not stored in database.
    
    Args:
        inquiry: ServiceInquiry instance
    
    Returns:
        int: Spam score from 0 to 10
    """
    score = 0
    
    # Check for suspicious patterns in description
    if inquiry.project_description:
        description_lower = inquiry.project_description.lower()
        
        # Check for excessive caps (spam indicator)
        if len(inquiry.project_description) > 0:
            caps_ratio = sum(1 for c in inquiry.project_description if c.isupper()) / len(inquiry.project_description)
            if caps_ratio > 0.5:
                score += 2
        
        # Check for spam keywords
        spam_keywords = [
            'viagra', 'casino', 'lottery', 'bitcoin', 'crypto',
            'porn', 'xxx', 'dating', 'pills', 'supplements',
            'weight loss', 'make money', 'work from home',
            'click here', 'buy now', 'limited offer'
        ]
        
        keyword_matches = sum(1 for keyword in spam_keywords if keyword in description_lower)
        score += min(keyword_matches * 2, 5)
    
    # Check email domain (free emails slightly suspicious)
    if inquiry.email:
        free_email_domains = [
            'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
            'aol.com', 'icloud.com', 'mail.com', 'protonmail.com'
        ]
        email_domain = inquiry.email.split('@')[-1].lower()
        
        if email_domain in free_email_domains:
            score += 1
    
    # Check budget/timeline combination (common spam pattern)
    if inquiry.budget_range == 'under_5k' and inquiry.timeline == 'asap':
        score += 1
    
    # Check description length
    if inquiry.project_description:
        desc_length = len(inquiry.project_description)
        if desc_length < 30 or desc_length > 2000:
            score += 1
    
    # Check for missing optional fields
    if not inquiry.phone and not inquiry.company:
        score += 1
    
    return min(score, 10)  # Cap at 10


def _send_inquiry_notifications(request, inquiry, service=None):
    """
    Send email notifications for new service inquiry.
    Sends to agency admin and confirmation to client.
    
    Args:
        request: Django request object
        inquiry: ServiceInquiry instance
        service: Optional Service instance for context
    """
    
    # Build absolute URLs
    site_url = f"{request.scheme}://{request.get_host()}"
    logo_url = request.build_absolute_uri(static('img/cascade.png'))
    admin_url = request.build_absolute_uri(
        f"/admin/services/serviceinquiry/{inquiry.id}/change/"
    )
    
    # Prepare context for email templates
    context = {
        'inquiry': inquiry,
        'service': service,
        'logo_url': logo_url,
        'site_url': site_url,
        'admin_url': admin_url,
    }
    
    # --- Admin Notification Email ---
    admin_subject = f"New Service Inquiry: {inquiry.project_type}"
    if service:
        admin_subject += f" ({service.title})"
    
    admin_html_message = render_to_string(
        'services/emails/admin_inquiry_notification.html',
        context
    )
    admin_text_message = strip_tags(admin_html_message)
    
    admin_email = EmailMultiAlternatives(
        subject=admin_subject,
        body=admin_text_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[settings.ADMIN_EMAIL],
        reply_to=[inquiry.email]
    )
    admin_email.attach_alternative(admin_html_message, "text/html")
    admin_email.send(fail_silently=False)
    
    logger.info(f"Admin notification sent for inquiry {inquiry.id}")
    
    # --- Client Confirmation Email ---
    client_subject = "We've Received Your Project Inquiry - Cascade Digital"
    
    client_html_message = render_to_string(
        'services/emails/client_inquiry_confirmation.html',
        context
    )
    client_text_message = strip_tags(client_html_message)
    
    client_email = EmailMultiAlternatives(
        subject=client_subject,
        body=client_text_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[inquiry.email],
        reply_to=[settings.ADMIN_EMAIL]
    )
    client_email.attach_alternative(client_html_message, "text/html")
    client_email.send(fail_silently=False)
    
    logger.info(f"Client confirmation sent to {inquiry.email} for inquiry {inquiry.id}")

@require_http_methods(["GET"])
def service_inquiry_success(request):
    """
    Success page after service inquiry submission.
    Shows confirmation message and next steps.
    """
    context = {
        'page_title': 'Inquiry Submitted Successfully'
    }
    return render(request, 'services/inquiry_success.html', context)