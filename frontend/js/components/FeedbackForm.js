/**
 * Feedback component for resolved complaints
 */
const FeedbackForm = ({ complaint, onSubmit, onReopen }) => {
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            if (rating === 0) {
                setError('Please select a rating');
                return;
            }
            
            await onSubmit(rating, feedback);
            setSubmitted(true);
            setError(null);
            
            // If rating is low (1-2), show the reopen option
            if (rating <= 2) {
                // We don't automatically show the reopen form here
                // The user needs to click "Reopen" button which will show the ReopenForm
            }
        } catch (err) {
            console.error('Error submitting feedback:', err);
            setError('Failed to submit feedback. Please try again.');
        }
    };
    
    // If the complaint already has feedback, display it
    if (complaint.rating) {
        return (
            <div className="card mb-4">
                <div className="card-header bg-light">
                    <h5 className="mb-0">Your Feedback</h5>
                </div>
                <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                        <div className="mr-3">Your Rating:</div>
                        <div className="stars-display">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <i key={star} 
                                   className={`fas fa-star ${star <= complaint.rating ? 'text-warning' : 'text-muted'}`}></i>
                            ))}
                        </div>
                    </div>
                    
                    {complaint.feedback && (
                        <div className="mb-3">
                            <h6>Your Comments:</h6>
                            <p className="mb-0">{complaint.feedback}</p>
                        </div>
                    )}
                    
                    {complaint.rating <= 2 && !complaint.reopened && (
                        <div className="mt-3">
                            <button 
                                className="btn btn-warning" 
                                onClick={() => onReopen()}
                            >
                                <i className="fas fa-redo mr-1"></i> Request to Reopen
                            </button>
                            <small className="form-text text-muted">
                                If you're not satisfied with how this complaint was resolved, you can request to reopen it.
                            </small>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    
    // If the complaint has been reopened, show that information
    if (complaint.reopened) {
        return (
            <div className="alert alert-warning">
                <h5><i className="fas fa-exclamation-triangle mr-2"></i> This complaint has been reopened</h5>
                <p>You requested this complaint to be reopened on {new Date(complaint.updatedAt).toLocaleString()}.</p>
                {complaint.reopenReason && (
                    <div>
                        <strong>Reason:</strong> {complaint.reopenReason}
                    </div>
                )}
            </div>
        );
    }
    
    // Otherwise show the feedback form
    return (
        <div className="card mb-4">
            <div className="card-header bg-light">
                <h5 className="mb-0">Rate Your Experience</h5>
            </div>
            <div className="card-body">
                {submitted ? (
                    <div className="alert alert-success">
                        <h5><i className="fas fa-check-circle mr-2"></i> Thank you for your feedback!</h5>
                        <p className="mb-0">Your input helps us improve our services.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {error && <div className="alert alert-danger">{error}</div>}
                        
                        <div className="form-group">
                            <label>How satisfied are you with the resolution?</label>
                            <div className="star-rating">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span 
                                        key={star} 
                                        className={`star ${star <= rating ? 'selected' : ''}`}
                                        onClick={() => setRating(star)}
                                    >
                                        <i className="fas fa-star"></i>
                                    </span>
                                ))}
                            </div>
                            <small className="form-text text-muted">
                                Click on a star to rate from 1 (very dissatisfied) to 5 (very satisfied)
                            </small>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="feedback">Additional Comments (optional)</label>
                            <textarea 
                                className="form-control" 
                                id="feedback" 
                                rows="3" 
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Please share any additional feedback about how your complaint was handled..."
                            ></textarea>
                        </div>
                        
                        <button type="submit" className="btn btn-primary">
                            <i className="fas fa-paper-plane mr-1"></i> Submit Feedback
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};