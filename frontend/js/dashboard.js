/**
 * Dashboard functionality for user dashboard
 * Manages user dashboard data display, charts, and user activity tracking
 */

// Global chart objects for reuse
let statusChart, categoryChart, timelineChart;

// Initialize the dashboard functionality
function initDashboard() {
    // Check if user is authenticated
    if (!requireAuth()) return;
    
    // Initialize notifications
    if (typeof notificationService !== 'undefined') {
        notificationService.init();
    }
    
    // Load user dashboard data
    loadDashboardData();
    
    // Initialize dashboard components
    initDashboardTabs();
    initRecentComplaints();
    initDashboardCharts();
    
    // Initialize profile settings
    initProfileSettings();
    
    // Initialize export component for admins
    initExportComponent();
    
    // Setup refresh functionality
    setupDashboardRefresh();
    
    // Initialize WebSocket for real-time updates
    if (typeof webSocketService !== 'undefined') {
        webSocketService.init();
        
        // Listen for real-time complaint updates
        document.addEventListener('complaint-update', handleRealTimeComplaintUpdate);
        
        // Listen for real-time statistics updates
        document.addEventListener('statistics-update', handleRealTimeStatisticsUpdate);
        
        // Listen for real-time notification updates
        document.addEventListener('new-notification', handleRealTimeNotification);
    }
}

// Load dashboard data
function loadDashboardData() {
    const dashboardStatsContainer = document.getElementById('dashboardStats');
    if (!dashboardStatsContainer) return;
    
    // Show loading state
    dashboardStatsContainer.innerHTML = '<div class="loading-spinner centered"></div>';
    
    // Fetch user-specific dashboard stats
    complaintsApi.getUserDashboardStats()
        .then(stats => {
            // Update statistics cards
            updateStatisticsCards(stats);
            
            // Load charts with data
            updateDashboardCharts(stats);
        })
        .catch(error => {
            console.error('Failed to load dashboard data:', error);
            dashboardStatsContainer.innerHTML = `
                <div class="alert alert-danger">
                    Failed to load dashboard data. Please try again.
                    <button class="btn btn-sm btn-outline-danger" onclick="loadDashboardData()">
                        <i class="fas fa-sync-alt"></i> Retry
                    </button>
                </div>
            `;
        });
}

// Update statistics cards with data
function updateStatisticsCards(stats) {
    const dashboardStatsContainer = document.getElementById('dashboardStats');
    if (!dashboardStatsContainer) return;
    
    // Clear loading spinner
    dashboardStatsContainer.innerHTML = '';
    
    // Create stats cards
    const statsData = [
        {
            title: 'Total Complaints',
            value: stats.totalComplaints || 0,
            icon: 'fa-file-alt',
            color: 'primary'
        },
        {
            title: 'Pending',
            value: stats.pendingComplaints || 0,
            icon: 'fa-clock',
            color: 'warning'
        },
        {
            title: 'In Progress',
            value: stats.inProgressComplaints || 0,
            icon: 'fa-tools',
            color: 'info'
        },
        {
            title: 'Resolved',
            value: stats.resolvedComplaints || 0,
            icon: 'fa-check-circle',
            color: 'success'
        },
        {
            title: 'Upvotes Received',
            value: stats.totalUpvotes || 0,
            icon: 'fa-thumbs-up',
            color: 'primary'
        },
        {
            title: 'Comments',
            value: stats.totalComments || 0,
            icon: 'fa-comments',
            color: 'info'
        }
    ];
    
    // Create and append each stat card
    statsData.forEach(stat => {
        const card = document.createElement('div');
        card.className = 'stat-card';
        card.innerHTML = `
            <div class="stat-card-content">
                <div class="stat-card-info">
                    <h4>${stat.title}</h4>
                    <h2>${stat.value}</h2>
                </div>
                <div class="stat-card-icon bg-${stat.color}">
                    <i class="fas ${stat.icon}"></i>
                </div>
            </div>
        `;
        dashboardStatsContainer.appendChild(card);
    });
}

