/**
 * Home page functionality
 */

// Initialize home page functionality
function initHomePage() {
    // Initialize navbar
    initNavbar();
    
    // Check auth status and update UI
    updateAuthUI();
    
    // Initialize notifications if user is authenticated
    if (typeof notificationService !== 'undefined' && authApi.isAuthenticated()) {
        notificationService.init();
    }
    
    // Initialize other home page components
    initMapView();
    initStatHighlights();
    initRecentComplaintsList();
}

// Initialize map view with complaint markers
function initMapView() {
    const mapElement = document.getElementById('homeMap');
    
    if (!mapElement) return;
    
    // Initialize map
    const map = L.map('homeMap').setView([20.5937, 78.9629], 5); // Default center of India
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Load recent complaints for map
    apiService.get('/api/complaints/map-data')
        .then(response => {
            // Add markers for each complaint
            response.data.forEach(complaint => {
                const marker = L.marker([complaint.latitude, complaint.longitude])
                    .addTo(map)
                    .bindPopup(`
                        <strong>${complaint.title}</strong><br>
                        <span class="status-badge status-${complaint.status.toLowerCase()}">${complaint.status}</span><br>
                        <small>${formatDate(complaint.createdAt)}</small><br>
                        <a href="complaint-detail.html?id=${complaint.id}">View Details</a>
                    `);
            });
            
            // Adjust map view to fit all markers
            if (response.data.length > 0) {
                const bounds = L.latLngBounds(response.data.map(c => [c.latitude, c.longitude]));
                map.fitBounds(bounds);
            }
        })
        .catch(error => {
            console.error('Error loading map data:', error);
        });
}

// Initialize statistics highlights on home page
function initStatHighlights() {
    apiService.get('/api/statistics/highlights')
        .then(response => {
            const stats = response.data;
            
            // Update stat counters
            document.querySelectorAll('[data-stat]').forEach(element => {
                const statKey = element.getAttribute('data-stat');
                if (stats[statKey] !== undefined) {
                    element.textContent = stats[statKey].toLocaleString();
                }
            });
        })
        .catch(error => {
            console.error('Error loading statistics:', error);
        });
}

// Initialize recent complaints list
function initRecentComplaintsList() {
    const recentListElement = document.getElementById('recentComplaintsList');
    
    if (!recentListElement) return;
    
    apiService.get('/api/complaints/public/recent?page=0&size=5')
        .then(response => {
            const complaints = response.data.content;
            
            if (complaints.length === 0) {
                recentListElement.innerHTML = '<li class="empty-list">No recent complaints</li>';
                return;
            }
            
            recentListElement.innerHTML = complaints.map(complaint => `
                <li class="complaint-item">
                    <div class="complaint-header">
                        <h4><a href="complaint-detail.html?id=${complaint.id}">${complaint.title}</a></h4>
                        <span class="status-badge status-${complaint.status.toLowerCase()}">${complaint.status}</span>
                    </div>
                    <div class="complaint-meta">
                        <span><i class="fas fa-map-marker-alt"></i> ${complaint.location}</span>
                        <span><i class="fas fa-calendar-alt"></i> ${formatDate(complaint.createdAt)}</span>
                    </div>
                </li>
            `).join('');
        })
        .catch(error => {
            console.error('Error loading recent complaints:', error);
            recentListElement.innerHTML = '<li class="empty-list error">Error loading complaints</li>';
        });
}

// Call init function when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initHomePage();
});