from django.db import models
from django.core.validators import EmailValidator, MinLengthValidator
from django.utils.translation import gettext_lazy as _
from django.utils import timezone


class ContactInquiry(models.Model):
    """
    Model for storing contact sales inquiries.
    Multi-step form data with comprehensive tracking.
    """
    
    # Step 1: Basic Information
    full_name = models.CharField(
        max_length=150,
        verbose_name=_("Full Name"),
        help_text=_("Client's full name")
    )
    email = models.EmailField(
        max_length=255,
        validators=[EmailValidator()],
        verbose_name=_("Work Email"),
        help_text=_("Primary contact email address")
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        verbose_name=_("Phone Number"),
        help_text=_("Contact phone number (optional)")
    )
    
    # Step 2: Company Information
    company_name = models.CharField(
        max_length=200,
        verbose_name=_("Company/Business Name"),
        help_text=_("Name of the organization")
    )
    job_title = models.CharField(
        max_length=150,
        blank=True,
        verbose_name=_("Job Title"),
        help_text=_("Client's position in the company")
    )
    company_size = models.CharField(
        max_length=50,
        choices=[
            ('1-10', '1-10 employees'),
            ('11-50', '11-50 employees'),
            ('51-200', '51-200 employees'),
            ('201-1000', '201-1000 employees'),
            ('1000+', '1000+ employees'),
        ],
        blank=True,
        verbose_name=_("Company Size")
    )
    country = models.CharField(
        max_length=100,
        verbose_name=_("Country/Region"),
        help_text=_("Country or region of operation")
    )
    
    # Step 3: Project Details
    service = models.ForeignKey(
        'services.Service',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contact_inquiries',
        verbose_name=_("Service of Interest"),
        help_text=_("Primary service the client is interested in")
    )
    project_type = models.CharField(
        max_length=100,
        verbose_name=_("Project Type"),
        help_text=_("Type of project or service needed")
    )
    project_description = models.TextField(
        verbose_name=_("Project Description"),
        help_text=_("Detailed description of project requirements")
    )
    
    # Step 4: Timeline & Budget
    timeline = models.CharField(
        max_length=50,
        choices=[
            ('urgent', 'ASAP (1-2 weeks)'),
            ('soon', 'Soon (2-4 weeks)'),
            ('flexible', 'Flexible (1-2 months)'),
            ('planned', 'Planned (3+ months)'),
        ],
        verbose_name=_("Project Timeline"),
        help_text=_("When the project needs to be completed")
    )
    budget_range = models.CharField(
        max_length=50,
        choices=[
            ('under_5k', 'Under $5,000'),
            ('5k_10k', '$5,000 - $10,000'),
            ('10k_25k', '$10,000 - $25,000'),
            ('25k_50k', '$25,000 - $50,000'),
            ('50k_100k', '$50,000 - $100,000'),
            ('100k+', '$100,000+'),
        ],
        verbose_name=_("Budget Range"),
        help_text=_("Approximate budget for the project")
    )
    
    # Additional Information
    additional_notes = models.TextField(
        blank=True,
        verbose_name=_("Additional Notes"),
        help_text=_("Any other information you'd like to share")
    )
    reference_url = models.URLField(
        max_length=500,
        blank=True,
        verbose_name=_("Reference URL"),
        help_text=_("Link to inspiration or similar projects")
    )
    
    # Marketing & Source Tracking
    how_did_you_hear = models.CharField(
        max_length=100,
        choices=[
            ('search', 'Search Engine'),
            ('social', 'Social Media'),
            ('referral', 'Referral'),
            ('advertisement', 'Advertisement'),
            ('other', 'Other'),
        ],
        blank=True,
        verbose_name=_("How did you hear about us?")
    )
    
    # Status & Management
    status = models.CharField(
        max_length=50,
        choices=[
            ('new', 'New'),
            ('contacted', 'Contacted'),
            ('qualified', 'Qualified'),
            ('proposal_sent', 'Proposal Sent'),
            ('converted', 'Converted'),
            ('declined', 'Declined'),
        ],
        default='new',
        verbose_name=_("Inquiry Status")
    )
    priority = models.CharField(
        max_length=20,
        choices=[
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High'),
            ('urgent', 'Urgent'),
        ],
        default='medium',
        verbose_name=_("Priority Level")
    )
    assigned_to = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_inquiries',
        verbose_name=_("Assigned To"),
        help_text=_("Team member handling this inquiry")
    )
    
    # Spam Prevention
    is_spam = models.BooleanField(
        default=False,
        verbose_name=_("Marked as Spam")
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name=_("IP Address")
    )
    user_agent = models.CharField(
        max_length=500,
        blank=True,
        verbose_name=_("User Agent")
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
        verbose_name=_("First Contact Date")
    )
    
    class Meta:
        verbose_name = _("Contact Inquiry")
        verbose_name_plural = _("Contact Inquiries")
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['email']),
            models.Index(fields=['is_spam', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.full_name} - {self.company_name} ({self.created_at.strftime('%Y-%m-%d')})"
    
    def mark_as_contacted(self):
        """Mark inquiry as contacted and update timestamp"""
        if not self.contacted_at:
            self.contacted_at = timezone.now()
        if self.status == 'new':
            self.status = 'contacted'
        self.save()
    
    def get_timeline_display_verbose(self):
        """Get verbose timeline description"""
        timeline_map = {
            'urgent': 'ASAP (1-2 weeks)',
            'soon': 'Soon (2-4 weeks)',
            'flexible': 'Flexible (1-2 months)',
            'planned': 'Planned (3+ months)',
        }
        return timeline_map.get(self.timeline, self.timeline)
    
    def get_budget_display_verbose(self):
        """Get verbose budget description"""
        budget_map = {
            'under_5k': 'Under $5,000',
            '5k_10k': '$5,000 - $10,000',
            '10k_25k': '$10,000 - $25,000',
            '25k_50k': '$25,000 - $50,000',
            '50k_100k': '$50,000 - $100,000',
            '100k+': '$100,000+',
        }
        return budget_map.get(self.budget_range, self.budget_range)