// Initialize dashboard tabs
function initDashboardTabs() {
    const tabLinks = document.querySelectorAll('.dashboard-tab-link');
    const tabContents = document.querySelectorAll('.dashboard-tab-content');
    
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get target tab
            const targetId = this.getAttribute('data-tab');
            
            // Remove active class from all links and contents
            tabLinks.forEach(el => el.classList.remove('active'));
            tabContents.forEach(el => el.classList.remove('active'));
            
            // Add active class to current link and content
            this.classList.add('active');
            document.getElementById(targetId).classList.add('active');
            
            // Load tab-specific content if needed
            if (targetId === 'myComplaints') {
                loadUserComplaints();
            } else if (targetId === 'activity') {
                loadUserActivity();
            } else if (targetId === 'settings') {
                loadUserSettings();
            }
        });
    });
    
    // Activate the first tab by default
    if (tabLinks.length > 0) {
        tabLinks[0].click();
    }
}

// Initialize recent complaints section
function initRecentComplaints() {
    const recentComplaintsContainer = document.getElementById('recentComplaints');
    if (!recentComplaintsContainer) return;
    
    // Show loading state
    recentComplaintsContainer.innerHTML = '<div class="loading-spinner centered"></div>';
    
    // Fetch recent complaints
    complaintsApi.getComplaints({ userId: 'current', limit: 5, sort: 'createdAt,desc' })
        .then(response => {
            if (response.content && response.content.length > 0) {
                // Clear loading spinner
                recentComplaintsContainer.innerHTML = '';
                
                // Create and append complaints
                response.content.forEach(complaint => {
                    const card = document.createElement('div');
                    card.className = 'complaint-card';
                    card.innerHTML = `
                        <div class="complaint-header">
                            <h4><a href="complaint-detail.html?id=${complaint.id}">${complaint.title}</a></h4>
                            <span class="badge bg-${getStatusColor(complaint.status)}">${formatStatus(complaint.status)}</span>
                        </div>
                        <div class="complaint-meta">
                            <span><i class="fas fa-calendar"></i> ${formatDate(complaint.createdAt)}</span>
                            <span><i class="fas fa-tag"></i> ${complaint.category.name}</span>
                            <span><i class="fas fa-map-marker-alt"></i> ${truncateText(complaint.address, 30)}</span>
                        </div>
                        <div class="complaint-actions">
                            <a href="complaint-detail.html?id=${complaint.id}" class="btn btn-sm btn-outline-primary">
                                <i class="fas fa-eye"></i> View
                            </a>
                            <span class="upvotes"><i class="fas fa-thumbs-up"></i> ${complaint.upvotesCount || 0}</span>
                            <span class="comments"><i class="fas fa-comments"></i> ${complaint.commentsCount || 0}</span>
                        </div>
                    `;
                    recentComplaintsContainer.appendChild(card);
                });
            } else {
                // No complaints
                recentComplaintsContainer.innerHTML = `
                    <div class="alert alert-info">
                        You haven't submitted any complaints yet.
                        <a href="submit-complaint.html" class="btn btn-sm btn-outline-primary ml-2">
                            <i class="fas fa-plus"></i> Submit New Complaint
                        </a>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Failed to load recent complaints:', error);
            recentComplaintsContainer.innerHTML = `
                <div class="alert alert-danger">
                    Failed to load your complaints. Please try again.
                    <button class="btn btn-sm btn-outline-danger" onclick="initRecentComplaints()">
                        <i class="fas fa-sync-alt"></i> Retry
                    </button>
                </div>
            `;
        });
}

// Load user complaints for My Complaints tab
function loadUserComplaints() {
    const complaintsContainer = document.getElementById('userComplaintsList');
    if (!complaintsContainer) return;
    
    // Show loading state
    complaintsContainer.innerHTML = '<div class="loading-spinner centered"></div>';
    
    // Get filter values
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    const sortFilter = document.getElementById('sortFilter')?.value || 'createdAt,desc';
    
    // Fetch user complaints with filters
    complaintsApi.getComplaints({
        userId: 'current',
        status: statusFilter,
        categoryId: categoryFilter,
        sort: sortFilter,
        page: 0,
        size: 10
    })
        .then(response => {
            if (response.content && response.content.length > 0) {
                // Clear loading spinner
                complaintsContainer.innerHTML = '';
                
                // Create table for complaints
                const table = document.createElement('table');
                table.className = 'table complaint-table';
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Upvotes</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                `;
                
                const tbody = table.querySelector('tbody');
                
                // Create and append complaint rows
                response.content.forEach(complaint => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>
                            <a href="complaint-detail.html?id=${complaint.id}" class="complaint-title">
                                ${complaint.title}
                            </a>
                        </td>
                        <td>${complaint.category.name}</td>
                        <td>
                            <span class="badge bg-${getStatusColor(complaint.status)}">
                                ${formatStatus(complaint.status)}
                            </span>
                        </td>
                        <td>${formatDate(complaint.createdAt)}</td>
                        <td>${complaint.upvotesCount || 0}</td>
                        <td>
                            <a href="complaint-detail.html?id=${complaint.id}" class="btn btn-sm btn-outline-primary">
                                <i class="fas fa-eye"></i>
                            </a>
                            ${complaint.status === 'PENDING' ? `
                                <button class="btn btn-sm btn-outline-warning edit-complaint" data-id="${complaint.id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger delete-complaint" data-id="${complaint.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </td>
                    `;
                    tbody.appendChild(row);
                });
                
                // Add table to container
                complaintsContainer.appendChild(table);
                
                // Add pagination if needed
                if (response.totalPages > 1) {
                    const pagination = createPagination(response.number, response.totalPages, loadUserComplaintsPage);
                    complaintsContainer.appendChild(pagination);
                }
                
                // Add event listeners for edit/delete buttons
                addComplaintActionListeners();
            } else {
                // No complaints
                complaintsContainer.innerHTML = `
                    <div class="alert alert-info">
                        You haven't submitted any complaints that match the filters.
                        <a href="submit-complaint.html" class="btn btn-sm btn-outline-primary ml-2">
                            <i class="fas fa-plus"></i> Submit New Complaint
                        </a>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Failed to load user complaints:', error);
            complaintsContainer.innerHTML = `
                <div class="alert alert-danger">
                    Failed to load your complaints. Please try again.
                    <button class="btn btn-sm btn-outline-danger" onclick="loadUserComplaints()">
                        <i class="fas fa-sync-alt"></i> Retry
                    </button>
                </div>
            `;
        });
}

// Load paginated user complaints
function loadUserComplaintsPage(page) {
    const complaintsContainer = document.getElementById('userComplaintsList');
    if (!complaintsContainer) return;
    
    // Show loading state
    complaintsContainer.innerHTML = '<div class="loading-spinner centered"></div>';
    
    // Get filter values
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    const sortFilter = document.getElementById('sortFilter')?.value || 'createdAt,desc';
    
    // Fetch user complaints with filters and pagination
    complaintsApi.getComplaints({
        userId: 'current',
        status: statusFilter,
        categoryId: categoryFilter,
        sort: sortFilter,
        page: page,
        size: 10
    })
        .then(response => {
            // Update the container with new page data
            if (response.content && response.content.length > 0) {
                // Clear loading spinner
                complaintsContainer.innerHTML = '';
                
                // Same table creation as loadUserComplaints function...
                // (This is identical to the table creation in loadUserComplaints)
                
                // Create table for complaints
                const table = document.createElement('table');
                table.className = 'table complaint-table';
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Upvotes</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                `;
                
                const tbody = table.querySelector('tbody');
                
                // Create and append complaint rows
                response.content.forEach(complaint => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>
                            <a href="complaint-detail.html?id=${complaint.id}" class="complaint-title">
                                ${complaint.title}
                            </a>
                        </td>
                        <td>${complaint.category.name}</td>
                        <td>
                            <span class="badge bg-${getStatusColor(complaint.status)}">
                                ${formatStatus(complaint.status)}
                            </span>
                        </td>
                        <td>${formatDate(complaint.createdAt)}</td>
                        <td>${complaint.upvotesCount || 0}</td>
                        <td>
                            <a href="complaint-detail.html?id=${complaint.id}" class="btn btn-sm btn-outline-primary">
                                <i class="fas fa-eye"></i>
                            </a>
                            ${complaint.status === 'PENDING' ? `
                                <button class="btn btn-sm btn-outline-warning edit-complaint" data-id="${complaint.id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger delete-complaint" data-id="${complaint.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </td>
                    `;
                    tbody.appendChild(row);
                });
                
                // Add table to container
                complaintsContainer.appendChild(table);
                
                // Add pagination
                const pagination = createPagination(response.number, response.totalPages, loadUserComplaintsPage);
                complaintsContainer.appendChild(pagination);
                
                // Add event listeners for edit/delete buttons
                addComplaintActionListeners();
            } else {
                // No complaints
                complaintsContainer.innerHTML = `
                    <div class="alert alert-info">
                        You haven't submitted any complaints that match the filters.
                        <a href="submit-complaint.html" class="btn btn-sm btn-outline-primary ml-2">
                            <i class="fas fa-plus"></i> Submit New Complaint
                        </a>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Failed to load user complaints:', error);
            complaintsContainer.innerHTML = `
                <div class="alert alert-danger">
                    Failed to load your complaints. Please try again.
                    <button class="btn btn-sm btn-outline-danger" onclick="loadUserComplaints()">
                        <i class="fas fa-sync-alt"></i> Retry
                    </button>
                </div>
            `;
        });
}

// Add event listeners for complaint action buttons
function addComplaintActionListeners() {
    // Add listeners for edit buttons
    document.querySelectorAll('.edit-complaint').forEach(button => {
        button.addEventListener('click', function() {
            const complaintId = this.dataset.id;
            window.location.href = `edit-complaint.html?id=${complaintId}`;
        });
    });
    
    // Add listeners for delete buttons
    document.querySelectorAll('.delete-complaint').forEach(button => {
        button.addEventListener('click', function() {
            const complaintId = this.dataset.id;
            
            // Show confirmation dialog
            if (confirm('Are you sure you want to delete this complaint?')) {
                deleteComplaint(complaintId);
            }
        });
    });
}

// Delete a complaint
function deleteComplaint(id) {
    complaintsApi.deleteComplaint(id)
        .then(() => {
            showToast('Complaint deleted successfully.', 'success');
            // Reload complaints list
            loadUserComplaints();
        })
        .catch(error => {
            console.error('Failed to delete complaint:', error);
            showToast(error.message || 'Failed to delete complaint.', 'error');
        });
}

// Load user activity
function loadUserActivity() {
    const activityContainer = document.getElementById('userActivityList');
    if (!activityContainer) return;
    
    // Show loading state
    activityContainer.innerHTML = '<div class="loading-spinner centered"></div>';
    
    // Fetch user activity
    userApi.getUserActivity()
        .then(activities => {
            if (activities && activities.length > 0) {
                // Clear loading spinner
                activityContainer.innerHTML = '';
                
                // Create timeline for activities
                const timeline = document.createElement('div');
                timeline.className = 'activity-timeline';
                
                // Create and append activity items
                activities.forEach(activity => {
                    const activityItem = document.createElement('div');
                    activityItem.className = 'activity-item';
                    activityItem.innerHTML = `
                        <div class="activity-icon ${getActivityIconClass(activity.type)}">
                            <i class="${getActivityIcon(activity.type)}"></i>
                        </div>
                        <div class="activity-content">
                            <div class="activity-time">
                                ${formatDate(activity.timestamp)} at ${formatTime(activity.timestamp)}
                            </div>
                            <div class="activity-description">
                                ${formatActivityDescription(activity)}
                            </div>
                        </div>
                    `;
                    timeline.appendChild(activityItem);
                });
                
                activityContainer.appendChild(timeline);
            } else {
                // No activity
                activityContainer.innerHTML = `
                    <div class="alert alert-info">
                        No activity found for your account.
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Failed to load user activity:', error);
            activityContainer.innerHTML = `
                <div class="alert alert-danger">
                    Failed to load your activity history. Please try again.
                    <button class="btn btn-sm btn-outline-danger" onclick="loadUserActivity()">
                        <i class="fas fa-sync-alt"></i> Retry
                    </button>
                </div>
            `;
        });
}

// Get activity icon based on activity type
function getActivityIcon(type) {
    switch (type) {
        case 'COMPLAINT_CREATED':
            return 'fas fa-file-alt';
        case 'COMPLAINT_UPDATED':
            return 'fas fa-edit';
        case 'COMPLAINT_DELETED':
            return 'fas fa-trash';
        case 'COMMENT_ADDED':
            return 'fas fa-comment';
        case 'UPVOTE_ADDED':
            return 'fas fa-thumbs-up';
        case 'UPVOTE_REMOVED':
            return 'fas fa-thumbs-down';
        case 'PROFILE_UPDATED':
            return 'fas fa-user-edit';
        case 'PASSWORD_CHANGED':
            return 'fas fa-key';
        case 'LOGIN':
            return 'fas fa-sign-in-alt';
        default:
            return 'fas fa-info-circle';
    }
}

// Get activity icon class based on activity type
function getActivityIconClass(type) {
    switch (type) {
        case 'COMPLAINT_CREATED':
            return 'bg-primary';
        case 'COMPLAINT_UPDATED':
            return 'bg-warning';
        case 'COMPLAINT_DELETED':
            return 'bg-danger';
        case 'COMMENT_ADDED':
            return 'bg-info';
        case 'UPVOTE_ADDED':
            return 'bg-success';
        case 'UPVOTE_REMOVED':
            return 'bg-secondary';
        case 'PROFILE_UPDATED':
            return 'bg-info';
        case 'PASSWORD_CHANGED':
            return 'bg-warning';
        case 'LOGIN':
            return 'bg-primary';
        default:
            return 'bg-secondary';
    }
}

// Format activity description
function formatActivityDescription(activity) {
    let description = '';
    
    switch (activity.type) {
        case 'COMPLAINT_CREATED':
            description = `You submitted a new complaint: <a href="complaint-detail.html?id=${activity.entityId}">${activity.details.title || 'Complaint'}</a>`;
            break;
        case 'COMPLAINT_UPDATED':
            description = `You updated your complaint: <a href="complaint-detail.html?id=${activity.entityId}">${activity.details.title || 'Complaint'}</a>`;
            break;
        case 'COMPLAINT_DELETED':
            description = `You deleted a complaint: ${activity.details.title || 'Complaint'}`;
            break;
        case 'COMMENT_ADDED':
            description = `You commented on <a href="complaint-detail.html?id=${activity.entityId}#comment-${activity.details.commentId}">a complaint</a>`;
            break;
        case 'UPVOTE_ADDED':
            description = `You upvoted a <a href="complaint-detail.html?id=${activity.entityId}">complaint</a>`;
            break;
        case 'UPVOTE_REMOVED':
            description = `You removed your upvote from a <a href="complaint-detail.html?id=${activity.entityId}">complaint</a>`;
            break;
        case 'PROFILE_UPDATED':
            description = 'You updated your profile information';
            break;
        case 'PASSWORD_CHANGED':
            description = 'You changed your password';
            break;
        case 'LOGIN':
            description = `You logged in from ${activity.details.ipAddress || 'unknown location'}`;
            break;
        default:
            description = 'You performed an action';
    }
    
    return description;
}

// Initialize dashboard charts
function initDashboardCharts() {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js library not loaded');
        return;
    }
    
    // Get chart canvases
    const statusChartCanvas = document.getElementById('statusChart');
    const categoryChartCanvas = document.getElementById('categoryChart');
    const timelineChartCanvas = document.getElementById('timelineChart');
    
    // Initialize charts if canvases exist
    if (statusChartCanvas) {
        statusChart = new Chart(statusChartCanvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: ['#ffc107', '#17a2b8', '#28a745', '#dc3545']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: 'Complaints by Status'
                    }
                }
            }
        });
    }
    
    if (categoryChartCanvas) {
        categoryChart = new Chart(categoryChartCanvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Complaints',
                    data: [],
                    backgroundColor: '#6f42c1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Complaints'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Category'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Complaints by Category'
                    }
                }
            }
        });
    }
    
    if (timelineChartCanvas) {
        timelineChart = new Chart(timelineChartCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Complaints',
                    data: [],
                    fill: false,
                    borderColor: '#007bff',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Complaints'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Complaints Over Time'
                    }
                }
            }
        });
    }
}

