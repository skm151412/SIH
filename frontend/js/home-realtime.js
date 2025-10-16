/**
 * Home page real-time functionality
 * Adds WebSocket support to the home page for real-time updates
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize WebSocket if user is authenticated
    if (typeof webSocketService !== 'undefined' && authApi.isAuthenticated()) {
        webSocketService.init();
        
        // Listen for real-time complaint updates
        document.addEventListener('complaint-update', handleRealTimeComplaintUpdate);
        
        // Listen for real-time statistics updates
        document.addEventListener('statistics-update', handleRealTimeStatisticsUpdate);
    }
});

/**
 * Handle real-time complaint updates
 * @param {Event} event Custom event with complaint data
 */
function handleRealTimeComplaintUpdate(event) {
    const updatedComplaint = event.detail;
    
    console.log('Real-time complaint update received:', updatedComplaint);
    
    // Update recent complaints list
    updateRecentComplaints();
    
    // Update map with new complaint
    updateMapWithNewComplaint(updatedComplaint);
    
    // Show toast notification
    if (typeof showToast === 'function') {
        showToast('New complaint reported: ' + updatedComplaint.title, 'info');
    }
}

/**
 * Handle real-time statistics updates
 * @param {Event} event Custom event with statistics data
 */
function handleRealTimeStatisticsUpdate(event) {
    const statistics = event.detail;
    
    console.log('Real-time statistics update received:', statistics);
    
    // Update statistics highlights
    updateStatisticsHighlights(statistics);
}

/**
 * Update the recent complaints list on the home page
 */
function updateRecentComplaints() {
    const recentComplaintsList = document.getElementById('recentComplaintsList');
    if (!recentComplaintsList) return;
    
    // Fetch recent complaints
    fetch(`${API_CONFIG.baseUrl}/complaints/public/recent?page=0&size=5&timestamp=${new Date().getTime()}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(authApi.isAuthenticated() ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to refresh recent complaints');
        }
        return response.json();
    })
    .then(data => {
        const complaints = data.content;
        
        if (complaints.length === 0) {
            recentComplaintsList.innerHTML = '<li class="empty-list">No recent complaints</li>';
            return;
        }
        
        recentComplaintsList.innerHTML = complaints.map(complaint => `
            <li class="complaint-item">
                <div class="complaint-header">
                    <span class="complaint-category ${complaint.category.toLowerCase()}">${formatCategory(complaint.category)}</span>
                    <span class="complaint-date">${formatTimeAgo(complaint.createdAt)}</span>
                </div>
                <h4><a href="complaint-detail.html?id=${complaint.id}">${complaint.title}</a></h4>
                <p>${truncateText(complaint.description, 100)}</p>
                <div class="complaint-footer">
                    <span class="complaint-location"><i class="fas fa-map-marker-alt"></i> ${truncateText(complaint.address || 'Unknown location', 30)}</span>
                    <span class="complaint-status ${complaint.status.toLowerCase()}">${complaint.status}</span>
                </div>
            </li>
        `).join('');
    })
    .catch(error => {
        console.error('Error updating recent complaints:', error);
    });
}

/**
 * Update the map with a new complaint marker
 * @param {Object} complaint The new complaint to add to the map
 */
function updateMapWithNewComplaint(complaint) {
    // Check if map object exists in window
    if (!window.complaintMap) return;
    
    // Create a new marker for the complaint
    const marker = L.marker([complaint.locationLat, complaint.locationLng])
        .addTo(window.complaintMap)
        .bindPopup(`
            <strong>${complaint.title}</strong><br>
            <span class="status-badge status-${complaint.status.toLowerCase()}">${complaint.status}</span><br>
            <small>${formatDate(complaint.createdAt)}</small><br>
            <a href="complaint-detail.html?id=${complaint.id}">View Details</a>
        `);
    
    // Store the marker in the global markers array if it exists
    if (window.complaintMarkers) {
        window.complaintMarkers.push(marker);
    }
    
    // Flash animation for the new marker
    flashMarker(marker);
}

/**
 * Create a flash animation for a new marker
 * @param {Object} marker The Leaflet marker to animate
 */
function flashMarker(marker) {
    const icon = marker.getIcon();
    const originalIcon = { ...icon.options };
    
    // Define a pulse animation with CSS
    const pulseIcon = L.divIcon({
        className: 'pulse-marker',
        html: '<span class="pulse-inner"></span>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
    
    // Apply the pulse icon
    marker.setIcon(pulseIcon);
    
    // Reset to original icon after animation
    setTimeout(() => {
        marker.setIcon(L.icon(originalIcon));
    }, 3000);
}

/**
 * Update statistics highlights with new data
 * @param {Object} statistics The statistics data
 */
function updateStatisticsHighlights(statistics) {
    // Update stat counters
    document.querySelectorAll('[data-stat]').forEach(element => {
        const statKey = element.getAttribute('data-stat');
        if (statistics[statKey] !== undefined) {
            // Animate the number change
            animateValue(element, parseInt(element.textContent.replace(/,/g, '')), statistics[statKey], 1000);
        }
    });
}

/**
 * Animate a numeric value change
 * @param {Element} element The DOM element to update
 * @param {Number} start Starting value
 * @param {Number} end Ending value
 * @param {Number} duration Animation duration in ms
 */
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = Math.floor(progress * (end - start) + start);
        element.textContent = current.toLocaleString();
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

/**
 * Format category name
 * @param {string} category The category code
 * @returns {string} Formatted category name
 */
function formatCategory(category) {
    if (!category) return 'Unknown';
    
    return category.replace('_', ' ').replace(/\w\S*/g, 
        txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

/**
 * Format date as time ago
 * @param {string} dateString ISO date string
 * @returns {string} Formatted time ago
 */
function formatTimeAgo(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);
    
    if (diffSeconds < 60) {
        return 'just now';
    } else if (diffSeconds < 3600) {
        const minutes = Math.floor(diffSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffSeconds < 86400) {
        const hours = Math.floor(diffSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffSeconds < 604800) {
        const days = Math.floor(diffSeconds / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
        return formatDate(dateString);
    }
}

/**
 * Format date string
 * @param {string} dateString ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

/**
 * Truncate text to a specific length
 * @param {string} text The text to truncate
 * @param {number} maxLength Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength) + '...';
}