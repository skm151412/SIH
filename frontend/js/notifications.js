/**
 * Notification services and utilities
 */

// Global state for notifications
const notificationState = {
    notifications: [],
    unreadCount: 0,
    eventSource: null,
    isConnected: false
};

// DOM Elements - will be initialized on page load
let notificationBell, notificationDropdown, notificationList, markAllReadBtn;

// Initialize notification functionality
function initNotifications() {
    // Get DOM elements
    notificationBell = document.getElementById('notificationBell');
    notificationDropdown = document.getElementById('notificationDropdown');
    notificationList = document.getElementById('notificationList');
    markAllReadBtn = document.getElementById('markAllReadBtn');
    
    if (!notificationBell) return;
    
    // Set up event listeners
    notificationBell.addEventListener('click', toggleNotificationDropdown);
    
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', markAllAsRead);
    }
    
    // Check authentication status
    if (authApi.isAuthenticated()) {
        // Load notifications
        fetchNotifications();
        fetchUnreadCount();
        
        // Connect to SSE for real-time updates
        connectToSSE();
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (notificationDropdown && notificationDropdown.classList.contains('show') &&
            !notificationBell.contains(event.target) && 
            !notificationDropdown.contains(event.target)) {
            notificationDropdown.classList.remove('show');
        }
    });
    
    // Update notification UI
    updateNotificationUI();
}

// Toggle notification dropdown
function toggleNotificationDropdown(event) {
    event.preventDefault();
    event.stopPropagation();
    
    if (notificationDropdown) {
        notificationDropdown.classList.toggle('show');
    }
}

// Fetch all notifications
async function fetchNotifications() {
    if (!authApi.isAuthenticated()) return;
    
    try {
        const response = await apiService.get('/api/notifications?page=0&size=10');
        notificationState.notifications = response.data.content;
        updateNotificationList();
    } catch (error) {
        console.error('Error fetching notifications:', error);
    }
}

// Fetch unread notification count
async function fetchUnreadCount() {
    if (!authApi.isAuthenticated()) return;
    
    try {
        const response = await apiService.get('/api/notifications/unread/count');
        notificationState.unreadCount = response.data;
        updateNotificationBadge();
    } catch (error) {
        console.error('Error fetching unread count:', error);
    }
}

// Mark notification as read
async function markAsRead(notificationId) {
    try {
        await apiService.put(`/api/notifications/${notificationId}/read`);
        
        // Update local state
        notificationState.notifications = notificationState.notifications.map(notification => {
            if (notification.id === notificationId) {
                return { ...notification, isRead: true };
            }
            return notification;
        });
        
        // Update unread count
        notificationState.unreadCount = Math.max(0, notificationState.unreadCount - 1);
        
        // Update UI
        updateNotificationBadge();
        updateNotificationList();
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

// Mark all notifications as read
async function markAllAsRead() {
    try {
        await apiService.put('/api/notifications/read-all');
        
        // Update local state
        notificationState.notifications = notificationState.notifications.map(notification => {
            return { ...notification, isRead: true };
        });
        
        // Update unread count
        notificationState.unreadCount = 0;
        
        // Update UI
        updateNotificationBadge();
        updateNotificationList();
        
        // Hide dropdown
        if (notificationDropdown) {
            notificationDropdown.classList.remove('show');
        }
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
    }
}

// Connect to SSE for real-time notifications
function connectToSSE() {
    if (!authApi.isAuthenticated() || notificationState.isConnected) return;
    
    // Close any existing connection
    if (notificationState.eventSource) {
        notificationState.eventSource.close();
    }
    
    const baseUrl = apiService.getBaseUrl();
    const newEventSource = new EventSource(`${baseUrl}/api/notifications/stream`);
    
    newEventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        // Add new notification to the top of the list
        notificationState.notifications.unshift(data);
        
        // Increment unread count
        notificationState.unreadCount++;
        
        // Update UI
        updateNotificationBadge();
        updateNotificationList();
        
        // Show notification toast
        showNotificationToast(data);
    };
    
    newEventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        notificationState.eventSource.close();
        notificationState.isConnected = false;
        
        // Try to reconnect after a delay
        setTimeout(connectToSSE, 5000);
    };
    
    notificationState.eventSource = newEventSource;
    notificationState.isConnected = true;
}

