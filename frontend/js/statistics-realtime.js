/**
 * Statistics page real-time functionality
 * Adds WebSocket support to the statistics page for real-time updates
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize WebSocket if user is authenticated
    if (typeof webSocketService !== 'undefined' && authApi.isAuthenticated()) {
        webSocketService.init();
        
        // Listen for real-time statistics updates
        document.addEventListener('statistics-update', handleRealTimeStatisticsUpdate);
        
        // Listen for real-time complaint updates that might affect statistics
        document.addEventListener('complaint-update', handleComplaintUpdateEffect);
    }
    
    // Add refresh button to statistics filters
    const filtersContainer = document.querySelector('.stats-filters');
    if (filtersContainer) {
        const refreshButton = document.createElement('button');
        refreshButton.className = 'btn btn-outline';
        refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
        refreshButton.addEventListener('click', function() {
            // Show spinning icon
            this.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Refreshing...';
            this.disabled = true;
            
            // Reload all chart data
            loadAllChartData();
            
            // Reset button after 1 second
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
                this.disabled = false;
            }, 1000);
        });
        
        filtersContainer.appendChild(refreshButton);
    }
});

/**
 * Handle real-time statistics updates
 * @param {Event} event Custom event with statistics data
 */
function handleRealTimeStatisticsUpdate(event) {
    const statistics = event.detail;
    
    console.log('Real-time statistics update received:', statistics);
    
    // Update all charts with new data
    updateAllCharts(statistics);
    
    // Update summary numbers
    updateSummaryNumbers(statistics);
    
    // Show toast notification
    if (typeof showToast === 'function') {
        showToast('Statistics updated with real-time data', 'info');
    }
}

/**
 * Handle complaint updates that might affect statistics
 * @param {Event} event Custom event with complaint data
 */
function handleComplaintUpdateEffect(event) {
    const complaint = event.detail;
    
    console.log('Complaint update affecting statistics:', complaint);
    
    // Request updated statistics data
    fetch(`${API_CONFIG.baseUrl}/statistics?timestamp=${new Date().getTime()}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(authApi.isAuthenticated() ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to refresh statistics');
        }
        return response.json();
    })
    .then(data => {
        // Update charts with fresh data
        updateAllCharts(data);
        
        // Update summary numbers
        updateSummaryNumbers(data);
    })
    .catch(error => {
        console.error('Error refreshing statistics:', error);
    });
}

/**
 * Update all chart data by forcing a reload
 */
function loadAllChartData() {
    // Get current filter values
    const timeFilter = document.getElementById('timeFilter').value;
    const areaFilter = document.getElementById('areaFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    // Construct query parameters
    const params = new URLSearchParams({
        timePeriod: timeFilter,
        area: areaFilter,
        category: categoryFilter
    });
    
    // Fetch updated statistics
    fetch(`${API_CONFIG.baseUrl}/statistics?${params.toString()}&timestamp=${new Date().getTime()}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(authApi.isAuthenticated() ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to refresh statistics');
        }
        return response.json();
    })
    .then(data => {
        // Update charts with fresh data
        updateAllCharts(data);
        
        // Update summary numbers
        updateSummaryNumbers(data);
        
        // Show success message
        if (typeof showToast === 'function') {
            showToast('Statistics refreshed successfully', 'success');
        }
    })
    .catch(error => {
        console.error('Error refreshing statistics:', error);
        
        // Show error message
        if (typeof showToast === 'function') {
            showToast('Failed to refresh statistics', 'error');
        }
    });
}