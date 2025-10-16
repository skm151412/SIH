/**
 * Statistics functionality for visualizing civic issue data
 * Creates and manages charts, maps, and statistics displays
 */

// Global chart objects
let categoryChart, statusChart, trendsChart, mapHeatmap;
let chartsInitialized = false;

// Initialize statistics functionality
function initStatistics() {
    // Load filters
    loadStatisticsFilters();
    
    // Initialize tabs
    initStatisticsTabs();
    
    // Load summary statistics
    loadSummaryStatistics();
}

// Load statistics filters
function loadStatisticsFilters() {
    const filtersContainer = document.getElementById('statisticsFilters');
    if (!filtersContainer) return;
    
    // Create date range selectors
    const startDateInput = document.createElement('input');
    startDateInput.type = 'date';
    startDateInput.id = 'startDate';
    startDateInput.className = 'form-control';
    
    const endDateInput = document.createElement('input');
    endDateInput.type = 'date';
    endDateInput.id = 'endDate';
    endDateInput.className = 'form-control';
    
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    endDateInput.value = formatDateForInput(today);
    startDateInput.value = formatDateForInput(thirtyDaysAgo);
    
    // Create category selector
    const categorySelect = document.createElement('select');
    categorySelect.id = 'categoryFilter';
    categorySelect.className = 'form-control';
    categorySelect.innerHTML = '<option value="">All Categories</option>';
    
    // Create location selector
    const locationSelect = document.createElement('select');
    locationSelect.id = 'locationFilter';
    locationSelect.className = 'form-control';
    locationSelect.innerHTML = '<option value="">All Locations</option>';
    
    // Create apply button
    const applyButton = document.createElement('button');
    applyButton.id = 'applyFilters';
    applyButton.className = 'btn btn-primary';
    applyButton.textContent = 'Apply Filters';
    
    // Add filter elements to container
    filtersContainer.innerHTML = `
        <div class="filters-row">
            <div class="filter-group">
                <label for="startDate">Start Date</label>
                <div id="startDateContainer"></div>
            </div>
            <div class="filter-group">
                <label for="endDate">End Date</label>
                <div id="endDateContainer"></div>
            </div>
            <div class="filter-group">
                <label for="categoryFilter">Category</label>
                <div id="categoryContainer"></div>
            </div>
            <div class="filter-group">
                <label for="locationFilter">Location</label>
                <div id="locationContainer"></div>
            </div>
            <div class="filter-group filter-button-group">
                <div id="buttonContainer"></div>
            </div>
        </div>
    `;
    
    // Append inputs to containers
    document.getElementById('startDateContainer').appendChild(startDateInput);
    document.getElementById('endDateContainer').appendChild(endDateInput);
    document.getElementById('categoryContainer').appendChild(categorySelect);
    document.getElementById('locationContainer').appendChild(locationSelect);
    document.getElementById('buttonContainer').appendChild(applyButton);
    
    // Fetch categories for dropdown
    complaintsApi.getCategories()
        .then(categories => {
            // Add categories to dropdown
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Failed to load categories:', error);
        });
    
    // Fetch locations for dropdown
    statisticsApi.getLocations()
        .then(locations => {
            // Add locations to dropdown
            locations.forEach(location => {
                const option = document.createElement('option');
                option.value = location.id;
                option.textContent = location.name;
                locationSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Failed to load locations:', error);
        });
    
    // Add filter apply event
    applyButton.addEventListener('click', () => {
        // Get current active tab
        const activeTab = document.querySelector('.statistics-tab-link.active');
        if (activeTab) {
            const tabId = activeTab.dataset.tab;
            
            // Reload appropriate tab content
            switch (tabId) {
                case 'summaryTab':
                    loadSummaryStatistics();
                    break;
                case 'categoryTab':
                    loadCategoryStatistics();
                    break;
                case 'statusTab':
                    loadStatusStatistics();
                    break;
                case 'trendsTab':
                    loadTrendsStatistics();
                    break;
                case 'resolutionTab':
                    loadResolutionStatistics();
                    break;
                case 'heatmapTab':
                    loadHeatmapStatistics();
                    break;
            }
        }
    });
}

// Format date for input elements
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Initialize statistics tabs
function initStatisticsTabs() {
    const tabLinks = document.querySelectorAll('.statistics-tab-link');
    const tabContents = document.querySelectorAll('.statistics-tab-content');
    
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get target tab
            const targetId = this.dataset.tab;
            
            // Remove active class from all links and contents
            tabLinks.forEach(el => el.classList.remove('active'));
            tabContents.forEach(el => el.classList.remove('active'));
            
            // Add active class to current link and content
            this.classList.add('active');
            document.getElementById(targetId).classList.add('active');
            
            // Load tab-specific content
            switch (targetId) {
                case 'summaryTab':
                    loadSummaryStatistics();
                    break;
                case 'categoryTab':
                    loadCategoryStatistics();
                    break;
                case 'statusTab':
                    loadStatusStatistics();
                    break;
                case 'trendsTab':
                    loadTrendsStatistics();
                    break;
                case 'resolutionTab':
                    loadResolutionStatistics();
                    break;
                case 'heatmapTab':
                    loadHeatmapStatistics();
                    break;
            }
        });
    });
    
    // Initialize charts
    initCharts();
    
    // Activate the first tab by default
    if (tabLinks.length > 0) {
        tabLinks[0].click();
    }
}

