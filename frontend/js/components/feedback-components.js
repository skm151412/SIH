// Feedback component for complaint detail page
class FeedbackForm {
    constructor(container, complaintId, onSubmitCallback) {
        this.container = document.querySelector(container);
        this.complaintId = complaintId;
        this.selectedRating = null;
        this.onSubmitCallback = onSubmitCallback || function() {};
        this.render();
        this.attachEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="card mb-4">
                <div class="card-header bg-light">
                    <h5 class="mb-0">Rate Your Experience</h5>
                </div>
                <div class="card-body">
                    <div class="alert alert-danger" id="feedback-error" style="display: none;"></div>
                    
                    <form id="feedback-form">
                        <div class="form-group">
                            <label>How satisfied are you with the resolution?</label>
                            <div class="star-rating mb-3">
                                <i class="fas fa-star star" data-rating="1"></i>
                                <i class="fas fa-star star" data-rating="2"></i>
                                <i class="fas fa-star star" data-rating="3"></i>
                                <i class="fas fa-star star" data-rating="4"></i>
                                <i class="fas fa-star star" data-rating="5"></i>
                            </div>
                            <small class="form-text text-muted">
                                Click on a star to rate from 1 (very dissatisfied) to 5 (very satisfied)
                            </small>
                        </div>
                        
                        <div class="form-group">
                            <label for="feedback-text">Additional Comments (optional)</label>
                            <textarea 
                                class="form-control" 
                                id="feedback-text" 
                                rows="3" 
                                placeholder="Please share any additional feedback about how your complaint was handled..."></textarea>
                        </div>
                        
                        <button type="button" id="submit-feedback" class="btn btn-primary">
                            <i class="fas fa-paper-plane mr-1"></i> Submit Feedback
                        </button>
                    </form>
                </div>
            </div>
        `;
    }
    
    attachEventListeners() {
        const stars = this.container.querySelectorAll('.star');
        const submitButton = this.container.querySelector('#submit-feedback');
        
        // Star rating
        stars.forEach(star => {
            star.addEventListener('click', (e) => {
                const rating = parseInt(e.currentTarget.getAttribute('data-rating'));
                this.selectRating(rating);
            });
        });
        
        // Submit button
        submitButton.addEventListener('click', () => {
            this.submitFeedback();
        });
    }
    
    selectRating(rating) {
        this.selectedRating = rating;
        const stars = this.container.querySelectorAll('.star');
        
        stars.forEach(star => {
            const starRating = parseInt(star.getAttribute('data-rating'));
            if (starRating <= rating) {
                star.classList.add('selected');
            } else {
                star.classList.remove('selected');
            }
        });
    }
    
    async submitFeedback() {
        const errorElement = this.container.querySelector('#feedback-error');
        const feedbackText = this.container.querySelector('#feedback-text').value.trim();
        
        errorElement.style.display = 'none';
        
        if (!this.selectedRating) {
            errorElement.textContent = 'Please select a rating';
            errorElement.style.display = 'block';
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/complaints/${this.complaintId}/feedback`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    rating: this.selectedRating,
                    feedback: feedbackText
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to submit feedback');
            }
            
            const data = await response.json();
            this.onSubmitCallback(data);
            
        } catch (error) {
            console.error('Error submitting feedback:', error);
            errorElement.textContent = 'Failed to submit feedback. Please try again later.';
            errorElement.style.display = 'block';
        }
    }
    
    showSuccess() {
        this.container.innerHTML = `
            <div class="alert alert-success">
                <h5><i class="fas fa-check-circle mr-2"></i> Thank you for your feedback!</h5>
                <p class="mb-0">Your input helps us improve our services.</p>
            </div>
        `;
    }
}

// Reopen form component for complaint detail page
class ReopenForm {
    constructor(container, complaintId, onSubmitCallback) {
        this.container = document.querySelector(container);
        this.complaintId = complaintId;
        this.onSubmitCallback = onSubmitCallback || function() {};
        this.render();
        this.attachEventListeners();
    }
    
    render() {
        this.container.innerHTML = `
            <div class="card mb-4 border-warning">
                <div class="card-header bg-warning text-white">
                    <h5 class="mb-0"><i class="fas fa-redo mr-2"></i> Request to Reopen Complaint</h5>
                </div>
                <div class="card-body">
                    <div class="alert alert-danger" id="reopen-error" style="display: none;"></div>
                    
                    <form id="reopen-form">
                        <div class="form-group">
                            <label for="reopen-reason">
                                <strong>Why do you want to reopen this complaint?</strong>
                            </label>
                            <textarea 
                                class="form-control"
                                id="reopen-reason"
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
                                id="cancel-reopen"
                            >
                                <i class="fas fa-times mr-1"></i> Cancel
                            </button>
                            <button 
                                type="button" 
                                class="btn btn-warning"
                                id="submit-reopen"
                            >
                                <i class="fas fa-redo mr-1"></i> Submit Reopen Request
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }
    
    attachEventListeners() {
        const submitButton = this.container.querySelector('#submit-reopen');
        const cancelButton = this.container.querySelector('#cancel-reopen');
        
        submitButton.addEventListener('click', () => {
            this.submitReopenRequest();
        });
        
        cancelButton.addEventListener('click', () => {
            this.hide();
        });
    }
    
    async submitReopenRequest() {
        const errorElement = this.container.querySelector('#reopen-error');
        const reasonText = this.container.querySelector('#reopen-reason').value.trim();
        
        errorElement.style.display = 'none';
        
        if (!reasonText) {
            errorElement.textContent = 'Please provide a reason for reopening this complaint';
            errorElement.style.display = 'block';
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/complaints/${this.complaintId}/reopen`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reopenReason: reasonText
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to reopen complaint');
            }
            
            const data = await response.json();
            this.onSubmitCallback(data);
            
        } catch (error) {
            console.error('Error reopening complaint:', error);
            errorElement.textContent = 'Failed to reopen complaint. Please try again later.';
            errorElement.style.display = 'block';
        }
    }
    
    hide() {
        this.container.innerHTML = '';
    }
    
    showReopenedStatus(complaint) {
        this.container.innerHTML = `
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
}

// Export components
window.FeedbackForm = FeedbackForm;
window.ReopenForm = ReopenForm;