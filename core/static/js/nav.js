/**
 * Navigation Controller
 * Handles navbar scroll effects, mega menus, and mobile navigation
 */

class NavigationController {
    constructor() {
        this.nav = document.getElementById('main-nav');
        this.navHeight = this.nav?.offsetHeight || 72;
        this.overlay = document.querySelector('.nav-overlay');
        this.mobileToggle = document.querySelector('.mobile-menu-toggle');
        this.mobileMenu = document.querySelector('.mobile-menu');
        this.activeMegaMenu = null;
        this.isMobileMenuOpen = false;
        
        this.init();
    }

    init() {
        if (!this.nav) return;

        this.setupScrollHandler();
        this.setupMegaMenus();
        this.setupMobileMenu();
        this.setupAccessibility();
        this.setupClickOutside();
    }

    /**
     * Scroll Handler - Changes navbar appearance on scroll
     */
    setupScrollHandler() {
        let lastScroll = 0;
        let ticking = false;

        const updateNavbar = () => {
            const currentScroll = window.pageYOffset;
            const heroSection = document.querySelector('.hero-section');
            const heroHeight = heroSection?.offsetHeight || 600;

            // Add scrolled class when past hero section
            if (currentScroll > heroHeight * 0.3) {
                this.nav.classList.add('scrolled');
            } else {
                this.nav.classList.remove('scrolled');
            }

            // Optional: Hide navbar on scroll down, show on scroll up
            // Uncomment if desired
            /*
            if (currentScroll > lastScroll && currentScroll > heroHeight) {
                this.nav.style.transform = 'translateY(-100%)';
            } else {
                this.nav.style.transform = 'translateY(0)';
            }
            */

            lastScroll = currentScroll;
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(updateNavbar);
                ticking = true;
            }
        }, { passive: true });

        // Initial check
        updateNavbar();
    }

    /**
     * Mega Menu Handler - Desktop dropdown menus
     */
    setupMegaMenus() {
        const megaMenuTriggers = document.querySelectorAll('[data-mega]');

        megaMenuTriggers.forEach(trigger => {
            const menuId = trigger.getAttribute('data-mega');
            const megaMenu = document.getElementById(`mega-${menuId}`);
            const navItem = trigger.closest('.nav-item');

            if (!megaMenu) return;

            // Mouse enter - show menu
            navItem.addEventListener('mouseenter', () => {
                this.openMegaMenu(megaMenu, navItem, trigger);
            });

            // Mouse leave - hide menu
            navItem.addEventListener('mouseleave', () => {
                this.closeMegaMenu(megaMenu, navItem, trigger);
            });

            // Keyboard support
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                if (megaMenu.classList.contains('active')) {
                    this.closeMegaMenu(megaMenu, navItem, trigger);
                } else {
                    this.openMegaMenu(megaMenu, navItem, trigger);
                }
            });

            // Keep menu open when hovering over it
            megaMenu.addEventListener('mouseenter', () => {
                clearTimeout(this.closeTimeout);
            });

            megaMenu.addEventListener('mouseleave', () => {
                this.closeMegaMenu(megaMenu, navItem, trigger);
            });
        });
    }

    openMegaMenu(megaMenu, navItem, trigger) {
        // Close any other open mega menus
        this.closeAllMegaMenus();

        // Open this mega menu
        megaMenu.classList.add('active');
        navItem.classList.add('active');
        this.overlay.classList.add('active');
        trigger.setAttribute('aria-expanded', 'true');
        this.activeMegaMenu = megaMenu;

        // Focus management for accessibility
        const firstLink = megaMenu.querySelector('a');
        if (firstLink && document.activeElement === trigger) {
            firstLink.focus();
        }
    }

    closeMegaMenu(megaMenu, navItem, trigger) {
        this.closeTimeout = setTimeout(() => {
            megaMenu.classList.remove('active');
            navItem.classList.remove('active');
            this.overlay.classList.remove('active');
            trigger.setAttribute('aria-expanded', 'false');
            if (this.activeMegaMenu === megaMenu) {
                this.activeMegaMenu = null;
            }
        }, 100);
    }

    closeAllMegaMenus() {
        const allMegaMenus = document.querySelectorAll('.mega-menu');
        const allNavItems = document.querySelectorAll('.nav-item');
        const allTriggers = document.querySelectorAll('[data-mega]');

        allMegaMenus.forEach(menu => menu.classList.remove('active'));
        allNavItems.forEach(item => item.classList.remove('active'));
        allTriggers.forEach(trigger => trigger.setAttribute('aria-expanded', 'false'));
        this.overlay.classList.remove('active');
        this.activeMegaMenu = null;
    }

    /**
     * Mobile Menu Handler
     */
    setupMobileMenu() {
        if (!this.mobileToggle || !this.mobileMenu) return;

        // Toggle mobile menu
        this.mobileToggle.addEventListener('click', () => {
            this.toggleMobileMenu();
        });

        // Mobile submenu navigation
        const mobileMenuLinks = document.querySelectorAll('[data-mobile-section]');
        mobileMenuLinks.forEach(link => {
            link.addEventListener('click', () => {
                const sectionId = link.getAttribute('data-mobile-section');
                const submenu = document.getElementById(`mobile-${sectionId}`);
                if (submenu) {
                    submenu.classList.add('active');
                }
            });
        });

        // Back buttons in submenus
        const backButtons = document.querySelectorAll('.mobile-back');
        backButtons.forEach(button => {
            button.addEventListener('click', () => {
                const submenu = button.closest('.mobile-submenu');
                if (submenu) {
                    submenu.classList.remove('active');
                }
            });
        });

        // Close mobile menu when clicking regular links
        const mobileLinks = this.mobileMenu.querySelectorAll('a:not([data-mobile-section])');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        });
    }

    toggleMobileMenu() {
        this.isMobileMenuOpen = !this.isMobileMenuOpen;

        if (this.isMobileMenuOpen) {
            this.openMobileMenu();
        } else {
            this.closeMobileMenu();
        }
    }

    openMobileMenu() {
        this.mobileMenu.classList.add('active');
        this.mobileToggle.classList.add('active');
        this.mobileToggle.setAttribute('aria-expanded', 'true');
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.isMobileMenuOpen = true;
    }

    closeMobileMenu() {
        this.mobileMenu.classList.remove('active');
        this.mobileToggle.classList.remove('active');
        this.mobileToggle.setAttribute('aria-expanded', 'false');
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        
        // Close all submenus
        const submenus = document.querySelectorAll('.mobile-submenu');
        submenus.forEach(submenu => submenu.classList.remove('active'));
        
        this.isMobileMenuOpen = false;
    }

    /**
     * Accessibility Enhancements
     */
    setupAccessibility() {
        // ESC key closes mega menus and mobile menu
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllMegaMenus();
                if (this.isMobileMenuOpen) {
                    this.closeMobileMenu();
                }
            }
        });

        // Tab key navigation for mega menus
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && this.activeMegaMenu) {
                const focusableElements = this.activeMegaMenu.querySelectorAll(
                    'a, button, [tabindex]:not([tabindex="-1"])'
                );
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                // If shift+tab on first element, close menu
                if (e.shiftKey && document.activeElement === firstElement) {
                    this.closeAllMegaMenus();
                }

                // If tab on last element, close menu
                if (!e.shiftKey && document.activeElement === lastElement) {
                    e.preventDefault();
                    this.closeAllMegaMenus();
                    const currentTrigger = document.querySelector('.nav-item.active [data-mega]');
                    if (currentTrigger) {
                        currentTrigger.focus();
                    }
                }
            }
        });
    }

    /**
     * Click Outside Handler
     */
    setupClickOutside() {
        this.overlay.addEventListener('click', () => {
            this.closeAllMegaMenus();
            if (this.isMobileMenuOpen) {
                this.closeMobileMenu();
            }
        });
    }

    /**
     * Public method to programmatically close all menus
     */
    closeAll() {
        this.closeAllMegaMenus();
        this.closeMobileMenu();
    }
}

// Initialize navigation when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.navigationController = new NavigationController();
    });
} else {
    window.navigationController = new NavigationController();
}

// Expose for external use if needed
window.NavigationController = NavigationController;