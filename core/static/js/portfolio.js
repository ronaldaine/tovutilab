/* ========================================
   PORTFOLIO PAGE JAVASCRIPT
   Filtering, Search, Load More, and Animations
   Production-Ready with Performance Optimizations
   ======================================== */

(function() {
    'use strict';

    // ========================================
    // DOM ELEMENTS
    // ========================================
    
    const portfolioGrid = document.getElementById('portfolioGrid');
    const filterButtons = document.querySelectorAll('.portfolio-filter-btn');
    const searchInput = document.getElementById('portfolioSearch');
    const loadMoreBtn = document.querySelector('.portfolio-load-more-btn');
    const loadMoreSection = document.getElementById('portfolioLoadMore');
    const emptyState = document.getElementById('portfolioEmptyState');
    const resetFiltersBtn = document.getElementById('resetFilters');
    const portfolioCards = document.querySelectorAll('.portfolio-card');

    // ========================================
    // STATE MANAGEMENT
    // ========================================
    
    let currentFilter = 'all';
    let currentSearchTerm = '';
    let visibleCards = 9; // Initially show 9 cards
    const cardsPerPage = 6; // Load 6 more on each click

    // ========================================
    // PROJECT DATA - Modal Content
    // ========================================

    const portfolioProjectsData = {
        'techflow': {
            title: 'TechFlow Analytics',
            category: 'SaaS Platform',
            categorySlug: 'saas',
            shortDescription: 'Enterprise analytics platform processing 10M+ events daily with real-time dashboards and AI-powered insights.',
            fullDescription: 'TechFlow Analytics is a comprehensive enterprise-grade analytics platform designed for data-driven organizations seeking actionable insights at scale. Built to handle massive data volumes, the platform processes over 10 million events daily while delivering real-time dashboards and AI-powered predictive analytics. The system features advanced filtering capabilities, custom report generation, automated alerts, and seamless integration with popular business intelligence tools. Our team engineered a highly scalable architecture using Django for the backend API, React for the interactive frontend, and PostgreSQL with TimescaleDB for efficient time-series data storage.',
            images: [
                'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=800&fit=crop&q=85',
                'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop&q=85',
                'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop&q=85'
            ],
            tags: ['Django', 'React', 'PostgreSQL'],
            year: 2024,
            teamSize: '8 developers',
            duration: '6 months',
            mainMetric: '+350% Growth',
            additionalMetrics: [
                { icon: 'fa-users', label: 'Active Users', value: '50,000+' },
                { icon: 'fa-database', label: 'Events/Day', value: '10M+' },
                { icon: 'fa-bolt', label: 'Response Time', value: '<100ms' }
            ],
            result: 'Achieved 350% increase in customer metrics tracking with 99.9% uptime SLA',
            websiteUrl: 'https://techflow-analytics.example.com',
            technologies: ['Django', 'React', 'PostgreSQL', 'TimescaleDB', 'Redis', 'Celery', 'AWS', 'Docker', 'Kubernetes', 'GraphQL']
        },
        'luxestyle': {
            title: 'LuxeStyle Fashion',
            category: 'E-Commerce',
            categorySlug: 'ecommerce',
            shortDescription: 'Premium fashion e-commerce platform with $2M+ monthly revenue, featuring real-time inventory and advanced personalization.',
            fullDescription: 'LuxeStyle Fashion represents the pinnacle of modern e-commerce excellence, combining sophisticated design with powerful functionality to create an immersive online shopping experience. This premium fashion marketplace features intelligent product recommendations powered by machine learning, real-time inventory synchronization across multiple warehouses, and a seamless checkout experience optimized for conversion. The platform integrates with Stripe for secure payment processing, leverages AWS for scalable infrastructure, and implements advanced caching strategies to handle traffic spikes during seasonal sales. Our custom-built recommendation engine analyzes user behavior, purchase history, and browsing patterns to deliver personalized product suggestions that have increased average order value by 45%.',
            images: [
                'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=800&fit=crop&q=85',
                'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&h=800&fit=crop&q=85',
                'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&h=800&fit=crop&q=85'
            ],
            tags: ['Django', 'Stripe', 'AWS'],
            year: 2024,
            teamSize: '10 developers',
            duration: '8 months',
            mainMetric: '$2M+ Revenue',
            additionalMetrics: [
                { icon: 'fa-shopping-cart', label: 'Monthly Orders', value: '15,000+' },
                { icon: 'fa-dollar-sign', label: 'Monthly Revenue', value: '$2.1M' },
                { icon: 'fa-chart-line', label: 'Conversion Rate', value: '4.2%' }
            ],
            result: 'Generated $2M+ in monthly revenue with 4.2% conversion rate and 45% increase in AOV',
            websiteUrl: 'https://luxestyle-fashion.example.com',
            technologies: ['Django', 'Vue.js', 'Stripe', 'AWS', 'S3', 'CloudFront', 'PostgreSQL', 'Redis', 'Elasticsearch', 'Machine Learning']
        },
        'globaltech': {
            title: 'GlobalTech Industries',
            category: 'Corporate Website',
            categorySlug: 'corporate',
            shortDescription: 'Fortune 500 corporate website with multi-language support, SEO optimization, and enterprise CMS integration.',
            fullDescription: 'GlobalTech Industries required a world-class corporate digital presence that would reflect their position as an industry leader while providing seamless access to information for stakeholders across 45 countries. We delivered a sophisticated multi-language corporate website built on Next.js for optimal performance and SEO, integrated with a headless CMS for content management flexibility, and designed with accessibility at its core to meet WCAG 2.1 AA standards. The site features an interactive product catalog, comprehensive resource library, investor relations portal, and global career center. Advanced SEO optimization strategies, including structured data markup, dynamic sitemap generation, and strategic internal linking, resulted in a 280% increase in organic search traffic within six months. The platform supports 12 languages with automated translation workflows and region-specific content delivery.',
            images: [
                'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=800&fit=crop&q=85',
                'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&h=800&fit=crop&q=85'
            ],
            tags: ['Next.js', 'CMS', 'SEO'],
            year: 2024,
            teamSize: '12 developers',
            duration: '10 months',
            mainMetric: '+280% Traffic',
            additionalMetrics: [
                { icon: 'fa-globe', label: 'Languages', value: '12' },
                { icon: 'fa-search', label: 'Traffic Increase', value: '+280%' },
                { icon: 'fa-clock', label: 'Load Time', value: '<2s' }
            ],
            result: 'Achieved 280% increase in organic traffic and 2x improvement in page load speed',
            websiteUrl: 'https://globaltech-industries.example.com',
            technologies: ['Next.js', 'React', 'Contentful CMS', 'Node.js', 'GraphQL', 'AWS', 'CloudFront', 'MongoDB', 'i18next', 'Vercel']
        },
        // Basic data for remaining projects
        'healthhub': {
            title: 'HealthHub Connect',
            category: 'Healthcare Marketplace',
            categorySlug: 'marketplace',
            fullDescription: 'Healthcare marketplace connecting patients with providers, featuring appointment scheduling, telemedicine capabilities, and secure medical records management.',
            images: [
                'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=800&fit=crop&q=85'
            ],
            tags: ['Django', 'Vue.js', 'Redis'],
            year: 2024,
            teamSize: '6 developers',
            duration: '5 months',
            mainMetric: '25K+ Patients',
            websiteUrl: 'https://healthhub-connect.example.com',
            technologies: ['Django', 'Vue.js', 'Redis', 'PostgreSQL', 'WebRTC']
        },
        'startuplaunch': {
            title: 'StartupLaunch',
            category: 'Startup Platform',
            categorySlug: 'startup',
            fullDescription: 'Comprehensive platform for startup founders featuring pitch deck creation, investor matching, and business planning tools.',
            images: [
                'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&h=800&fit=crop&q=85'
            ],
            tags: ['React', 'Node.js', 'MongoDB'],
            year: 2024,
            teamSize: '5 developers',
            duration: '4 months',
            mainMetric: '500+ Startups',
            websiteUrl: 'https://startuplaunch.example.com',
            technologies: ['React', 'Node.js', 'MongoDB', 'Express']
        },
        'foodiemarket': {
            title: 'FoodieMarket',
            category: 'Food Delivery',
            categorySlug: 'ecommerce',
            fullDescription: 'Local food delivery marketplace connecting restaurants with customers, featuring real-time tracking and custom mobile apps.',
            images: [
                'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=800&fit=crop&q=85'
            ],
            tags: ['Shopify', 'Custom API', 'Mobile'],
            year: 2024,
            teamSize: '7 developers',
            duration: '6 months',
            mainMetric: '10K+ Orders',
            websiteUrl: 'https://foodiemarket.example.com',
            technologies: ['Shopify', 'React Native', 'Node.js', 'Socket.io']
        },
        'cloudsync': {
            title: 'CloudSync Pro',
            category: 'SaaS Platform',
            categorySlug: 'saas',
            fullDescription: 'Enterprise cloud synchronization platform with automatic backup, file versioning, and team collaboration features.',
            images: [
                'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=800&fit=crop&q=85'
            ],
            tags: ['Python', 'Kubernetes', 'GraphQL'],
            year: 2024,
            teamSize: '9 developers',
            duration: '7 months',
            mainMetric: '1PB+ Data',
            websiteUrl: 'https://cloudsync-pro.example.com',
            technologies: ['Python', 'Kubernetes', 'GraphQL', 'AWS S3', 'Redis']
        },
        'urbanspaces': {
            title: 'UrbanSpaces',
            category: 'Real Estate Platform',
            categorySlug: 'marketplace',
            fullDescription: 'Modern real estate marketplace featuring 3D property tours, interactive maps, and AI-powered property recommendations.',
            images: [
                'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=800&fit=crop&q=85'
            ],
            tags: ['Django', 'Maps API', '3D Tours'],
            year: 2024,
            teamSize: '8 developers',
            duration: '8 months',
            mainMetric: '5K+ Properties',
            websiteUrl: 'https://urbanspaces.example.com',
            technologies: ['Django', 'React', 'Mapbox', 'Three.js', 'PostgreSQL']
        },
        'financeflow': {
            title: 'FinanceFlow',
            category: 'FinTech Platform',
            categorySlug: 'startup',
            fullDescription: 'Modern fintech platform for personal finance management with blockchain integration and automated investment strategies.',
            images: [
                'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&h=800&fit=crop&q=85'
            ],
            tags: ['React Native', 'Blockchain', 'Plaid'],
            year: 2024,
            teamSize: '10 developers',
            duration: '9 months',
            mainMetric: '$50M+ Managed',
            websiteUrl: 'https://financeflow.example.com',
            technologies: ['React Native', 'Blockchain', 'Plaid', 'Node.js', 'PostgreSQL']
        }
    };

    // ========================================
    // MODAL STATE
    // ========================================

    let currentGalleryImages = [];
    let currentImageIndex = 0;
    let lastFocusedElement = null;
    let modalOpen = false;

    // ========================================
    // UTILITY FUNCTIONS
    // ========================================
    
    /**
     * Debounce function for search input
     * Delays execution until user stops typing
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Smooth scroll to top of portfolio grid
     */
    function scrollToGrid() {
        const filterSection = document.querySelector('.portfolio-filter-section');
        if (filterSection) {
            const offset = 100;
            const elementPosition = filterSection.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }

    // ========================================
    // FILTERING LOGIC
    // ========================================
    
    /**
     * Filter cards based on category and search term
     */
    function filterCards() {
        const cards = Array.from(portfolioCards);
        let visibleCount = 0;
        let totalMatchingCards = 0;

        cards.forEach((card, index) => {
            const category = card.getAttribute('data-category');
            const title = card.querySelector('.portfolio-card-title')?.textContent.toLowerCase() || '';
            const description = card.querySelector('.portfolio-card-description')?.textContent.toLowerCase() || '';
            const categoryLabel = card.querySelector('.portfolio-card-category')?.textContent.toLowerCase() || '';
            const tags = Array.from(card.querySelectorAll('.portfolio-tag')).map(tag => tag.textContent.toLowerCase()).join(' ');

            // Check category filter
            const categoryMatch = currentFilter === 'all' || category === currentFilter;

            // Check search term
            const searchTermLower = currentSearchTerm.toLowerCase();
            const searchMatch = !currentSearchTerm || 
                title.includes(searchTermLower) || 
                description.includes(searchTermLower) ||
                categoryLabel.includes(searchTermLower) ||
                tags.includes(searchTermLower);

            const shouldShow = categoryMatch && searchMatch;

            if (shouldShow) {
                totalMatchingCards++;
                
                // Show card if it's within visible limit
                if (visibleCount < visibleCards) {
                    card.classList.remove('hidden');
                    card.style.display = 'block';
                    visibleCount++;
                    
                    // Add stagger animation
                    card.style.animation = 'none';
                    requestAnimationFrame(() => {
                        card.style.animation = `fadeInUp 0.5s ease forwards ${visibleCount * 0.05}s`;
                    });
                } else {
                    card.classList.add('hidden');
                    card.style.display = 'none';
                }
            } else {
                card.classList.add('hidden');
                card.style.display = 'none';
            }
        });

        // Update Load More button visibility
        if (totalMatchingCards > visibleCards) {
            loadMoreSection.style.display = 'block';
            loadMoreBtn.innerHTML = `
                <span>Load More Projects (${totalMatchingCards - visibleCards} remaining)</span>
                <i class="fas fa-chevron-down"></i>
            `;
        } else {
            loadMoreSection.style.display = 'none';
        }

        // Show/hide empty state
        if (totalMatchingCards === 0) {
            emptyState.style.display = 'flex';
            loadMoreSection.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
        }

        // Add fade in animation CSS if not already present
        if (!document.getElementById('portfolio-animations')) {
            const style = document.createElement('style');
            style.id = 'portfolio-animations';
            style.textContent = `
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ========================================
    // EVENT HANDLERS
    // ========================================
    
    /**
     * Handle filter button clicks
     */
    function handleFilterClick(e) {
        const button = e.currentTarget;
        const filter = button.getAttribute('data-filter');

        // Update active state
        filterButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
        });
        button.classList.add('active');
        button.setAttribute('aria-selected', 'true');

        // Update current filter and reset visible cards
        currentFilter = filter;
        visibleCards = 9;

        // Apply filter
        filterCards();

        // Scroll to grid (optional, can be removed if not desired)
        // scrollToGrid();

        // Track analytics (if you have analytics setup)
        if (typeof gtag !== 'undefined') {
            gtag('event', 'filter_projects', {
                'event_category': 'Portfolio',
                'event_label': filter
            });
        }
    }

    /**
     * Handle search input
     */
    const handleSearch = debounce(function(e) {
        currentSearchTerm = e.target.value.trim();
        visibleCards = 9; // Reset visible cards count
        filterCards();

        // Track analytics
        if (typeof gtag !== 'undefined' && currentSearchTerm) {
            gtag('event', 'search_projects', {
                'event_category': 'Portfolio',
                'event_label': currentSearchTerm
            });
        }
    }, 300);

    /**
     * Handle Load More button click
     */
    function handleLoadMore() {
        visibleCards += cardsPerPage;
        filterCards();

        // Track analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'load_more_projects', {
                'event_category': 'Portfolio',
                'event_label': `Showing ${visibleCards} cards`
            });
        }
    }

    /**
     * Handle Reset Filters button click
     */
    function handleResetFilters() {
        // Reset filter
        currentFilter = 'all';
        filterButtons.forEach(btn => {
            if (btn.getAttribute('data-filter') === 'all') {
                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');
            } else {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            }
        });

        // Reset search
        currentSearchTerm = '';
        if (searchInput) {
            searchInput.value = '';
        }

        // Reset visible cards
        visibleCards = 9;

        // Apply filter
        filterCards();

        // Scroll to grid
        scrollToGrid();
    }

    // ========================================
    // MODAL FUNCTIONS
    // ========================================

    /**
     * Open modal and display project details
     */
    function openModal(projectId) {
        const projectData = portfolioProjectsData[projectId];
        if (!projectData) {
            console.error('Project data not found for:', projectId);
            return;
        }

        const modal = document.getElementById('portfolioModal');
        if (!modal) return;

        // Store last focused element
        lastFocusedElement = document.activeElement;

        // Populate modal with project data
        populateModalData(projectData);

        // Initialize gallery
        initializeGallery(projectData.images);

        // Prevent body scroll
        preventBodyScroll();

        // Show modal
        modal.classList.add('active');
        modalOpen = true;

        // Trap focus
        setTimeout(() => {
            const closeBtn = document.getElementById('modalCloseBtn');
            if (closeBtn) closeBtn.focus();
            trapFocus(modal);
        }, 300);

        // Track analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'modal_opened', {
                'event_category': 'Portfolio',
                'event_label': projectData.title
            });
        }
    }

    /**
     * Close modal and restore state
     */
    function closeModal() {
        const modal = document.getElementById('portfolioModal');
        if (!modal) return;

        // Hide modal
        modal.classList.remove('active');
        modalOpen = false;

        // Restore body scroll
        restoreBodyScroll();

        // Restore focus
        setTimeout(() => {
            if (lastFocusedElement) {
                lastFocusedElement.focus();
            }
        }, 300);

        // Track analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'modal_closed', {
                'event_category': 'Portfolio'
            });
        }
    }

    /**
     * Populate modal with project data
     */
    function populateModalData(projectData) {
        // Title
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) modalTitle.textContent = projectData.title;

        // Category
        const modalCategory = document.getElementById('modalCategory');
        if (modalCategory) modalCategory.textContent = projectData.category;

        // Tags
        const modalTags = document.getElementById('modalTags');
        if (modalTags && projectData.tags) {
            modalTags.innerHTML = projectData.tags.map(tag =>
                `<span class="portfolio-modal-tag">${tag}</span>`
            ).join('');
        }

        // Description
        const modalDescription = document.getElementById('modalDescription');
        if (modalDescription) {
            modalDescription.textContent = projectData.fullDescription || projectData.shortDescription;
        }

        // Metrics
        const modalMetrics = document.getElementById('modalMetrics');
        if (modalMetrics && projectData.additionalMetrics) {
            modalMetrics.innerHTML = projectData.additionalMetrics.map(metric => `
                <div class="portfolio-modal-metric-item">
                    <div class="portfolio-modal-metric-icon">
                        <i class="fas ${metric.icon}"></i>
                    </div>
                    <div class="portfolio-modal-metric-content">
                        <span class="portfolio-modal-metric-label">${metric.label}</span>
                        <span class="portfolio-modal-metric-value">${metric.value}</span>
                    </div>
                </div>
            `).join('');
        }

        // Details
        const modalYear = document.getElementById('modalYear');
        if (modalYear) modalYear.textContent = projectData.year || 'N/A';

        const modalTeamSize = document.getElementById('modalTeamSize');
        if (modalTeamSize) modalTeamSize.textContent = projectData.teamSize || 'N/A';

        const modalDuration = document.getElementById('modalDuration');
        if (modalDuration) modalDuration.textContent = projectData.duration || 'N/A';

        const modalResult = document.getElementById('modalResult');
        if (modalResult) modalResult.textContent = projectData.result || projectData.mainMetric || 'N/A';

        // Technologies
        const modalTechnologies = document.getElementById('modalTechnologies');
        if (modalTechnologies && projectData.technologies) {
            modalTechnologies.innerHTML = projectData.technologies.map(tech =>
                `<span class="portfolio-modal-tech-badge">${tech}</span>`
            ).join('');
        }

        // Website link
        const modalWebsiteLink = document.getElementById('modalWebsiteLink');
        if (modalWebsiteLink && projectData.websiteUrl) {
            modalWebsiteLink.href = projectData.websiteUrl;
        }
    }

    /**
     * Initialize image gallery
     */
    function initializeGallery(images) {
        currentGalleryImages = images || [];
        currentImageIndex = 0;
        showImage(0);
    }

    /**
     * Display image at specific index
     */
    function showImage(index) {
        if (!currentGalleryImages.length) return;

        // Ensure index is within bounds
        currentImageIndex = index;
        if (currentImageIndex < 0) currentImageIndex = currentGalleryImages.length - 1;
        if (currentImageIndex >= currentGalleryImages.length) currentImageIndex = 0;

        const modalImage = document.getElementById('modalMainImage');
        const imageContainer = document.querySelector('.portfolio-modal-image-container');
        const loadingSpinner = document.querySelector('.portfolio-modal-image-loading');

        if (modalImage && imageContainer) {
            // Show loading spinner
            if (loadingSpinner) loadingSpinner.style.display = 'block';
            modalImage.classList.remove('loaded');

            // Load new image
            const newImage = new Image();
            newImage.onload = () => {
                modalImage.src = currentGalleryImages[currentImageIndex];
                modalImage.alt = `Project image ${currentImageIndex + 1} of ${currentGalleryImages.length}`;
                modalImage.classList.add('loaded');
                if (loadingSpinner) loadingSpinner.style.display = 'none';
            };
            newImage.onerror = () => {
                if (loadingSpinner) loadingSpinner.style.display = 'none';
                modalImage.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"%3E%3Crect fill="%23f6f9fc" width="800" height="600"/%3E%3Ctext x="400" y="300" font-family="Arial" font-size="24" fill="%23697386" text-anchor="middle"%3EImage not available%3C/text%3E%3C/svg%3E';
                modalImage.classList.add('loaded');
            };
            newImage.src = currentGalleryImages[currentImageIndex];
        }

        // Update counter
        const currentSpan = document.getElementById('modalImageCurrent');
        const totalSpan = document.getElementById('modalImageTotal');
        if (currentSpan) currentSpan.textContent = currentImageIndex + 1;
        if (totalSpan) totalSpan.textContent = currentGalleryImages.length;

        // Hide/show navigation buttons
        const prevBtn = document.getElementById('modalImagePrev');
        const nextBtn = document.getElementById('modalImageNext');
        if (currentGalleryImages.length <= 1) {
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
        } else {
            if (prevBtn) prevBtn.style.display = 'flex';
            if (nextBtn) nextBtn.style.display = 'flex';
        }
    }

    /**
     * Navigate to next image
     */
    function nextImage() {
        showImage(currentImageIndex + 1);
    }

    /**
     * Navigate to previous image
     */
    function prevImage() {
        showImage(currentImageIndex - 1);
    }

    /**
     * Trap focus within modal
     */
    function trapFocus(modal) {
        const focusableElements = modal.querySelectorAll(
            'button:not([disabled]), [href]:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
        );

        if (!focusableElements.length) return;

        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        modal.addEventListener('keydown', function trapFocusHandler(e) {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        });
    }

    /**
     * Prevent body scroll
     */
    function preventBodyScroll() {
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.paddingRight = `${scrollbarWidth}px`;
        document.body.classList.add('modal-open');
    }

    /**
     * Restore body scroll
     */
    function restoreBodyScroll() {
        document.body.style.paddingRight = '';
        document.body.classList.remove('modal-open');
    }

    // ========================================
    // PROJECT CARD CLICK TRACKING
    // ========================================
    
    /**
     * Track portfolio card clicks
     */
    function trackProjectClick(e) {
        const card = e.currentTarget.closest('.portfolio-card');
        const projectName = card.querySelector('.portfolio-card-title')?.textContent || 'Unknown';
        
        // Track analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'view_project', {
                'event_category': 'Portfolio',
                'event_label': projectName
            });
        }

        // Log for debugging (remove in production)
        console.log('Project clicked:', projectName);
    }

    // ========================================
    // SMOOTH SCROLL FOR PROJECT LINKS
    // ========================================
    
    /**
     * Handle project card click - open modal
     */
    function handleProjectLinkClick(e) {
        e.preventDefault();

        // Get project ID from data attribute
        const card = e.currentTarget.closest('.portfolio-card');
        const projectLink = e.currentTarget;
        const projectId = projectLink.getAttribute('data-project');

        if (projectId) {
            openModal(projectId);
        } else {
            console.error('Project ID not found on card link');
        }

        // Track the click
        trackProjectClick(e);
    }

    // ========================================
    // INITIALIZATION
    // ========================================
    
    /**
     * Initialize the portfolio page
     */
    function init() {
        // Attach event listeners to filter buttons
        filterButtons.forEach(button => {
            button.addEventListener('click', handleFilterClick);
        });

        // Attach search input listener
        if (searchInput) {
            searchInput.addEventListener('input', handleSearch);
            
            // Clear search on escape key
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    searchInput.value = '';
                    currentSearchTerm = '';
                    visibleCards = 9;
                    filterCards();
                }
            });
        }

        // Attach load more button listener
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', handleLoadMore);
        }

        // Attach reset filters button listener
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', handleResetFilters);
        }

        // Attach project card click listeners
        document.querySelectorAll('.portfolio-card-link').forEach(link => {
            link.addEventListener('click', handleProjectLinkClick);
        });

        // Modal event listeners
        const modalCloseBtn = document.getElementById('modalCloseBtn');
        const modalBackdrop = document.getElementById('modalBackdrop');
        const modalImagePrev = document.getElementById('modalImagePrev');
        const modalImageNext = document.getElementById('modalImageNext');
        const modalContactBtn = document.getElementById('modalContactBtn');

        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', closeModal);
        }

        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', closeModal);
        }

        if (modalImagePrev) {
            modalImagePrev.addEventListener('click', prevImage);
        }

        if (modalImageNext) {
            modalImageNext.addEventListener('click', nextImage);
        }

        if (modalContactBtn) {
            modalContactBtn.addEventListener('click', () => {
                window.location.href = '/contact/';
            });
        }

        // Keyboard navigation for modal
        document.addEventListener('keydown', (e) => {
            if (!modalOpen) return;

            if (e.key === 'Escape') {
                closeModal();
            } else if (e.key === 'ArrowLeft') {
                prevImage();
            } else if (e.key === 'ArrowRight') {
                nextImage();
            }
        });

        // Initial filter application
        filterCards();

        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            // You can implement URL-based filtering here if needed
            filterCards();
        });

        // Keyboard navigation for filter buttons
        filterButtons.forEach((button, index) => {
            button.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    const nextButton = filterButtons[index + 1] || filterButtons[0];
                    nextButton.focus();
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const prevButton = filterButtons[index - 1] || filterButtons[filterButtons.length - 1];
                    prevButton.focus();
                }
            });
        });

        // Log initialization (remove in production)
        console.log('Portfolio page initialized successfully');
    }

    // ========================================
    // EXECUTE INITIALIZATION
    // ========================================
    
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ========================================
    // PERFORMANCE MONITORING (Optional)
    // ========================================
    
    /**
     * Log performance metrics
     */
    if (window.performance && window.performance.timing) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = window.performance.timing;
                const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
                const connectTime = perfData.responseEnd - perfData.requestStart;
                const renderTime = perfData.domComplete - perfData.domLoading;

                console.log('Performance Metrics:');
                console.log(`Page Load Time: ${pageLoadTime}ms`);
                console.log(`Connect Time: ${connectTime}ms`);
                console.log(`Render Time: ${renderTime}ms`);

                // Track performance in analytics
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'timing_complete', {
                        'name': 'load',
                        'value': pageLoadTime,
                        'event_category': 'Portfolio Page'
                    });
                }
            }, 0);
        });
    }

    // ========================================
    // INTERSECTION OBSERVER (Optional Enhancement)
    // ========================================
    
    /**
     * Lazy load images as they come into viewport
     */
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });

        // Observe all images with data-src attribute
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

})();