from django.shortcuts import render, get_object_or_404
from django.views.decorators.cache import cache_page
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.db.models import Q, Count
from .models import Post, Category, Tag
import json


@require_http_methods(["GET"])
@cache_page(60 * 15)  # Cache for 15 minutes
def post_list(request):
    """
    Blog post listing page with pagination, filtering, and search.
    Optimized for performance with select_related and proper indexing.

    Query Parameters:
        category (optional): Filter by category slug
        tag (optional): Filter by tag slug
        search (optional): Search in title and content
        page (optional): Page number for pagination

    Returns:
        Rendered blog list template with filtered posts
    """
    # Get filter parameters from query params
    category_slug = request.GET.get('category')
    tag_slug = request.GET.get('tag')
    search_query = request.GET.get('search', '').strip()
    page_number = request.GET.get('page', 1)

    # Base queryset - only published posts
    posts = Post.objects.filter(
        status='published',
        published_at__lte=timezone.now()
    ).select_related(
        'author', 'category'
    ).prefetch_related('tags').order_by('-published_at')

    # Apply category filter if provided
    selected_category = None
    if category_slug:
        selected_category = get_object_or_404(
            Category,
            slug=category_slug,
            is_active=True
        )
        posts = posts.filter(category=selected_category)

    # Apply tag filter if provided
    selected_tag = None
    if tag_slug:
        selected_tag = get_object_or_404(
            Tag,
            slug=tag_slug,
            is_active=True
        )
        posts = posts.filter(tags=selected_tag)

    # Apply search filter if provided
    if search_query:
        posts = posts.filter(
            Q(title__icontains=search_query) |
            Q(excerpt__icontains=search_query) |
            Q(content__icontains=search_query)
        )

    # Get featured posts for sidebar
    featured_posts = Post.objects.filter(
        status='published',
        published_at__lte=timezone.now(),
        is_featured=True
    ).select_related('author', 'category').order_by('-published_at')[:3]

    # Get all active categories for filter UI
    categories = Category.objects.filter(
        is_active=True
    ).order_by('display_order', 'name')

    # Add post count to each category
    for category in categories:
        category.post_count = category.get_published_posts_count()

    # Get popular tags (tags with most posts)
    popular_tags = Tag.objects.filter(
        is_active=True,
        posts__status='published',
        posts__published_at__lte=timezone.now()
    ).annotate(
        post_count=Count('posts')
    ).order_by('-post_count')[:10]

    # Pagination
    paginator = Paginator(posts, 12)  # 12 posts per page

    try:
        posts_page = paginator.page(page_number)
    except PageNotAnInteger:
        posts_page = paginator.page(1)
    except EmptyPage:
        posts_page = paginator.page(paginator.num_pages)

    # Build page title and meta description
    if selected_category:
        page_title = f"{selected_category.name} - Blog"
        meta_description = selected_category.description or f"Read our latest articles about {selected_category.name.lower()}"
    elif selected_tag:
        page_title = f"Posts tagged with '{selected_tag.name}' - Blog"
        meta_description = f"Browse all blog posts tagged with {selected_tag.name}"
    elif search_query:
        page_title = f"Search results for '{search_query}' - Blog"
        meta_description = f"Search results for {search_query} in our blog"
    else:
        page_title = "Blog - Latest Articles & Insights"
        meta_description = "Stay updated with our latest articles, tutorials, and insights on web development, design, and digital marketing."

    context = {
        'posts': posts_page,
        'featured_posts': featured_posts,
        'categories': categories,
        'popular_tags': popular_tags,
        'selected_category': selected_category,
        'selected_tag': selected_tag,
        'search_query': search_query,
        'page_title': page_title,
        'meta_title': page_title + " | TovutiLab",
        'meta_description': meta_description,
    }

    return render(request, 'blog/post_list.html', context)


