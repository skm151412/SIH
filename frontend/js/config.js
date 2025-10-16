// Configuration settings for the application
const API_CONFIG = {
    // Base URL for the API
    baseUrl: 'http://localhost:8080/api',
    
    // Endpoints
    endpoints: {
        // Authentication
        auth: {
            login: '/auth/login',
            register: '/auth/register',
            refreshToken: '/auth/refresh-token'
        },
        // User
        user: {
            profile: '/users/profile',
            updateProfile: '/users/profile',
            changePassword: '/users/change-password'
        },
        // Complaints
        complaints: {
            list: '/complaints',
            create: '/complaints/create',
            detail: (id) => `/complaints/${id}`,
            update: (id) => `/complaints/${id}`,
            delete: (id) => `/complaints/${id}`,
            upvote: (id) => `/complaints/${id}/upvote`,
            removeUpvote: (id) => `/complaints/${id}/upvote`,
            comments: (id) => `/complaints/${id}/comments`,
            addComment: (id) => `/complaints/${id}/comments`,
            deleteComment: (id, commentId) => `/complaints/${id}/comments/${commentId}`,
            updateStatus: (id) => `/complaints/${id}/status`,
            similar: (id) => `/complaints/${id}/similar`,
            nearby: '/complaints/nearby'
        },
        // Notifications
        notifications: {
            list: '/notifications',
            markRead: (id) => `/notifications/${id}/read`,
            markAllRead: '/notifications/read-all'
        },
        // Statistics
        statistics: {
            // Use existing backend endpoint (secured) for aggregate counts
            summary: '/complaints/statistics',
            // The following endpoints are not yet implemented server-side.
            // They remain as placeholders for future expansion.
            byCategory: '/statistics/by-category',
            byStatus: '/statistics/by-status',
            byTime: '/statistics/by-time',
            byLocation: '/statistics/by-location',
            resolutionTime: '/statistics/resolution-time',
            trends: '/statistics/trends'
        },
        // Contact
        contact: {
            send: '/contact'
        }
    },

    // Default headers for API requests
    defaultHeaders: {
        'Content-Type': 'application/json'
    },

    // Default request options
    requestOptions: {
        timeout: 30000 // 30 seconds
    }
};

// Map configuration
const MAP_CONFIG = {
    defaultCenter: [20.5937, 78.9629], // Default center of India
    defaultZoom: 5,
    maxZoom: 18,
    tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
};

// File upload configuration
const UPLOAD_CONFIG = {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 5,
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif']
};

// Categories configuration
const CATEGORIES = [
    { id: 'ROADS', name: 'Roads & Infrastructure', icon: 'fa-road' },
    { id: 'WASTE_MANAGEMENT', name: 'Waste Management', icon: 'fa-trash' },
    { id: 'WATER_SUPPLY', name: 'Water Supply', icon: 'fa-tint' },
    { id: 'SANITATION', name: 'Sanitation', icon: 'fa-hands-wash' },
    { id: 'ELECTRICITY', name: 'Electricity', icon: 'fa-bolt' },
    { id: 'PUBLIC_TRANSPORT', name: 'Public Transport', icon: 'fa-bus' },
    { id: 'STREET_LIGHTING', name: 'Street Lighting', icon: 'fa-lightbulb' },
    { id: 'PARKS_RECREATION', name: 'Parks & Recreation', icon: 'fa-tree' },
    { id: 'PUBLIC_SAFETY', name: 'Public Safety', icon: 'fa-shield-alt' },
    { id: 'OTHERS', name: 'Others', icon: 'fa-question-circle' }
];

// Status configuration
const STATUS_TYPES = [
    { id: 'PENDING', name: 'Pending', icon: 'fa-clock', color: '#f39c12' },
    { id: 'IN_PROGRESS', name: 'In Progress', icon: 'fa-spinner', color: '#3498db' },
    { id: 'RESOLVED', name: 'Resolved', icon: 'fa-check-circle', color: '#2ecc71' },
    { id: 'CLOSED', name: 'Closed', icon: 'fa-check-double', color: '#27ae60' },
    { id: 'REJECTED', name: 'Rejected', icon: 'fa-times-circle', color: '#e74c3c' }
];

// Severity configuration
const SEVERITY_TYPES = [
    { id: 'LOW', name: 'Low', icon: 'fa-exclamation', color: '#3498db' },
    { id: 'MEDIUM', name: 'Medium', icon: 'fa-exclamation', color: '#f39c12' },
    { id: 'HIGH', name: 'High', icon: 'fa-exclamation-circle', color: '#e74c3c' }
];

// User roles
const USER_ROLES = {
    CITIZEN: 'ROLE_CITIZEN',
    ADMIN: 'ROLE_ADMIN',
    MUNICIPAL_OFFICER: 'ROLE_MUNICIPAL_OFFICER',
    DEPARTMENT_HEAD: 'ROLE_DEPARTMENT_HEAD'
};

// Time formats
const TIME_FORMATS = {
    date: 'YYYY-MM-DD',
    dateTime: 'YYYY-MM-DD HH:mm',
    shortDate: 'MMM DD, YYYY',
    shortDateTime: 'MMM DD, YYYY HH:mm'
};