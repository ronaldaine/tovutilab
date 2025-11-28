/**
 * Multi-Step Contact Form JavaScript
 * Stripe-inspired progressive form with validation
 */

(function() {
    'use strict';

    // State management
    let currentStep = 1;
    const totalSteps = 4;
    
    // Form elements
    const form = document.getElementById('contactForm');
    const formSteps = document.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.progress-step');
    const btnContinue = document.getElementById('btnContinue');
    const btnBack = document.getElementById('btnBack');
    const btnSubmit = document.getElementById('btnSubmit');
    const formLoading = document.getElementById('formLoading');
    const formTitle = document.getElementById('form-title');
    const formDescription = document.getElementById('form-description');

    // Step configurations
    const stepConfig = {
        1: {
            title: "Let's get you to the right place",
            description: "We just need a few quick details.",
            requiredFields: ['id_full_name', 'id_email']
        },
        2: {
            title: "Tell us about your company",
            description: "This helps us understand your business better.",
            requiredFields: ['id_company_name', 'id_country']
        },
        3: {
            title: "What are you looking to build?",
            description: "Share your project vision with us.",
            requiredFields: ['id_project_type', 'id_project_description']
        },
        4: {
            title: "Timeline and budget",
            description: "Help us prepare the right proposal for you.",
            requiredFields: ['id_timeline', 'id_budget_range']
        }
    };

    /**
     * Initialize form
     */
    function init() {
        if (!form) return;

        // Event listeners
        btnContinue.addEventListener('click', handleContinue);
        btnBack.addEventListener('click', handleBack);
        form.addEventListener('submit', handleSubmit);

        // Real-time validation
        const inputs = form.querySelectorAll('.form-control, .form-select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => validateField(input));
            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    validateField(input);
                }
            });
        });

        // Radio button validation
        const radioGroups = form.querySelectorAll('input[type="radio"]');
        radioGroups.forEach(radio => {
            radio.addEventListener('change', () => {
                const groupName = radio.getAttribute('name');
                clearFieldError(groupName);
            });
        });

        // Show first step
        showStep(1);
    }

    /**
     * Show specific step
     */
    function showStep(step) {
        currentStep = step;

        // Update form steps
        formSteps.forEach((formStep, index) => {
            if (index + 1 === step) {
                formStep.classList.add('active');
            } else {
                formStep.classList.remove('active');
            }
        });

        // Update progress indicator
        progressSteps.forEach((progressStep, index) => {
            const stepNum = index + 1;
            if (stepNum < step) {
                progressStep.classList.add('completed');
                progressStep.classList.remove('active');
            } else if (stepNum === step) {
                progressStep.classList.add('active');
                progressStep.classList.remove('completed');
            } else {
                progressStep.classList.remove('active', 'completed');
            }
        });

        // Update header text
        if (stepConfig[step]) {
            formTitle.textContent = stepConfig[step].title;
            formDescription.textContent = stepConfig[step].description;
        }

        // Update button visibility
        if (step === 1) {
            btnBack.style.display = 'none';
        } else {
            btnBack.style.display = 'inline-flex';
        }

        if (step === totalSteps) {
            btnContinue.style.display = 'none';
            btnSubmit.style.display = 'inline-flex';
        } else {
            btnContinue.style.display = 'inline-flex';
            btnSubmit.style.display = 'none';
        }

        // Scroll to top of form
        const formCard = document.querySelector('.form-card');
        if (formCard) {
            formCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    /**
     * Handle continue button click
     */
    function handleContinue(e) {
        e.preventDefault();

        if (validateCurrentStep()) {
            if (currentStep < totalSteps) {
                showStep(currentStep + 1);
            }
        }
    }

    /**
     * Handle back button click
     */
    function handleBack(e) {
        e.preventDefault();

        if (currentStep > 1) {
            showStep(currentStep - 1);
        }
    }

    /**
     * Validate current step
     */
    function validateCurrentStep() {
        const config = stepConfig[currentStep];
        if (!config) return true;

        let isValid = true;
        const requiredFields = config.requiredFields;

        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                // Handle radio buttons
                if (field.type === 'radio') {
                    const radioGroup = document.getElementsByName(field.name);
                    const isChecked = Array.from(radioGroup).some(radio => radio.checked);
                    if (!isChecked) {
                        showFieldError(field.name, 'Please select an option.');
                        isValid = false;
                    }
                } else {
                    if (!validateField(field)) {
                        isValid = false;
                    }
                }
            }
        });

        return isValid;
    }

    /**
     * Validate individual field
     */
    function validateField(field) {
        const value = field.value.trim();
        const fieldId = field.id;
        let errorMessage = '';

        // Clear previous errors
        clearFieldError(fieldId);

        // Check if field is required and empty
        if (field.hasAttribute('required') || field.closest('.form-group')?.querySelector('.required')) {
            if (!value) {
                errorMessage = 'This field is required.';
            }
        }

        // Specific field validations
        if (value && !errorMessage) {
            switch (fieldId) {
                case 'id_email':
                    if (!isValidEmail(value)) {
                        errorMessage = 'Please enter a valid email address.';
                    }
                    break;

                case 'id_phone':
                    if (value && !isValidPhone(value)) {
                        errorMessage = 'Please enter a valid phone number.';
                    }
                    break;

                case 'id_full_name':
                    if (value.length < 2) {
                        errorMessage = 'Name must be at least 2 characters.';
                    }
                    break;

                case 'id_project_description':
                    if (value.length < 20) {
                        errorMessage = 'Please provide at least 20 characters.';
                    }
                    break;

                case 'id_reference_url':
                    if (value && !isValidURL(value)) {
                        errorMessage = 'Please enter a valid URL.';
                    }
                    break;
            }
        }

        if (errorMessage) {
            showFieldError(fieldId, errorMessage);
            return false;
        }

        return true;
    }

    /**
     * Show field error
     */
    function showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId) || 
                     document.querySelector(`input[name="${fieldId}"]`);
        
        if (!field) return;

        const errorElement = document.getElementById(`error-${fieldId}`);
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('visible');
        }

        field.classList.add('error');
    }

    /**
     * Clear field error
     */
    function clearFieldError(fieldId) {
        const field = document.getElementById(fieldId) || 
                     document.querySelector(`input[name="${fieldId}"]`);
        
        if (!field) return;

        const errorElement = document.getElementById(`error-${fieldId}`);
        
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('visible');
        }

        field.classList.remove('error');
    }

    /**
     * Handle form submission
     */
    async function handleSubmit(e) {
        e.preventDefault();

        // Final validation
        if (!validateCurrentStep()) {
            return;
        }

        // Check agreement checkbox
        const agreeCheckbox = document.getElementById('id_agree_to_contact');
        if (agreeCheckbox && !agreeCheckbox.checked) {
            showFieldError('id_agree_to_contact', 'You must agree to be contacted.');
            return;
        }

        // Show loading state
        formLoading.style.display = 'flex';

        try {
            // Get CSRF token
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

            // Prepare form data
            const formData = new FormData(form);

            // Submit via AJAX
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': csrfToken
                }
            });

            const data = await response.json();

            if (data.success) {
                // Success - redirect or show success message
                showSuccessMessage(data.message);
                
                // Redirect after 2 seconds
                setTimeout(() => {
                    window.location.href = '/contact/success/';
                }, 2000);
            } else {
                // Handle errors
                handleFormErrors(data);
                formLoading.style.display = 'none';
            }
        } catch (error) {
            console.error('Form submission error:', error);
            alert('An error occurred. Please try again or contact us directly.');
            formLoading.style.display = 'none';
        }
    }

    /**
     * Handle form errors from server
     */
    function handleFormErrors(data) {
        if (data.errors) {
            // Field-specific errors
            Object.keys(data.errors).forEach(fieldName => {
                const errors = data.errors[fieldName];
                if (errors && errors.length > 0) {
                    const errorMessage = errors[0].message;
                    showFieldError(`id_${fieldName}`, errorMessage);
                }
            });

            // Go to first step with error
            for (let step = 1; step <= totalSteps; step++) {
                const config = stepConfig[step];
                const hasError = config.requiredFields.some(fieldId => {
                    const field = document.getElementById(fieldId);
                    return field && field.classList.contains('error');
                });

                if (hasError) {
                    showStep(step);
                    break;
                }
            }
        }

        if (data.message) {
            alert(data.message);
        }
    }

    /**
     * Show success message
     */
    function showSuccessMessage(message) {
        const loadingText = formLoading.querySelector('p');
        const spinner = formLoading.querySelector('.spinner');
        
        if (spinner) spinner.style.display = 'none';
        if (loadingText) {
            loadingText.innerHTML = `
                <i class="fas fa-check-circle" style="color: #10b981; font-size: 48px; margin-bottom: 16px;"></i>
                <br>${message}
            `;
        }
    }

    /**
     * Email validation
     */
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    /**
     * Phone validation
     */
    function isValidPhone(phone) {
        const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
        return /^\d{7,15}$/.test(cleaned);
    }

    /**
     * URL validation
     */
    function isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();