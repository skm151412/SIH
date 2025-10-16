/**
 * Export component for admin dashboard
 * Allows admins to export complaint data as CSV or PDF
 */
class ExportComponent {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'export-container';
        
        this.filters = {
            startDate: null,
            endDate: null,
            category: '',
            status: '',
            exportFormat: 'CSV'
        };
        
        this.categories = [];
        this.statusOptions = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];
        
        this.init();
    }
    
    async init() {
        this.render();
        await this.loadCategories();
    }
    
    async loadCategories() {
        try {
            // Load available categories from API
            const response = await fetch('/api/complaints/categories', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                this.categories = await response.json();
                this.updateCategoryDropdown();
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }
    
    updateCategoryDropdown() {
        const categorySelect = document.getElementById('export-category');
        if (!categorySelect) return;
        
        // Clear existing options
        while (categorySelect.options.length > 1) {
            categorySelect.remove(1);
        }
        
        // Add categories
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }
    
    render() {
        this.container.innerHTML = `
            <div class="export-panel card">
                <div class="card-header">
                    <h3>Export Complaints</h3>
                </div>
                <div class="card-body">
                    <form id="export-form">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label for="export-start-date">Start Date</label>
                                    <input type="datetime-local" id="export-start-date" class="form-control">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label for="export-end-date">End Date</label>
                                    <input type="datetime-local" id="export-end-date" class="form-control">
                                </div>
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label for="export-category">Category</label>
                                    <select id="export-category" class="form-control">
                                        <option value="">All Categories</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label for="export-status">Status</label>
                                    <select id="export-status" class="form-control">
                                        <option value="">All Statuses</option>
                                        <option value="PENDING">Pending</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="RESOLVED">Resolved</option>
                                        <option value="REJECTED">Rejected</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-md-12">
                                <div class="form-group">
                                    <label>Export Format</label>
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" name="export-format" id="format-csv" value="CSV" checked>
                                        <label class="form-check-label" for="format-csv">
                                            CSV
                                        </label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" name="export-format" id="format-pdf" value="PDF">
                                        <label class="form-check-label" for="format-pdf">
                                            PDF
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-12">
                                <button type="button" id="export-button" class="btn btn-primary">
                                    <i class="fas fa-file-export"></i> Export
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Add event listeners
        setTimeout(() => {
            const exportButton = document.getElementById('export-button');
            if (exportButton) {
                exportButton.addEventListener('click', () => this.exportData());
            }
        }, 100);
    }
    
    async exportData() {
        try {
            // Get filter values
            const startDateInput = document.getElementById('export-start-date');
            const endDateInput = document.getElementById('export-end-date');
            
            const filterData = {
                startDate: startDateInput.value ? new Date(startDateInput.value).toISOString() : null,
                endDate: endDateInput.value ? new Date(endDateInput.value).toISOString() : null,
                category: document.getElementById('export-category').value,
                status: document.getElementById('export-status').value,
                exportFormat: document.querySelector('input[name="export-format"]:checked').value
            };
            
            // Show loading indicator
            const exportButton = document.getElementById('export-button');
            exportButton.disabled = true;
            exportButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exporting...';
            
            // Call API
            const response = await fetch('/api/admin/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(filterData)
            });
            
            if (response.ok) {
                // Convert response to blob
                const blob = await response.blob();
                
                // Create download link
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                const dateStr = new Date().toISOString().slice(0, 10);
                a.href = url;
                a.download = `complaints_${dateStr}.${filterData.exportFormat.toLowerCase()}`;
                document.body.appendChild(a);
                a.click();
                
                // Cleanup
                window.URL.revokeObjectURL(url);
                a.remove();
                
                // Show success notification
                showNotification('Export successful', 'success');
            } else {
                throw new Error('Export failed');
            }
        } catch (error) {
            console.error('Export error:', error);
            showNotification('Failed to export data. Please try again.', 'error');
        } finally {
            // Reset button state
            const exportButton = document.getElementById('export-button');
            exportButton.disabled = false;
            exportButton.innerHTML = '<i class="fas fa-file-export"></i> Export';
        }
    }
    
    getElement() {
        return this.container;
    }
}

// Helper function for notifications
function showNotification(message, type = 'info') {
    if (window.Toastify) {
        Toastify({
            text: message,
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right",
            backgroundColor: type === 'error' ? "#e74c3c" : 
                            type === 'success' ? "#07bc0c" : 
                            "#3498db"
        }).showToast();
    } else {
        alert(message);
    }
}