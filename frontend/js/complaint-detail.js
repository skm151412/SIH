/**
 * Complaint Detail Page JS
 * Handles displaying complaint details and feedback functionality
 */

// Page state
let complaintData = null;
let showingReopenForm = false;

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!isAuthenticated()) {
        window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
        return;
    }
    
    // Get complaint ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const complaintId = urlParams.get('id');
    
    if (!complaintId) {
        showError('Complaint ID not found');
        window.location.href = 'complaints.html';
        return;
    }
    
    // Load complaint details
    loadComplaintDetails(complaintId);
    
    // Setup event listeners
    document.addEventListener('click', function(e) {
        // Feedback form submission
        if (e.target && e.target.id === 'submitFeedback') {
            submitFeedback(complaintId);
        }
        
        // Reopen button click
        if (e.target && e.target.id === 'reopenButton') {
            toggleReopenForm(true);
        }
        
        // Cancel reopen button click
        if (e.target && e.target.id === 'cancelReopenButton') {
            toggleReopenForm(false);
        }
        
        // Submit reopen form
        if (e.target && e.target.id === 'submitReopenButton') {
            submitReopenRequest(complaintId);
        }
    });
});

/**
 * Load complaint details from the API
 * @param {string} complaintId Complaint ID
 */
async function loadComplaintDetails(complaintId) {
    try {
        showLoader();
        
        const response = await fetch(`${API_BASE_URL}/api/complaints/${complaintId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load complaint details');
        }
        
        complaintData = await response.json();
        
        // Render complaint details
        renderComplaintDetails(complaintData);
        
        // Load updates for this complaint
        loadComplaintUpdates(complaintId);
        
        hideLoader();
    } catch (error) {
        console.error('Error loading complaint details:', error);
        hideLoader();
        showError('Failed to load complaint details. Please try again later.');
    }
}

/**
 * Render complaint details in the UI
 * @param {object} complaint Complaint data
 */
function renderComplaintDetails(complaint) {
    document.getElementById('complaintTitle').textContent = complaint.title;
    document.getElementById('complaintDescription').textContent = complaint.description;
    document.getElementById('complaintCategory').textContent = complaint.category;
    document.getElementById('complaintStatus').textContent = complaint.status;
    document.getElementById('complaintCreatedAt').textContent = formatDate(complaint.createdAt);
    
    // Set status badge
    const statusBadge = document.getElementById('statusBadge');
    statusBadge.textContent = complaint.status;
    statusBadge.className = `badge badge-${getStatusBadgeClass(complaint.status)}`;
    
    // Show location on map
    if (complaint.locationLat && complaint.locationLng) {
        initMap(complaint.locationLat, complaint.locationLng);
    }
    
    // Show photo if available
    if (complaint.photoPath) {
        const photoContainer = document.getElementById('photoContainer');
        photoContainer.innerHTML = `<img src="${API_BASE_URL}${complaint.photoPath}" class="img-fluid rounded" alt="Complaint Photo">`;
        photoContainer.style.display = 'block';
    }
    
    // Show feedback section if the complaint is resolved
    if (complaint.status === 'RESOLVED') {
        renderFeedbackSection(complaint);
    } else {
        document.getElementById('feedbackSection').style.display = 'none';
    }
}

/**
 * Renders the feedback section based on complaint state
 * @param {object} complaint Complaint data
 */
function renderFeedbackSection(complaint) {
    const feedbackSection = document.getElementById('feedbackSection');
    feedbackSection.style.display = 'block';
    
    // If user has already provided feedback
    if (complaint.rating) {
        renderExistingFeedback(complaint);
    } 
    // If complaint has been reopened
    else if (complaint.reopened) {
        renderReopenedStatus(complaint);
    }
    // Show feedback form
    else {
        renderFeedbackForm();
    }
}

/**
 * Renders existing feedback display
 * @param {object} complaint Complaint data
 */
function renderExistingFeedback(complaint) {
    const feedbackSection = document.getElementById('feedbackSection');
    
    feedbackSection.innerHTML = `
        <div class="card mb-4">
            <div class="card-header bg-light">
                <h5 class="mb-0">Your Feedback</h5>
            </div>
            <div class="card-body">
                <div class="d-flex align-items-center mb-3">
                    <div class="mr-3">Your Rating:</div>
                    <div class="stars-display">
                        ${renderStars(complaint.rating)}
                    </div>
                </div>
                
                ${complaint.feedback ? `
                <div class="mb-3">
                    <h6>Your Comments:</h6>
                    <p class="mb-0">${complaint.feedback}</p>
                </div>
                ` : ''}
                
                ${(complaint.rating <= 2 && !complaint.reopened) ? `
                <div class="mt-3">
                    <button class="btn btn-warning" id="reopenButton">
                        <i class="fas fa-redo mr-1"></i> Request to Reopen
                    </button>
                    <small class="form-text text-muted">
                        If you're not satisfied with how this complaint was resolved, you can request to reopen it.
                    </small>
                </div>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * Renders reopened complaint status
 * @param {object} complaint Complaint data
 */
function renderReopenedStatus(complaint) {
    const feedbackSection = document.getElementById('feedbackSection');
    
    feedbackSection.innerHTML = `
        <div class="alert alert-warning">
            <h5><i class="fas fa-exclamation-triangle mr-2"></i> This complaint has been reopened</h5>
            <p>You requested this complaint to be reopened on ${formatDate(complaint.updatedAt)}.</p>
            ${complaint.reopenReason ? `
            <div>
                <strong>Reason:</strong> ${complaint.reopenReason}
            </div>
            ` : ''}
        </div>
    `;
}

/**
 * Renders the feedback form
 */
function renderFeedbackForm() {
    const feedbackSection = document.getElementById('feedbackSection');
    
    feedbackSection.innerHTML = `
        <div class="card mb-4">
            <div class="card-header bg-light">
                <h5 class="mb-0">Rate Your Experience</h5>
            </div>
            <div class="card-body">
                <div id="feedbackError" class="alert alert-danger" style="display: none;"></div>
                <div id="feedbackSuccess" class="alert alert-success" style="display: none;">
                    <h5><i class="fas fa-check-circle mr-2"></i> Thank you for your feedback!</h5>
                    <p class="mb-0">Your input helps us improve our services.</p>
                </div>
                
                <form id="feedbackForm">
                    <div class="form-group">
                        <label>How satisfied are you with the resolution?</label>
                        <div class="star-rating">
                            <span class="star" data-rating="1"><i class="fas fa-star"></i></span>
                            <span class="star" data-rating="2"><i class="fas fa-star"></i></span>
                            <span class="star" data-rating="3"><i class="fas fa-star"></i></span>
                            <span class="star" data-rating="4"><i class="fas fa-star"></i></span>
                            <span class="star" data-rating="5"><i class="fas fa-star"></i></span>
                        </div>
                        <small class="form-text text-muted">
                            Click on a star to rate from 1 (very dissatisfied) to 5 (very satisfied)
                        </small>
                    </div>
                    
                    <div class="form-group">
                        <label for="feedback">Additional Comments (optional)</label>
                        <textarea 
                            class="form-control" 
                            id="feedbackText" 
                            rows="3" 
                            placeholder="Please share any additional feedback about how your complaint was handled..."></textarea>
                    </div>
                    
                    <button type="button" id="submitFeedback" class="btn btn-primary">
                        <i class="fas fa-paper-plane mr-1"></i> Submit Feedback
                    </button>
                </form>
            </div>
        </div>
    `;
    
    // Add event listeners for star rating
    document.querySelectorAll('.star').forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.dataset.rating);
            selectRating(rating);
        });
    });
}

/**
 * Renders the reopen form
 */
function renderReopenForm() {
    const reopenContainer = document.getElementById('reopenFormContainer');
    
    reopenContainer.innerHTML = `
        <div class="card mb-4 border-warning">
            <div class="card-header bg-warning text-white">
                <h5 class="mb-0"><i class="fas fa-redo mr-2"></i> Request to Reopen Complaint</h5>
            </div>
            <div class="card-body">
                <div id="reopenError" class="alert alert-danger" style="display: none;"></div>
                
                <form id="reopenForm">
                    <div class="form-group">
                        <label for="reopenReason">
                            <strong>Why do you want to reopen this complaint?</strong>
                        </label>
                        <textarea 
                            class="form-control"
                            id="reopenReason"
                            rows="4"
                            placeholder="Please explain why you're not satisfied with the resolution and why this complaint should be reopened..."
                            required></textarea>
                        <small class="form-text text-muted">
                            Please be specific about what aspects of the resolution are unsatisfactory.
                        </small>
                    </div>
                    
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle mr-2"></i> Your complaint will be reviewed again by our staff if reopened.
                    </div>
                    
                    <div class="d-flex justify-content-between">
                        <button 
                            type="button" 
                            class="btn btn-secondary" 
                            id="cancelReopenButton"
                        >
                            <i class="fas fa-times mr-1"></i> Cancel
                        </button>
                        <button 
                            type="button" 
                            class="btn btn-warning"
                            id="submitReopenButton"
                        >
                            <i class="fas fa-redo mr-1"></i> Submit Reopen Request
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

/**
 * Toggle the reopen form visibility
 * @param {boolean} show Whether to show the form
 */
function toggleReopenForm(show) {
    showingReopenForm = show;
    const reopenContainer = document.getElementById('reopenFormContainer');
    
    if (show) {
        renderReopenForm();
        reopenContainer.style.display = 'block';
    } else {
        reopenContainer.innerHTML = '';
        reopenContainer.style.display = 'none';
    }
}

/**
 * Submit feedback for a complaint
 * @param {string} complaintId Complaint ID
 */
async function submitFeedback(complaintId) {
    try {
        const rating = document.querySelector('.star.selected')?.dataset.rating;
        const feedback = document.getElementById('feedbackText').value.trim();
        
        if (!rating) {
            document.getElementById('feedbackError').textContent = 'Please select a rating';
            document.getElementById('feedbackError').style.display = 'block';
            return;
        }
        
        showLoader();
        
        const response = await fetch(`${API_BASE_URL}/api/complaints/${complaintId}/feedback`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rating: parseInt(rating),
                feedback: feedback
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit feedback');
        }
        
        // Hide form, show success message
        document.getElementById('feedbackForm').style.display = 'none';
        document.getElementById('feedbackSuccess').style.display = 'block';
        
        // Reload complaint data after a short delay
        setTimeout(() => {
            loadComplaintDetails(complaintId);
        }, 1500);
        
        hideLoader();
    } catch (error) {
        console.error('Error submitting feedback:', error);
        hideLoader();
        document.getElementById('feedbackError').textContent = 'Failed to submit feedback. Please try again later.';
        document.getElementById('feedbackError').style.display = 'block';
    }
}

/**
 * Submit a request to reopen a complaint
 * @param {string} complaintId Complaint ID
 */
async function submitReopenRequest(complaintId) {
    try {
        const reopenReason = document.getElementById('reopenReason').value.trim();
        
        if (!reopenReason) {
            document.getElementById('reopenError').textContent = 'Please provide a reason for reopening this complaint';
            document.getElementById('reopenError').style.display = 'block';
            return;
        }
        
        showLoader();
        
        const response = await fetch(`${API_BASE_URL}/api/complaints/${complaintId}/reopen`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reopenReason: reopenReason
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to reopen complaint');
        }
        
        // Hide reopen form
        toggleReopenForm(false);
        
        // Show success message
        showSuccess('Your complaint has been reopened successfully');
        
        // Reload complaint data after a short delay
        setTimeout(() => {
            loadComplaintDetails(complaintId);
        }, 1500);
        
        hideLoader();
    } catch (error) {
        console.error('Error reopening complaint:', error);
        hideLoader();
        document.getElementById('reopenError').textContent = 'Failed to reopen complaint. Please try again later.';
        document.getElementById('reopenError').style.display = 'block';
    }
}

/**
 * Select a rating (1-5 stars)
 * @param {number} rating Rating value
 */
function selectRating(rating) {
    const stars = document.querySelectorAll('.star');
    
    stars.forEach(star => {
        const starRating = parseInt(star.dataset.rating);
        
        if (starRating <= rating) {
            star.classList.add('selected');
        } else {
            star.classList.remove('selected');
        }
    });
}

/**
 * Render star icons for a rating
 * @param {number} rating Rating value
 * @returns {string} HTML for star icons
 */
function renderStars(rating) {
    let starsHtml = '';
    
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            starsHtml += '<i class="fas fa-star text-warning"></i>';
        } else {
            starsHtml += '<i class="fas fa-star text-muted"></i>';
        }
    }
    
    return starsHtml;
}

/**
 * Load complaint updates
 * @param {string} complaintId Complaint ID
 */
async function loadComplaintUpdates(complaintId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/complaints/${complaintId}/updates`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load complaint updates');
        }
        
        const updates = await response.json();
        
        renderComplaintUpdates(updates);
    } catch (error) {
        console.error('Error loading complaint updates:', error);
    }
}

/**
 * Render complaint updates
 * @param {Array} updates List of updates
 */
function renderComplaintUpdates(updates) {
    const updatesContainer = document.getElementById('complaintUpdates');
    
    if (!updates || updates.length === 0) {
        updatesContainer.innerHTML = '<div class="text-muted text-center py-3">No updates yet</div>';
        return;
    }
    
    const updatesHtml = updates.map(update => `
        <div class="update-item">
            <div class="update-time">${formatDate(update.timestamp)}</div>
            <div class="update-content">
                <span class="badge badge-${getUpdateBadgeClass(update.updateType)}">${update.updateType}</span>
                <div class="update-text">${update.description}</div>
                <div class="update-user">- ${update.user.name}</div>
            </div>
        </div>
    `).join('');
    
    updatesContainer.innerHTML = updatesHtml;
}

/**
 * Get badge class for update type
 * @param {string} updateType Type of update
 * @returns {string} Badge class
 */
function getUpdateBadgeClass(updateType) {
    switch (updateType) {
        case 'STATUS_CHANGE':
            return 'primary';
        case 'COMMENT':
            return 'info';
        case 'FEEDBACK':
            return 'success';
        case 'REOPENED':
            return 'warning';
        default:
            return 'secondary';
    }
}

/**
 * Returns the appropriate badge class for a complaint status
 * @param {string} status The complaint status
 * @returns {string} The badge class
 */
function getStatusBadgeClass(status) {
    switch (status) {
        case 'PENDING':
            return 'secondary';
        case 'IN_PROGRESS':
            return 'primary';
        case 'RESOLVED':
            return 'success';
        case 'REJECTED':
            return 'danger';
        case 'ESCALATED':
            return 'warning';
        default:
            return 'info';
    }
}

/**
 * Format a date string for display
 * @param {string} dateString The date string to format
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

/**
 * Initialize map with complaint location
 * @param {number} lat Latitude
 * @param {number} lng Longitude
 */
function initMap(lat, lng) {
    // This would be implemented with a mapping library like Leaflet or Google Maps
    console.log('Map would be initialized with location:', lat, lng);
}

/**
 * Shows a loader
 */
function showLoader() {
    const loader = document.createElement('div');
    loader.className = 'loader-container';
    loader.innerHTML = '<div class="loader"></div>';
    
    document.body.appendChild(loader);
}

/**
 * Hides all loaders
 */
function hideLoader() {
    document.querySelectorAll('.loader-container').forEach(loader => {
        loader.remove();
    });
}