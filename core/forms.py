from django import forms
from django.core.validators import EmailValidator
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from .models import ContactInquiry
from services.models import Service
import re


class ContactSalesForm(forms.ModelForm):
    """
    Multi-step contact sales form with comprehensive validation.
    Stripe-inspired design with progressive disclosure.
    """
    
    # Honeypot field for spam prevention
    website = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={
            'style': 'display:none !important;',
            'tabindex': '-1',
            'autocomplete': 'off'
        }),
        label=''
    )
    
    # Agreement checkbox
    agree_to_contact = forms.BooleanField(
        required=True,
        label=_('I agree to be contacted about my inquiry'),
        error_messages={
            'required': _('You must agree to be contacted to proceed.')
        }
    )
    
    class Meta:
        model = ContactInquiry
        fields = [
            'full_name',
            'email',
            'phone',
            'company_name',
            'job_title',
            'company_size',
            'country',
            'service',
            'project_type',
            'project_description',
            'timeline',
            'budget_range',
            'additional_notes',
            'reference_url',
            'how_did_you_hear',
        ]
        
        widgets = {
            # Step 1: Personal Information
            'full_name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Jane Smith',
                'maxlength': '150',
                'data-step': '1',
            }),
            'email': forms.EmailInput(attrs={
                'class': 'form-control',
                'placeholder': 'jane.smith@company.com',
                'data-step': '1',
            }),
            'phone': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '+1 (555) 123-4567',
                'maxlength': '20',
                'data-step': '1',
            }),
            
            # Step 2: Company Information
            'company_name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Acme Corporation',
                'maxlength': '200',
                'data-step': '2',
            }),
            'job_title': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Marketing Director',
                'maxlength': '150',
                'data-step': '2',
            }),
            'company_size': forms.Select(attrs={
                'class': 'form-select',
                'data-step': '2',
            }),
            'country': forms.Select(attrs={
                'class': 'form-select',
                'data-step': '2',
            }),
            
            # Step 3: Project Details
            'service': forms.Select(attrs={
                'class': 'form-select',
                'data-step': '3',
            }),
            'project_type': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'E-Commerce Website',
                'maxlength': '100',
                'data-step': '3',
            }),
            'project_description': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'Tell us about your project needs, goals, and requirements...',
                'rows': 5,
                'data-step': '3',
            }),
            
            # Step 4: Timeline & Budget
            'timeline': forms.RadioSelect(attrs={
                'class': 'form-radio',
                'data-step': '4',
            }),
            'budget_range': forms.RadioSelect(attrs={
                'class': 'form-radio',
                'data-step': '4',
            }),
            'reference_url': forms.URLInput(attrs={
                'class': 'form-control',
                'placeholder': 'https://example.com',
                'maxlength': '500',
                'data-step': '4',
            }),
            'additional_notes': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'Any additional information...',
                'rows': 3,
                'data-step': '4',
            }),
            'how_did_you_hear': forms.Select(attrs={
                'class': 'form-select',
                'data-step': '4',
            }),
        }
        
        labels = {
            'full_name': _('Full Name'),
            'email': _('Work Email'),
            'phone': _('Phone Number'),
            'company_name': _('Company/Business Name'),
            'job_title': _('Job Title'),
            'company_size': _('Company Size'),
            'country': _('Country/Region'),
            'service': _('Service of Interest'),
            'project_type': _('Project Type'),
            'project_description': _('Tell us about your project'),
            'timeline': _('When do you need this completed?'),
            'budget_range': _('What\'s your budget range?'),
            'reference_url': _('Reference/Inspiration URL'),
            'additional_notes': _('Additional Notes'),
            'how_did_you_hear': _('How did you hear about us?'),
        }
        
        error_messages = {
            'full_name': {
                'required': _('Please enter your full name.'),
            },
            'email': {
                'required': _('Please enter your work email.'),
                'invalid': _('Please enter a valid email address.'),
            },
            'company_name': {
                'required': _('Please enter your company name.'),
            },
            'project_description': {
                'required': _('Please describe your project.'),
            },
            'timeline': {
                'required': _('Please select a timeline.'),
            },
            'budget_range': {
                'required': _('Please select a budget range.'),
            },
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Load active services for dropdown
        self.fields['service'].queryset = Service.objects.filter(
            is_active=True
        ).select_related('category').order_by('category__name', 'title')
        self.fields['service'].empty_label = "Select a service"
        self.fields['service'].required = False
        
        # Country choices (simplified - in production, use a country library)
        self.fields['country'].widget = forms.Select(
            choices=[
                ('', 'Select your country'),
                ('US', 'United States'),
                ('CA', 'Canada'),
                ('GB', 'United Kingdom'),
                ('AU', 'Australia'),
                ('UG', 'Uganda'),
                ('KE', 'Kenya'),
                ('NG', 'Nigeria'),
                ('ZA', 'South Africa'),
                ('other', 'Other'),
            ],
            attrs={'class': 'form-select', 'data-step': '2'}
        )
        
        # Make some fields optional
        self.fields['phone'].required = False
        self.fields['job_title'].required = False
        self.fields['company_size'].required = False
        self.fields['reference_url'].required = False
        self.fields['additional_notes'].required = False
        self.fields['how_did_you_hear'].required = False
    
    def clean_website(self):
        """Honeypot validation"""
        if self.cleaned_data.get('website'):
            raise ValidationError(_('Invalid submission.'), code='spam')
        return ''
    
    def clean_full_name(self):
        """Validate full name"""
        name = self.cleaned_data.get('full_name', '').strip()
        
        if len(name) < 2:
            raise ValidationError(_('Please enter your full name.'))
        
        if re.search(r'\d', name):
            raise ValidationError(_('Name should not contain numbers.'))
        
        return name
    
    def clean_email(self):
        """Validate email with spam checks"""
        email = self.cleaned_data.get('email', '').strip().lower()
        
        # Check for temporary email domains
        temp_domains = [
            'tempmail.com', 'throwaway.email', '10minutemail.com',
            'guerrillamail.com', 'mailinator.com'
        ]
        
        domain = email.split('@')[-1] if '@' in email else ''
        if domain in temp_domains:
            raise ValidationError(_('Please use a permanent email address.'))
        
        return email
    
    def clean_phone(self):
        """Validate phone number if provided"""
        phone = self.cleaned_data.get('phone', '').strip()
        
        if phone:
            phone_digits = re.sub(r'[\s\-\(\)\+]', '', phone)
            
            if not phone_digits.isdigit():
                raise ValidationError(_('Please enter a valid phone number.'))
            
            if len(phone_digits) < 7 or len(phone_digits) > 15:
                raise ValidationError(_('Phone number should be 7-15 digits.'))
        
        return phone
    
    def clean_project_description(self):
        """Validate project description"""
        description = self.cleaned_data.get('project_description', '').strip()
        
        if len(description) < 20:
            raise ValidationError(
                _('Please provide more detail (at least 20 characters).')
            )
        
        # Spam keyword check
        spam_keywords = ['viagra', 'casino', 'lottery', 'porn', 'xxx']
        if any(keyword in description.lower() for keyword in spam_keywords):
            raise ValidationError(_('Invalid content detected.'))
        
        return description
    
    def save(self, commit=True, request=None):
        """Save with request metadata"""
        instance = super().save(commit=False)
        
        if request:
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                instance.ip_address = x_forwarded_for.split(',')[0].strip()
            else:
                instance.ip_address = request.META.get('REMOTE_ADDR')
            
            instance.user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]
        
        if commit:
            instance.save()
        
        return instance