/**
 * Hero Section Controller
 * Handles animations, interactions, and scroll effects
 */

class HeroController {
    constructor() {
        this.heroSection = document.querySelector('.hero-section');
        this.scrollIndicator = document.querySelector('.scroll-indicator');
        this.visualCards = document.querySelectorAll('.visual-card');
        this.floatingBadges = document.querySelectorAll('.floating-badge');
        
        this.init();
    }

    init() {
        if (!this.heroSection) return;

        this.setupParallax();
        this.setupScrollIndicator();
        this.setupCardInteractions();
        this.setupMouseTracking();
        this.animateOnScroll();
    }

    /**
     * Parallax Effect on Scroll
     */
    setupParallax() {
        let ticking = false;

        const updateParallax = () => {
            const scrolled = window.pageYOffset;
            const heroHeight = this.heroSection.offsetHeight;
            
            // Only apply parallax when in hero section
            if (scrolled < heroHeight) {
                // Move background orbs at different speeds
                const orbs = document.querySelectorAll('.gradient-orb');
                orbs.forEach((orb, index) => {
                    const speed = 0.3 + (index * 0.1);
                    orb.style.transform = `translateY(${scrolled * speed}px)`;
                });

                // Fade out hero content
                const heroContent = document.querySelector('.hero-content');
                const heroVisual = document.querySelector('.hero-visual');
                const opacity = 1 - (scrolled / heroHeight) * 1.5;
                
                if (heroContent) {
                    heroContent.style.opacity = Math.max(0, opacity);
                    heroContent.style.transform = `translateY(${scrolled * 0.5}px)`;
                }
                
                if (heroVisual) {
                    heroVisual.style.opacity = Math.max(0, opacity);
                    heroVisual.style.transform = `translateY(${scrolled * 0.3}px)`;
                }
            }

            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(updateParallax);
                ticking = true;
            }
        }, { passive: true });
    }

    /**
     * Scroll Indicator Click Handler
     */
    setupScrollIndicator() {
        if (!this.scrollIndicator) return;

        this.scrollIndicator.addEventListener('click', () => {
            const heroHeight = this.heroSection.offsetHeight;
            window.scrollTo({
                top: heroHeight,
                behavior: 'smooth'
            });
        });

        // Hide scroll indicator when user scrolls
        let lastScroll = 0;
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            if (currentScroll > 100 && this.scrollIndicator) {
                this.scrollIndicator.style.opacity = '0';
                this.scrollIndicator.style.pointerEvents = 'none';
            } else if (this.scrollIndicator) {
                this.scrollIndicator.style.opacity = '1';
                this.scrollIndicator.style.pointerEvents = 'auto';
            }
            lastScroll = currentScroll;
        }, { passive: true });
    }

    /**
     * Interactive Card Hover Effects
     */
    setupCardInteractions() {
        this.visualCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'scale(1.05) translateY(-10px)';
                card.style.transition = 'transform 0.4s ease';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });

            // Add tilt effect on mouse move
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) / 10;
                const rotateY = (centerX - x) / 10;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
            });
        });
    }

    /**
     * Mouse Tracking for Gradient Orbs
     */
    setupMouseTracking() {
        const orb3 = document.querySelector('.orb-3');
        if (!orb3) return;

        let mouseX = 0;
        let mouseY = 0;
        let orbX = 0;
        let orbY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        // Smooth follow animation using RAF
        const animateOrb = () => {
            const speed = 0.05;
            
            orbX += (mouseX - orbX) * speed;
            orbY += (mouseY - orbY) * speed;
            
            if (orb3) {
                orb3.style.left = `${orbX}px`;
                orb3.style.top = `${orbY}px`;
            }
            
            requestAnimationFrame(animateOrb);
        };

        animateOrb();
    }

    /**
     * Animate Elements on Scroll (Simple AOS alternative)
     */
    animateOnScroll() {
        const elements = document.querySelectorAll('[data-aos]');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('aos-animate');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        elements.forEach(element => {
            // Add initial hidden state
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            
            observer.observe(element);
        });

        // Add animation class styles
        const style = document.createElement('style');
        style.textContent = `
            .aos-animate {
                opacity: 1 !important;
                transform: translateY(0) !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Typing Animation for Hero Title (Optional Enhancement)
     */
    setupTypingAnimation() {
        const gradientText = document.querySelector('.gradient-text');
        if (!gradientText) return;

        const text = gradientText.textContent;
        gradientText.textContent = '';
        gradientText.style.borderRight = '2px solid';
        
        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                gradientText.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 100);
            } else {
                gradientText.style.borderRight = 'none';
            }
        };

        // Start typing animation after page load
        setTimeout(typeWriter, 500);
    }

    /**
     * Counter Animation for Stats
     */
    animateCounters() {
        const counters = document.querySelectorAll('.proof-item strong');
        
        counters.forEach(counter => {
            const target = counter.textContent;
            const hasPlus = target.includes('+');
            const hasPercent = target.includes('%');
            const numericValue = parseInt(target.replace(/\D/g, ''));
            
            if (isNaN(numericValue)) return;

            let current = 0;
            const increment = numericValue / 50;
            const duration = 2000;
            const stepTime = duration / 50;

            const timer = setInterval(() => {
                current += increment;
                if (current >= numericValue) {
                    counter.textContent = numericValue + (hasPlus ? '+' : '') + (hasPercent ? '%' : '');
                    clearInterval(timer);
                } else {
                    counter.textContent = Math.floor(current) + (hasPlus ? '+' : '') + (hasPercent ? '%' : '');
                }
            }, stepTime);
        });
    }

    /**
     * Add Sparkle Effects (Optional Enhancement)
     */
    addSparkles() {
        const heroContent = document.querySelector('.hero-content');
        if (!heroContent) return;

        setInterval(() => {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            
            const x = Math.random() * heroContent.offsetWidth;
            const y = Math.random() * heroContent.offsetHeight;
            
            sparkle.style.cssText = `
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                width: 4px;
                height: 4px;
                background: white;
                border-radius: 50%;
                pointer-events: none;
                animation: sparkleAnimation 1s ease-out forwards;
            `;
            
            heroContent.appendChild(sparkle);
            
            setTimeout(() => sparkle.remove(), 1000);
        }, 3000);

        // Add sparkle animation to document
        if (!document.getElementById('sparkle-styles')) {
            const style = document.createElement('style');
            style.id = 'sparkle-styles';
            style.textContent = `
                @keyframes sparkleAnimation {
                    0% {
                        opacity: 0;
                        transform: scale(0);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: scale(0) translateY(-20px);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Smooth Scroll for CTA Buttons
     */
    setupSmoothScroll() {
        const ctaButtons = document.querySelectorAll('.hero-btn');
        
        ctaButtons.forEach(button => {
            // Add ripple effect on click
            button.addEventListener('click', (e) => {
                const ripple = document.createElement('span');
                const rect = button.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                ripple.style.cssText = `
                    position: absolute;
                    left: ${x}px;
                    top: ${y}px;
                    width: 0;
                    height: 0;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.5);
                    transform: translate(-50%, -50%);
                    animation: rippleEffect 0.6s ease-out;
                `;
                
                button.style.position = 'relative';
                button.style.overflow = 'hidden';
                button.appendChild(ripple);
                
                setTimeout(() => ripple.remove(), 600);
            });
        });

        // Add ripple animation
        if (!document.getElementById('ripple-styles')) {
            const style = document.createElement('style');
            style.id = 'ripple-styles';
            style.textContent = `
                @keyframes rippleEffect {
                    to {
                        width: 300px;
                        height: 300px;
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Gradient Animation on Scroll
     */
    updateGradientPosition() {
        const gradientText = document.querySelector('.gradient-text');
        if (!gradientText) return;

        let ticking = false;

        const update = () => {
            const scrolled = window.pageYOffset;
            const position = (scrolled / 10) % 200;
            gradientText.style.backgroundPosition = `${position}% 50%`;
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(update);
                ticking = true;
            }
        }, { passive: true });
    }

    /**
     * Performance Optimization - Reduce animations on low-end devices
     */
    optimizeForPerformance() {
        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (prefersReducedMotion) {
            // Disable complex animations
            document.querySelectorAll('.gradient-orb').forEach(orb => {
                orb.style.animation = 'none';
            });
            
            document.querySelectorAll('.visual-card').forEach(card => {
                card.style.animation = 'none';
            });
        }

        // Detect low-end devices (optional)
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection && connection.saveData) {
            // Reduce animations for data saver mode
            document.body.classList.add('reduced-animations');
        }
    }

    /**
     * Intersection Observer for Performance
     */
    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Start animations when hero is visible
                    this.animateCounters();
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.2
        });

        if (this.heroSection) {
            observer.observe(this.heroSection);
        }
    }
}

/**
 * Utility Functions
 */

// Debounce function for performance
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

// Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Initialize Hero Controller
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const heroController = new HeroController();
        heroController.setupSmoothScroll();
        heroController.updateGradientPosition();
        heroController.optimizeForPerformance();
        heroController.setupIntersectionObserver();
        
        // Optional: Uncomment for additional effects
        // heroController.setupTypingAnimation();
        // heroController.addSparkles();
    });
} else {
    const heroController = new HeroController();
    heroController.setupSmoothScroll();
    heroController.updateGradientPosition();
    heroController.optimizeForPerformance();
    heroController.setupIntersectionObserver();
}

// Expose for external use
window.HeroController = HeroController;