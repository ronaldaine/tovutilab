from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from .models import Category, Service, ServiceInquiry


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """
    Admin interface for Category model with enhanced features.
    """
    list_display = [
        'name',
        'display_order',
        'icon_preview',
        'service_count',
        'is_active',
        'created_at'
    ]
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['display_order', 'name']
    list_editable = ['display_order', 'is_active']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'description')
        }),
        ('Display Settings', {
            'fields': ('icon_class', 'display_order', 'is_active')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def icon_preview(self, obj):
        """Display FontAwesome icon preview"""
        return format_html(
            '<i class="{}" style="font-size: 20px; color: var(--blendIntersection);"></i>',
            obj.icon_class
        )
    icon_preview.short_description = 'Icon'

    def service_count(self, obj):
        """Display count of services in category"""
        count = obj.get_active_services_count()
        total = obj.services.count()
        return format_html(
            '<span style="color: {};">{}</span> / {}',
            '#22c55e' if count > 0 else '#ef4444',
            count,
            total
        )
    service_count.short_description = 'Active / Total'

    def get_queryset(self, request):
        """Optimize queryset with service count"""
        queryset = super().get_queryset(request)
        queryset = queryset.annotate(
            _service_count=Count('services')
        )
        return queryset

    class Media:
        css = {
            'all': ('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',)
        }


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    """
    Admin interface for Service model with enhanced features.
    """
    list_display = [
        'title',
        'category',
        'display_order',
        'icon_preview',
        'image_preview',
        'price_display',
        'is_featured',
        'is_active',
        'created_at'
    ]
    list_filter = [
        'category',
        'is_active',
        'is_featured',
        'created_at'
    ]
    search_fields = ['title', 'short_description', 'full_description']
    prepopulated_fields = {'slug': ('title',)}
    ordering = ['category', 'display_order', 'title']
    list_editable = ['display_order', 'is_featured', 'is_active']
    readonly_fields = ['created_at', 'updated_at', 'image_large_preview']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('category', 'title', 'slug')
        }),
        ('Content', {
            'fields': ('short_description', 'full_description', 'features')
        }),
        ('Visual Elements', {
            'fields': ('image_url', 'image_large_preview', 'icon_class')
        }),
        ('Pricing & Timeline', {
            'fields': ('price_starting_at', 'delivery_time_days')
        }),
        ('Display Settings', {
            'fields': ('display_order', 'is_featured', 'is_active')
        }),
        ('SEO', {
            'fields': ('meta_title', 'meta_description'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def icon_preview(self, obj):
        """Display FontAwesome icon preview"""
        return format_html(
            '<i class="{}" style="font-size: 20px; color: var(--blendIntersection);"></i>',
            obj.icon_class
        )
    icon_preview.short_description = 'Icon'

    def image_preview(self, obj):
        """Display small image preview in list view"""
        if obj.image_url:
            return format_html(
                '<img src="{}" style="width: 60px; height: 40px; object-fit: cover; border-radius: 4px;" />',
                obj.image_url
            )
        return format_html(
            '<span style="color: #9ca3af;">No image</span>'
        )
    image_preview.short_description = 'Image'

    def image_large_preview(self, obj):
        """Display larger image preview in detail view"""
        if obj.image_url:
            return format_html(
                '<img src="{}" style="max-width: 400px; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />',
                obj.image_url
            )
        return format_html(
            '<span style="color: #9ca3af;">No image URL provided</span>'
        )
    image_large_preview.short_description = 'Image Preview'

    def price_display(self, obj):
        """Display formatted price"""
        return obj.get_price_display()
    price_display.short_description = 'Price'

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        queryset = super().get_queryset(request)
        queryset = queryset.select_related('category')
        return queryset

    class Media:
        css = {
            'all': ('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',)
        }
        js = (
            'admin/js/vendor/jquery/jquery.min.js',
        )

@admin.register(ServiceInquiry)
class ServiceInquiryAdmin(admin.ModelAdmin):
    """
    Comprehensive admin interface for managing service inquiries with filtering,
    search, and batch actions for efficient inquiry management.
    """
    list_display = [
        'inquiry_summary',
        'service_link',
        'budget_badge',
        'timeline_badge',
        'status_badge',
        'priority_indicator',
        'submitted_date',
        'contact_status'
    ]
    
    list_filter = [
        'status',
        'budget_range',
        'timeline',
        'is_spam',
        ('service', admin.RelatedOnlyFieldListFilter),
        ('created_at', admin.DateFieldListFilter),
    ]
    
    search_fields = [
        'full_name',
        'email',
        'company',
        'project_type',
        'project_description',
        'phone'
    ]
    
    ordering = ['-created_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        (_('Client Information'), {
            'fields': ('full_name', 'email', 'phone', 'company')
        }),
        (_('Project Details'), {
            'fields': (
                'service',
                'project_type',
                'project_description',
                'budget_range',
                'timeline',
                'reference_url',
                'additional_notes'
            )
        }),
        (_('Internal Management'), {
            'fields': (
                'status',
                'assigned_to',
                'internal_notes',
                'estimated_value'
            ),
            'classes': ('collapse',),
        }),
        (_('Metadata & Tracking'), {
            'fields': (
                'ip_address',
                'user_agent',
                'referrer',
                'is_spam'
            ),
            'classes': ('collapse',),
        }),
        (_('Timestamps'), {
            'fields': (
                'created_at',
                'updated_at',
                'contacted_at'
            ),
            'classes': ('collapse',),
        }),
    )
    
    readonly_fields = [
        'created_at',
        'updated_at',
        'ip_address',
        'user_agent',
        'referrer'
    ]
    
    actions = [
        'mark_as_new',
        'mark_as_reviewing',
        'mark_as_contacted',
        'mark_as_quoted',
        'mark_as_spam',
        'mark_as_not_spam',
    ]
    
    # Custom display methods
    def inquiry_summary(self, obj):
        """Display a formatted summary of the inquiry"""
        spam_indicator = ' 🚩' if obj.is_spam else ''
        return format_html(
            '<strong>{}</strong><br><small style="color: #666;">{}</small>{}',
            obj.full_name,
            obj.email,
            spam_indicator
        )
    inquiry_summary.short_description = _('Client')
    
    def service_link(self, obj):
        """Display linked service if available"""
        if obj.service:
            url = reverse('admin:services_service_change', args=[obj.service.id])
            return format_html(
                '<a href="{}" style="color: #0073e6;">{}</a>',
                url,
                obj.service.title
            )
        return format_html('<em style="color: #999;">{}</em>', obj.project_type)
    service_link.short_description = _('Service/Project')
    
    def budget_badge(self, obj):
        """Display budget as a styled badge"""
        colors = {
            'under_5k': '#6b7280',
            '5k_10k': '#0073e6',
            '10k_25k': '#0073e6',
            '25k_50k': '#0048e5',
            '50k_100k': '#a960ee',
            'over_100k': '#ff333d',
            'not_sure': '#9ca3af',
        }
        color = colors.get(obj.budget_range, '#6b7280')
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 8px; '
            'border-radius: 4px; font-size: 11px; font-weight: 600;">{}</span>',
            color,
            obj.get_budget_display_verbose()
        )
    budget_badge.short_description = _('Budget')
    
    def timeline_badge(self, obj):
        """Display timeline as a badge"""
        colors = {
            'asap': '#ff333d',
            'flexible': '#0073e6',
            'planned': '#09cbcb',
            'ongoing': '#a960ee',
        }
        color = colors.get(obj.timeline, '#6b7280')
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 8px; '
            'border-radius: 4px; font-size: 11px;">{}</span>',
            color,
            obj.get_timeline_display()
        )
    timeline_badge.short_description = _('Timeline')
    
    def status_badge(self, obj):
        """Display status as a colored badge"""
        colors = {
            'new': '#ffcb57',
            'reviewing': '#0073e6',
            'contacted': '#09cbcb',
            'quoted': '#a960ee',
            'converted': '#34a853',
            'declined': '#6b7280',
            'spam': '#ff333d',
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background: {}; color: white; padding: 4px 10px; '
            'border-radius: 4px; font-size: 12px; font-weight: 600; '
            'text-transform: uppercase;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = _('Status')
    
    def priority_indicator(self, obj):
        """Display priority score with visual indicator"""
        score = obj.get_priority_score()
        if score >= 8:
            color = '#ff333d'
            icon = '🔥'
        elif score >= 6:
            color = '#ffcb57'
            icon = '⭐'
        else:
            color = '#6b7280'
            icon = '•'
        
        return format_html(
            '<span style="color: {}; font-weight: bold;">{} {}</span>',
            color,
            icon,
            score
        )
    priority_indicator.short_description = _('Priority')
    
    def submitted_date(self, obj):
        """Display formatted submission date"""
        from django.utils import timezone
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff.days == 0:
            return format_html(
                '<span style="color: #ff333d; font-weight: 600;">Today</span><br>'
                '<small style="color: #999;">{}</small>',
                obj.created_at.strftime('%I:%M %p')
            )
        elif diff.days == 1:
            return format_html(
                '<span style="color: #ffcb57;">Yesterday</span><br>'
                '<small style="color: #999;">{}</small>',
                obj.created_at.strftime('%I:%M %p')
            )
        else:
            return format_html(
                '<span>{}</span><br><small style="color: #999;">{}</small>',
                obj.created_at.strftime('%b %d, %Y'),
                obj.created_at.strftime('%I:%M %p')
            )
    submitted_date.short_description = _('Submitted')
    
    def contact_status(self, obj):
        """Display whether client has been contacted"""
        if obj.contacted_at:
            return format_html(
                '<span style="color: #34a853;">✓ Contacted</span><br>'
                '<small style="color: #999;">{}</small>',
                obj.contacted_at.strftime('%b %d')
            )
        else:
            return format_html(
                '<span style="color: #ff333d;">✗ Not Contacted</span>'
            )
    contact_status.short_description = _('Contact Status')
    
    # Custom actions
    def mark_as_new(self, request, queryset):
        """Mark selected inquiries as new"""
        updated = queryset.update(status='new')
        self.message_user(
            request,
            _(f'{updated} inquiry(ies) marked as new.')
        )
    mark_as_new.short_description = _('Mark as New')
    
    def mark_as_reviewing(self, request, queryset):
        """Mark selected inquiries as reviewing"""
        updated = queryset.update(status='reviewing')
        self.message_user(
            request,
            _(f'{updated} inquiry(ies) marked as reviewing.')
        )
    mark_as_reviewing.short_description = _('Mark as Reviewing')
    
    def mark_as_contacted(self, request, queryset):
        """Mark selected inquiries as contacted and set timestamp"""
        from django.utils import timezone
        count = 0
        for inquiry in queryset:
            if not inquiry.contacted_at:
                inquiry.contacted_at = timezone.now()
            inquiry.status = 'contacted'
            inquiry.save()
            count += 1
        
        self.message_user(
            request,
            _(f'{count} inquiry(ies) marked as contacted.')
        )
    mark_as_contacted.short_description = _('Mark as Contacted')
    
    def mark_as_quoted(self, request, queryset):
        """Mark selected inquiries as quoted"""
        updated = queryset.update(status='quoted')
        self.message_user(
            request,
            _(f'{updated} inquiry(ies) marked as quoted.')
        )
    mark_as_quoted.short_description = _('Mark as Quoted')
    
    def mark_as_spam(self, request, queryset):
        """Mark selected inquiries as spam"""
        updated = queryset.update(is_spam=True, status='spam')
        self.message_user(
            request,
            _(f'{updated} inquiry(ies) marked as spam.'),
            level='warning'
        )
    mark_as_spam.short_description = _('Mark as Spam')
    
    def mark_as_not_spam(self, request, queryset):
        """Remove spam flag from selected inquiries"""
        updated = queryset.filter(is_spam=True).update(is_spam=False, status='new')
        self.message_user(
            request,
            _(f'{updated} inquiry(ies) marked as not spam.')
        )
    mark_as_not_spam.short_description = _('Mark as Not Spam')
    
    def get_queryset(self, request):
        """
        Optimize queryset with select_related for better performance
        """
        qs = super().get_queryset(request)
        return qs.select_related('service', 'service__category')
    
    class Media:
        """
        Add custom CSS for better admin interface styling
        """
        css = {
            'all': ('admin/css/inquiry_admin.css',)  # Optional: create this for custom styling
        }

# Additional admin customization for better UX
admin.site.site_header = "Cascade Digital Admin"
admin.site.site_title = "Cascade Digital"
admin.site.index_title = "Service Management Dashboard"