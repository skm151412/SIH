/**
 * Complaint listing page functionality
 * Manages loading and displaying complaint listings with filters and sorting
 */

// Current page state
let currentPage = 0;
let currentPageSize = 10;
let totalPages = 0;
let totalElements = 0;
let currentSort = 'createdAt,desc';
let currentFilters = {
    category: '',
    status: '',
    search: '',
};
let complaintList = [];

// DOM elements
let complaintListingElement;
let paginationElement;

// Initialize the complaints listing page
document.addEventListener('DOMContentLoaded', function() {
    // Initialize page elements
    initPageElements();
    
    // Load initial complaints data
    loadComplaints();
    
    // Initialize filters and search
    initFilters();
    
    // Initialize sorting
    initSorting();
    
    // Initialize pagination
    initPagination();
    
    // Setup WebSocket for real-time updates if authenticated
    if (typeof webSocketService !== 'undefined' && authApi.isAuthenticated()) {
        webSocketService.init();
        // Listen for real-time complaint updates
        document.addEventListener('complaint-update', handleRealTimeComplaintUpdate);
    }
    
    // Setup "Add Complaint" button visibility
    updateAddComplaintButton();
});

// Initialize page elements
function initPageElements() {
    // Correct IDs from complaints.html
    complaintListingElement = document.getElementById('complaintsList');
    paginationElement = document.getElementById('complaintsPagination');

    const addButton = document.getElementById('addComplaintBtn');
    const ctaButton = document.getElementById('ctaButton');
    
    if (addButton && authApi.isAuthenticated()) {
        addButton.style.display = 'flex';
    }
    
    if (ctaButton) {
        if (authApi.isAuthenticated()) {
            ctaButton.textContent = 'Report an Issue Now';
            ctaButton.href = 'report.html';
        } else {
            ctaButton.textContent = 'Sign Up & Report Now';
            ctaButton.href = 'register.html';
        }
    }
}

