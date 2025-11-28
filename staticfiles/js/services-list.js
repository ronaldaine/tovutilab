/**
 * Services List Page - Interactive Functionality
 * Mobile filter toggle, smooth scrolling, and accessibility features
 * All selectors prefixed with "service-list-" to avoid conflicts
 */

(function() {
    'use strict';

    // DOM Elements
    const mobileFilterToggle = document.getElementById('serviceListMobileFilterToggle');
    const mobileFilterOverlay = document.getElementById('serviceListMobileFilterOverlay');
    const servicesSidebar = document.querySelector('.service-list-sidebar');
    const body = document.body;

    /**
     * Initialize all functionality
     */
    function init() {
        setupMobileFilter();
        setupSmoothScrolling();
        setupKeyboardNavigation();
        setupServiceCardAnimations();
    }

    /**
     * Mobile filter toggle functionality
     */
    function setupMobileFilter() {
        if (!mobileFilterToggle || !mobileFilterOverlay || !servicesSidebar) {
            return;
        }

        // Toggle filter sidebar
        mobileFilterToggle.addEventListener('click', function() {
            toggleMobileFilter(true);
        });

        // Close on overlay click
        mobileFilterOverlay.addEventListener('click', function() {
            toggleMobileFilter(false);
        });

        // Close on ESC key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && servicesSidebar.classList.contains('active')) {
                toggleMobileFilter(false);
            }
        });

        // Close filter when category is selected
        const categoryLinks = servicesSidebar.querySelectorAll('.service-list-category-link');
        categoryLinks.forEach(link => {
            link.addEventListener('click', function() {
                // Small delay to allow navigation
                setTimeout(() => {
                    toggleMobileFilter(false);
                }, 150);
            });
        });
    }

    /**
     * Toggle mobile filter state
     * @param {boolean} show - Whether to show or hide the filter
     */
    function toggleMobileFilter(show) {
        if (show) {
            servicesSidebar.classList.add('active');
            mobileFilterOverlay.classList.add('active');
            body.style.overflow = 'hidden';
            
            // Set focus to first category link for accessibility
            const firstLink = servicesSidebar.querySelector('.service-list-category-link');
            if (firstLink) {
                setTimeout(() => firstLink.focus(), 100);
            }
        } else {
            servicesSidebar.classList.remove('active');
            mobileFilterOverlay.classList.remove('active');
            body.style.overflow = '';
            
            // Return focus to toggle button
            if (mobileFilterToggle) {
                mobileFilterToggle.focus();
            }
        }
    }

    /**
     * Setup smooth scrolling for anchor links
     */
    function setupSmoothScrolling() {
        const anchorLinks = document.querySelectorAll('.service-list-page a[href^="#"]');
        
        anchorLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                
                // Skip if href is just "#"
                if (targetId === '#') {
                    return;
                }
                
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    e.preventDefault();
                    
                    // Calculate offset for fixed header
                    const headerOffset = 96;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    /**
     * Setup keyboard navigation for service cards
     */
    function setupKeyboardNavigation() {
        const serviceCards = document.querySelectorAll('.service-list-card-link');
        
        serviceCards.forEach(card => {
            // Make cards keyboard accessible
            card.setAttribute('tabindex', '0');
            
            // Handle Enter and Space key press
            card.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });
    }

    /**
     * Setup service card animations on scroll (intersection observer)
     */
    function setupServiceCardAnimations() {
        // Check if IntersectionObserver is supported
        if (!('IntersectionObserver' in window)) {
            return;
        }

        const serviceCards = document.querySelectorAll('.service-list-card');
        
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    // Add staggered animation delay
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, index * 50);
                    
                    // Stop observing once animated
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Set initial state and observe each card
        serviceCards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(card);
        });
    }

    /**
     * Handle window resize events
     */
    function handleResize() {
        // Close mobile filter when resizing to desktop
        if (window.innerWidth > 767) {
            if (servicesSidebar && servicesSidebar.classList.contains('active')) {
                toggleMobileFilter(false);
            }
        }
    }

    /**
     * Debounce function for resize events
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

    // Add resize listener with debounce
    window.addEventListener('resize', debounce(handleResize, 250));

    /**
     * Performance optimization: Lazy load images
     */
    function setupLazyLoading() {
        const images = document.querySelectorAll('.service-list-page img[loading="lazy"]');
        
        if ('loading' in HTMLImageElement.prototype) {
            // Native lazy loading is supported
            images.forEach(img => {
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                }
            });
        } else {
            // Fallback for browsers that don't support native lazy loading
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
            document.body.appendChild(script);
        }
    }

    /**
     * Add loading state for service card clicks
     */
    function setupLoadingStates() {
        const serviceCards = document.querySelectorAll('.service-list-card-link');
        
        serviceCards.forEach(card => {
            card.addEventListener('click', function(e) {
                // Add loading indicator
                this.style.opacity = '0.6';
                this.style.pointerEvents = 'none';
            });
        });
    }

    /**
     * Track analytics events (if analytics is set up)
     */
    function trackEvent(category, action, label) {
        // Google Analytics 4
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                'event_category': category,
                'event_label': label
            });
        }
        
        // Alternative: Custom analytics
        if (typeof window.analytics !== 'undefined') {
            window.analytics.track(action, {
                category: category,
                label: label
            });
        }
    }

    /**
     * Setup analytics tracking for interactions
     */
    function setupAnalytics() {
        // Track category filter clicks
        const categoryLinks = document.querySelectorAll('.service-list-category-link');
        categoryLinks.forEach(link => {
            link.addEventListener('click', function() {
                const categoryName = this.querySelector('.service-list-category-name')?.textContent;
                trackEvent('Services List', 'Category Filter', categoryName);
            });
        });

        // Track service card clicks
        const serviceCards = document.querySelectorAll('.service-list-card-link');
        serviceCards.forEach(card => {
            card.addEventListener('click', function() {
                const serviceName = this.querySelector('.service-list-card-title')?.textContent;
                trackEvent('Services List', 'Service Click', serviceName);
            });
        });

        // Track CTA button clicks
        const ctaButtons = document.querySelectorAll('.service-list-cta-btn');
        ctaButtons.forEach(button => {
            button.addEventListener('click', function() {
                const buttonText = this.textContent.trim();
                trackEvent('Services List', 'CTA Click', buttonText);
            });
        });

        // Track mobile filter toggle
        if (mobileFilterToggle) {
            mobileFilterToggle.addEventListener('click', function() {
                trackEvent('Services List', 'Mobile Filter', 'Toggle Open');
            });
        }
    }

    /**
     * Initialize on DOM ready
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Optional: Setup additional features
    setupLazyLoading();
    setupLoadingStates();
    setupAnalytics();

})();