// Initialize all charts
function initCharts() {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js library not loaded');
        return;
    }
    
    // Create charts only if not already initialized
    if (!chartsInitialized) {
        initCategoryChart();
        initStatusChart();
        initTrendsChart();
        
        chartsInitialized = true;
    }
}

// Initialize category chart
function initCategoryChart() {
    const categoryChartCanvas = document.getElementById('categoryChart');
    if (!categoryChartCanvas) return;
    
    categoryChart = new Chart(categoryChartCanvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Complaints',
                data: [],
                backgroundColor: [
                    '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b',
                    '#6f42c1', '#fd7e14', '#20c9a6', '#858796', '#5a5c69'
                ]
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
                },
                legend: {
                    display: false
                }
            }
        }
    });
}

// Initialize status chart
function initStatusChart() {
    const statusChartCanvas = document.getElementById('statusChart');
    if (!statusChartCanvas) return;
    
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

// Initialize trends chart
function initTrendsChart() {
    const trendsChartCanvas = document.getElementById('trendsChart');
    if (!trendsChartCanvas) return;
    
    trendsChart = new Chart(trendsChartCanvas.getContext('2d'), {
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
                    text: 'Complaints Trend Over Time'
                }
            }
        }
    });
}

// Initialize heatmap
function initHeatmap() {
    const heatmapContainer = document.getElementById('heatmapContainer');
    if (!heatmapContainer || typeof L === 'undefined') return;
    
    // Create map if it doesn't exist
    if (!mapHeatmap) {
        // Initialize map
        mapHeatmap = L.map('heatmapContainer').setView([20.5937, 78.9629], 5); // Default center on India
        
        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapHeatmap);
    }
}

