/**
 * Get Started CTA Section - Interactive Animations
 * Handles phone mockup step transitions and form interactions
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        STEP_DURATION: 5000, // 5 seconds per step
        TRANSITION_DELAY: 500,
        AUTO_CYCLE: true
    };

    // DOM Elements
    let phoneScreen;
    let appInterfaces;
    let currentStepIndex = 0;
    let intervalId = null;
    let budgetSlider;
    let budgetValue;

    /**
     * Initialize the Get Started section
     */
    function init() {
        // Check if section exists on page
        const getStartedSection = document.querySelector('.get-started-section');
        if (!getStartedSection) return;

        // Cache DOM elements
        phoneScreen = document.querySelector('.phone-screen');
        appInterfaces = document.querySelectorAll('.app-interface');
        budgetSlider = document.querySelector('.slider');
        budgetValue = document.querySelector('.budget-value');

        if (!phoneScreen || appInterfaces.length === 0) return;

        // Initialize components
        setupStepCycling();
        setupInteractiveElements();
        setupBudgetSlider();
        setupVisibilityHandling();
        setupAccessibility();

        console.log('Get Started section initialized');
    }

    /**
     * Setup automatic step cycling through app interfaces
     */
    function setupStepCycling() {
        if (!CONFIG.AUTO_CYCLE) return;

        // Show first step initially
        showStep(0);

        // Start automatic cycling
        startCycling();

        // Pause on hover
        phoneScreen.addEventListener('mouseenter', stopCycling);
        phoneScreen.addEventListener('mouseleave', startCycling);

        // Pause when tab is not visible
        document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    /**
     * Show specific step
     */
    function showStep(index) {
        // Remove active class from all steps
        appInterfaces.forEach(interface => {
            interface.classList.remove('active');
        });

        // Add active class to current step
        if (appInterfaces[index]) {
            appInterfaces[index].classList.add('active');
            currentStepIndex = index;

            // Announce to screen readers
            announceStepChange(index + 1, appInterfaces.length);
        }
    }

    /**
     * Move to next step
     */
    function nextStep() {
        const nextIndex = (currentStepIndex + 1) % appInterfaces.length;
        showStep(nextIndex);
    }

    /**
     * Start automatic cycling
     */
    function startCycling() {
        if (intervalId) return; // Already running

        intervalId = setInterval(() => {
            nextStep();
        }, CONFIG.STEP_DURATION);
    }

    /**
     * Stop automatic cycling
     */
    function stopCycling() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    /**
     * Handle visibility change (pause when tab not visible)
     */
    function handleVisibilityChange() {
        if (document.hidden) {
            stopCycling();
        } else {
            startCycling();
        }
    }

    /**
     * Setup interactive form elements
     */
    function setupInteractiveElements() {
        // Project type buttons
        const projectTypeBtns = document.querySelectorAll('.project-type-btn');
        projectTypeBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                // Remove active from all buttons
                projectTypeBtns.forEach(b => b.classList.remove('active'));
                // Add active to clicked button
                this.classList.add('active');
            });
        });

        // Feature tags
        const featureTags = document.querySelectorAll('.feature-tag:not(:last-child)');
        featureTags.forEach(tag => {
            tag.addEventListener('click', function(e) {
                e.preventDefault();
                this.classList.toggle('active');
            });
        });

        // Continue buttons - advance to next step
        const continueBtns = document.querySelectorAll('.continue-btn');
        continueBtns.forEach((btn, index) => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                stopCycling(); // Stop auto-cycling when user interacts
                
                // Move to next step with slight delay
                setTimeout(() => {
                    showStep(index + 1);
                }, 200);
            });
        });

        // Submit button - show success view
        const submitBtn = document.querySelector('.submit-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', function(e) {
                e.preventDefault();
                stopCycling();
                
                // Show loading state
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
                this.disabled = true;
                
                // Simulate submission delay
                setTimeout(() => {
                    showStep(3); // Show success view
                    this.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Project Brief';
                    this.disabled = false;
                }, 1500);
            });
        }

        // Back buttons
        const backBtns = document.querySelectorAll('.back-btn');
        backBtns.forEach((btn, index) => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                stopCycling();
                
                // Go to previous step
                const prevIndex = currentStepIndex > 0 ? currentStepIndex - 1 : 0;
                showStep(prevIndex);
            });
        });

        // Form inputs - add focus effects
        const formInputs = document.querySelectorAll('.form-input, .form-select, .form-textarea');
        formInputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.classList.add('focused');
            });
            
            input.addEventListener('blur', function() {
                this.parentElement.classList.remove('focused');
            });
        });
    }

    /**
     * Setup budget slider with real-time value updates
     */
    function setupBudgetSlider() {
        if (!budgetSlider || !budgetValue) return;

        // Format currency
        function formatCurrency(value) {
            return '$' + parseInt(value).toLocaleString();
        }

        // Update value on slider input
        budgetSlider.addEventListener('input', function() {
            budgetValue.textContent = formatCurrency(this.value);
        });

        // Set initial value
        budgetValue.textContent = formatCurrency(budgetSlider.value);
    }

    /**
     * Setup Intersection Observer for visibility handling
     */
    function setupVisibilityHandling() {
        const getStartedSection = document.querySelector('.get-started-section');
        if (!getStartedSection) return;

        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.3
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Section is visible - start cycling if not already running
                    if (CONFIG.AUTO_CYCLE && !intervalId) {
                        startCycling();
                    }
                } else {
                    // Section is not visible - stop cycling to save resources
                    stopCycling();
                }
            });
        }, observerOptions);

        observer.observe(getStartedSection);
    }

    /**
     * Setup accessibility features
     */
    function setupAccessibility() {
        // Add ARIA labels to interactive elements
        const phoneMockup = document.querySelector('.phone-mockup');
        if (phoneMockup) {
            phoneMockup.setAttribute('role', 'region');
            phoneMockup.setAttribute('aria-label', 'Interactive project submission form preview');
        }

        // Add step indicators for screen readers
        appInterfaces.forEach((interface, index) => {
            interface.setAttribute('role', 'tabpanel');
            interface.setAttribute('aria-label', `Step ${index + 1} of ${appInterfaces.length}`);
        });

        // Keyboard navigation for phone mockup
        const mainCTAButton = document.querySelector('.started-btn-primary');
        if (mainCTAButton) {
            mainCTAButton.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        }
    }

    /**
     * Announce step change to screen readers
     */
    function announceStepChange(currentStep, totalSteps) {
        // Create or update live region for screen reader announcements
        let liveRegion = document.getElementById('step-announcement');
        
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'step-announcement';
            liveRegion.className = 'sr-only';
            liveRegion.setAttribute('role', 'status');
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            document.body.appendChild(liveRegion);
        }

        liveRegion.textContent = `Step ${currentStep} of ${totalSteps}`;
    }

    /**
     * Cleanup function
     */
    function cleanup() {
        stopCycling();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        
        if (phoneScreen) {
            phoneScreen.removeEventListener('mouseenter', stopCycling);
            phoneScreen.removeEventListener('mouseleave', startCycling);
        }
    }

    /**
     * Debounce utility function
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
     * Handle window resize - adjust animations if needed
     */
    const handleResize = debounce(() => {
        // Pause animations on very small screens if needed
        const isMobile = window.innerWidth < 768;
        
        if (isMobile && CONFIG.AUTO_CYCLE) {
            // Optionally adjust step duration for mobile
            // Currently keeping same duration
        }
    }, 250);

    window.addEventListener('resize', handleResize);

    /**
     * Initialize when DOM is ready
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    /**
     * Cleanup on page unload
     */
    window.addEventListener('beforeunload', cleanup);

    // Export for potential external control
    window.GetStartedSection = {
        showStep,
        nextStep,
        startCycling,
        stopCycling,
        getCurrentStep: () => currentStepIndex
    };

})();