@require_http_methods(["GET"])
@cache_page(60 * 10)  # Cache for 10 minutes
def post_detail(request, slug):
    """
    Blog post detail view with comprehensive optimization.

    Features:
    - Single query optimization with select_related
    - Related posts suggestions
    - View count increment
    - SEO-optimized with structured data
    - Comment display (approved comments only)

    Args:
        request: HTTP request object
        slug: URL-friendly post identifier

    Returns:
        Rendered post detail template with context

    Raises:
        Http404: If post doesn't exist or is not published
    """
    # Fetch the post with related data in optimized queries
    post = get_object_or_404(
        Post.objects.select_related('author', 'category').prefetch_related('tags'),
        slug=slug,
        status='published',
        published_at__lte=timezone.now()
    )

    # Increment view count (use update to avoid triggering save signals)
    Post.objects.filter(id=post.id).update(view_count=post.view_count + 1)
    # Reload the instance to reflect the updated view count
    post.refresh_from_db()

    # Get related posts based on category and tags
    related_posts = post.get_related_posts(limit=3)

    # Get approved comments for this post
    comments = post.comments.filter(
        status='approved'
    ).select_related('parent').order_by('-created_at')

    # Separate top-level comments and replies
    top_level_comments = comments.filter(parent__isnull=True)

    # Build breadcrumb data for structured navigation
    breadcrumbs = [
        {'title': 'Home', 'url': '/'},
        {'title': 'Blog', 'url': '/blog/'},
        {'title': post.category.name, 'url': f'/blog/?category={post.category.slug}'},
        {'title': post.title, 'url': None}
    ]

    # Prepare structured data for SEO (JSON-LD)
    structured_data = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.excerpt or post.meta_description,
        "author": {
            "@type": "Person",
            "name": f"{post.author.first_name} {post.author.last_name}".strip() or post.author.username
        },
        "publisher": {
            "@type": "Organization",
            "name": "TovutiLab",
            "logo": {
                "@type": "ImageObject",
                "url": request.build_absolute_uri('/static/img/logo.png')
            }
        },
        "datePublished": post.published_at.isoformat() if post.published_at else None,
        "dateModified": post.updated_at.isoformat(),
    }

    # Add featured image if available
    if post.featured_image_url:
        structured_data["image"] = post.featured_image_url

    # Convert structured data to JSON string for template
    structured_data_json = json.dumps(structured_data)

    # Get all active categories for sidebar
    categories = Category.objects.filter(
        is_active=True
    ).order_by('display_order', 'name')

    # Get popular tags for sidebar
    popular_tags = Tag.objects.filter(
        is_active=True,
        posts__status='published',
        posts__published_at__lte=timezone.now()
    ).annotate(
        post_count=Count('posts')
    ).order_by('-post_count')[:10]

    context = {
        'post': post,
        'related_posts': related_posts,
        'comments': top_level_comments,
        'comment_count': comments.count(),
        'categories': categories,
        'popular_tags': popular_tags,
        'breadcrumbs': breadcrumbs,
        'structured_data': structured_data_json,

        # SEO Meta tags
        'meta_title': post.meta_title or f"{post.title} | TovutiLab Blog",
        'meta_description': post.meta_description or post.excerpt[:160] if post.excerpt else "Read this article on TovutiLab Blog",
        'og_title': post.title,
        'og_description': post.excerpt or post.meta_description,
        'og_image': post.featured_image_url,
        'og_type': 'article',
        'canonical_url': request.build_absolute_uri(),
    }

    return render(request, 'blog/post_detail.html', context)


@require_http_methods(["GET"])
@cache_page(60 * 30)  # Cache for 30 minutes
def category_posts(request, slug):
    """
    Category-specific posts listing page.
    SEO-friendly URLs for better indexing and user experience.

    Args:
        slug: URL-friendly category identifier

    Returns:
        Redirects to post_list with category filter
    """
    # Verify category exists
    category = get_object_or_404(
        Category,
        slug=slug,
        is_active=True
    )

    # Redirect to post_list with category parameter
    from django.shortcuts import redirect
    return redirect(f'/blog/?category={slug}')


@require_http_methods(["GET"])
@cache_page(60 * 30)  # Cache for 30 minutes
def tag_posts(request, slug):
    """
    Tag-specific posts listing page.
    SEO-friendly URLs for better indexing and user experience.

    Args:
        slug: URL-friendly tag identifier

    Returns:
        Redirects to post_list with tag filter
    """
    # Verify tag exists
    tag = get_object_or_404(
        Tag,
        slug=slug,
        is_active=True
    )

    # Redirect to post_list with tag parameter
    from django.shortcuts import redirect
    return redirect(f'/blog/?tag={slug}')
