from django.db import models
from django.core.validators import URLValidator, EmailValidator, MinLengthValidator
from django.core.exceptions import ValidationError
from django.utils.text import slugify
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
import re


class Category(models.Model):
    """
    Service category model for organizing services into logical groups.
    Examples: Web Development, Design, Marketing, etc.
    """
    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name=_("Category Name"),
        help_text=_("Unique name for the service category")
    )
    slug = models.SlugField(
        max_length=120,
        unique=True,
        blank=True,
        verbose_name=_("URL Slug"),
        help_text=_("Auto-generated URL-friendly version of the name")
    )
    description = models.TextField(
        blank=True,
        verbose_name=_("Description"),
        help_text=_("Brief description of this category")
    )
    icon_class = models.CharField(
        max_length=50,
        default="fas fa-cog",
        verbose_name=_("FontAwesome Icon Class"),
        help_text=_("FontAwesome icon class (e.g., 'fas fa-code')")
    )
    display_order = models.PositiveIntegerField(
        default=0,
        verbose_name=_("Display Order"),
        help_text=_("Order in which categories appear (lower numbers first)")
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Active"),
        help_text=_("Whether this category is visible on the website")
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Category")
        verbose_name_plural = _("Categories")
        ordering = ['display_order', 'name']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['is_active', 'display_order']),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        """Auto-generate slug from name if not provided"""
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def get_active_services_count(self):
        """Returns count of active services in this category"""
        return self.services.filter(is_active=True).count()


class Service(models.Model):
    """
    Service model representing individual services offered by the agency.
    Uses URL field for images to avoid server storage.
    """
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='services',
        verbose_name=_("Category"),
        help_text=_("Category this service belongs to")
    )
    title = models.CharField(
        max_length=200,
        verbose_name=_("Service Title"),
        help_text=_("Name of the service")
    )
    slug = models.SlugField(
        max_length=220,
        unique=True,
        blank=True,
        verbose_name=_("URL Slug"),
        help_text=_("Auto-generated URL-friendly version of the title")
    )
    short_description = models.CharField(
        max_length=250,
        verbose_name=_("Short Description"),
        help_text=_("Brief description for service cards (max 250 chars)")
    )
    full_description = models.TextField(
        verbose_name=_("Full Description"),
        help_text=_("Detailed description of the service")
    )
    image_url = models.URLField(
        max_length=500,
        validators=[URLValidator()],
        verbose_name=_("Image URL"),
        help_text=_("Full URL to service image (hosted externally)")
    )
    icon_class = models.CharField(
        max_length=50,
        default="fas fa-laptop-code",
        verbose_name=_("FontAwesome Icon Class"),
        help_text=_("FontAwesome icon class (e.g., 'fas fa-code')")
    )
    price_starting_at = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name=_("Starting Price"),
        help_text=_("Starting price for this service (optional)")
    )
    delivery_time_days = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name=_("Delivery Time (Days)"),
        help_text=_("Typical delivery timeframe in days (optional)")
    )
    features = models.JSONField(
        default=list,
        blank=True,
        verbose_name=_("Features List"),
        help_text=_("List of key features (stored as JSON array)")
    )
    display_order = models.PositiveIntegerField(
        default=0,
        verbose_name=_("Display Order"),
        help_text=_("Order in which services appear (lower numbers first)")
    )
    is_featured = models.BooleanField(
        default=False,
        verbose_name=_("Featured Service"),
        help_text=_("Highlight this service on the homepage")
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Active"),
        help_text=_("Whether this service is visible on the website")
    )
    meta_title = models.CharField(
        max_length=60,
        blank=True,
        verbose_name=_("SEO Meta Title"),
        help_text=_("Page title for SEO (leave blank to use service title)")
    )
    meta_description = models.CharField(
        max_length=160,
        blank=True,
        verbose_name=_("SEO Meta Description"),
        help_text=_("Meta description for SEO (max 160 chars)")
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Service")
        verbose_name_plural = _("Services")
        ordering = ['category', 'display_order', 'title']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['category', 'is_active', 'display_order']),
            models.Index(fields=['is_featured', 'is_active']),
        ]

    def __str__(self):
        return f"{self.category.name} - {self.title}"

    def save(self, *args, **kwargs):
        """Auto-generate slug from title if not provided"""
        if not self.slug:
            self.slug = slugify(self.title)
        
        # Generate meta fields if not provided
        if not self.meta_title:
            self.meta_title = self.title[:60]
        if not self.meta_description:
            self.meta_description = self.short_description[:160]
        
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        """Returns the URL for this service's detail page"""
        return reverse('services:service_detail', kwargs={'slug': self.slug})

    def get_price_display(self):
        """Returns formatted price or 'Contact Us' if no price"""
        if self.price_starting_at:
            return f"Starting at ${self.price_starting_at:,.2f}"
        return "Contact Us"

    def get_delivery_display(self):
        """Returns formatted delivery time"""
        if self.delivery_time_days:
            days = self.delivery_time_days
            if days == 1:
                return "1 day"
            elif days < 7:
                return f"{days} days"
            elif days < 30:
                weeks = days // 7
                return f"{weeks} week{'s' if weeks > 1 else ''}"
            else:
                months = days // 30
                return f"{months} month{'s' if months > 1 else ''}"
        return "Custom timeline"
    

