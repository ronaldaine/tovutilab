// Function to close an alert message
function closeAlert(button) {
    const alert = button.closest('.alert');
    alert.classList.add('removing');

    // Remove the alert after animation completes
    setTimeout(() => {
        alert.remove();

        // Check if this was the last alert, remove container if empty
        const container = document.querySelector('.alert-container');
        if (container && !container.querySelector('.alert')) {
            container.remove();
        }
    }, 300); // Match this time with the CSS animation duration (0.3s)
}

// Auto-dismiss alerts after a delay
document.addEventListener('DOMContentLoaded', function () {
    const alerts = document.querySelectorAll('.alert');

    if (alerts.length > 0) {
        // Set different timeouts based on message type
        alerts.forEach(alert => {
            // Success messages disappear faster than errors
            let timeout = 5000; // Default 5 seconds

            if (alert.classList.contains('alert-success')) {
                timeout = 3000; // 3 seconds for success messages
            } else if (alert.classList.contains('alert-error')) {
                timeout = 8000; // 8 seconds for error messages
            }

            setTimeout(() => {
                if (alert.parentNode) { // Check if alert still exists
                    alert.classList.add('removing');

                    setTimeout(() => {
                        if (alert.parentNode) { // Check again before removal
                            alert.remove();

                            // Check if this was the last alert
                            const container = document.querySelector('.alert-container');
                            if (container && !container.querySelector('.alert')) {
                                container.remove();
                            }
                        }
                    }, 300);
                }
            }, timeout);
        });
    }
});