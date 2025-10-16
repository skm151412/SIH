// Handle real-time complaint updates
function handleRealTimeComplaintUpdate(event) {
    const updatedComplaint = event.detail;
    
    console.log('Real-time complaint update received:', updatedComplaint);
    
    // Update recent complaints list if visible
    const recentComplaintsContainer = document.getElementById('recentComplaints');
    if (recentComplaintsContainer && document.getElementById('myComplaints').classList.contains('active')) {
        // Refresh the complaints list
        initRecentComplaints();
    }
    
    // Update dashboard statistics
    loadDashboardData();
    
    // Show notification toast
    if (typeof showToast === 'function') {
        showToast(`Complaint "${updatedComplaint.title}" has been updated`, 'info');
    }
}

// Handle real-time statistics updates
function handleRealTimeStatisticsUpdate(event) {
    const statistics = event.detail;
    
    console.log('Real-time statistics update received:', statistics);
    
    // Update statistics cards
    updateStatisticsCards(statistics);
    
    // Update dashboard charts
    updateDashboardCharts(statistics);
}

// Handle real-time notification updates
function handleRealTimeNotification(event) {
    const notification = event.detail;
    
    console.log('Real-time notification received:', notification);
    
    // Show notification toast
    if (typeof showToast === 'function') {
        showToast(notification.message, 'info');
    }
    
    // Update notification badge/count
    if (typeof updateNotificationBadge === 'function') {
        updateNotificationBadge();
    }
}