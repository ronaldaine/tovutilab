/**
 * Blog JavaScript - Interactive Features
 * Mobile-First Responsive Blog Functionality
 */

// ===================================
// READING PROGRESS BAR
// ===================================

function initReadingProgress() {
    const progressBar = document.getElementById('readingProgressBar');
    if (!progressBar) return;

    function updateProgress() {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100;
        progressBar.style.width = `${Math.min(scrollPercentage, 100)}%`;
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress(); // Initial call
}

// ===================================
// SHARE FUNCTIONALITY
// ===================================

function initShareFunctionality() {
    const shareBtn = document.getElementById('shareBtn');
    const shareDropdown = document.getElementById('shareDropdown');
    const copyLinkBtn = document.getElementById('copyLinkBtn');

    if (!shareBtn || !shareDropdown) return;

    // Toggle share dropdown
    shareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        shareDropdown.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!shareBtn.contains(e.target) && !shareDropdown.contains(e.target)) {
            shareDropdown.classList.remove('active');
        }
    });

    // Copy link functionality
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(window.location.href);

                // Show success feedback
                const originalText = copyLinkBtn.innerHTML;
                copyLinkBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                copyLinkBtn.style.color = '#22c55e';

                setTimeout(() => {
                    copyLinkBtn.innerHTML = originalText;
                    copyLinkBtn.style.color = '';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy link:', err);
            }
        });
    }
}

// ===================================
// TABLE OF CONTENTS
// ===================================

function initTableOfContents() {
    const tocNav = document.getElementById('tocNav');
    const articleBody = document.querySelector('.article-body');

    if (!tocNav || !articleBody) return;

    // Find all headings in the article
    const headings = articleBody.querySelectorAll('h2, h3');

    if (headings.length === 0) {
        // Hide TOC if no headings
        const tocWidget = document.getElementById('tocWidget');
        if (tocWidget) tocWidget.style.display = 'none';
        return;
    }

    // Generate table of contents
    headings.forEach((heading, index) => {
        // Add ID to heading if it doesn't have one
        if (!heading.id) {
            heading.id = `section-${index}`;
        }

        // Create TOC link
        const link = document.createElement('a');
        link.href = `#${heading.id}`;
        link.className = 'toc-link';
        link.textContent = heading.textContent;

        // Add indentation for h3
        if (heading.tagName === 'H3') {
            link.style.paddingLeft = '2rem';
            link.style.fontSize = '0.875rem';
        }

        tocNav.appendChild(link);
    });

    // Highlight active section on scroll
    function updateActiveSection() {
        const scrollPosition = window.scrollY + 150;

        headings.forEach((heading, index) => {
            const section = heading;
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const link = tocNav.querySelectorAll('.toc-link')[index];

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight + 300) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    window.addEventListener('scroll', updateActiveSection, { passive: true });
    updateActiveSection();

    // Smooth scroll for TOC links
    tocNav.querySelectorAll('.toc-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const offset = 100;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ===================================
// NEWSLETTER FORM
// ===================================

function initNewsletterForms() {
    const forms = document.querySelectorAll('.newsletter-form, .newsletter-form-small');

    forms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const input = form.querySelector('input[type="email"]');
            const button = form.querySelector('button[type="submit"]');
            const email = input.value.trim();

            if (!email) return;

            // Disable form during submission
            button.disabled = true;
            const originalButtonText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            try {
                // TODO: Replace with actual API endpoint
                // const response = await fetch('/api/newsletter/subscribe', {
                //     method: 'POST',
                //     headers: {
                //         'Content-Type': 'application/json',
                //     },
                //     body: JSON.stringify({ email }),
                // });

                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Show success message
                button.innerHTML = '<i class="fas fa-check"></i> Subscribed!';
                button.style.background = '#22c55e';
                input.value = '';

                setTimeout(() => {
                    button.innerHTML = originalButtonText;
                    button.style.background = '';
                    button.disabled = false;
                }, 3000);

            } catch (error) {
                console.error('Newsletter subscription error:', error);

                // Show error message
                button.innerHTML = '<i class="fas fa-times"></i> Error';
                button.style.background = '#ef4444';

                setTimeout(() => {
                    button.innerHTML = originalButtonText;
                    button.style.background = '';
                    button.disabled = false;
                }, 3000);
            }
        });
    });
}

// ===================================
// SEARCH FUNCTIONALITY
// ===================================

function initSearch() {
    const searchForm = document.querySelector('.blog-search-form');
    const searchInput = document.querySelector('.search-input');

    if (!searchForm || !searchInput) return;

    // Auto-focus search input on page load (desktop only)
    if (window.innerWidth >= 768) {
        setTimeout(() => {
            searchInput.focus();
        }, 500);
    }

    // Handle search form submission
    searchForm.addEventListener('submit', (e) => {
        const searchValue = searchInput.value.trim();

        // Prevent empty searches
        if (!searchValue) {
            e.preventDefault();
            searchInput.focus();
        }
    });
}

