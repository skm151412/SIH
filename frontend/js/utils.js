/**
 * Utility functions for the application
 */

// Initialize navbar functionality
function initNavbar() {
    const navbarToggle = document.getElementById('navbarToggle');
    const navbarMenu = document.getElementById('navbarMenu');
    
    // Toggle mobile menu
    if (navbarToggle && navbarMenu) {
        navbarToggle.addEventListener('click', () => {
            navbarMenu.classList.toggle('active');
            navbarToggle.classList.toggle('active');
        });
    }
    
    // Initialize user menu dropdown
    initUserMenuDropdown();
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (navbarMenu && navbarMenu.classList.contains('active') && 
            !navbarToggle.contains(event.target) && 
            !navbarMenu.contains(event.target)) {
            navbarMenu.classList.remove('active');
            navbarToggle.classList.remove('active');
        }
    });
}

// Initialize user menu dropdown
function initUserMenuDropdown() {
    const userMenuToggle = document.getElementById('userMenuToggle');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    if (userMenuToggle && dropdownMenu) {
        userMenuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            dropdownMenu.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (dropdownMenu && dropdownMenu.classList.contains('show') &&
                !userMenuToggle.contains(event.target) && 
                !dropdownMenu.contains(event.target)) {
                dropdownMenu.classList.remove('show');
            }
        });
    }
}

// Format date to readable string
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

// Format date and time to readable string
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// Get relative time (e.g. "2 days ago", "5 minutes ago")
function getRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const secondsDiff = Math.floor((now - date) / 1000);
    
    if (secondsDiff < 60) {
        return `${secondsDiff} second${secondsDiff !== 1 ? 's' : ''} ago`;
    }
    
    const minutesDiff = Math.floor(secondsDiff / 60);
    if (minutesDiff < 60) {
        return `${minutesDiff} minute${minutesDiff !== 1 ? 's' : ''} ago`;
    }
    
    const hoursDiff = Math.floor(minutesDiff / 60);
    if (hoursDiff < 24) {
        return `${hoursDiff} hour${hoursDiff !== 1 ? 's' : ''} ago`;
    }
    
    const daysDiff = Math.floor(hoursDiff / 24);
    if (daysDiff < 30) {
        return `${daysDiff} day${daysDiff !== 1 ? 's' : ''} ago`;
    }
    
    const monthsDiff = Math.floor(daysDiff / 30);
    if (monthsDiff < 12) {
        return `${monthsDiff} month${monthsDiff !== 1 ? 's' : ''} ago`;
    }
    
    const yearsDiff = Math.floor(monthsDiff / 12);
    return `${yearsDiff} year${yearsDiff !== 1 ? 's' : ''} ago`;
}

// Format status with proper coloring and icon
function formatStatus(status) {
    const statusInfo = STATUS_TYPES.find(s => s.id === status) || {
        name: status,
        color: '#777',
        icon: 'fa-question-circle'
    };
    
    return `
        <span class="status-badge" style="background-color: ${statusInfo.color}">
            <i class="fas ${statusInfo.icon}"></i>
            ${statusInfo.name}
        </span>
    `;
}

// Format category with proper icon
function formatCategory(categoryId) {
    const category = CATEGORIES.find(c => c.id === categoryId) || {
        name: categoryId,
        icon: 'fa-question-circle'
    };
    
    return `
        <span class="category-badge">
            <i class="fas ${category.icon}"></i>
            ${category.name}
        </span>
    `;
}

// Format severity with proper coloring and icon
function formatSeverity(severity) {
    const severityInfo = SEVERITY_TYPES.find(s => s.id === severity) || {
        name: severity,
        color: '#777',
        icon: 'fa-exclamation'
    };
    
    return `
        <span class="severity-badge" style="color: ${severityInfo.color}">
            <i class="fas ${severityInfo.icon}"></i>
            ${severityInfo.name}
        </span>
    `;
}

// Get URL parameters as an object
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    
    for (const [key, value] of params.entries()) {
        result[key] = value;
    }
    
    return result;
}

