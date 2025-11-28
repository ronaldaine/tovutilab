/**
 * Service Card Slider (SCS) - Stripe-Inspired Card Carousel
 * Prefix: scs- to avoid class conflicts
 * Responsive, touch-enabled, performance-optimized slider
 * @version 1.0.0
 */

class ServiceCardSlider {
    constructor(container) {
        this.container = container;
        this.slider = container.querySelector('.scs-slider');
        this.cards = Array.from(this.slider.querySelectorAll('.scs-card'));
        this.prevBtn = container.querySelector('.scs-nav-prev');
        this.nextBtn = container.querySelector('.scs-nav-next');
        this.indicatorsContainer = container.querySelector('.scs-indicators');
        
        // Slider state
        this.currentIndex = 0;
        this.cardsPerView = this.getCardsPerView();
        this.totalSlides = Math.ceil(this.cards.length / this.cardsPerView);
        this.isAnimating = false;
        
        // Touch/drag state
        this.isDragging = false;
        this.startPos = 0;
        this.currentTranslate = 0;
        this.prevTranslate = 0;
        this.animationID = 0;
        
        // Debounce timer
        this.resizeTimer = null;
        
        this.init();
    }
    
    /**
     * Initialize the slider
     */
    init() {
        if (this.cards.length === 0) return;
        
        this.createIndicators();
        this.attachEventListeners();
        this.updateSlider();
        
        // Initial button state
        this.updateNavigationButtons();
    }
    
    /**
     * Calculate cards per view based on viewport width
     */
    getCardsPerView() {
        const width = window.innerWidth;
        
        if (width < 768) {
            return 1; // Mobile: 1 card
        } else if (width < 1024) {
            return 2; // Tablet: 2 cards
        } else {
            return 3; // Desktop: 3 cards
        }
    }
    
    /**
     * Create indicator dots
     */
    createIndicators() {
        if (!this.indicatorsContainer) return;
        
        this.indicatorsContainer.innerHTML = '';
        
        for (let i = 0; i < this.totalSlides; i++) {
            const dot = document.createElement('button');
            dot.classList.add('scs-indicator-dot');
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            
            if (i === 0) {
                dot.classList.add('active');
            }
            
            dot.addEventListener('click', () => this.goToSlide(i));
            this.indicatorsContainer.appendChild(dot);
        }
    }
    
