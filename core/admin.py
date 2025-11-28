from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from .models import ContactInquiry


@admin.register(ContactInquiry)
class ContactInquiryAdmin(admin.ModelAdmin):
    """
    Comprehensive admin interface for managing contact inquiries.
    """
    
    list_display = [
        'id',
        'full_name',
        'company_name',
        'project_type_display',
        'budget_badge',
        'timeline_badge',
        'status_badge',
        'priority_badge',
        'created_at',
        'actions_column',
    ]
    
    list_filter = [
        'status',
        'priority',
        'timeline',
        'budget_range',
        'is_spam',
        'created_at',
        'contacted_at',
    ]
    
    search_fields = [
        'full_name',
        'email',
        'company_name',
        'project_type',
        'project_description',
    ]
    
    readonly_fields = [
        'created_at',
        'updated_at',
        'ip_address',
        'user_agent',
    ]
    
    fieldsets = (
        (_('Status & Management'), {
            'fields': (
                'status',
                'priority',
                'assigned_to',
                'is_spam',
            ),
            'classes': ('wide',),
        }),
        (_('Contact Information'), {
            'fields': (
                'full_name',
                'email',
                'phone',
            ),
        }),
        (_('Company Details'), {
            'fields': (
                'company_name',
                'country',
                'job_title',
                'company_size',
            ),
        }),
        (_('Project Information'), {
            'fields': (
                'service',
                'project_type',
                'project_description',
                'timeline',
                'budget_range',
            ),
        }),
        (_('Additional Information'), {
            'fields': (
                'reference_url',
                'additional_notes',
                'how_did_you_hear',
            ),
            'classes': ('collapse',),
        }),
        (_('Metadata'), {
            'fields': (
                'created_at',
                'updated_at',
                'contacted_at',
                'ip_address',
                'user_agent',
            ),
            'classes': ('collapse',),
        }),
    )
    
    list_per_page = 25
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    actions = [
        'mark_as_contacted',
        'mark_as_qualified',
        'mark_as_spam',
        'mark_as_not_spam',
        'set_priority_high',
        'set_priority_medium',
    ]
    
    def project_type_display(self, obj):
        """Display project type with service"""
        if obj.service:
            return f"{obj.project_type} ({obj.service.title})"
        return obj.project_type
    project_type_display.short_description = _('Project Type')
    
    def budget_badge(self, obj):
        """Display budget as colored badge"""
        colors = {
            'under_5k': '#6b7280',
            '5k_10k': '#3b82f6',
            '10k_25k': '#8b5cf6',
            '25k_50k': '#ec4899',
            '50k_100k': '#f59e0b',
            '100k+': '#10b981',
        }
        color = colors.get(obj.budget_range, '#6b7280')
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 11px; font-weight: 600;">{}</span>',
            color,
            obj.get_budget_range_display()
        )
    budget_badge.short_description = _('Budget')
    
    def timeline_badge(self, obj):
        """Display timeline as colored badge"""
        colors = {
            'urgent': '#ef4444',
            'soon': '#f59e0b',
            'flexible': '#3b82f6',
            'planned': '#10b981',
        }
        color = colors.get(obj.timeline, '#6b7280')
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 11px; font-weight: 600;">{}</span>',
            color,
            obj.get_timeline_display()
        )
    timeline_badge.short_description = _('Timeline')
    
    def status_badge(self, obj):
        """Display status as colored badge"""
        colors = {
            'new': '#3b82f6',
            'contacted': '#8b5cf6',
            'qualified': '#f59e0b',
            'proposal_sent': '#ec4899',
            'converted': '#10b981',
            'declined': '#6b7280',
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 11px; font-weight: 600;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = _('Status')
    
    def priority_badge(self, obj):
        """Display priority as colored badge"""
        colors = {
            'low': '#6b7280',
            'medium': '#3b82f6',
            'high': '#f59e0b',
            'urgent': '#ef4444',
        }
        color = colors.get(obj.priority, '#6b7280')
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 11px; font-weight: 600;">{}</span>',
            color,
            obj.get_priority_display()
        )
    priority_badge.short_description = _('Priority')
    
    def actions_column(self, obj):
        """Action buttons for quick access"""
        return format_html(
            '<a href="mailto:{}" style="margin-right: 10px;" title="Send Email">📧</a>'
            '<a href="tel:{}" title="Call">📞</a>',
            obj.email,
            obj.phone if obj.phone else '#'
        )
    actions_column.short_description = _('Actions')
    
    # Custom Actions
    
    @admin.action(description=_('Mark as contacted'))
    def mark_as_contacted(self, request, queryset):
        """Mark selected inquiries as contacted"""
        updated = 0
        for inquiry in queryset:
            inquiry.mark_as_contacted()
            updated += 1
        self.message_user(
            request,
            _(f'{updated} inquiry(ies) marked as contacted.')
        )
    
    @admin.action(description=_('Mark as qualified'))
    def mark_as_qualified(self, request, queryset):
        """Mark selected inquiries as qualified"""
        updated = queryset.update(status='qualified')
        self.message_user(
            request,
            _(f'{updated} inquiry(ies) marked as qualified.')
        )
    
    @admin.action(description=_('Mark as spam'))
    def mark_as_spam(self, request, queryset):
        """Mark selected inquiries as spam"""
        updated = queryset.update(is_spam=True)
        self.message_user(
            request,
            _(f'{updated} inquiry(ies) marked as spam.')
        )
    
    @admin.action(description=_('Mark as NOT spam'))
    def mark_as_not_spam(self, request, queryset):
        """Mark selected inquiries as not spam"""
        updated = queryset.update(is_spam=False)
        self.message_user(
            request,
            _(f'{updated} inquiry(ies) marked as NOT spam.')
        )
    
    @admin.action(description=_('Set priority to HIGH'))
    def set_priority_high(self, request, queryset):
        """Set priority to high"""
        updated = queryset.update(priority='high')
        self.message_user(
            request,
            _(f'{updated} inquiry(ies) priority set to HIGH.')
        )
    
    @admin.action(description=_('Set priority to MEDIUM'))
    def set_priority_medium(self, request, queryset):
        """Set priority to medium"""
        updated = queryset.update(priority='medium')
        self.message_user(
            request,
            _(f'{updated} inquiry(ies) priority set to MEDIUM.')
        )
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        queryset = super().get_queryset(request)
        return queryset.select_related('service', 'assigned_to')
    
    def has_delete_permission(self, request, obj=None):
        """Only superusers can delete inquiries"""
        return request.user.is_superuser