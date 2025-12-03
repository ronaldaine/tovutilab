from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from .models import Category, Tag, Post, Comment


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """
    Admin interface for blog Category model with enhanced features.
    """
    list_display = [
        'name',
        'display_order',
        'icon_preview',
        'post_count',
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

    def post_count(self, obj):
        """Display count of published posts in category"""
        published = obj.get_published_posts_count()
        total = obj.posts.count()
        return format_html(
            '<span style="color: {};">{}</span> / {}',
            '#22c55e' if published > 0 else '#ef4444',
            published,
            total
        )
    post_count.short_description = 'Published / Total'

    def get_queryset(self, request):
        """Optimize queryset with post count"""
        queryset = super().get_queryset(request)
        queryset = queryset.annotate(
            _post_count=Count('posts')
        )
        return queryset

    class Media:
        css = {
            'all': ('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',)
        }


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    """
    Admin interface for Tag model.
    """
    list_display = [
        'name',
        'slug',
        'post_count',
        'is_active',
        'created_at'
    ]
    list_filter = ['is_active', 'created_at']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['name']
    list_editable = ['is_active']
    readonly_fields = ['created_at']

    def post_count(self, obj):
        """Display count of published posts with this tag"""
        count = obj.get_published_posts_count()
        return format_html(
            '<span style="color: {}; font-weight: 600;">{}</span>',
            '#22c55e' if count > 0 else '#9ca3af',
            count
        )
    post_count.short_description = 'Posts'

    def get_queryset(self, request):
        """Optimize queryset"""
        queryset = super().get_queryset(request)
        queryset = queryset.annotate(
            _post_count=Count('posts')
        )
        return queryset


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    """
    Admin interface for Post model with enhanced features.
    """
    list_display = [
        'title',
        'author',
        'category',
        'status_badge',
        'image_preview',
        'is_featured',
        'view_count',
        'published_date',
        'created_at'
    ]
    list_filter = [
        'status',
        'category',
        'is_featured',
        'allow_comments',
        'author',
        ('published_at', admin.DateFieldListFilter),
        ('created_at', admin.DateFieldListFilter),
    ]
    search_fields = ['title', 'excerpt', 'content', 'meta_description']
    prepopulated_fields = {'slug': ('title',)}
    ordering = ['-published_at', '-created_at']
    list_editable = ['is_featured']
    readonly_fields = ['created_at', 'updated_at', 'view_count', 'image_large_preview', 'reading_time']
    date_hierarchy = 'published_at'
    filter_horizontal = ['tags']

    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'slug', 'author', 'category')
        }),
        ('Content', {
            'fields': ('excerpt', 'content')
        }),
        ('Media', {
            'fields': ('featured_image_url', 'image_large_preview')
        }),
        ('Categorization', {
            'fields': ('tags',)
        }),
        ('Publishing', {
            'fields': ('status', 'published_at', 'is_featured', 'allow_comments')
        }),
        ('SEO', {
            'fields': ('meta_title', 'meta_description'),
            'classes': ('collapse',)
        }),
        ('Analytics', {
            'fields': ('view_count', 'reading_time'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def status_badge(self, obj):
        """Display status as a colored badge"""
        colors = {
            'draft': '#6b7280',
            'published': '#22c55e',
            'scheduled': '#0073e6',
            'archived': '#ef4444',
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background: {}; color: white; padding: 4px 10px; '
            'border-radius: 4px; font-size: 12px; font-weight: 600; '
            'text-transform: uppercase;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'

    def image_preview(self, obj):
        """Display small image preview in list view"""
        if obj.featured_image_url:
            return format_html(
                '<img src="{}" style="width: 80px; height: 50px; object-fit: cover; border-radius: 4px;" />',
                obj.featured_image_url
            )
        return format_html(
            '<span style="color: #9ca3af;">No image</span>'
        )
    image_preview.short_description = 'Image'

    def image_large_preview(self, obj):
        """Display larger image preview in detail view"""
        if obj.featured_image_url:
            return format_html(
                '<img src="{}" style="max-width: 500px; height: auto; border-radius: 8px; '
                'box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />',
                obj.featured_image_url
            )
        return format_html(
            '<span style="color: #9ca3af;">No image URL provided</span>'
        )
    image_large_preview.short_description = 'Featured Image Preview'

    def published_date(self, obj):
        """Display formatted published date"""
        if obj.published_at:
            now = timezone.now()
            if obj.published_at > now and obj.status == 'scheduled':
                return format_html(
                    '<span style="color: #0073e6;">📅 {}</span>',
                    obj.published_at.strftime('%b %d, %Y %I:%M %p')
                )
            else:
                return format_html(
                    '<span>{}</span>',
                    obj.published_at.strftime('%b %d, %Y')
                )
        return format_html('<span style="color: #9ca3af;">Not published</span>')
    published_date.short_description = 'Published'

    def reading_time(self, obj):
        """Display estimated reading time"""
        minutes = obj.get_reading_time()
        return format_html(
            '<span>{} min read</span>',
            minutes
        )
    reading_time.short_description = 'Reading Time'

    def get_queryset(self, request):
        """Optimize queryset with select_related and prefetch_related"""
        queryset = super().get_queryset(request)
        queryset = queryset.select_related('author', 'category').prefetch_related('tags')
        return queryset

    actions = ['make_published', 'make_draft', 'make_featured', 'remove_featured']

    def make_published(self, request, queryset):
        """Publish selected posts"""
        count = 0
        for post in queryset:
            if post.status != 'published':
                post.status = 'published'
                if not post.published_at:
                    post.published_at = timezone.now()
                post.save()
                count += 1

        self.message_user(
            request,
            _(f'{count} post(s) published successfully.')
        )
    make_published.short_description = 'Publish selected posts'

    def make_draft(self, request, queryset):
        """Convert selected posts to draft"""
        updated = queryset.update(status='draft')
        self.message_user(
            request,
            _(f'{updated} post(s) converted to draft.')
        )
    make_draft.short_description = 'Convert to draft'

    def make_featured(self, request, queryset):
        """Mark selected posts as featured"""
        updated = queryset.update(is_featured=True)
        self.message_user(
            request,
            _(f'{updated} post(s) marked as featured.')
        )
    make_featured.short_description = 'Mark as featured'

    def remove_featured(self, request, queryset):
        """Remove featured flag from selected posts"""
        updated = queryset.update(is_featured=False)
        self.message_user(
            request,
            _(f'{updated} post(s) removed from featured.')
        )
    remove_featured.short_description = 'Remove featured'

    class Media:
        css = {
            'all': ('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',)
        }


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    """
    Admin interface for Comment model with moderation features.
    """
    list_display = [
        'comment_summary',
        'post_link',
        'status_badge',
        'parent_info',
        'submitted_date'
    ]
    list_filter = [
        'status',
        ('created_at', admin.DateFieldListFilter),
        ('post', admin.RelatedOnlyFieldListFilter),
    ]
    search_fields = [
        'author_name',
        'author_email',
        'content',
        'post__title'
    ]
    ordering = ['-created_at']
    date_hierarchy = 'created_at'
    readonly_fields = ['created_at', 'updated_at', 'ip_address', 'user_agent']

    fieldsets = (
        ('Comment Information', {
            'fields': ('post', 'parent', 'content', 'status')
        }),
        ('Author Information', {
            'fields': ('author_name', 'author_email', 'author_website')
        }),
        ('Metadata', {
            'fields': ('ip_address', 'user_agent', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    actions = ['approve_comments', 'reject_comments', 'mark_as_spam']

    def comment_summary(self, obj):
        """Display a formatted summary of the comment"""
        content_preview = obj.content[:100] + '...' if len(obj.content) > 100 else obj.content
        return format_html(
            '<strong>{}</strong><br><small style="color: #666;">{}</small><br>'
            '<small style="color: #999;">{}</small>',
            obj.author_name,
            obj.author_email,
            content_preview
        )
    comment_summary.short_description = 'Comment'

    def post_link(self, obj):
        """Display linked post"""
        url = reverse('admin:blog_post_change', args=[obj.post.id])
        return format_html(
            '<a href="{}" style="color: #0073e6;">{}</a>',
            url,
            obj.post.title[:50]
        )
    post_link.short_description = 'Post'

    def status_badge(self, obj):
        """Display status as a colored badge"""
        colors = {
            'pending': '#ffcb57',
            'approved': '#22c55e',
            'rejected': '#ef4444',
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
    status_badge.short_description = 'Status'

    def parent_info(self, obj):
        """Display parent comment info if this is a reply"""
        if obj.parent:
            return format_html(
                '<span style="color: #0073e6;">↪ Reply to {}</span>',
                obj.parent.author_name
            )
        return format_html('<span style="color: #9ca3af;">—</span>')
    parent_info.short_description = 'Reply To'

    def submitted_date(self, obj):
        """Display formatted submission date"""
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
    submitted_date.short_description = 'Submitted'

    def approve_comments(self, request, queryset):
        """Approve selected comments"""
        updated = queryset.update(status='approved')
        self.message_user(
            request,
            _(f'{updated} comment(s) approved.')
        )
    approve_comments.short_description = 'Approve selected comments'

    def reject_comments(self, request, queryset):
        """Reject selected comments"""
        updated = queryset.update(status='rejected')
        self.message_user(
            request,
            _(f'{updated} comment(s) rejected.')
        )
    reject_comments.short_description = 'Reject selected comments'

    def mark_as_spam(self, request, queryset):
        """Mark selected comments as spam"""
        updated = queryset.update(status='spam')
        self.message_user(
            request,
            _(f'{updated} comment(s) marked as spam.'),
            level='warning'
        )
    mark_as_spam.short_description = 'Mark as spam'

    def get_queryset(self, request):
        """Optimize queryset"""
        queryset = super().get_queryset(request)
        queryset = queryset.select_related('post', 'parent')
        return queryset
