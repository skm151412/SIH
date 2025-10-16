/**
 * Reopen form component for resolved complaints
 */
const ReopenForm = ({ complaint, onSubmit, onCancel }) => {
    const [reopenReason, setReopenReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!reopenReason.trim()) {
            setError('Please provide a reason for reopening this complaint');
            return;
        }
        
        setSubmitting(true);
        setError(null);
        
        try {
            await onSubmit(reopenReason);
        } catch (err) {
            console.error('Error reopening complaint:', err);
            setError('Failed to reopen complaint. Please try again.');
            setSubmitting(false);
        }
    };
    
    return (
        <div className="card mb-4 border-warning">
            <div className="card-header bg-warning text-white">
                <h5 className="mb-0"><i className="fas fa-redo mr-2"></i> Request to Reopen Complaint</h5>
            </div>
            <div className="card-body">
                {error && <div className="alert alert-danger">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="reopenReason">
                            <strong>Why do you want to reopen this complaint?</strong>
                        </label>
                        <textarea 
                            className="form-control"
                            id="reopenReason"
                            rows="4"
                            value={reopenReason}
                            onChange={(e) => setReopenReason(e.target.value)}
                            placeholder="Please explain why you're not satisfied with the resolution and why this complaint should be reopened..."
                            required
                        ></textarea>
                        <small className="form-text text-muted">
                            Please be specific about what aspects of the resolution are unsatisfactory.
                        </small>
                    </div>
                    
                    <div className="alert alert-info">
                        <i className="fas fa-info-circle mr-2"></i> Your complaint will be reviewed again by our staff if reopened.
                    </div>
                    
                    <div className="d-flex justify-content-between">
                        <button 
                            type="button" 
                            className="btn btn-secondary" 
                            onClick={onCancel}
                            disabled={submitting}
                        >
                            <i className="fas fa-times mr-1"></i> Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="btn btn-warning"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-redo mr-1"></i> Submit Reopen Request
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};