// Show an alert message
function showAlert(message, type = 'error', duration = 5000) {
    const alertBox = document.getElementById('alertBox');
    if (!alertBox) return;
    
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    
    // Show the alert
    alertBox.classList.remove('hide');
    
    // Hide after duration
    if (duration > 0) {
        setTimeout(() => {
            alertBox.classList.add('hide');
        }, duration);
    }
}

// Hide an alert message
function hideAlert() {
    const alertBox = document.getElementById('alertBox');
    if (alertBox) {
        alertBox.classList.add('hide');
    }
}

// Validate email format
function isValidEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

// Validate password strength
function isStrongPassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(password);
}

// Truncate text to specified length
function truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Get user's current location
function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            position => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            error => {
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    });
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Validate file type
function isValidFileType(file, allowedTypes = UPLOAD_CONFIG.allowedTypes) {
    return allowedTypes.includes(file.type);
}

// Validate file size
function isValidFileSize(file, maxSize = UPLOAD_CONFIG.maxFileSize) {
    return file.size <= maxSize;
}

// Create pagination buttons
function createPagination(currentPage, totalPages, onPageChange) {
    const paginationEl = document.createElement('div');
    paginationEl.className = 'pagination';
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPage <= 1;
    prevBtn.addEventListener('click', () => onPageChange(currentPage - 1));
    paginationEl.appendChild(prevBtn);
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
            if (i !== currentPage) {
                onPageChange(i);
            }
        });
        paginationEl.appendChild(pageBtn);
    }
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.addEventListener('click', () => onPageChange(currentPage + 1));
    paginationEl.appendChild(nextBtn);
    
    return paginationEl;
}

// Create a modal popup
function createModal(title, content, actions) {
    const modalId = 'dynamic-modal-' + Date.now();
    
    // Create modal structure
    const modalEl = document.createElement('div');
    modalEl.className = 'modal';
    modalEl.id = modalId;
    
    modalEl.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">${content}</div>
            <div class="modal-footer"></div>
        </div>
    `;
    
    // Add action buttons
    const modalFooter = modalEl.querySelector('.modal-footer');
    actions.forEach(action => {
        const btn = document.createElement('button');
        btn.className = `btn ${action.class || ''}`;
        btn.textContent = action.text;
        btn.addEventListener('click', () => {
            action.callback();
            if (action.closeModal !== false) {
                closeModal(modalId);
            }
        });
        modalFooter.appendChild(btn);
    });
    
    // Close button functionality
    const closeBtn = modalEl.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => closeModal(modalId));
    
    // Append to body
    document.body.appendChild(modalEl);
    
    // Show modal
    setTimeout(() => {
        modalEl.classList.add('show');
    }, 50);
    
    // Return modal ID for later reference
    return modalId;
}

// Close a modal popup
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.classList.remove('show');
    
    // Remove from DOM after animation
    setTimeout(() => {
        modal.remove();
    }, 300);
}

// Handle responsive navbar toggle
function setupNavbar() {
    const navbarToggle = document.getElementById('navbarToggle');
    const navbarMenu = document.getElementById('navbarMenu');
    
    if (navbarToggle && navbarMenu) {
        navbarToggle.addEventListener('click', () => {
            navbarToggle.classList.toggle('active');
            navbarMenu.classList.toggle('active');
        });
    }

    // User menu dropdown
    const userMenuToggle = document.getElementById('userMenuToggle');
    if (userMenuToggle) {
        userMenuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            userMenuToggle.parentElement.classList.toggle('active');
        });
        
        // Close when clicking outside
        document.addEventListener('click', (e) => {
            const userMenu = document.querySelector('.user-menu');
            if (userMenu && userMenu.classList.contains('active') && !userMenu.contains(e.target)) {
                userMenu.classList.remove('active');
            }
        });
    }
}

// Setup on page load
document.addEventListener('DOMContentLoaded', () => {
    setupNavbar();
});