// Update dashboard charts with data
function updateDashboardCharts(stats) {
    // Update status chart
    if (statusChart) {
        statusChart.data.datasets[0].data = [
            stats.pendingComplaints || 0,
            stats.inProgressComplaints || 0,
            stats.resolvedComplaints || 0,
            stats.rejectedComplaints || 0
        ];
        statusChart.update();
    }
    
    // Update category chart
    if (categoryChart && stats.byCategory) {
        const categories = [];
        const counts = [];
        
        // Sort by count
        const sortedCategories = Object.entries(stats.byCategory)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5); // Top 5 categories
        
        sortedCategories.forEach(([category, count]) => {
            categories.push(category);
            counts.push(count);
        });
        
        categoryChart.data.labels = categories;
        categoryChart.data.datasets[0].data = counts;
        categoryChart.update();
    }
    
    // Update timeline chart
    if (timelineChart && stats.byTime) {
        const dates = [];
        const counts = [];
        
        // Sort by date
        const sortedDates = Object.entries(stats.byTime)
            .sort((a, b) => new Date(a[0]) - new Date(b[0]));
        
        sortedDates.forEach(([date, count]) => {
            dates.push(formatDate(date));
            counts.push(count);
        });
        
        timelineChart.data.labels = dates;
        timelineChart.data.datasets[0].data = counts;
        timelineChart.update();
    }
}