class ServiceInquiry(models.Model):
    """
    Model for capturing service inquiries and quote requests from potential clients.
    Includes comprehensive validation and spam prevention measures.
    """
    
    # Status choices for inquiry tracking
    STATUS_CHOICES = [
        ('new', _('New')),
        ('reviewing', _('Reviewing')),
        ('contacted', _('Contacted')),
        ('quoted', _('Quoted')),
        ('converted', _('Converted')),
        ('declined', _('Declined')),
        ('spam', _('Spam')),
    ]
    
    # Budget range choices
    BUDGET_CHOICES = [
        ('under_5k', _('Under $5,000')),
        ('5k_10k', _('$5,000 - $10,000')),
        ('10k_25k', _('$10,000 - $25,000')),
        ('25k_50k', _('$25,000 - $50,000')),
        ('50k_100k', _('$50,000 - $100,000')),
        ('over_100k', _('Over $100,000')),
        ('not_sure', _('Not Sure Yet')),
    ]
    
    # Timeline choices
    TIMELINE_CHOICES = [
        ('asap', _('ASAP (2-4 weeks)')),
        ('flexible', _('Flexible (1-2 months)')),
        ('planned', _('Planned (3+ months)')),
        ('ongoing', _('Ongoing Project')),
    ]
    
    # Contact Information
    full_name = models.CharField(
        max_length=150,
        verbose_name=_("Full Name"),
        validators=[MinLengthValidator(2)],
        help_text=_("Client's full name")
    )
    
    email = models.EmailField(
        verbose_name=_("Email Address"),
        validators=[EmailValidator()],
        help_text=_("Primary contact email")
    )
    
    phone = models.CharField(
        max_length=20,
        blank=True,
        verbose_name=_("Phone Number"),
        help_text=_("Optional: Contact phone number")
    )
    
    company = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_("Company Name"),
        help_text=_("Optional: Company or organization name")
    )
    
    # Project Details
    service = models.ForeignKey(
        Service,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='inquiries',
        verbose_name=_("Interested Service"),
        help_text=_("Specific service they're inquiring about (if any)")
    )
    
    project_type = models.CharField(
        max_length=100,
        verbose_name=_("Project Type"),
        help_text=_("Type of project (e.g., Website, E-Commerce, Web App)")
    )
    
    project_description = models.TextField(
        verbose_name=_("Project Description"),
        validators=[MinLengthValidator(20)],
        help_text=_("Detailed description of the project requirements")
    )
    
    budget_range = models.CharField(
        max_length=20,
        choices=BUDGET_CHOICES,
        verbose_name=_("Budget Range"),
        help_text=_("Approximate budget for the project")
    )
    
    timeline = models.CharField(
        max_length=20,
        choices=TIMELINE_CHOICES,
        verbose_name=_("Desired Timeline"),
        help_text=_("When they need the project completed")
    )
    
    reference_url = models.URLField(
        max_length=500,
        blank=True,
        validators=[URLValidator()],
        verbose_name=_("Reference/Inspiration URL"),
        help_text=_("Optional: URL of similar websites or inspiration")
    )
    
    additional_notes = models.TextField(
        blank=True,
        verbose_name=_("Additional Notes"),
        help_text=_("Any additional information or requirements")
    )
    
    # Internal Management Fields
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='new',
        verbose_name=_("Inquiry Status"),
        help_text=_("Current status of this inquiry")
    )
    
    assigned_to = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_("Assigned To"),
        help_text=_("Team member handling this inquiry")
    )
    
    internal_notes = models.TextField(
        blank=True,
        verbose_name=_("Internal Notes"),
        help_text=_("Private notes for internal team use only")
    )
    
    estimated_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name=_("Estimated Project Value"),
        help_text=_("Internal estimate of project value")
    )
    
    # Spam Prevention & Metadata
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name=_("IP Address"),
        help_text=_("IP address of the submission")
    )
    
    user_agent = models.CharField(
        max_length=500,
        blank=True,
        verbose_name=_("User Agent"),
        help_text=_("Browser user agent string")
    )
    
    referrer = models.URLField(
        max_length=500,
        blank=True,
        verbose_name=_("Referrer"),
        help_text=_("Page that referred to the inquiry form")
    )
    
    is_spam = models.BooleanField(
        default=False,
        verbose_name=_("Marked as Spam"),
        help_text=_("Flag suspicious submissions")
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Submitted At")
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Last Updated")
    )
    
    contacted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("First Contact Date"),
        help_text=_("When we first contacted the client")
    )

    class Meta:
        verbose_name = _("Service Inquiry")
        verbose_name_plural = _("Service Inquiries")
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['email']),
            models.Index(fields=['is_spam', 'status']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.full_name} - {self.project_type} ({self.get_status_display()})"

    def clean(self):
        """
        Custom validation for the inquiry form.
        """
        super().clean()
        
        # Validate phone number format if provided
        if self.phone:
            phone_pattern = re.compile(r'^[\d\s\+\-\(\)]+$')
            if not phone_pattern.match(self.phone):
                raise ValidationError({
                    'phone': _('Please enter a valid phone number.')
                })
        
        # Check for spam indicators in description
        spam_keywords = ['viagra', 'casino', 'crypto', 'bitcoin', 'lottery', 'porn']
        description_lower = self.project_description.lower()
        if any(keyword in description_lower for keyword in spam_keywords):
            self.is_spam = True
        
        # Validate budget and timeline combination
        if self.budget_range == 'under_5k' and self.timeline == 'asap':
            # This is a common spam pattern, flag for review
            pass

    def save(self, *args, **kwargs):
        """
        Override save to perform additional validations.
        """
        self.full_clean()
        super().save(*args, **kwargs)

    def get_budget_display_verbose(self):
        """
        Returns a more detailed budget display string.
        """
        budget_map = {
            'under_5k': 'Under $5,000',
            '5k_10k': '$5,000 - $10,000',
            '10k_25k': '$10,000 - $25,000',
            '25k_50k': '$25,000 - $50,000',
            '50k_100k': '$50,000 - $100,000',
            'over_100k': 'Over $100,000',
            'not_sure': 'Budget Not Determined',
        }
        return budget_map.get(self.budget_range, 'Unknown')

    def mark_as_contacted(self):
        """
        Helper method to mark inquiry as contacted and set timestamp.
        """
        if not self.contacted_at:
            from django.utils import timezone
            self.contacted_at = timezone.now()
        if self.status == 'new':
            self.status = 'contacted'
        self.save()

    def is_high_value(self):
        """
        Returns True if inquiry is for a high-value project.
        """
        high_value_budgets = ['50k_100k', 'over_100k']
        return self.budget_range in high_value_budgets

    def get_priority_score(self):
        """
        Calculate a priority score for inquiry routing (1-10).
        """
        score = 5  # Base score
        
        # Budget impact
        if self.budget_range in ['over_100k']:
            score += 3
        elif self.budget_range in ['50k_100k']:
            score += 2
        elif self.budget_range in ['25k_50k']:
            score += 1
        
        # Timeline urgency
        if self.timeline == 'asap':
            score += 2
        elif self.timeline == 'flexible':
            score += 1
        
        # Service specificity
        if self.service:
            score += 1
        
        return min(score, 10)  # Cap at 10