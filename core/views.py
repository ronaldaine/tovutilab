from django.shortcuts import render, redirect
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods, require_POST
from django.views.decorators.csrf import csrf_protect
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.templatetags.static import static
from .forms import ContactSalesForm
from .models import ContactInquiry
from services.models import Service
import logging

logger = logging.getLogger(__name__)

def home(request):
    services = Service.objects.all()
    context = {
        'services': services,
    }
    return render(request, 'core/index.html', context)

def portfolio(request):
    context = {}
    return render(request, 'core/portfolio.html', context)

def ecommerce(request):
    context = {}
    return render(request, 'core/ecommerce.html', context)

@require_http_methods(["GET", "POST"])
@csrf_protect
def contact(request):
    """
    Multi-step contact sales page.
    Handles both GET (display form) and POST (submit form) requests.
    """
    if request.method == 'POST':
        return handle_contact_submission(request)
    
    # GET request - display form
    form = ContactSalesForm()
    
    context = {
        'form': form,
        'page_title': 'Contact Sales',
        'meta_title': 'Contact Sales - Get a Custom Quote | Cascade Digital',
        'meta_description': 'Get in touch with our sales team for a custom quote. Tell us about your project and we\'ll provide a tailored solution.',
    }
    
    return render(request, 'core/contact.html', context)


@require_POST
@csrf_protect
def handle_contact_submission(request):
    """
    Process contact form submission.
    Supports both AJAX and standard form submissions.
    """
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
    
    form = ContactSalesForm(request.POST)
    
    if form.is_valid():
        try:
            # Save inquiry with request metadata
            inquiry = form.save(commit=False, request=request)
            
            # Basic spam scoring
            spam_score = calculate_spam_score(inquiry)
            if spam_score > 7:
                inquiry.is_spam = True
                logger.warning(
                    f"Potential spam inquiry from {inquiry.email} (score: {spam_score})"
                )
            
            inquiry.save()
            
            # Send notification emails
            try:
                send_contact_notifications(request, inquiry)
            except Exception as email_error:
                logger.error(
                    f"Failed to send contact notification: {email_error}",
                    exc_info=True
                )
            
            # Success response
            success_message = (
                "Thank you for contacting us! Our team will review your inquiry "
                "and get back to you within 24 hours."
            )
            
            if is_ajax:
                return JsonResponse({
                    'success': True,
                    'message': success_message,
                    'inquiry_id': inquiry.id,
                })
            else:
                messages.success(request, success_message)
                return redirect('contact_success')
        
        except Exception as e:
            logger.error(f"Error processing contact inquiry: {e}", exc_info=True)
            
            error_message = (
                "We encountered an error processing your request. "
                "Please try again or email us directly."
            )
            
            if is_ajax:
                return JsonResponse({
                    'success': False,
                    'message': error_message
                }, status=500)
            else:
                messages.error(request, error_message)
                return render(request, 'core/contact.html', {'form': form})
    
    else:
        # Form validation errors
        if is_ajax:
            return JsonResponse({
                'success': False,
                'message': 'Please correct the errors below.',
                'errors': form.errors.get_json_data()
            }, status=400)
        else:
            messages.error(request, 'Please correct the errors below.')
            return render(request, 'core/contact.html', {'form': form})


@require_http_methods(["GET"])
def contact_success(request):
    """Success page after contact form submission"""
    context = {
        'page_title': 'Thank You for Contacting Us',
    }
    return render(request, 'core/contact_success.html', context)


def calculate_spam_score(inquiry):
    """
    Calculate spam probability score (0-10).
    Higher score = more likely spam.
    """
    score = 0
    
    # Check description for spam patterns
    if inquiry.project_description:
        desc_lower = inquiry.project_description.lower()
        
        # Excessive caps
        caps_ratio = sum(
            1 for c in inquiry.project_description if c.isupper()
        ) / len(inquiry.project_description) if inquiry.project_description else 0
        
        if caps_ratio > 0.5:
            score += 2
        
        # Spam keywords
        spam_keywords = [
            'viagra', 'casino', 'lottery', 'bitcoin', 'porn', 'xxx',
            'dating', 'pills', 'weight loss', 'make money'
        ]
        keyword_matches = sum(
            1 for keyword in spam_keywords if keyword in desc_lower
        )
        score += min(keyword_matches * 2, 5)
    
    # Free email domains (slight suspicion)
    if inquiry.email:
        free_domains = [
            'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'
        ]
        domain = inquiry.email.split('@')[-1].lower()
        if domain in free_domains:
            score += 1
    
    # Suspicious budget/timeline combo
    if inquiry.budget_range == 'under_5k' and inquiry.timeline == 'urgent':
        score += 1
    
    # Short description
    if inquiry.project_description and len(inquiry.project_description) < 30:
        score += 1
    
    return min(score, 10)


def send_contact_notifications(request, inquiry):
    """
    Send email notifications for new contact inquiry.
    Sends to admin and confirmation to client.
    """
    site_url = f"{request.scheme}://{request.get_host()}"
    logo_url = request.build_absolute_uri(static('img/cascade.png'))
    admin_url = request.build_absolute_uri(
        f"/admin/core/contactinquiry/{inquiry.id}/change/"
    )
    
    context = {
        'inquiry': inquiry,
        'logo_url': logo_url,
        'site_url': site_url,
        'admin_url': admin_url,
    }
    
    # Admin notification
    admin_subject = f"New Contact Inquiry: {inquiry.company_name}"
    admin_html = render_to_string(
        'core/emails/admin_contact_notification.html',
        context
    )
    admin_text = strip_tags(admin_html)
    
    admin_email = EmailMultiAlternatives(
        subject=admin_subject,
        body=admin_text,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[settings.ADMIN_EMAIL],
        reply_to=[inquiry.email]
    )
    admin_email.attach_alternative(admin_html, "text/html")
    admin_email.send(fail_silently=False)
    
    # Client confirmation
    client_subject = "We've Received Your Inquiry - Cascade Digital"
    client_html = render_to_string(
        'core/emails/client_contact_confirmation.html',
        context
    )
    client_text = strip_tags(client_html)
    
    client_email = EmailMultiAlternatives(
        subject=client_subject,
        body=client_text,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[inquiry.email],
        reply_to=[settings.ADMIN_EMAIL]
    )
    client_email.attach_alternative(client_html, "text/html")
    client_email.send(fail_silently=False)
    
    logger.info(f"Contact notifications sent for inquiry {inquiry.id}")


def education(request):
    return render(request, 'core/education.html')


def healthcare(request):
    return render(request, 'core/healthcare.html')

def data_platforms(request):
    return render(request, 'core/data_platforms.html')

def about(request):
    context = {
        'page_title': 'About Us',
    }
    return render(request, 'core/about.html', context)

def finance(request):
    return render(request, 'core/finance.html')

def data_platforms(request):
    return render(request, 'core/data_platforms.html')