// Initialize profile settings
function initProfileSettings() {
    const profileForm = document.getElementById('profileForm');
    const passwordForm = document.getElementById('passwordForm');
    
    // Load user profile data
    loadUserProfile();
    
    // Add form submission listeners
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordChange);
    }
}

// Load user profile
function loadUserProfile() {
    const profileForm = document.getElementById('profileForm');
    if (!profileForm) return;
    
    // Show loading state
    toggleLoadingState(profileForm, true);
    
    // Get current user data
    userApi.getProfile()
        .then(user => {
            // Fill form with user data
            document.getElementById('firstName').value = user.firstName || '';
            document.getElementById('lastName').value = user.lastName || '';
            document.getElementById('email').value = user.email || '';
            document.getElementById('phoneNumber').value = user.phoneNumber || '';
            
            // Address fields
            if (user.address) {
                document.getElementById('street').value = user.address.street || '';
                document.getElementById('city').value = user.address.city || '';
                document.getElementById('state').value = user.address.state || '';
                document.getElementById('pincode').value = user.address.pincode || '';
            }
            
            // Hide loading state
            toggleLoadingState(profileForm, false);
        })
        .catch(error => {
            console.error('Failed to load user profile:', error);
            showToast(error.message || 'Failed to load user profile.', 'error');
            
            // Hide loading state
            toggleLoadingState(profileForm, false);
        });
}

