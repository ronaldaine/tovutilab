from django import forms
from django.core.validators import EmailValidator, MinLengthValidator
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from .models import ServiceInquiry, Service
import re


class ServiceInquiryForm(forms.ModelForm):
    """
    Professional service inquiry form with comprehensive validation,
    spam prevention, and user-friendly error messages.
    """
    
    # Honeypot field for spam prevention (hidden via CSS)
    website = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={
            'style': 'display:none !important;',
            'tabindex': '-1',
            'autocomplete': 'off'
        }),
        label=''
    )
    
    # Terms acceptance
    accept_terms = forms.BooleanField(
        required=True,
        label=_('I agree to receive project updates and communication'),
        error_messages={
            'required': _('You must agree to receive communication to proceed.')
        }
    )
    
    class Meta:
        model = ServiceInquiry
        fields = [
            'full_name',
            'email',
            'phone',
            'company',
            'service',
            'project_type',
            'project_description',
            'budget_range',
            'timeline',
            'reference_url',
            'additional_notes',
        ]
        
        widgets = {
            'full_name': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'John Doe',
                'maxlength': '150',
                'required': True,
            }),
            'email': forms.EmailInput(attrs={
                'class': 'form-input',
                'placeholder': 'john.doe@example.com',
                'required': True,
            }),
            'phone': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': '+1 (555) 123-4567',
                'maxlength': '20',
            }),
            'company': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'Your Company Name',
                'maxlength': '200',
            }),
            'service': forms.Select(attrs={
                'class': 'form-select',
            }),
            'project_type': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'e.g., E-Commerce Website, Web Application',
                'maxlength': '100',
                'required': True,
            }),
            'project_description': forms.Textarea(attrs={
                'class': 'form-textarea',
                'placeholder': 'Tell us about your project vision, goals, and requirements...',
                'rows': 6,
                'required': True,
            }),
            'budget_range': forms.Select(attrs={
                'class': 'form-select',
                'required': True,
            }),
            'timeline': forms.Select(attrs={
                'class': 'form-select',
                'required': True,
            }),
            'reference_url': forms.URLInput(attrs={
                'class': 'form-input',
                'placeholder': 'https://example.com',
                'maxlength': '500',
            }),
            'additional_notes': forms.Textarea(attrs={
                'class': 'form-textarea',
                'placeholder': 'Any additional information or specific requirements...',
                'rows': 4,
            }),
        }
        
        labels = {
            'full_name': _('Full Name'),
            'email': _('Email Address'),
            'phone': _('Phone Number (Optional)'),
            'company': _('Company Name (Optional)'),
            'service': _('Interested Service (Optional)'),
            'project_type': _('Project Type'),
            'project_description': _('Project Description'),
            'budget_range': _('Budget Range'),
            'timeline': _('Desired Timeline'),
            'reference_url': _('Reference/Inspiration URL (Optional)'),
            'additional_notes': _('Additional Notes (Optional)'),
        }
        
        help_texts = {
            'project_description': _('Minimum 20 characters. Be as detailed as possible.'),
            'budget_range': _('Select your approximate budget range for this project.'),
            'timeline': _('When do you need this project completed?'),
            'reference_url': _('Share a website or design that inspires you.'),
        }
        
        error_messages = {
            'full_name': {
                'required': _('Please enter your full name.'),
                'max_length': _('Name is too long. Please use 150 characters or less.'),
            },
            'email': {
                'required': _('Please enter your email address.'),
                'invalid': _('Please enter a valid email address.'),
            },
            'project_type': {
                'required': _('Please specify your project type.'),
            },
            'project_description': {
                'required': _('Please provide a description of your project.'),
            },
            'budget_range': {
                'required': _('Please select your budget range.'),
            },
            'timeline': {
                'required': _('Please select your desired timeline.'),
            },
        }
    
    def __init__(self, *args, **kwargs):
        """
        Initialize form with additional configuration.
        """
        super().__init__(*args, **kwargs)
        
        # Filter service dropdown to only show active services
        self.fields['service'].queryset = Service.objects.filter(
            is_active=True
        ).select_related('category').order_by('category__name', 'title')
        
        # Add empty label for optional service field
        self.fields['service'].empty_label = "Select a service (optional)"
        
        # Make service field not required in the form
        self.fields['service'].required = False
    
    def clean_website(self):
        """
        Honeypot field validation - if filled, it's likely spam.
        """
        website = self.cleaned_data.get('website')
        if website:
            raise ValidationError(
                _('Invalid submission detected.'),
                code='spam_detected'
            )
        return website
    
    def clean_full_name(self):
        """
        Validate full name field.
        """
        full_name = self.cleaned_data.get('full_name', '').strip()
        
        # Check minimum length
        if len(full_name) < 2:
            raise ValidationError(
                _('Please enter a valid full name (at least 2 characters).'),
                code='name_too_short'
            )
        
        # Check for numbers in name (common spam indicator)
        if re.search(r'\d', full_name):
            raise ValidationError(
                _('Name should not contain numbers.'),
                code='invalid_name_format'
            )
        
        # Check for excessive special characters
        special_char_count = len(re.findall(r'[^a-zA-Z\s\-\']', full_name))
        if special_char_count > 2:
            raise ValidationError(
                _('Name contains too many special characters.'),
                code='invalid_name_format'
            )
        
        return full_name
    
    def clean_email(self):
        """
        Validate email with additional spam checks.
        """
        email = self.cleaned_data.get('email', '').strip().lower()
        
        # Basic email validation is handled by EmailField
        # Additional checks for spam patterns
        spam_domains = [
            'tempmail.com', 'throwaway.email', '10minutemail.com',
            'guerrillamail.com', 'mailinator.com'
        ]
        
        email_domain = email.split('@')[-1] if '@' in email else ''
        if email_domain in spam_domains:
            raise ValidationError(
                _('Please use a permanent email address.'),
                code='temporary_email'
            )
        
        return email
    
    def clean_phone(self):
        """
        Validate phone number format if provided.
        """
        phone = self.cleaned_data.get('phone', '').strip()
        
        if phone:
            # Remove common formatting characters
            phone_digits = re.sub(r'[\s\-\(\)\+]', '', phone)
            
            # Check if remaining characters are digits
            if not phone_digits.isdigit():
                raise ValidationError(
                    _('Please enter a valid phone number.'),
                    code='invalid_phone'
                )
            
            # Check reasonable length (7-15 digits)
            if len(phone_digits) < 7 or len(phone_digits) > 15:
                raise ValidationError(
                    _('Phone number should be between 7 and 15 digits.'),
                    code='invalid_phone_length'
                )
        
        return phone
    
    def clean_project_description(self):
        """
        Validate project description with spam detection.
        """
        description = self.cleaned_data.get('project_description', '').strip()
        
        # Check minimum length
        if len(description) < 20:
            raise ValidationError(
                _('Please provide a more detailed description (at least 20 characters).'),
                code='description_too_short'
            )
        
        # Check for spam keywords
        spam_keywords = [
            'viagra', 'casino', 'lottery', 'bitcoin', 'crypto',
            'porn', 'xxx', 'dating', 'hookup', 'pills'
        ]
        description_lower = description.lower()
        
        for keyword in spam_keywords:
            if keyword in description_lower:
                raise ValidationError(
                    _('Your description contains inappropriate content.'),
                    code='spam_content'
                )
        
        # Check for excessive links (common spam pattern)
        url_pattern = r'https?://[^\s]+'
        urls_found = re.findall(url_pattern, description)
        if len(urls_found) > 3:
            raise ValidationError(
                _('Please limit the number of URLs in your description.'),
                code='too_many_urls'
            )
        
        # Check for excessive repetition (spam pattern)
        words = description_lower.split()
        if len(words) > 10:
            unique_words = set(words)
            repetition_ratio = len(words) / len(unique_words)
            if repetition_ratio > 3:
                raise ValidationError(
                    _('Your description contains excessive repetition.'),
                    code='spam_repetition'
                )
        
        return description
    
    def clean_reference_url(self):
        """
        Validate reference URL if provided.
        """
        url = self.cleaned_data.get('reference_url', '').strip()
        
        if url:
            # Basic URL validation is handled by URLField
            # Additional check for suspicious domains
            suspicious_patterns = ['bit.ly', 'tinyurl', 'goo.gl']
            if any(pattern in url.lower() for pattern in suspicious_patterns):
                raise ValidationError(
                    _('Please provide a direct URL, not a shortened link.'),
                    code='shortened_url'
                )
        
        return url
    
    def clean(self):
        """
        Cross-field validation and additional spam checks.
        """
        cleaned_data = super().clean()
        
        # Check budget and timeline combination for spam patterns
        budget = cleaned_data.get('budget_range')
        timeline = cleaned_data.get('timeline')
        
        if budget == 'under_5k' and timeline == 'asap':
            # This combination is often spam, but don't reject outright
            # Just flag it in the instance
            self.instance.is_spam = False  # Will be reviewed manually
        
        # Check if email domain matches company (optional consistency check)
        email = cleaned_data.get('email', '')
        company = cleaned_data.get('company', '')
        
        if company and email:
            email_domain = email.split('@')[-1].split('.')[0].lower()
            company_slug = re.sub(r'[^a-z0-9]', '', company.lower())
            
            # This is just informational, not a validation error
            # Could be used for scoring in the model
            if email_domain not in company_slug and len(company_slug) > 3:
                # Domain doesn't match company, possible lead quality indicator
                pass
        
        return cleaned_data
    
    def save(self, commit=True, request=None):
        """
        Save the form with additional metadata from the request.
        """
        instance = super().save(commit=False)
        
        # Add request metadata if available
        if request:
            # Get client IP address
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                instance.ip_address = x_forwarded_for.split(',')[0].strip()
            else:
                instance.ip_address = request.META.get('REMOTE_ADDR')
            
            # Get user agent
            instance.user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]
            
            # Get referrer
            instance.referrer = request.META.get('HTTP_REFERER', '')[:500]
        
        if commit:
            instance.save()
        
        return instance