// Load complaints with current filters, sorting, and pagination
function loadComplaints() {
    if (!complaintListingElement) return;
    
    // Show loading state (use dedicated element if present)
    const loadingEl = document.getElementById('complaintsLoadingState');
    const emptyEl = document.getElementById('complaintsEmptyState');
    if (emptyEl) emptyEl.style.display = 'none';
    if (loadingEl) {
        loadingEl.style.display = 'block';
    } else {
        complaintListingElement.innerHTML = '<div class="loading-spinner"></div>';
    }
    
    // Build query parameters
    const params = {
        page: currentPage,
        size: currentPageSize,
        sort: currentSort
    };
    
    // Add filters if set
    if (currentFilters.category) params.category = currentFilters.category;
    if (currentFilters.status) params.status = currentFilters.status;
    if (currentFilters.search) params.search = currentFilters.search;
    
    // Fetch complaints from API
    fetch(`${API_CONFIG.baseUrl}/complaints?` + new URLSearchParams(params), {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(authApi.isAuthenticated() ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load complaints');
        }
        return response.json();
    })
    .then(data => {
        // Store pagination data
        currentPage = data.number;
        totalPages = data.totalPages;
        totalElements = data.totalElements;
        complaintList = data.content;
        
    // Render complaints
    renderComplaints(complaintList);
    const loadingEl2 = document.getElementById('complaintsLoadingState');
    if (loadingEl2) loadingEl2.style.display = 'none';
        
        // Update pagination
        updatePagination();
        
        // Update results count
        updateResultsCount();
    })
    .catch(error => {
        console.error('Error loading complaints:', error);
        complaintListingElement.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load complaints. Please try again.</p>
                <button class="btn btn-primary" onclick="loadComplaints()">Retry</button>
            </div>
        `;
    });
}

// Render complaints to the listing
function renderComplaints(complaints) {
    if (!complaintListingElement) return;
    
    if (!complaints || complaints.length === 0) {
        const emptyEl = document.getElementById('complaintsEmptyState');
        const loadingEl = document.getElementById('complaintsLoadingState');
        if (loadingEl) loadingEl.style.display = 'none';
        if (emptyEl) {
            emptyEl.style.display = 'block';
            complaintListingElement.querySelectorAll('.complaint-card').forEach(el=>el.remove());
        } else {
            complaintListingElement.innerHTML = `
                <div class="empty-state">
                    <h3>No Complaints Found</h3>
                    <p>Be the first to report an issue.</p>
                </div>`;
        }
        return;
    }
    
    // Generate HTML for each complaint
    const complaintHTML = complaints.map(complaint => `
        <div class="complaint-card" id="complaint-${complaint.id}" data-id="${complaint.id}">
            <div class="complaint-header">
                <div class="complaint-meta">
                    <span class="complaint-category ${complaint.category.toLowerCase()}">${formatCategory(complaint.category)}</span>
                    <span class="complaint-status ${complaint.status.toLowerCase()}">${formatStatus(complaint.status)}</span>
                </div>
                <h3 class="complaint-title">
                    <a href="complaint-detail.html?id=${complaint.id}">${complaint.title}</a>
                </h3>
                <p class="complaint-date">
                    <i class="far fa-calendar-alt"></i> 
                    ${formatDate(complaint.createdAt)}
                </p>
            </div>
            <div class="complaint-body">
                <p class="complaint-description">${truncateText(complaint.description, 150)}</p>
                ${complaint.images ? 
                    `<div class="complaint-thumbnail">
                        <img src="${complaint.images.split(',')[0]}" alt="${complaint.title}">
                        ${complaint.images.split(',').length > 1 ? 
                            `<span class="image-count">+${complaint.images.split(',').length - 1}</span>` : ''}
                    </div>` : ''}
            </div>
            <div class="complaint-footer">
                <div class="complaint-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${complaint.address || 'Location unavailable'}</span>
                </div>
                <a href="complaint-detail.html?id=${complaint.id}" class="btn btn-sm btn-outline">View Details</a>
            </div>
        </div>
    `).join('');
    
    complaintListingElement.innerHTML = complaintHTML;
    const emptyEl2 = document.getElementById('complaintsEmptyState');
    if (emptyEl2) emptyEl2.style.display = 'none';
}

// Initialize filter functionality
function initFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const searchInput = document.getElementById('complaintSearch');
    const searchButton = document.getElementById('searchBtn');
    
    // Category filter
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            currentFilters.category = this.value;
            currentPage = 0; // Reset to first page
            loadComplaints();
        });
    }
    
    // Status filter
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            currentFilters.status = this.value;
            currentPage = 0; // Reset to first page
            loadComplaints();
        });
    }
    
    // Search functionality
    if (searchInput && searchButton) {
        searchButton.addEventListener('click', function() {
            currentFilters.search = searchInput.value.trim();
            currentPage = 0; // Reset to first page
            loadComplaints();
        });
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                currentFilters.search = this.value.trim();
                currentPage = 0; // Reset to first page
                loadComplaints();
            }
        });
    }
}

// Initialize sorting functionality
function initSorting() {
    const sortOption = document.getElementById('sortOption');
    
    if (sortOption) {
        sortOption.addEventListener('change', function() {
            currentSort = this.value;
            loadComplaints();
        });
    }
}

// Initialize pagination
function initPagination() {
    if (!paginationElement) return;
    
    paginationElement.addEventListener('click', function(e) {
        if (e.target.classList.contains('page-link')) {
            e.preventDefault();
            
            const targetPage = e.target.getAttribute('data-page');
            
            if (targetPage === 'prev') {
                if (currentPage > 0) currentPage--;
            } else if (targetPage === 'next') {
                if (currentPage < totalPages - 1) currentPage++;
            } else {
                currentPage = parseInt(targetPage);
            }
            
            loadComplaints();
            
            // Scroll back to top of results
            window.scrollTo({
                top: document.querySelector('.filter-bar').offsetTop - 100,
                behavior: 'smooth'
            });
        }
    });
}

// Update pagination controls
function updatePagination() {
    if (!paginationElement) return;
    
    if (totalPages <= 1) {
        paginationElement.style.display = 'none';
        return;
    }
    
    paginationElement.style.display = 'flex';
    
    let paginationHTML = `
        <li class="page-item ${currentPage === 0 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="prev">
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `;
    
    // Show limited number of page links
    const maxPages = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxPages - 1);
    
    if (endPage - startPage < maxPages - 1) {
        startPage = Math.max(0, endPage - maxPages + 1);
    }
    
    // First page
    if (startPage > 0) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" data-page="0">1</a>
            </li>
            ${startPage > 1 ? '<li class="page-item disabled"><span class="page-link">...</span></li>' : ''}
        `;
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i + 1}</a>
            </li>
        `;
    }
    
    // Last page
    if (endPage < totalPages - 1) {
        paginationHTML += `
            ${endPage < totalPages - 2 ? '<li class="page-item disabled"><span class="page-link">...</span></li>' : ''}
            <li class="page-item">
                <a class="page-link" href="#" data-page="${totalPages - 1}">${totalPages}</a>
            </li>
        `;
    }
    
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages - 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="next">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;
    
    paginationElement.innerHTML = paginationHTML;
}

// Update results count display
function updateResultsCount() {
    const resultsCountElement = document.getElementById('resultsCount');
    
    if (resultsCountElement) {
        const start = totalElements === 0 ? 0 : currentPage * currentPageSize + 1;
        const end = Math.min((currentPage + 1) * currentPageSize, totalElements);
        
        resultsCountElement.textContent = `Showing ${start}-${end} of ${totalElements} complaints`;
    }
}

// Update Add Complaint button based on auth status
function updateAddComplaintButton() {
    const addButton = document.getElementById('addComplaintButton');
    
    if (addButton) {
        if (authApi.isAuthenticated()) {
            addButton.style.display = 'flex';
            addButton.href = 'report.html';
        } else {
            addButton.style.display = 'none';
        }
    }
}

// Handle real-time complaint updates from WebSocket
function handleRealTimeComplaintUpdate(event) {
    const updatedComplaint = event.detail;
    
    console.log('Real-time complaint update received:', updatedComplaint);
    
    if (!updatedComplaint || !updatedComplaint.id) return;
    
    // Check if the complaint is already in our list
    const existingIndex = complaintList.findIndex(c => c.id === updatedComplaint.id);
    
    if (existingIndex >= 0) {
        // Update existing complaint
        complaintList[existingIndex] = updatedComplaint;
    } else {
        // Add new complaint to the beginning (if current sort is by date desc)
        if (currentSort === 'createdAt,desc') {
            complaintList.unshift(updatedComplaint);
            totalElements++;
            
            // Remove last item if we're at page size
            if (complaintList.length > currentPageSize) {
                complaintList.pop();
            }
        }
    }
    
    // Re-render the complaints list
    renderComplaints(complaintList);
    
    // Update pagination info
    updatePagination();
    updateResultsCount();
    
    // Show a notification toast
    if (typeof showToast === 'function') {
        if (existingIndex >= 0) {
            showToast('A complaint has been updated', 'info');
        } else {
            showToast('A new complaint has been added', 'success');
        }
    }
}

// Format category name
function formatCategory(category) {
    if (!category) return 'Unknown';
    
    return category.replace('_', ' ').replace(/\w\S*/g, 
        txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

// Format status name
function formatStatus(status) {
    if (!status) return 'Unknown';
    
    const statusMap = {
        'PENDING': 'Pending',
        'IN_PROGRESS': 'In Progress',
        'RESOLVED': 'Resolved',
        'CLOSED': 'Closed'
    };
    
    return statusMap[status] || status;
}

// Format date string
function formatDate(dateString) {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Truncate text to a specific length
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength) + '...';
}