// Handle profile update form submission
function handleProfileUpdate(event) {
    event.preventDefault();
    
    // Show loading state
    toggleLoadingState(event.target, true);
    
    // Get form data
    const formData = new FormData(event.target);
    
    // Create user data object
    const userData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        phoneNumber: formData.get('phoneNumber'),
        address: {
            street: formData.get('street'),
            city: formData.get('city'),
            state: formData.get('state'),
            pincode: formData.get('pincode')
        }
    };
    
    // Update profile
    userApi.updateProfile(userData)
        .then(() => {
            showToast('Profile updated successfully.', 'success');
            
            // Update current user data
            const currentUser = authApi.getCurrentUser();
            if (currentUser) {
                currentUser.firstName = userData.firstName;
                currentUser.lastName = userData.lastName;
                authApi.setCurrentUser(currentUser);
                
                // Update UI with new user info
                updateAuthUI();
            }
            
            // Hide loading state
            toggleLoadingState(event.target, false);
        })
        .catch(error => {
            console.error('Failed to update profile:', error);
            showToast(error.message || 'Failed to update profile.', 'error');
            
            // Hide loading state
            toggleLoadingState(event.target, false);
        });
}

// Handle password change form submission
function handlePasswordChange(event) {
    event.preventDefault();
    
    // Show loading state
    toggleLoadingState(event.target, true);
    
    // Get form data
    const formData = new FormData(event.target);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
        showToast('New passwords do not match.', 'error');
        toggleLoadingState(event.target, false);
        return;
    }
    
    // Change password
    userApi.changePassword(currentPassword, newPassword)
        .then(() => {
            showToast('Password changed successfully.', 'success');
            
            // Clear form
            event.target.reset();
            
            // Hide loading state
            toggleLoadingState(event.target, false);
        })
        .catch(error => {
            console.error('Failed to change password:', error);
            showToast(error.message || 'Failed to change password.', 'error');
            
            // Hide loading state
            toggleLoadingState(event.target, false);
        });
}

