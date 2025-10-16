/**
 * Report Feedback Module
 * Handles form feedback and tracking real complaint submissions
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're returning from a successful submission
    const urlParams = new URLSearchParams(window.location.search);
    const newSubmission = urlParams.get('new');
    const complaintId = urlParams.get('id');
    
    if (newSubmission === 'true' && complaintId) {
        displaySuccessMessage(complaintId);
    }
    
    // Add any additional form validation to ensure quality real data
    enhanceFormValidation();
});

/**
 * Display success message after complaint submission
 */
function displaySuccessMessage(complaintId) {
    // Create a success notification
    const notification = document.createElement('div');
    notification.className = 'alert alert-success';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <div>
            <strong>Complaint Submitted Successfully!</strong>
            <p>Your complaint ID is: ${complaintId}</p>
            <p>Thank you for reporting this issue. A confirmation has been sent to your email.</p>
            <p><a href="complaint-detail.html?id=${complaintId}" class="btn btn-primary btn-sm">View your complaint</a></p>
        </div>
    `;
    
    // Insert at the top of the form section
    const formContainer = document.querySelector('.form-container');
    formContainer.insertBefore(notification, formContainer.firstChild);
    
    // Scroll to the top to see the message
    window.scrollTo(0, 0);
}

/**
 * Add additional validation to form to ensure quality data submission
 */
function enhanceFormValidation() {
    const form = document.getElementById('complaintForm');
    if (!form) return;
    
    // Add minimum length validation for description
    const descriptionField = document.getElementById('description');
    if (descriptionField) {
        descriptionField.addEventListener('blur', function() {
            if (this.value.trim().length < 20) {
                showError('description', 'Please provide a more detailed description (minimum 20 characters)');
            } else {
                clearError('description');
            }
        });
    }
    
    // Add validation for the location description
    const locationField = document.getElementById('locationDescription');
    if (locationField) {
        locationField.addEventListener('blur', function() {
            if (this.value.trim().length < 10) {
                showError('locationDescription', 'Please provide a more specific location description');
            } else {
                clearError('locationDescription');
            }
        });
    }
}

/**
 * Clear error for a field
 */
function clearError(fieldId) {
    const field = document.getElementById(fieldId);
    field.classList.remove('error');
    
    const errorElement = field.nextElementSibling;
    if (errorElement && errorElement.classList.contains('error-text')) {
        errorElement.textContent = '';
    }
}