    /**
     * Attach all event listeners
     */
    attachEventListeners() {
        // Navigation buttons
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.prevSlide());
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.nextSlide());
        }
        
        // Keyboard navigation
        this.container.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Touch events
        this.slider.addEventListener('touchstart', (e) => this.touchStart(e), { passive: true });
        this.slider.addEventListener('touchmove', (e) => this.touchMove(e), { passive: true });
        this.slider.addEventListener('touchend', () => this.touchEnd());
        
        // Mouse events for desktop drag
        this.slider.addEventListener('mousedown', (e) => this.touchStart(e));
        this.slider.addEventListener('mousemove', (e) => this.touchMove(e));
        this.slider.addEventListener('mouseup', () => this.touchEnd());
        this.slider.addEventListener('mouseleave', () => this.touchEnd());
        
        // Prevent context menu on long press
        this.slider.addEventListener('contextmenu', (e) => {
            if (this.isDragging) e.preventDefault();
        });
        
        // Window resize with debounce
        window.addEventListener('resize', () => this.handleResize());
        
        // Intersection Observer for lazy loading images
        this.observeImages();
    }
    
    /**
     * Handle window resize with debounce
     */
    handleResize() {
        clearTimeout(this.resizeTimer);
        
        this.resizeTimer = setTimeout(() => {
            const newCardsPerView = this.getCardsPerView();
            
            if (newCardsPerView !== this.cardsPerView) {
                this.cardsPerView = newCardsPerView;
                this.totalSlides = Math.ceil(this.cards.length / this.cardsPerView);
                
                // Reset to valid index
                if (this.currentIndex >= this.totalSlides) {
                    this.currentIndex = Math.max(0, this.totalSlides - 1);
                }
                
                this.createIndicators();
                this.updateSlider();
                this.updateNavigationButtons();
            }
        }, 250);
    }
    
    /**
     * Handle keyboard navigation
     */
    handleKeyboard(e) {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            this.prevSlide();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            this.nextSlide();
        }
    }
    
    /**
     * Touch/Mouse start
     */
    touchStart(e) {
        if (this.isAnimating) return;
        
        this.isDragging = true;
        this.startPos = this.getPositionX(e);
        
        // Get current translate value
        const transform = window.getComputedStyle(this.slider).transform;
        if (transform !== 'none') {
            const matrix = new DOMMatrix(transform);
            this.prevTranslate = matrix.m41;
        }
        
        this.animationID = requestAnimationFrame(() => this.animation());
        this.slider.style.cursor = 'grabbing';
    }
    
    /**
     * Touch/Mouse move
     */
    touchMove(e) {
        if (!this.isDragging) return;
        
        const currentPosition = this.getPositionX(e);
        this.currentTranslate = this.prevTranslate + currentPosition - this.startPos;
    }
    
    /**
     * Touch/Mouse end
     */
    touchEnd() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        cancelAnimationFrame(this.animationID);
        
        const movedBy = this.currentTranslate - this.prevTranslate;
        
        // Threshold for slide change (20% of slider width)
        const threshold = this.slider.offsetWidth * 0.2;
        
        if (movedBy < -threshold && this.currentIndex < this.totalSlides - 1) {
            this.nextSlide();
        } else if (movedBy > threshold && this.currentIndex > 0) {
            this.prevSlide();
        } else {
            this.updateSlider();
        }
        
        this.slider.style.cursor = 'grab';
    }
    
    /**
     * Get X position from touch or mouse event
     */
    getPositionX(e) {
        return e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
    }
    
    /**
     * Animation frame for smooth dragging
     */
    animation() {
        if (this.isDragging) {
            this.setSliderPosition();
            this.animationID = requestAnimationFrame(() => this.animation());
        }
    }
    
    /**
     * Set slider position during drag
     */
    setSliderPosition() {
        this.slider.style.transform = `translateX(${this.currentTranslate}px)`;
    }
    
    /**
     * Go to specific slide
     */
    goToSlide(index) {
        if (this.isAnimating || index === this.currentIndex) return;
        
        this.currentIndex = Math.max(0, Math.min(index, this.totalSlides - 1));
        this.updateSlider();
    }
    
    /**
     * Go to previous slide
     */
    prevSlide() {
        if (this.isAnimating || this.currentIndex <= 0) return;
        
        this.currentIndex--;
        this.updateSlider();
    }
    
    /**
     * Go to next slide
     */
    nextSlide() {
        if (this.isAnimating || this.currentIndex >= this.totalSlides - 1) return;
        
        this.currentIndex++;
        this.updateSlider();
    }
    
    /**
     * Update slider position and indicators
     */
    updateSlider() {
        if (this.cards.length === 0) return;
        
        this.isAnimating = true;
        
        // Calculate card width including gap
        const cardWidth = this.cards[0].offsetWidth;
        const gap = 24; // Match CSS gap
        const offset = this.currentIndex * (cardWidth + gap) * this.cardsPerView;
        
        // Apply transform
        this.slider.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        this.slider.style.transform = `translateX(-${offset}px)`;
        
        // Update current and previous translate for drag
        this.currentTranslate = -offset;
        this.prevTranslate = -offset;
        
        // Update indicators
        this.updateIndicators();
        
        // Update navigation buttons
        this.updateNavigationButtons();
        
        // Reset animation flag after transition
        setTimeout(() => {
            this.isAnimating = false;
        }, 500);
    }
    
    /**
     * Update indicator dots
     */
    updateIndicators() {
        if (!this.indicatorsContainer) return;
        
        const dots = this.indicatorsContainer.querySelectorAll('.scs-indicator-dot');
        dots.forEach((dot, index) => {
            if (index === this.currentIndex) {
                dot.classList.add('active');
                dot.setAttribute('aria-current', 'true');
            } else {
                dot.classList.remove('active');
                dot.removeAttribute('aria-current');
            }
        });
    }
    
    /**
     * Update navigation button states
     */
    updateNavigationButtons() {
        if (this.prevBtn) {
            this.prevBtn.disabled = this.currentIndex === 0;
        }
        
        if (this.nextBtn) {
            this.nextBtn.disabled = this.currentIndex >= this.totalSlides - 1;
        }
    }
    
    /**
     * Observe images for lazy loading
     */
    observeImages() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        imageObserver.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px'
            });
            
            const images = this.slider.querySelectorAll('img[data-src]');
            images.forEach(img => imageObserver.observe(img));
        }
    }
    
    /**
     * Destroy slider and remove event listeners
     */
    destroy() {
        if (this.prevBtn) {
            this.prevBtn.removeEventListener('click', this.prevSlide);
        }
        
        if (this.nextBtn) {
            this.nextBtn.removeEventListener('click', this.nextSlide);
        }
        
        window.removeEventListener('resize', this.handleResize);
        
        if (this.resizeTimer) {
            clearTimeout(this.resizeTimer);
        }
    }
}

/**
 * Initialize slider on DOM ready
 */
document.addEventListener('DOMContentLoaded', () => {
    const sliderContainer = document.querySelector('.scs-section');
    
    if (sliderContainer) {
        const serviceCardSlider = new ServiceCardSlider(sliderContainer);
        
        // Make slider instance globally accessible for debugging
        window.serviceCardSlider = serviceCardSlider;
    }
});

/**
 * Auto-play functionality (optional)
 * Uncomment to enable auto-advance
 */
/*
let autoplayInterval;

function startAutoplay(slider, interval = 5000) {
    stopAutoplay();
    autoplayInterval = setInterval(() => {
        if (slider.currentIndex >= slider.totalSlides - 1) {
            slider.goToSlide(0);
        } else {
            slider.nextSlide();
        }
    }, interval);
}

function stopAutoplay() {
    if (autoplayInterval) {
        clearInterval(autoplayInterval);
    }
}

// Start autoplay after initialization
document.addEventListener('DOMContentLoaded', () => {
    const slider = window.serviceCardSlider;
    if (slider) {
        startAutoplay(slider);
        
        // Pause on hover
        slider.container.addEventListener('mouseenter', () => stopAutoplay());
        slider.container.addEventListener('mouseleave', () => startAutoplay(slider));
    }
});
*/