// Load summary statistics (simplified to only use existing backend aggregate endpoint)
function loadSummaryStatistics() {
    const summaryContainer = document.getElementById('summaryStats');
    if (!summaryContainer) return;

    summaryContainer.innerHTML = '<div class="loading-spinner centered"></div>';

    // Fetch only implemented summary endpoint
    fetch(API_CONFIG.baseUrl + API_CONFIG.endpoints.statistics.summary, {
        headers: buildAuthHeaders()
    })
        .then(r => {
            if (!r.ok) throw new Error('Failed to load statistics');
            return r.json();
        })
        .then(data => {
            // Clear container
            summaryContainer.innerHTML = '';

            const cards = [
                { title: 'Total Complaints', value: data.totalComplaints || 0, icon: 'fa-list' },
                { title: 'Pending', value: data.pendingComplaints || 0, icon: 'fa-clock', color: 'warning' },
                { title: 'In Progress', value: data.inProgressComplaints || 0, icon: 'fa-spinner', color: 'info' },
                { title: 'Resolved', value: data.resolvedComplaints || 0, icon: 'fa-check-circle', color: 'success' }
            ];

            const grid = document.createElement('div');
            grid.className = 'stats-cards-grid';

            cards.forEach(card => {
                const el = document.createElement('div');
                el.className = 'stats-card';
                el.innerHTML = `
                    <div class="stats-card-icon ${card.color ? 'bg-' + card.color : ''}"><i class="fas ${card.icon}"></i></div>
                    <div class="stats-card-content">
                        <h4>${card.title}</h4>
                        <div class="stats-card-value">${card.value}</div>
                    </div>`;
                grid.appendChild(el);
            });

            // Category breakdown if available
            if (data.complaintsByCategory) {
                const catSection = document.createElement('div');
                catSection.className = 'stats-section';
                catSection.innerHTML = '<h3>Complaints by Category</h3>';
                const list = document.createElement('ul');
                list.className = 'category-mini-list';
                Object.entries(data.complaintsByCategory)
                    .sort((a,b)=> b[1]-a[1])
                    .forEach(([cat, count]) => {
                        const li = document.createElement('li');
                        li.innerHTML = `<span>${cat}</span><span class="count">${count}</span>`;
                        list.appendChild(li);
                    });
                catSection.appendChild(list);
                summaryContainer.appendChild(catSection);
            }

            summaryContainer.prepend(grid);
        })
        .catch(err => {
            console.error(err);
            summaryContainer.innerHTML = `
                <div class="alert alert-danger">
                    Failed to load statistics.
                    <button class="btn btn-sm btn-outline-danger" onclick="loadSummaryStatistics()">Retry</button>
                </div>`;
        });
}

// Helper to add auth header if token present
function buildAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return headers;
}