// ===================================
// LAZY LOADING IMAGES
// ===================================

function initLazyLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');

    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });

        images.forEach(img => imageObserver.observe(img));
    }
}

// ===================================
// ANIMATE ON SCROLL (AOS) REFRESH
// ===================================

function initAOSRefresh() {
    // Refresh AOS after page load to ensure all animations work
    if (typeof AOS !== 'undefined') {
        setTimeout(() => {
            AOS.refresh();
        }, 100);
    }
}

// ===================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ===================================

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');

            // Skip if it's just "#" or empty
            if (href === '#' || href === '#!') return;

            e.preventDefault();
            const target = document.querySelector(href);

            if (target) {
                const offset = 80; // Account for fixed header
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ===================================
// BACK TO TOP BUTTON
// ===================================

function initBackToTop() {
    // Create back to top button if it doesn't exist
    if (!document.querySelector('.back-to-top')) {
        const button = document.createElement('button');
        button.className = 'back-to-top';
        button.innerHTML = '<i class="fas fa-arrow-up"></i>';
        button.setAttribute('aria-label', 'Back to top');
        document.body.appendChild(button);

        // Show/hide button based on scroll position
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 500) {
                button.classList.add('visible');
            } else {
                button.classList.remove('visible');
            }
        }, { passive: true });

        // Scroll to top on click
        button.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// Add CSS for back to top button if it doesn't exist
function addBackToTopStyles() {
    if (!document.querySelector('#backToTopStyles')) {
        const style = document.createElement('style');
        style.id = 'backToTopStyles';
        style.textContent = `
            .back-to-top {
                position: fixed;
                bottom: 2rem;
                right: 2rem;
                width: 50px;
                height: 50px;
                background: linear-gradient(135deg, #0048e5 0%, #635bff 100%);
                color: white;
                border: none;
                border-radius: 50%;
                font-size: 1.25rem;
                cursor: pointer;
                opacity: 0;
                visibility: hidden;
                transform: translateY(20px);
                transition: all 0.3s ease;
                box-shadow: 0 8px 20px rgba(0, 72, 229, 0.3);
                z-index: 1000;
            }

            .back-to-top.visible {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }

            .back-to-top:hover {
                transform: translateY(-4px);
                box-shadow: 0 12px 28px rgba(0, 72, 229, 0.4);
            }

            .back-to-top:active {
                transform: translateY(-2px);
            }

            @media (max-width: 768px) {
                .back-to-top {
                    bottom: 1.5rem;
                    right: 1.5rem;
                    width: 45px;
                    height: 45px;
                    font-size: 1.125rem;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// ===================================
// VIEW COUNT TRACKING
// ===================================

function trackPostView() {
    // Only track on post detail pages
    const articleSection = document.querySelector('.article-hero-section');
    if (!articleSection) return;

    // Get post slug from URL
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const postSlug = pathParts[pathParts.length - 1];

    if (!postSlug) return;

    // Track view after user has been on page for 10 seconds
    setTimeout(() => {
        // TODO: Implement actual view tracking API call
        // fetch(`/api/blog/posts/${postSlug}/track-view`, {
        //     method: 'POST',
        //     headers: {
        //         'X-CSRFToken': csrfToken,
        //     },
        // });

        console.log('Post view tracked:', postSlug);
    }, 10000);
}

// ===================================
// KEYBOARD SHORTCUTS
// ===================================

function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Only activate if not in an input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        // Press '/' to focus search
        if (e.key === '/') {
            e.preventDefault();
            const searchInput = document.querySelector('.search-input');
            if (searchInput) {
                searchInput.focus();
            }
        }

        // Press 'Escape' to close modals/dropdowns
        if (e.key === 'Escape') {
            const shareDropdown = document.getElementById('shareDropdown');
            if (shareDropdown && shareDropdown.classList.contains('active')) {
                shareDropdown.classList.remove('active');
            }
        }
    });
}

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all features
    initReadingProgress();
    initShareFunctionality();
    initTableOfContents();
    initNewsletterForms();
    initSearch();
    initLazyLoading();
    initAOSRefresh();
    initSmoothScroll();
    addBackToTopStyles();
    initBackToTop();
    trackPostView();
    initKeyboardShortcuts();

    console.log('Blog JavaScript initialized successfully');
});

// Refresh on window resize (debounced)
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (typeof AOS !== 'undefined') {
            AOS.refresh();
        }
    }, 250);
}, { passive: true });