// Update notification badge with unread count
function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;
    
    if (notificationState.unreadCount > 0) {
        badge.textContent = notificationState.unreadCount > 99 ? '99+' : notificationState.unreadCount;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// Update notification list in dropdown
function updateNotificationList() {
    if (!notificationList) return;
    
    // Clear current list
    notificationList.innerHTML = '';
    
    if (notificationState.notifications.length === 0) {
        const emptyItem = document.createElement('li');
        emptyItem.className = 'notification-item empty';
        emptyItem.textContent = 'No notifications';
        notificationList.appendChild(emptyItem);
        return;
    }
    
    // Add notifications to the list
    notificationState.notifications.forEach(notification => {
        const item = document.createElement('li');
        item.className = `notification-item ${notification.isRead ? '' : 'unread'}`;
        item.setAttribute('data-type', notification.type.toLowerCase());
        item.setAttribute('data-id', notification.id);
        
        // Create notification content
        const content = document.createElement('div');
        content.className = 'notification-content';
        
        const message = document.createElement('p');
        message.className = 'notification-message';
        message.textContent = notification.message;
        
        const time = document.createElement('span');
        time.className = 'notification-time';
        time.textContent = formatNotificationTime(notification.sentAt);
        
        content.appendChild(message);
        content.appendChild(time);
        item.appendChild(content);
        
        // Add click event to navigate to the relevant page
        item.addEventListener('click', () => handleNotificationClick(notification));
        
        notificationList.appendChild(item);
    });
    
    // Update visibility of mark all read button
    if (markAllReadBtn) {
        markAllReadBtn.style.display = notificationState.unreadCount > 0 ? 'block' : 'none';
    }
}

// Handle notification click
function handleNotificationClick(notification) {
    // Mark as read if unread
    if (!notification.isRead) {
        markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.complaintId) {
        window.location.href = `complaint-detail.html?id=${notification.complaintId}`;
    }
    
    // Close dropdown
    if (notificationDropdown) {
        notificationDropdown.classList.remove('show');
    }
}

// Format notification time
function formatNotificationTime(timestamp) {
    const now = new Date();
    const notifDate = new Date(timestamp);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) {
        return 'just now';
    } else if (diffMins < 60) {
        return `${diffMins}m ago`;
    } else if (diffHours < 24) {
        return `${diffHours}h ago`;
    } else if (diffDays < 7) {
        return `${diffDays}d ago`;
    } else {
        return notifDate.toLocaleDateString();
    }
}

// Show notification toast for new notifications
function showNotificationToast(notification) {
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.setAttribute('data-type', notification.type.toLowerCase());
    
    const content = document.createElement('div');
    content.className = 'toast-content';
    
    const title = document.createElement('h4');
    title.textContent = getNotificationTitle(notification.type);
    
    const message = document.createElement('p');
    message.textContent = notification.message;
    
    content.appendChild(title);
    content.appendChild(message);
    toast.appendChild(content);
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(toast);
    });
    toast.appendChild(closeBtn);
    
    // Add click event to navigate
    toast.addEventListener('click', (e) => {
        if (!e.target.matches('.toast-close')) {
            handleNotificationClick(notification);
            document.body.removeChild(toast);
        }
    });
    
    document.body.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(toast)) {
            document.body.removeChild(toast);
        }
    }, 5000);
}

// Get notification title based on type
function getNotificationTitle(type) {
    switch (type) {
        case 'STATUS_CHANGE':
            return 'Status Update';
        case 'COMMENT':
            return 'New Comment';
        case 'ASSIGNMENT':
            return 'Assignment';
        default:
            return 'Notification';
    }
}

// Update all notification UI elements
function updateNotificationUI() {
    updateNotificationBadge();
    updateNotificationList();
}

// Handle disconnect when user logs out
function disconnectNotifications() {
    if (notificationState.eventSource) {
        notificationState.eventSource.close();
        notificationState.eventSource = null;
        notificationState.isConnected = false;
    }
}

// Export notification functions
const notificationService = {
    init: initNotifications,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    disconnect: disconnectNotifications
};