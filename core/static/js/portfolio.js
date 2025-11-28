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
     * Prevent default for demo links and show message
     */
    function handleProjectLinkClick(e) {
        // In production, remove this and let links work normally
        // For demo, we'll show a message
        e.preventDefault();
        
        const projectName = e.currentTarget.closest('.portfolio-card')
            .querySelector('.portfolio-card-title')?.textContent || 'this project';
        
        alert(`In a production environment, this would navigate to the detailed case study for ${projectName}. For now, this is a demonstration.`);
        
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