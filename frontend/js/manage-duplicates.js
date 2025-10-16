/**
 * Manage duplicates functionality for admin users
 */

// Page state
let selectedComplaints = [];
let complaintGroups = {};

// DOM ready
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated and is admin
    if (!isAuthenticated() || !isAdmin()) {
        window.location.href = 'login.html?redirect=manage-duplicates.html';
        return;
    }
    
    // Load duplicate groups
    loadDuplicateGroups();
    
    // Event listeners
    document.getElementById('refreshDuplicates').addEventListener('click', loadDuplicateGroups);
    document.getElementById('filterStatus').addEventListener('change', applyFilters);
    document.getElementById('confirmMerge').addEventListener('click', mergeSelectedComplaints);
});

/**
 * Loads all duplicate complaint groups
 */
async function loadDuplicateGroups() {
    try {
        showLoader('duplicateGroups');
        
        // Get all complaints with duplicates
        const response = await fetch('/api/admin/complaints/duplicates', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load duplicate complaints');
        }
        
        const data = await response.json();
        complaintGroups = data;
        
        renderDuplicateGroups(data);
        hideLoader();
        
        if (Object.keys(data).length === 0) {
            document.getElementById('emptyStateMessage').style.display = 'block';
        } else {
            document.getElementById('emptyStateMessage').style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading duplicate groups:', error);
        hideLoader();
        showError('Failed to load duplicate complaints. Please try again later.');
    }
}

/**
 * Renders all duplicate complaint groups in the UI
 * @param {Object} groups The complaint groups data
 */
function renderDuplicateGroups(groups) {
    const container = document.getElementById('duplicateGroups');
    container.innerHTML = '';
    
    if (!groups || Object.keys(groups).length === 0) {
        return;
    }
    
    // Sort groups by the original complaint's creation date (newest first)
    const sortedGroups = Object.entries(groups).sort((a, b) => {
        const dateA = new Date(a[1].originalComplaint.createdAt);
        const dateB = new Date(b[1].originalComplaint.createdAt);
        return dateB - dateA;
    });
    
    for (const [originalId, group] of sortedGroups) {
        const { originalComplaint, duplicateComplaints } = group;
        
        // Create group container
        const groupEl = document.createElement('div');
        groupEl.className = 'duplicate-group';
        groupEl.dataset.groupId = originalId;
        
        // Create header
        const header = document.createElement('div');
        header.className = 'duplicate-group-header';
        header.innerHTML = `
            <h4>
                ${originalComplaint.title}
                <span class="badge badge-${getStatusBadgeClass(originalComplaint.status)}">${originalComplaint.status}</span>
                <span class="badge badge-info">${duplicateComplaints.length} duplicate(s)</span>
            </h4>
            <p class="text-muted mb-0">
                <i class="fas fa-map-marker-alt mr-1"></i> ${originalComplaint.locationLat.toFixed(6)}, ${originalComplaint.locationLng.toFixed(6)}
                <span class="mx-2">|</span>
                <i class="fas fa-folder mr-1"></i> ${originalComplaint.category}
                <span class="mx-2">|</span>
                <i class="fas fa-clock mr-1"></i> ${formatDate(originalComplaint.createdAt)}
            </p>
        `;
        
        // Create body
        const body = document.createElement('div');
        body.className = 'duplicate-group-body';
        
        // Add original complaint
        const originalItem = document.createElement('div');
        originalItem.className = 'duplicate-item original';
        originalItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h5>
                        <i class="fas fa-star-of-life mr-1"></i>
                        Original: ${originalComplaint.title}
                    </h5>
                    <p class="mb-1">${truncateText(originalComplaint.description, 100)}</p>
                    <small class="text-muted">
                        Reported by: ${originalComplaint.userFullName} (${formatDate(originalComplaint.createdAt)})
                    </small>
                </div>
                <a href="complaint-detail.html?id=${originalComplaint.complaintId}" class="btn btn-sm btn-outline-primary">
                    <i class="fas fa-eye"></i> View
                </a>
            </div>
        `;
        body.appendChild(originalItem);
        
        // Add duplicate complaints
        for (const duplicate of duplicateComplaints) {
            const duplicateItem = document.createElement('div');
            duplicateItem.className = 'duplicate-item';
            duplicateItem.dataset.id = duplicate.complaintId;
            duplicateItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div class="custom-control custom-checkbox">
                        <input type="checkbox" class="custom-control-input duplicate-checkbox" 
                               id="duplicate-${duplicate.complaintId}" 
                               data-id="${duplicate.complaintId}"
                               data-group="${originalId}">
                        <label class="custom-control-label" for="duplicate-${duplicate.complaintId}">
                            <div>
                                <h5>${duplicate.title}</h5>
                                <p class="mb-1">${truncateText(duplicate.description, 100)}</p>
                                <small class="text-muted">
                                    Reported by: ${duplicate.userFullName} (${formatDate(duplicate.createdAt)})
                                </small>
                            </div>
                        </label>
                    </div>
                    <a href="complaint-detail.html?id=${duplicate.complaintId}" class="btn btn-sm btn-outline-primary">
                        <i class="fas fa-eye"></i> View
                    </a>
                </div>
            `;
            body.appendChild(duplicateItem);
        }
        
        // Create controls
        const controls = document.createElement('div');
        controls.className = 'duplicate-controls';
        controls.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <button class="btn btn-sm btn-outline-secondary select-all-btn" data-group="${originalId}">
                        <i class="fas fa-check-square mr-1"></i> Select All
                    </button>
                    <button class="btn btn-sm btn-outline-secondary deselect-all-btn" data-group="${originalId}">
                        <i class="fas fa-square mr-1"></i> Deselect All
                    </button>
                </div>
                <button class="btn btn-warning merge-btn" data-group="${originalId}" disabled>
                    <i class="fas fa-object-group mr-1"></i> Merge Selected
                </button>
            </div>
        `;
        
        // Assemble group
        groupEl.appendChild(header);
        groupEl.appendChild(body);
        groupEl.appendChild(controls);
        
        container.appendChild(groupEl);
    }
    
    // Add event listeners
    addDuplicateEventListeners();
}

/**
 * Adds event listeners to duplicate group elements
 */
function addDuplicateEventListeners() {
    // Checkbox change
    document.querySelectorAll('.duplicate-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const complaintId = this.dataset.id;
            const groupId = this.dataset.group;
            
            if (this.checked) {
                if (!selectedComplaints.includes(complaintId)) {
                    selectedComplaints.push(complaintId);
                }
            } else {
                selectedComplaints = selectedComplaints.filter(id => id !== complaintId);
            }
            
            // Update merge button state
            updateMergeButtonState(groupId);
        });
    });
    
    // Select all button
    document.querySelectorAll('.select-all-btn').forEach(button => {
        button.addEventListener('click', function() {
            const groupId = this.dataset.group;
            const checkboxes = document.querySelectorAll(`.duplicate-checkbox[data-group="${groupId}"]`);
            
            checkboxes.forEach(checkbox => {
                checkbox.checked = true;
                const complaintId = checkbox.dataset.id;
                if (!selectedComplaints.includes(complaintId)) {
                    selectedComplaints.push(complaintId);
                }
            });
            
            updateMergeButtonState(groupId);
        });
    });
    
    // Deselect all button
    document.querySelectorAll('.deselect-all-btn').forEach(button => {
        button.addEventListener('click', function() {
            const groupId = this.dataset.group;
            const checkboxes = document.querySelectorAll(`.duplicate-checkbox[data-group="${groupId}"]`);
            
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
                const complaintId = checkbox.dataset.id;
                selectedComplaints = selectedComplaints.filter(id => id !== complaintId);
            });
            
            updateMergeButtonState(groupId);
        });
    });
    
    // Merge button
    document.querySelectorAll('.merge-btn').forEach(button => {
        button.addEventListener('click', function() {
            const groupId = this.dataset.group;
            const selectedIds = getSelectedComplaintsForGroup(groupId);
            
            if (selectedIds.length > 0) {
                // Set up merge modal
                const originalComplaint = complaintGroups[groupId].originalComplaint;
                document.getElementById('mergeModalLabel').innerText = `Merge Duplicates - ${originalComplaint.title}`;
                document.getElementById('confirmMerge').dataset.groupId = groupId;
                
                // Show modal
                $('#mergeModal').modal('show');
            }
        });
    });
}

/**
 * Updates the state of the merge button based on selection
 * @param {string} groupId The ID of the complaint group
 */
function updateMergeButtonState(groupId) {
    const selectedIds = getSelectedComplaintsForGroup(groupId);
    const mergeBtn = document.querySelector(`.merge-btn[data-group="${groupId}"]`);
    
    if (selectedIds.length > 0) {
        mergeBtn.removeAttribute('disabled');
    } else {
        mergeBtn.setAttribute('disabled', 'disabled');
    }
}

/**
 * Gets the list of selected complaint IDs for a specific group
 * @param {string} groupId The ID of the complaint group
 * @returns {Array} Array of selected complaint IDs
 */
function getSelectedComplaintsForGroup(groupId) {
    const checkboxes = document.querySelectorAll(`.duplicate-checkbox[data-group="${groupId}"]:checked`);
    return Array.from(checkboxes).map(checkbox => checkbox.dataset.id);
}

/**
 * Merges selected complaints into their original
 */
async function mergeSelectedComplaints() {
    try {
        const groupId = document.getElementById('confirmMerge').dataset.groupId;
        const selectedIds = getSelectedComplaintsForGroup(groupId);
        
        if (!groupId || selectedIds.length === 0) {
            $('#mergeModal').modal('hide');
            return;
        }
        
        showLoader();
        
        // Call API to merge complaints
        const response = await fetch(`/api/complaints/${groupId}/merge-duplicates`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(selectedIds)
        });
        
        if (!response.ok) {
            throw new Error('Failed to merge complaints');
        }
        
        // Hide modal
        $('#mergeModal').modal('hide');
        
        // Show success message
        showSuccess(`Successfully merged ${selectedIds.length} duplicate complaints.`);
        
        // Reset selected complaints
        selectedComplaints = selectedComplaints.filter(id => !selectedIds.includes(id));
        
        // Reload duplicate groups
        setTimeout(() => {
            loadDuplicateGroups();
        }, 1500);
        
    } catch (error) {
        console.error('Error merging complaints:', error);
        hideLoader();
        showError('Failed to merge complaints. Please try again later.');
    }
}

/**
 * Apply filters to the duplicate complaints list
 */
function applyFilters() {
    const filterValue = document.getElementById('filterStatus').value;
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    // Clone the original data
    let filteredGroups = { ...complaintGroups };
    
    if (filterValue === 'recent') {
        // Filter to show only groups with original complaints created in the last 7 days
        filteredGroups = Object.entries(complaintGroups)
            .filter(([_, group]) => {
                const createdAt = new Date(group.originalComplaint.createdAt);
                return createdAt >= oneWeekAgo;
            })
            .reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
            }, {});
    } else if (filterValue === 'unresolved') {
        // Filter to show only groups with unresolved original complaints
        filteredGroups = Object.entries(complaintGroups)
            .filter(([_, group]) => {
                return group.originalComplaint.status !== 'RESOLVED';
            })
            .reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
            }, {});
    }
    
    renderDuplicateGroups(filteredGroups);
    
    if (Object.keys(filteredGroups).length === 0) {
        document.getElementById('emptyStateMessage').style.display = 'block';
    } else {
        document.getElementById('emptyStateMessage').style.display = 'none';
    }
}

/**
 * Returns the appropriate badge class for a complaint status
 * @param {string} status The complaint status
 * @returns {string} The badge class
 */
function getStatusBadgeClass(status) {
    switch (status) {
        case 'PENDING':
            return 'secondary';
        case 'IN_PROGRESS':
            return 'primary';
        case 'RESOLVED':
            return 'success';
        case 'REJECTED':
            return 'danger';
        case 'ESCALATED':
            return 'warning';
        default:
            return 'info';
    }
}

/**
 * Truncates text to a specific length with ellipsis
 * @param {string} text The text to truncate
 * @param {number} maxLength Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength) + '...';
}

/**
 * Format a date string for display
 * @param {string} dateString The date string to format
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

/**
 * Shows a loader in a specific container or body
 * @param {string} containerId Optional container ID
 */
function showLoader(containerId) {
    const container = containerId ? document.getElementById(containerId) : document.body;
    
    const loader = document.createElement('div');
    loader.className = 'loader-container';
    loader.innerHTML = '<div class="loader"></div>';
    
    container.appendChild(loader);
}

/**
 * Hides all loaders
 */
function hideLoader() {
    document.querySelectorAll('.loader-container').forEach(loader => {
        loader.remove();
    });
}

/**
 * Checks if the current user is an admin
 * @returns {boolean} True if user is admin
 */
function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'ADMIN';
}