# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Django 5.2.7 web application for TovutiLab, a digital agency offering web development services. The application features a service catalog, inquiry forms, and administrative management tools. It's configured for deployment on Passenger WSGI with WhiteNoise for static file serving.

## Development Commands

### Setup and Installation
```bash
# Install dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Create superuser for admin access
python manage.py createsuperuser

# Collect static files (required before deployment)
python manage.py collectstatic --noinput
```

### Development Server
```bash
# Run development server
python manage.py runserver

# Run on specific port
python manage.py runserver 8080
```

### Database Operations
```bash
# Create new migrations after model changes
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Open Django shell
python manage.py shell
```

### Testing
```bash
# Run all tests
python manage.py test

# Run tests for specific app
python manage.py test core
python manage.py test services

# Run with verbosity
python manage.py test --verbosity=2
```

### Cache Management
```bash
# Clear Django cache (useful after updating services/categories)
python manage.py shell -c "from django.core.cache import cache; cache.clear()"
```

## Architecture Overview

### Application Structure

The project follows Django's two-app architecture:

1. **`core` app**: Main website pages and general contact functionality
   - Homepage with service showcase
   - Portfolio and e-commerce information pages
   - Multi-step contact sales form with comprehensive tracking
   - Contact inquiry management (`ContactInquiry` model)

2. **`services` app**: Service catalog and service-specific inquiries
   - Service and category management (`Service`, `Category` models)
   - Service-specific inquiry forms (`ServiceInquiry` model)
   - Service detail pages with SEO optimization
   - Global navigation context processor for all templates

### Key Models

**`services.Service`**: Individual services offered by the agency
- Uses external URLs for images (no file uploads)
- JSON field for features list
- Auto-generates slugs and SEO meta tags
- Supports pricing and delivery time estimates
- Featured/active flags for visibility control

**`services.Category`**: Service organization and grouping
- FontAwesome icon integration
- Display order control
- Related to services via ForeignKey with PROTECT

**`services.ServiceInquiry`**: Service-specific quote requests
- Budget range, timeline, and project type tracking
- Built-in spam detection with scoring system
- Status tracking (new → reviewing → contacted → quoted → converted)
- Email notifications to admin and client

**`core.ContactInquiry`**: General sales inquiries
- Multi-step form data capture (4 steps: contact, company, project, timeline/budget)
- Status and priority management
- Assignment to team members
- Comprehensive spam prevention (IP tracking, user agent)

### Email System

Both apps implement dual email notifications:
- **Admin notifications**: Sent to `ADMIN_EMAIL` with full inquiry details and admin panel link
- **Client confirmations**: Automated thank-you emails with next steps

Email templates are in:
- `core/templates/core/emails/`
- `services/templates/services/emails/`

Email configuration uses SMTP (see settings.py:139-158) with SSL on port 465.

### Context Processors

**`services.context_processors.services_navigation`**: Global service data available in all templates
- Provides `service_categories`, `featured_services`, `service_count`
- Heavily cached (30 minutes) for performance
- Automatically prefetches related services to minimize queries

To clear cache after service changes: call `clear_services_navigation_cache()` or use cache management signal.

### URL Structure

```
/                              → Homepage (core.views.home)
/portfolio/                    → Portfolio page
/ecommerce/                    → E-commerce info page
/contact/                      → Contact sales form
/contact/success/              → Contact form success page
/services/                     → Services listing
/services/<slug>/              → Service detail page
/services/<slug>/inquiry/      → Service inquiry submission (POST only)
/services/inquiry/success/     → Service inquiry success page
/admin/                        → Django admin
```

### Static Files

- **Development**: Files served from `core/static/` and `services/static/`
- **Production**: Files collected to `staticfiles/` via `collectstatic`
- **WhiteNoise**: Handles static file serving in production (middleware at settings.py:47)
- **Assets**: JavaScript in `core/static/js/`, CSS in `core/static/css/`

### Template Inheritance

Base template: `core/templates/core/base.html`
- Includes nav component: `core/templates/components/nav.html`
- Includes footer component: `core/templates/components/footer.html`
- All pages extend base template for consistent layout

### Deployment Configuration

**Passenger WSGI**: `passenger_wsgi.py` loads the application
- Points to `cascade/wsgi.py`
- Configured for cPanel/Passenger hosting environments

**Settings Notes**:
- `DEBUG = True` in current settings (SHOULD be False in production)
- `ALLOWED_HOSTS = ["*"]` (SHOULD be restricted in production)
- SQLite database (consider PostgreSQL for production)
- Email credentials are hardcoded (SHOULD use environment variables)

## Important Patterns

### Query Optimization
All views use `select_related()` and `prefetch_related()` to minimize database queries:
```python
Service.objects.filter(is_active=True).select_related('category')
```

### Caching Strategy
- Service list views: 30-minute cache (`@cache_page(60 * 30)`)
- Service detail views: 15-minute cache (`@cache_page(60 * 15)`)
- Global navigation: 30-minute cache in context processor
- Clear cache after modifying services/categories in admin

### Spam Prevention
Both inquiry forms implement spam scoring (0-10 scale):
- Keyword detection (viagra, casino, bitcoin, etc.)
- Caps ratio analysis
- Free email domain flags
- Description length validation
- Suspicious budget/timeline combinations
- Scores > 7 automatically marked as spam

### Form Handling
All forms support both AJAX and standard submissions:
- AJAX requests return JSON responses
- Standard requests use Django messages framework
- Check `X-Requested-With` header for AJAX detection

### SEO Optimization
- Auto-generated meta titles and descriptions
- Structured data (JSON-LD) on service detail pages
- Canonical URLs in templates
- Slug-based URLs for services and categories

## Development Workflow

1. **Adding a new service**: Use Django admin at `/admin/services/service/`
2. **Modifying models**: Always run `makemigrations` then `migrate`
3. **Updating static files**: Run `collectstatic` before deploying
4. **Testing email**: Check logs for email errors; emails fail silently in forms
5. **Viewing inquiries**: Access admin panel for `ContactInquiry` and `ServiceInquiry`

## Security Considerations

- CSRF protection enabled on all forms
- Email validation on all inquiry forms
- Spam detection on all submissions
- IP address logging for tracking
- User agent tracking for security analysis
- Model-level validation in `clean()` methods

## Database Indexes

Optimized indexes on:
- `Service`: slug, category+active+display_order, is_featured+is_active
- `Category`: slug, is_active+display_order
- `ContactInquiry`: created_at, status+created_at, email, is_spam+created_at
- `ServiceInquiry`: status+created_at, email, is_spam+status, created_at
