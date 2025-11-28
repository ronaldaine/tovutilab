/**
 * Service Detail Page JavaScript
 * Handles AJAX form submission, validation, and interactive elements
 * Integrated with Django ServiceInquiryForm
 */

(function() {
    'use strict';

    // DOM Elements
    const form = document.getElementById('serviceInquiryForm');
    const formMessage = document.getElementById('formMessage');
    const submitBtn = form?.querySelector('.form-submit-btn');

    /**
     * Get CSRF token from cookie
     * @returns {string} CSRF token
     */
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    /**
     * Show form message (success or error)
     * @param {string} message - Message to display
     * @param {string} type - Message type ('success' or 'error')
     */
    function showFormMessage(message, type = 'success') {
        if (!formMessage) return;

        formMessage.textContent = message;
        formMessage.className = `form-message ${type}`;
        formMessage.style.display = 'block';

        // Scroll to message
        formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Auto-hide after 8 seconds
        setTimeout(() => {
            formMessage.style.display = 'none';
        }, 8000);
    }

    /**
     * Display field-specific errors from Django form
     * @param {Object} errors - Error object from Django
     */
    function displayFieldErrors(errors) {
        // Clear all previous errors
        const errorElements = form.querySelectorAll('.form-error');
        errorElements.forEach(el => {
            el.textContent = '';
            el.closest('.form-group')?.classList.remove('error');
        });

        // Display new errors
        Object.keys(errors).forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (!field) return;

            const formGroup = field.closest('.form-group');
            const errorElement = formGroup?.querySelector('.form-error');

            if (formGroup && errorElement) {
                formGroup.classList.add('error');
                
                // Get first error message
                const errorData = errors[fieldName];
                let errorMessage = '';
                
                if (Array.isArray(errorData)) {
                    errorMessage = errorData[0].message || errorData[0];
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                } else {
                    errorMessage = errorData;
                }
                
                errorElement.textContent = errorMessage;
            }
        });

        // Scroll to first error
        const firstError = form.querySelector('.form-group.error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    /**
     * Clear field error on input
     * @param {HTMLElement} field - Input field
     */
    function clearFieldError(field) {
        const formGroup = field.closest('.form-group');
        if (formGroup?.classList.contains('error')) {
            formGroup.classList.remove('error');
            const errorElement = formGroup.querySelector('.form-error');
            if (errorElement) errorElement.textContent = '';
        }
    }

    /**
     * Handle form submission with AJAX
     * @param {Event} e - Submit event
     */
    async function handleFormSubmit(e) {
        e.preventDefault();

        // Clear previous messages
        if (formMessage) {
            formMessage.style.display = 'none';
        }

        // Disable submit button
        submitBtn.disabled = true;
        const originalText = submitBtn.querySelector('.btn-text').textContent;
        submitBtn.querySelector('.btn-text').textContent = 'Sending...';

        try {
            // Prepare form data
            const formData = new FormData(form);
            
            // Get CSRF token
            const csrfToken = getCookie('csrftoken');

            // Send AJAX request
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': csrfToken
                },
                credentials: 'same-origin'
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Success - redirect to success page
                showFormMessage(
                    data.message || 'Thank you! Redirecting...',
                    'success'
                );
                
                // Redirect to success page (use returned URL or fallback)
                setTimeout(() => {
                    window.location.href = data.redirect_url || '/services/inquiry/success/';
                }, 1500);
                
                // Optional: Track conversion
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'inquiry_submission', {
                        'event_category': 'engagement',
                        'event_label': 'service_inquiry',
                        'value': 1
                    });
                }
            } else {
                // Error - display field-specific errors
                if (data.errors) {
                    displayFieldErrors(data.errors);
                }
                
                showFormMessage(
                    data.message || 'Please correct the errors below.',
                    'error'
                );
            }
        } catch (error) {
            console.error('Form submission error:', error);
            showFormMessage(
                'Network error. Please check your connection and try again.',
                'error'
            );
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.querySelector('.btn-text').textContent = originalText;
        }
    }

    /**
     * Setup input event listeners to clear errors
     */
    function setupInputListeners() {
        const fields = form?.querySelectorAll('input, select, textarea');
        
        fields?.forEach(field => {
            // Clear error on input/change
            field.addEventListener('input', () => clearFieldError(field));
            field.addEventListener('change', () => clearFieldError(field));
        });
    }

    /**
     * Handle smooth scroll to form from CTA
     */
    function setupSmoothScroll() {
        const ctaButtons = document.querySelectorAll('a[href="#serviceInquiryForm"]');
        
        ctaButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const formElement = document.getElementById('serviceInquiryForm');
                if (formElement) {
                    formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Focus first input after scroll
                    setTimeout(() => {
                        const firstInput = formElement.querySelector('input:not([type="hidden"])');
                        firstInput?.focus();
                    }, 500);
                }
            });
        });
    }

    /**
     * Setup chat trigger button
     */
    function setupChatTrigger() {
        const chatTrigger = document.querySelector('.chat-trigger');
        
        chatTrigger?.addEventListener('click', (e) => {
            e.preventDefault();
            // Implement your chat widget trigger here
            // For now, show an alert
            alert('Live chat feature coming soon! Please use the contact form or email us directly.');
        });
    }

    /**
     * Character counter for textarea
     */
    function setupCharacterCounter() {
        const textarea = form?.querySelector('[name="project_description"]');
        const maxLength = 2000; // From your model
        
        if (textarea) {
            const formGroup = textarea.closest('.form-group');
            const counter = document.createElement('span');
            counter.className = 'char-counter';
            counter.style.cssText = 'font-size: 12px; color: #6b7280; text-align: right; display: block; margin-top: 4px;';
            
            // Insert after help text if exists, otherwise after error span
            const helpText = formGroup.querySelector('.form-help');
            const errorSpan = formGroup.querySelector('.form-error');
            
            if (helpText) {
                helpText.parentNode.insertBefore(counter, helpText.nextSibling);
            } else if (errorSpan) {
                errorSpan.parentNode.insertBefore(counter, errorSpan.nextSibling);
            } else {
                formGroup.appendChild(counter);
            }
            
            function updateCounter() {
                const length = textarea.value.length;
                const remaining = maxLength - length;
                counter.textContent = `${length}/${maxLength} characters`;
                
                if (remaining < 0) {
                    counter.style.color = '#ef4444';
                } else if (remaining < 100) {
                    counter.style.color = '#f59e0b';
                } else {
                    counter.style.color = '#6b7280';
                }
            }
            
            textarea.addEventListener('input', updateCounter);
            updateCounter();
        }
    }

    /**
     * Add loading state styles
     */
    function addLoadingStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .form-submit-btn:disabled {
                opacity: 0.7;
                cursor: not-allowed;
                position: relative;
            }
            
            .form-submit-btn:disabled::after {
                content: '';
                position: absolute;
                width: 16px;
                height: 16px;
                top: 50%;
                right: 20px;
                margin-top: -8px;
                border: 2px solid #ffffff;
                border-radius: 50%;
                border-top-color: transparent;
                animation: spinner 0.6s linear infinite;
            }
            
            @keyframes spinner {
                to { transform: rotate(360deg); }
            }
            
            .form-message {
                animation: slideDown 0.3s ease-out;
            }
            
            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .checkbox-group {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .checkbox-label {
                display: flex;
                align-items: flex-start;
                gap: 8px;
                font-size: 14px;
                color: #4b5563;
                cursor: pointer;
            }
            
            .checkbox-label input[type="checkbox"] {
                margin-top: 2px;
                cursor: pointer;
            }
            
            .required {
                color: #ef4444;
                margin-left: 2px;
            }
            
            .form-help {
                font-size: 12px;
                color: #6b7280;
                display: block;
                margin-top: 4px;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Prefill form from URL parameters (optional feature)
     */
    function prefillFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Check if there are any parameters to prefill
        urlParams.forEach((value, key) => {
            const field = form?.querySelector(`[name="${key}"]`);
            if (field) {
                field.value = value;
            }
        });
    }

    /**
     * Setup scroll indicator
     */
    function setupScrollIndicator() {
        const scrollIndicator = document.querySelector('.scroll-indicator');
        
        if (scrollIndicator) {
            scrollIndicator.addEventListener('click', () => {
                const detailSection = document.querySelector('.service-detail-section');
                if (detailSection) {
                    detailSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        }
    }

    /**
     * Add client-side validation hints (non-blocking)
     */
    function addValidationHints() {
        // Email validation hint
        const emailField = form?.querySelector('[name="email"]');
        if (emailField) {
            emailField.addEventListener('blur', function() {
                const value = this.value.trim();
                if (value && !value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                    const formGroup = this.closest('.form-group');
                    const errorEl = formGroup?.querySelector('.form-error');
                    if (errorEl && !errorEl.textContent) {
                        errorEl.textContent = 'Please enter a valid email address';
                        formGroup.classList.add('error');
                    }
                }
            });
        }

        // Phone validation hint
        const phoneField = form?.querySelector('[name="phone"]');
        if (phoneField) {
            phoneField.addEventListener('blur', function() {
                const value = this.value.trim();
                if (value && !value.match(/^[\d\s\-\+\(\)]+$/)) {
                    const formGroup = this.closest('.form-group');
                    const errorEl = formGroup?.querySelector('.form-error');
                    if (errorEl && !errorEl.textContent) {
                        errorEl.textContent = 'Please enter a valid phone number';
                        formGroup.classList.add('error');
                    }
                }
            });
        }

        // Project description minimum length hint
        const descField = form?.querySelector('[name="project_description"]');
        if (descField) {
            descField.addEventListener('blur', function() {
                const value = this.value.trim();
                if (value && value.length < 20) {
                    const formGroup = this.closest('.form-group');
                    const errorEl = formGroup?.querySelector('.form-error');
                    if (errorEl && !errorEl.textContent) {
                        errorEl.textContent = 'Description must be at least 20 characters';
                        formGroup.classList.add('error');
                    }
                }
            });
        }
    }

    /**
     * Setup form autosave to localStorage (optional)
     * Helps users not lose data if they accidentally navigate away
     */
    function setupFormAutosave() {
        const STORAGE_KEY = 'service_inquiry_draft';
        const fields = form?.querySelectorAll('input:not([type="hidden"]), select, textarea');
        
        // Load saved data
        function loadSavedData() {
            try {
                const savedData = localStorage.getItem(STORAGE_KEY);
                if (savedData) {
                    const data = JSON.parse(savedData);
                    Object.keys(data).forEach(key => {
                        const field = form?.querySelector(`[name="${key}"]`);
                        if (field && field.value === '') {
                            field.value = data[key];
                        }
                    });
                }
            } catch (e) {
                console.error('Error loading saved form data:', e);
            }
        }

        // Save data on input
        function saveData() {
            try {
                const data = {};
                fields?.forEach(field => {
                    if (field.name && field.value) {
                        data[field.name] = field.value;
                    }
                });
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            } catch (e) {
                console.error('Error saving form data:', e);
            }
        }

        // Clear saved data on successful submission
        function clearSavedData() {
            try {
                localStorage.removeItem(STORAGE_KEY);
            } catch (e) {
                console.error('Error clearing saved form data:', e);
            }
        }

        // Load saved data on page load
        loadSavedData();

        // Save on input with debounce
        let saveTimeout;
        fields?.forEach(field => {
            field.addEventListener('input', () => {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(saveData, 1000);
            });
        });

        // Clear on successful submission
        form?.addEventListener('submit', (e) => {
            // Only clear after successful submission
            setTimeout(() => {
                if (formMessage?.classList.contains('success')) {
                    clearSavedData();
                }
            }, 1000);
        });
    }

    /**
     * Initialize all functionality
     */
    function init() {
        if (!form) {
            console.warn('Service inquiry form not found on page');
            return;
        }

        // Add custom styles
        addLoadingStyles();

        // Setup event listeners
        form.addEventListener('submit', handleFormSubmit);
        setupInputListeners();
        setupSmoothScroll();
        setupChatTrigger();
        setupCharacterCounter();
        setupScrollIndicator();
        addValidationHints();
        
        // Optional features
        prefillFromURL();
        setupFormAutosave();

        console.log('Service detail page initialized successfully');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();