// Setup dashboard refresh functionality
function setupDashboardRefresh() {
    const refreshButton = document.getElementById('refreshDashboard');
    
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            // Show loading spinner
            this.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i>';
            this.disabled = true;
            
            // Reload dashboard data
            loadDashboardData();
            initRecentComplaints();
            
            // Reset button after timeout
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-sync-alt"></i>';
                this.disabled = false;
                
                showToast('Dashboard refreshed', 'info');
            }, 1000);
        });
    }
}

// Create pagination element
function createPagination(currentPage, totalPages, clickHandler) {
    const pagination = document.createElement('div');
    pagination.className = 'pagination';
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.className = 'pagination-button';
    prevButton.innerHTML = '&laquo; Previous';
    prevButton.disabled = currentPage === 0;
    prevButton.addEventListener('click', () => clickHandler(currentPage - 1));
    pagination.appendChild(prevButton);
    
    // Page numbers
    const startPage = Math.max(0, currentPage - 2);
    const endPage = Math.min(totalPages - 1, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = `pagination-button ${i === currentPage ? 'active' : ''}`;
        pageButton.textContent = i + 1;
        pageButton.addEventListener('click', () => clickHandler(i));
        pagination.appendChild(pageButton);
    }
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.className = 'pagination-button';
    nextButton.innerHTML = 'Next &raquo;';
    nextButton.disabled = currentPage === totalPages - 1;
    nextButton.addEventListener('click', () => clickHandler(currentPage + 1));
    pagination.appendChild(nextButton);
    
    return pagination;
}

// Initialize export component for admin users
function initExportComponent() {
    // Check if user is admin
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user || user.role !== 'ADMIN') {
        return;
    }
    
    // Get container element
    const container = document.getElementById('exportComponentContainer');
    if (!container) return;
    
    // Create export component
    const exportComponent = new ExportComponent();
    container.appendChild(exportComponent.getElement());
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initDashboard);