from django.db import models
from django.contrib.auth.models import User
from django.core.validators import URLValidator, MinLengthValidator
from django.core.exceptions import ValidationError
from django.utils.text import slugify
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from django.utils import timezone


class Category(models.Model):
    """
    Blog category model for organizing posts into logical groups.
    Examples: Technology, Business, Design, Tutorials, etc.
    """
    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name=_("Category Name"),
        help_text=_("Unique name for the blog category")
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
        default="fas fa-folder",
        verbose_name=_("FontAwesome Icon Class"),
        help_text=_("FontAwesome icon class (e.g., 'fas fa-laptop-code')")
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

    def get_published_posts_count(self):
        """Returns count of published posts in this category"""
        return self.posts.filter(status='published', published_at__lte=timezone.now()).count()


class Tag(models.Model):
    """
    Tag model for flexible post categorization and filtering.
    """
    name = models.CharField(
        max_length=50,
        unique=True,
        verbose_name=_("Tag Name"),
        help_text=_("Unique tag name")
    )
    slug = models.SlugField(
        max_length=60,
        unique=True,
        blank=True,
        verbose_name=_("URL Slug"),
        help_text=_("Auto-generated URL-friendly version of the name")
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Active"),
        help_text=_("Whether this tag is visible on the website")
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("Tag")
        verbose_name_plural = _("Tags")
        ordering = ['name']
        indexes = [
            models.Index(fields=['slug']),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        """Auto-generate slug from name if not provided"""
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def get_published_posts_count(self):
        """Returns count of published posts with this tag"""
        return self.posts.filter(status='published', published_at__lte=timezone.now()).count()


class Post(models.Model):
    """
    Blog post model representing individual blog articles.
    Uses URL field for images to avoid server storage.
    """

    # Status choices for post lifecycle
    STATUS_CHOICES = [
        ('draft', _('Draft')),
        ('published', _('Published')),
        ('scheduled', _('Scheduled')),
        ('archived', _('Archived')),
    ]

    # Core Fields
    title = models.CharField(
        max_length=200,
        verbose_name=_("Post Title"),
        help_text=_("Title of the blog post")
    )
    slug = models.SlugField(
        max_length=220,
        unique=True,
        blank=True,
        verbose_name=_("URL Slug"),
        help_text=_("Auto-generated URL-friendly version of the title")
    )
    excerpt = models.TextField(
        max_length=500,
        blank=True,
        verbose_name=_("Excerpt"),
        help_text=_("Brief summary for post previews (max 500 chars)")
    )
    content = models.TextField(
        verbose_name=_("Content"),
        help_text=_("Full post content (supports HTML)")
    )

    # Categorization
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='posts',
        verbose_name=_("Category"),
        help_text=_("Primary category for this post")
    )
    tags = models.ManyToManyField(
        Tag,
        blank=True,
        related_name='posts',
        verbose_name=_("Tags"),
        help_text=_("Tags for this post")
    )

    # Author and Media
    author = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='blog_posts',
        verbose_name=_("Author"),
        help_text=_("Author of this post")
    )
    featured_image_url = models.URLField(
        max_length=500,
        blank=True,
        validators=[URLValidator()],
        verbose_name=_("Featured Image URL"),
        help_text=_("Full URL to featured image (hosted externally)")
    )

    # Publishing
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        verbose_name=_("Status"),
        help_text=_("Publishing status of this post")
    )
    published_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Published Date"),
        help_text=_("When this post was/will be published")
    )

    # Features and Visibility
    is_featured = models.BooleanField(
        default=False,
        verbose_name=_("Featured Post"),
        help_text=_("Highlight this post on the blog homepage")
    )
    allow_comments = models.BooleanField(
        default=True,
        verbose_name=_("Allow Comments"),
        help_text=_("Allow readers to comment on this post")
    )

    # Analytics
    view_count = models.PositiveIntegerField(
        default=0,
        verbose_name=_("View Count"),
        help_text=_("Number of times this post has been viewed")
    )

    # SEO
    meta_title = models.CharField(
        max_length=60,
        blank=True,
        verbose_name=_("SEO Meta Title"),
        help_text=_("Page title for SEO (leave blank to use post title)")
    )
    meta_description = models.CharField(
        max_length=160,
        blank=True,
        verbose_name=_("SEO Meta Description"),
        help_text=_("Meta description for SEO (max 160 chars)")
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Post")
        verbose_name_plural = _("Posts")
        ordering = ['-published_at', '-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['status', '-published_at']),
            models.Index(fields=['category', 'status', '-published_at']),
            models.Index(fields=['author', '-published_at']),
            models.Index(fields=['is_featured', 'status']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        """Auto-generate slug and SEO fields if not provided"""
        if not self.slug:
            self.slug = slugify(self.title)

        # Auto-set published_at when status changes to published
        if self.status == 'published' and not self.published_at:
            self.published_at = timezone.now()

        # Generate meta fields if not provided
        if not self.meta_title:
            self.meta_title = self.title[:60]
        if not self.meta_description and self.excerpt:
            self.meta_description = self.excerpt[:160]

        super().save(*args, **kwargs)

    def get_absolute_url(self):
        """Returns the URL for this post's detail page"""
        return reverse('blog:post_detail', kwargs={'slug': self.slug})

    def is_published(self):
        """Check if post is currently published"""
        if self.status == 'published' and self.published_at:
            return self.published_at <= timezone.now()
        return False

    def increment_view_count(self):
        """Increment the view count for this post"""
        self.view_count += 1
        self.save(update_fields=['view_count'])

    def get_reading_time(self):
        """Calculate estimated reading time in minutes"""
        word_count = len(self.content.split())
        reading_time = max(1, round(word_count / 200))  # Average reading speed: 200 words/min
        return reading_time

    def get_related_posts(self, limit=3):
        """Get related posts based on category and tags"""
        related_posts = Post.objects.filter(
            category=self.category,
            status='published',
            published_at__lte=timezone.now()
        ).exclude(id=self.id)

        # Filter by common tags if available
        if self.tags.exists():
            related_posts = related_posts.filter(tags__in=self.tags.all()).distinct()

        return related_posts[:limit]

    def clean(self):
        """Custom validation"""
        super().clean()

        # Validate that scheduled posts have a future published_at date
        if self.status == 'scheduled':
            if not self.published_at:
                raise ValidationError({
                    'published_at': _('Scheduled posts must have a publish date.')
                })
            if self.published_at <= timezone.now():
                raise ValidationError({
                    'published_at': _('Scheduled publish date must be in the future.')
                })


class Comment(models.Model):
    """
    Comment model for reader engagement on blog posts.
    Includes moderation and spam prevention features.
    """

    # Status choices for comment moderation
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('approved', _('Approved')),
        ('rejected', _('Rejected')),
        ('spam', _('Spam')),
    ]

    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name=_("Post"),
        help_text=_("The post this comment belongs to")
    )
    author_name = models.CharField(
        max_length=100,
        verbose_name=_("Name"),
        validators=[MinLengthValidator(2)],
        help_text=_("Commenter's name")
    )
    author_email = models.EmailField(
        verbose_name=_("Email Address"),
        help_text=_("Commenter's email (not displayed publicly)")
    )
    author_website = models.URLField(
        max_length=200,
        blank=True,
        verbose_name=_("Website"),
        help_text=_("Optional: Commenter's website")
    )
    content = models.TextField(
        verbose_name=_("Comment"),
        validators=[MinLengthValidator(10)],
        help_text=_("Comment content")
    )

    # Moderation
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name=_("Status"),
        help_text=_("Moderation status")
    )

    # Spam Prevention
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

    # Reply Threading (optional)
    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='replies',
        verbose_name=_("Parent Comment"),
        help_text=_("Parent comment if this is a reply")
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Comment")
        verbose_name_plural = _("Comments")
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['post', 'status', '-created_at']),
            models.Index(fields=['status', '-created_at']),
        ]

    def __str__(self):
        return f"Comment by {self.author_name} on {self.post.title}"

    def is_approved(self):
        """Check if comment is approved"""
        return self.status == 'approved'

    def approve(self):
        """Approve this comment"""
        self.status = 'approved'
        self.save()

    def reject(self):
        """Reject this comment"""
        self.status = 'rejected'
        self.save()

    def mark_as_spam(self):
        """Mark this comment as spam"""
        self.status = 'spam'
        self.save()