// Load category statistics
function loadCategoryStatistics() {
    const categoryContainer = document.getElementById('categoryStats');
    if (!categoryContainer) return;
    
    // Show loading state
    categoryContainer.innerHTML = '<div class="loading-spinner centered"></div>';
    
    // Get filter values
    const filters = getStatisticsFilters();
    
    // Fetch category statistics with filters
    statisticsApi.getByCategory(filters)
        .then(stats => {
            // Clear loading spinner
            categoryContainer.innerHTML = '';
            
            if (stats && stats.categories) {
                // Update category chart
                updateCategoryChart(stats.categories);
                
                // Create table container
                const tableContainer = document.createElement('div');
                tableContainer.className = 'stats-table-container';
                
                // Create table
                const table = document.createElement('table');
                table.className = 'stats-table';
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Complaints</th>
                            <th>Percentage</th>
                            <th>Resolved</th>
                            <th>Resolution Rate</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                `;
                
                const tbody = table.querySelector('tbody');
                
                // Add rows for each category
                stats.categories.forEach(category => {
                    const row = document.createElement('tr');
                    const resolutionRate = category.resolved / category.count * 100 || 0;
                    
                    row.innerHTML = `
                        <td>${category.name}</td>
                        <td>${category.count}</td>
                        <td>${(category.count / stats.totalComplaints * 100).toFixed(1)}%</td>
                        <td>${category.resolved}</td>
                        <td>
                            <div class="progress-bar-container">
                                <div class="progress-bar" style="width: ${resolutionRate}%"></div>
                                <span>${resolutionRate.toFixed(1)}%</span>
                            </div>
                        </td>
                    `;
                    
                    tbody.appendChild(row);
                });
                
                // Add table to container
                tableContainer.appendChild(table);
                categoryContainer.appendChild(tableContainer);
                
                // Add subcategory section if available
                if (stats.subcategories && Object.keys(stats.subcategories).length > 0) {
                    const subcategorySection = document.createElement('div');
                    subcategorySection.className = 'stats-section';
                    subcategorySection.innerHTML = '<h3>Subcategory Breakdown</h3>';
                    
                    // Create subcategory details for each category
                    Object.entries(stats.subcategories).forEach(([categoryName, subcats]) => {
                        const categoryDetails = document.createElement('div');
                        categoryDetails.className = 'subcategory-details';
                        categoryDetails.innerHTML = `<h4>${categoryName}</h4>`;
                        
                        // Create subcategory list
                        const subcatsList = document.createElement('ul');
                        subcatsList.className = 'subcategory-list';
                        
                        Object.entries(subcats).forEach(([subcatName, count]) => {
                            const subcatItem = document.createElement('li');
                            subcatItem.innerHTML = `
                                <span class="subcategory-name">${subcatName}</span>
                                <span class="subcategory-count">${count}</span>
                            `;
                            subcatsList.appendChild(subcatItem);
                        });
                        
                        categoryDetails.appendChild(subcatsList);
                        subcategorySection.appendChild(categoryDetails);
                    });
                    
                    categoryContainer.appendChild(subcategorySection);
                }
            } else {
                categoryContainer.innerHTML = '<div class="alert alert-info">No category data available for the selected filters.</div>';
            }
        })
        .catch(error => {
            console.error('Failed to load category statistics:', error);
            categoryContainer.innerHTML = `
                <div class="alert alert-danger">
                    Failed to load category statistics. Please try again.
                    <button class="btn btn-sm btn-outline-danger" onclick="loadCategoryStatistics()">
                        <i class="fas fa-sync-alt"></i> Retry
                    </button>
                </div>
            `;
        });
}

// Update category chart with data
function updateCategoryChart(categories) {
    if (!categoryChart) return;
    
    const labels = [];
    const data = [];
    
    // Sort categories by count
    categories.sort((a, b) => b.count - a.count);
    
    // Extract labels and data
    categories.forEach(category => {
        labels.push(category.name);
        data.push(category.count);
    });
    
    // Update chart
    categoryChart.data.labels = labels;
    categoryChart.data.datasets[0].data = data;
    categoryChart.update();
}

// Load status statistics
function loadStatusStatistics() {
    const statusContainer = document.getElementById('statusStats');
    if (!statusContainer) return;
    
    // Show loading state
    statusContainer.innerHTML = '<div class="loading-spinner centered"></div>';
    
    // Get filter values
    const filters = getStatisticsFilters();
    
    // Fetch status statistics with filters
    statisticsApi.getByStatus(filters)
        .then(stats => {
            // Clear loading spinner
            statusContainer.innerHTML = '';
            
            if (stats && stats.statusCounts) {
                // Update status chart
                updateStatusChart(stats.statusCounts);
                
                // Create status summary
                const statusSummary = document.createElement('div');
                statusSummary.className = 'stats-summary';
                
                // Calculate total
                const totalComplaints = 
                    (stats.statusCounts.PENDING || 0) +
                    (stats.statusCounts.IN_PROGRESS || 0) +
                    (stats.statusCounts.RESOLVED || 0) +
                    (stats.statusCounts.REJECTED || 0);
                
                // Add status tiles
                statusSummary.innerHTML = `
                    <div class="status-tile">
                        <div class="status-icon bg-warning">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="status-details">
                            <h4>Pending</h4>
                            <div class="status-numbers">
                                <span class="status-count">${stats.statusCounts.PENDING || 0}</span>
                                <span class="status-percent">${((stats.statusCounts.PENDING || 0) / totalComplaints * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="status-tile">
                        <div class="status-icon bg-info">
                            <i class="fas fa-tools"></i>
                        </div>
                        <div class="status-details">
                            <h4>In Progress</h4>
                            <div class="status-numbers">
                                <span class="status-count">${stats.statusCounts.IN_PROGRESS || 0}</span>
                                <span class="status-percent">${((stats.statusCounts.IN_PROGRESS || 0) / totalComplaints * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="status-tile">
                        <div class="status-icon bg-success">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="status-details">
                            <h4>Resolved</h4>
                            <div class="status-numbers">
                                <span class="status-count">${stats.statusCounts.RESOLVED || 0}</span>
                                <span class="status-percent">${((stats.statusCounts.RESOLVED || 0) / totalComplaints * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="status-tile">
                        <div class="status-icon bg-danger">
                            <i class="fas fa-times-circle"></i>
                        </div>
                        <div class="status-details">
                            <h4>Rejected</h4>
                            <div class="status-numbers">
                                <span class="status-count">${stats.statusCounts.REJECTED || 0}</span>
                                <span class="status-percent">${((stats.statusCounts.REJECTED || 0) / totalComplaints * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                `;
                
                statusContainer.appendChild(statusSummary);
                
                // Add status by category
                if (stats.statusByCategory) {
                    const statusByCategorySection = document.createElement('div');
                    statusByCategorySection.className = 'stats-section';
                    statusByCategorySection.innerHTML = '<h3>Status by Category</h3>';
                    
                    // Create table
                    const table = document.createElement('table');
                    table.className = 'stats-table';
                    table.innerHTML = `
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Pending</th>
                                <th>In Progress</th>
                                <th>Resolved</th>
                                <th>Rejected</th>
                                <th>Resolution Rate</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    `;
                    
                    const tbody = table.querySelector('tbody');
                    
                    // Add rows for each category
                    Object.entries(stats.statusByCategory).forEach(([category, statuses]) => {
                        const row = document.createElement('tr');
                        const total = 
                            (statuses.PENDING || 0) + 
                            (statuses.IN_PROGRESS || 0) + 
                            (statuses.RESOLVED || 0) + 
                            (statuses.REJECTED || 0);
                            
                        const resolutionRate = (statuses.RESOLVED || 0) / total * 100;
                        
                        row.innerHTML = `
                            <td>${category}</td>
                            <td>${statuses.PENDING || 0}</td>
                            <td>${statuses.IN_PROGRESS || 0}</td>
                            <td>${statuses.RESOLVED || 0}</td>
                            <td>${statuses.REJECTED || 0}</td>
                            <td>
                                <div class="progress-bar-container">
                                    <div class="progress-bar" style="width: ${resolutionRate}%"></div>
                                    <span>${resolutionRate.toFixed(1)}%</span>
                                </div>
                            </td>
                        `;
                        
                        tbody.appendChild(row);
                    });
                    
                    statusByCategorySection.appendChild(table);
                    statusContainer.appendChild(statusByCategorySection);
                }
            } else {
                statusContainer.innerHTML = '<div class="alert alert-info">No status data available for the selected filters.</div>';
            }
        })
        .catch(error => {
            console.error('Failed to load status statistics:', error);
            statusContainer.innerHTML = `
                <div class="alert alert-danger">
                    Failed to load status statistics. Please try again.
                    <button class="btn btn-sm btn-outline-danger" onclick="loadStatusStatistics()">
                        <i class="fas fa-sync-alt"></i> Retry
                    </button>
                </div>
            `;
        });
}

// Update status chart with data
function updateStatusChart(statusCounts) {
    if (!statusChart) return;
    
    statusChart.data.datasets[0].data = [
        statusCounts.PENDING || 0,
        statusCounts.IN_PROGRESS || 0,
        statusCounts.RESOLVED || 0,
        statusCounts.REJECTED || 0
    ];
    
    statusChart.update();
}

// Load trends statistics
function loadTrendsStatistics() {
    const trendsContainer = document.getElementById('trendsStats');
    if (!trendsContainer) return;
    
    // Show loading state
    trendsContainer.innerHTML = '<div class="loading-spinner centered"></div>';
    
    // Get filter values
    const filters = getStatisticsFilters();
    
    // Fetch trends statistics with filters
    statisticsApi.getTrends(filters)
        .then(stats => {
            // Clear loading spinner
            trendsContainer.innerHTML = '';
            
            if (stats && stats.byDate) {
                // Update trends chart
                updateTrendsChart(stats.byDate);
                
                // Add trends analysis
                const trendsAnalysisSection = document.createElement('div');
                trendsAnalysisSection.className = 'stats-section';
                
                // Calculate trend metrics
                const trendMetrics = calculateTrendMetrics(stats.byDate);
                
                trendsAnalysisSection.innerHTML = `
                    <h3>Trend Analysis</h3>
                    <div class="trends-metrics">
                        <div class="trend-metric ${trendMetrics.direction === 'increase' ? 'trend-up' : 'trend-down'}">
                            <div class="trend-icon">
                                <i class="fas fa-${trendMetrics.direction === 'increase' ? 'arrow-up' : 'arrow-down'}"></i>
                            </div>
                            <div class="trend-details">
                                <h4>${trendMetrics.percentChange}% ${trendMetrics.direction}</h4>
                                <p>in complaints over the period</p>
                            </div>
                        </div>
                        
                        <div class="trend-metric">
                            <div class="trend-icon">
                                <i class="fas fa-calendar-day"></i>
                            </div>
                            <div class="trend-details">
                                <h4>${trendMetrics.avgPerDay}</h4>
                                <p>average complaints per day</p>
                            </div>
                        </div>
                        
                        <div class="trend-metric">
                            <div class="trend-icon">
                                <i class="fas fa-chart-line"></i>
                            </div>
                            <div class="trend-details">
                                <h4>${trendMetrics.peak.count}</h4>
                                <p>highest on ${formatDate(trendMetrics.peak.date)}</p>
                            </div>
                        </div>
                    </div>
                `;
                
                trendsContainer.appendChild(trendsAnalysisSection);
                
                // Add weekly distribution
                if (stats.byDayOfWeek) {
                    const weeklySection = document.createElement('div');
                    weeklySection.className = 'stats-section';
                    weeklySection.innerHTML = '<h3>Weekly Distribution</h3>';
                    
                    // Create weekly chart
                    const weeklyChartContainer = document.createElement('div');
                    weeklyChartContainer.className = 'weekly-chart-container';
                    
                    // Find max value for scaling
                    const maxValue = Math.max(...Object.values(stats.byDayOfWeek));
                    
                    // Days of week
                    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    
                    // Create bars for each day
                    daysOfWeek.forEach(day => {
                        const count = stats.byDayOfWeek[day] || 0;
                        const percentage = maxValue > 0 ? (count / maxValue * 100) : 0;
                        
                        const dayBar = document.createElement('div');
                        dayBar.className = 'weekly-bar';
                        dayBar.innerHTML = `
                            <div class="weekly-bar-label">${day.substring(0, 3)}</div>
                            <div class="weekly-bar-container">
                                <div class="weekly-bar-value" style="height: ${percentage}%"></div>
                            </div>
                            <div class="weekly-bar-count">${count}</div>
                        `;
                        
                        weeklyChartContainer.appendChild(dayBar);
                    });
                    
                    weeklySection.appendChild(weeklyChartContainer);
                    trendsContainer.appendChild(weeklySection);
                }
                
                // Add hourly distribution
                if (stats.byHourOfDay) {
                    const hourlySection = document.createElement('div');
                    hourlySection.className = 'stats-section';
                    hourlySection.innerHTML = '<h3>Hourly Distribution</h3>';
                    
                    // Create hourly heatmap
                    const hourlyHeatmap = document.createElement('div');
                    hourlyHeatmap.className = 'hourly-heatmap';
                    
                    // Find max value for scaling
                    const maxHourlyValue = Math.max(...Object.values(stats.byHourOfDay));
                    
                    // Create cells for each hour
                    for (let hour = 0; hour < 24; hour++) {
                        const count = stats.byHourOfDay[hour] || 0;
                        const intensity = maxHourlyValue > 0 ? (count / maxHourlyValue) : 0;
                        
                        const hourCell = document.createElement('div');
                        hourCell.className = 'hourly-cell';
                        hourCell.style.backgroundColor = `rgba(0, 123, 255, ${intensity})`;
                        hourCell.innerHTML = `
                            <div class="hourly-cell-hour">${hour}:00</div>
                            <div class="hourly-cell-count">${count}</div>
                        `;
                        
                        hourlyHeatmap.appendChild(hourCell);
                    }
                    
                    hourlySection.appendChild(hourlyHeatmap);
                    trendsContainer.appendChild(hourlySection);
                }
            } else {
                trendsContainer.innerHTML = '<div class="alert alert-info">No trend data available for the selected filters.</div>';
            }
        })
        .catch(error => {
            console.error('Failed to load trends statistics:', error);
            trendsContainer.innerHTML = `
                <div class="alert alert-danger">
                    Failed to load trends statistics. Please try again.
                    <button class="btn btn-sm btn-outline-danger" onclick="loadTrendsStatistics()">
                        <i class="fas fa-sync-alt"></i> Retry
                    </button>
                </div>
            `;
        });
}

// Calculate trend metrics
// Stubbed legacy functions to avoid runtime errors if referenced
function calculateTrendMetrics() { return { direction: 'increase', percentChange: 0, avgPerDay: 0, peak: { count: 0, date: new Date() } }; }
function loadResolutionStatistics() {
    const el = document.getElementById('resolutionStats');
    if (el) el.innerHTML = '<div class="alert alert-info">Resolution statistics not implemented yet.</div>';
}

// Load heatmap statistics
function loadHeatmapStatistics() {
    const heatmapContainer = document.getElementById('heatmapStats');
    if (!heatmapContainer) return;
    
    // Show loading state
    heatmapContainer.innerHTML = `
        <div id="heatmapContainer" class="heatmap-container"></div>
        <div class="loading-spinner centered"></div>
    `;
    
    // Initialize map
    initHeatmap();
    
    // Get filter values
    const filters = getStatisticsFilters();
    
    // Fetch location statistics with filters
    statisticsApi.getByLocation(filters)
        .then(stats => {
            // Remove loading spinner
            heatmapContainer.querySelector('.loading-spinner').remove();
            
            if (stats && stats.complaints && stats.complaints.length > 0) {
                // Create heatmap layer
                const heatData = stats.complaints.map(complaint => [
                    complaint.latitude,
                    complaint.longitude,
                    1 // Intensity
                ]);
                
                // Check if Leaflet.heat is available
                if (typeof L.heatLayer === 'undefined') {
                    console.error('Leaflet.heat plugin not loaded');
                    
                    // Use markers instead
                    const markers = L.markerClusterGroup();
                    
                    stats.complaints.forEach(complaint => {
                        const marker = L.marker([complaint.latitude, complaint.longitude])
                            .bindPopup(`<b>${complaint.title}</b><br>${complaint.address}`);
                        markers.addLayer(marker);
                    });
                    
                    mapHeatmap.addLayer(markers);
                } else {
                    // Use heatmap
                    const heat = L.heatLayer(heatData, {
                        radius: 25,
                        blur: 15,
                        maxZoom: 17
                    }).addTo(mapHeatmap);
                }
                
                // Add hotspot markers
                if (stats.hotspots && stats.hotspots.length > 0) {
                    stats.hotspots.forEach(hotspot => {
                        const hotspotMarker = L.marker([hotspot.latitude, hotspot.longitude], {
                            icon: L.divIcon({
                                className: 'hotspot-marker',
                                html: `<div class="hotspot-marker-inner">${hotspot.count}</div>`,
                                iconSize: [40, 40]
                            })
                        }).addTo(mapHeatmap);
                        
                        // Add popup with information
                        hotspotMarker.bindPopup(`
                            <div class="hotspot-popup">
                                <h4>Complaint Hotspot</h4>
                                <p><strong>Location:</strong> ${hotspot.address || 'Unknown'}</p>
                                <p><strong>Complaints:</strong> ${hotspot.count}</p>
                                <p><strong>Main Categories:</strong> ${hotspot.categories.join(', ')}</p>
                                <p><strong>Resolution Rate:</strong> ${hotspot.resolutionRate}%</p>
                            </div>
                        `);
                    });
                }
                
                // Add heatmap legend
                const legend = L.control({ position: 'bottomright' });
                legend.onAdd = function() {
                    const div = L.DomUtil.create('div', 'heatmap-legend');
                    div.innerHTML = `
                        <h4>Complaint Density</h4>
                        <div class="legend-gradient"></div>
                        <div class="legend-labels">
                            <span>Low</span>
                            <span>High</span>
                        </div>
                    `;
                    return div;
                };
                legend.addTo(mapHeatmap);
                
                // Add heatmap stats below map
                const heatmapStatsSection = document.createElement('div');
                heatmapStatsSection.className = 'stats-section heatmap-stats-section';
                heatmapStatsSection.innerHTML = `
                    <h3>Location Analysis</h3>
                    <div class="heatmap-metrics">
                        <div class="heatmap-metric">
                            <div class="heatmap-icon">
                                <i class="fas fa-map-marker-alt"></i>
                            </div>
                            <div class="heatmap-details">
                                <h4>${stats.complaints.length}</h4>
                                <p>Total locations</p>
                            </div>
                        </div>
                        
                        <div class="heatmap-metric">
                            <div class="heatmap-icon">
                                <i class="fas fa-fire"></i>
                            </div>
                            <div class="heatmap-details">
                                <h4>${stats.hotspots ? stats.hotspots.length : 0}</h4>
                                <p>Hotspots identified</p>
                            </div>
                        </div>
                        
                        <div class="heatmap-metric">
                            <div class="heatmap-icon">
                                <i class="fas fa-map"></i>
                            </div>
                            <div class="heatmap-details">
                                <h4>${stats.areasCount || 0}</h4>
                                <p>Areas affected</p>
                            </div>
                        </div>
                    </div>
                `;
                
                // Add top locations table if available
                if (stats.topLocations && stats.topLocations.length > 0) {
                    const topLocationsTable = document.createElement('div');
                    topLocationsTable.className = 'top-locations-table';
                    topLocationsTable.innerHTML = `
                        <h4>Top Affected Areas</h4>
                        <table class="stats-table">
                            <thead>
                                <tr>
                                    <th>Area</th>
                                    <th>Complaints</th>
                                    <th>Main Category</th>
                                    <th>Resolution Rate</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    `;
                    
                    const tbody = topLocationsTable.querySelector('tbody');
                    
                    stats.topLocations.forEach(location => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${location.name}</td>
                            <td>${location.count}</td>
                            <td>${location.mainCategory}</td>
                            <td>${location.resolutionRate}%</td>
                        `;
                        tbody.appendChild(row);
                    });
                    
                    heatmapStatsSection.appendChild(topLocationsTable);
                }
                
                heatmapContainer.appendChild(heatmapStatsSection);
            } else {
                // Add a message if no data
                const noDataMessage = document.createElement('div');
                noDataMessage.className = 'alert alert-info';
                noDataMessage.textContent = 'No location data available for the selected filters.';
                heatmapContainer.appendChild(noDataMessage);
            }
        })
        .catch(error => {
            console.error('Failed to load heatmap statistics:', error);
            
            // Remove loading spinner and add error message
            heatmapContainer.querySelector('.loading-spinner')?.remove();
            
            const errorMessage = document.createElement('div');
            errorMessage.className = 'alert alert-danger';
            errorMessage.innerHTML = `
                Failed to load location statistics. Please try again.
                <button class="btn btn-sm btn-outline-danger" onclick="loadHeatmapStatistics()">
                    <i class="fas fa-sync-alt"></i> Retry
                </button>
            `;
            heatmapContainer.appendChild(errorMessage);
        });
}

// Get filter values from form
function getStatisticsFilters() {
    const startDate = document.getElementById('startDate')?.value;
    const endDate = document.getElementById('endDate')?.value;
    const categoryId = document.getElementById('categoryFilter')?.value;
    const locationId = document.getElementById('locationFilter')?.value;
    
    const filters = {};
    
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (categoryId) filters.categoryId = categoryId;
    if (locationId) filters.locationId = locationId;
    
    return filters;
}

// Format duration in milliseconds to human-readable format
function formatDuration(milliseconds) {
    if (!milliseconds) return 'N/A';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
        return `${days} day${days === 1 ? '' : 's'}`;
    } else if (hours > 0) {
        return `${hours} hour${hours === 1 ? '' : 's'}`;
    } else if (minutes > 0) {
        return `${minutes} minute${minutes === 1 ? '' : 's'}`;
    } else {
        return `${seconds} second${seconds === 1 ? '' : 's'}`;
    }
}

// Initialize statistics on page load
document.addEventListener('DOMContentLoaded', initStatistics);