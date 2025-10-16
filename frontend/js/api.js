/**
 * API service for handling all API requests
 */

// Base API class with common functionality
class API {
    constructor() {
        this.baseUrl = API_CONFIG.baseUrl;
        this.defaultHeaders = API_CONFIG.defaultHeaders;
        this.requestOptions = API_CONFIG.requestOptions;
    }
    
    // Get the base URL
    getBaseUrl() {
        return this.baseUrl;
    }
    
    // Get the authentication token
    getAuthToken() {
        return localStorage.getItem('token');
    }
    
    // Set the authentication token
    setAuthToken(token) {
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }
    
    // Check if the user is authenticated
    isAuthenticated() {
        return !!this.getAuthToken();
    }
    
    // Get headers for authenticated requests
    getAuthHeaders() {
        const headers = { ...this.defaultHeaders };
        const token = this.getAuthToken();
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }
    
    // Handle API errors
    handleError(error) {
        console.error('API Error:', error);
        
        if (error.response) {
            // Server responded with an error status code
            const status = error.response.status;
            
            // Handle 401 Unauthorized - Token expired or invalid
            if (status === 401) {
                // Try to refresh token if available
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    return this.refreshToken(refreshToken).catch(() => {
                        // If refresh fails, log out the user
                        this.logout();
                        throw new Error('Session expired. Please log in again.');
                    });
                } else {
                    // No refresh token, log out the user
                    this.logout();
                    throw new Error('Session expired. Please log in again.');
                }
            }
            
            // Attempt to extract structured validation errors returned by backend GlobalExceptionHandler
            let serverData = error.data || error.response.data;
            if (serverData) {
                // If validation errors array present, build a human-readable message
                if (Array.isArray(serverData.errors) && serverData.errors.length > 0) {
                    const fieldMessages = serverData.errors.map(e => `${e.field}: ${e.message}`).join('\n');
                    throw new Error(fieldMessages);
                }
                if (serverData.message) {
                    throw new Error(serverData.message);
                }
            }
            throw new Error(`Request failed with status ${status}`);
        } else if (error.request) {
            // Request was made but no response received
            throw new Error('No response from server. Please check your internet connection.');
        } else {
            // Something else happened while setting up the request
            throw new Error(error.message || 'An unknown error occurred');
        }
    }
    
    // Make a GET request
    async get(endpoint, params = {}) {
        try {
            const url = this.buildUrl(endpoint, params);
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getAuthHeaders(),
                credentials: 'include'
            });
            
            return this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }
    
    // Make a POST request
    async post(endpoint, data = {}) {
        try {
            const url = this.buildUrl(endpoint);
            const response = await fetch(url, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(data),
                credentials: 'include'
            });
            
            return this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }
    
    // Make a PUT request
    async put(endpoint, data = {}) {
        try {
            const url = this.buildUrl(endpoint);
            const response = await fetch(url, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(data),
                credentials: 'include'
            });
            
            return this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }
    
    // Make a DELETE request
    async delete(endpoint) {
        try {
            const url = this.buildUrl(endpoint);
            const response = await fetch(url, {
                method: 'DELETE',
                headers: this.getAuthHeaders(),
                credentials: 'include'
            });
            
            return this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }
    
    // Make a PATCH request
    async patch(endpoint, data = {}) {
        try {
            const url = this.buildUrl(endpoint);
            const response = await fetch(url, {
                method: 'PATCH',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(data),
                credentials: 'include'
            });
            
            return this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }
    
    // Upload files with form data
    async upload(endpoint, formData) {
        try {
            const url = this.buildUrl(endpoint);
            const headers = this.getAuthHeaders();
            
            // Remove Content-Type for form data so browser can set it with boundary
            delete headers['Content-Type'];
            
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: formData,
                credentials: 'include'
            });
            
            return this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }
    
    // Build URL with query parameters
    buildUrl(endpoint, params = {}) {
        const url = new URL(this.baseUrl + endpoint);
        
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key]);
            }
        });
        
        return url.toString();
    }
    
    // Handle API response
    async handleResponse(response) {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.message || `Request failed with status ${response.status}`);
            error.response = response;
            error.data = errorData;
            throw error;
        }
        
        // For 204 No Content responses, return empty object
        if (response.status === 204) {
            return {};
        }
        
        return response.json();
    }
    
    // Refresh the authentication token
    async refreshToken(refreshToken) {
        try {
            const response = await this.post(API_CONFIG.endpoints.auth.refreshToken, {
                refreshToken: refreshToken
            });
            
            if (response && response.token) {
                this.setAuthToken(response.token);
                localStorage.setItem('refreshToken', response.refreshToken);
                return response;
            } else {
                throw new Error('Failed to refresh token');
            }
        } catch (error) {
            return this.handleError(error);
        }
    }
    
    // Log out the user
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Redirect to login page if not already there
        if (!window.location.pathname.includes('/login.html')) {
            window.location.href = '/login.html';
        }
    }
}

// Auth API service
class AuthAPI extends API {
    // Log in user
    async login(email, password) {
        try {
            const response = await this.post(API_CONFIG.endpoints.auth.login, {
                email,
                password
            });
            
            if (response && response.token) {
                this.setAuthToken(response.token);
                localStorage.setItem('refreshToken', response.refreshToken);
                localStorage.setItem('user', JSON.stringify(response.user));
                return response.user;
            } else {
                throw new Error('Login failed: Invalid response from server');
            }
        } catch (error) {
            return this.handleError(error);
        }
    }
    
    // Register new user
    async register(userData) {
        try {
            // Backend returns UserDTO (no token). Do not auto-login.
            const response = await this.post(API_CONFIG.endpoints.auth.register, userData);
            return response;
        } catch (error) {
            return this.handleError(error);
        }
    }
    
    // Get the current user
    getCurrentUser() {
        const userJson = localStorage.getItem('user');
        return userJson ? JSON.parse(userJson) : null;
    }
    
    // Update current user data
    setCurrentUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    }
    
    // Check if user has specific role
    hasRole(role) {
        const user = this.getCurrentUser();
        return user && user.roles && user.roles.includes(role);
    }
    
    // Check if the current user is admin
    isAdmin() {
        return this.hasRole(USER_ROLES.ADMIN);
    }
    
    // Check if the current user is a municipal officer
    isMunicipalOfficer() {
        return this.hasRole(USER_ROLES.MUNICIPAL_OFFICER);
    }
    
    // Check if the current user is a department head
    isDepartmentHead() {
        return this.hasRole(USER_ROLES.DEPARTMENT_HEAD);
    }
}

// Complaints API service
class ComplaintsAPI extends API {
    // Get complaints list with filtering and pagination
    async getComplaints(params = {}) {
        return this.get(API_CONFIG.endpoints.complaints.list, params);
    }
    
    // Get a specific complaint by ID
    async getComplaint(id) {
        return this.get(API_CONFIG.endpoints.complaints.detail(id));
    }
    
    // Create a new complaint
    async createComplaint(complaintData, images = []) {
        if (images && images.length > 0) {
            // Use FormData for file uploads
            const formData = new FormData();
            
            // Add complaint data as JSON
            formData.append('complaint', new Blob([JSON.stringify(complaintData)], {
                type: 'application/json'
            }));
            
            // Add images
            images.forEach((image, index) => {
                formData.append('images', image);
            });
            
            return this.upload(API_CONFIG.endpoints.complaints.create, formData);
        } else {
            // No images, use regular JSON endpoint
            return this.post(API_CONFIG.endpoints.complaints.create, complaintData);
        }
    }
    
    // Update an existing complaint
    async updateComplaint(id, complaintData, images = []) {
        if (images && images.length > 0) {
            // Use FormData for file uploads
            const formData = new FormData();
            
            // Add complaint data as JSON
            formData.append('complaint', new Blob([JSON.stringify(complaintData)], {
                type: 'application/json'
            }));
            
            // Add images
            images.forEach((image, index) => {
                formData.append('images', image);
            });
            
            // Use PUT with FormData
            const url = this.buildUrl(API_CONFIG.endpoints.complaints.update(id));
            const headers = this.getAuthHeaders();
            
            // Remove Content-Type for form data
            delete headers['Content-Type'];
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: headers,
                body: formData,
                credentials: 'include'
            });
            
            return this.handleResponse(response);
        } else {
            // No images, use regular JSON endpoint
            return this.put(API_CONFIG.endpoints.complaints.update(id), complaintData);
        }
    }
    
    // Delete a complaint
    async deleteComplaint(id) {
        return this.delete(API_CONFIG.endpoints.complaints.delete(id));
    }
    
    // Upvote a complaint
    async upvoteComplaint(id) {
        return this.post(API_CONFIG.endpoints.complaints.upvote(id));
    }
    
    // Remove upvote from a complaint
    async removeUpvote(id) {
        return this.delete(API_CONFIG.endpoints.complaints.removeUpvote(id));
    }
    
    // Get comments for a complaint
    async getComments(id, params = {}) {
        return this.get(API_CONFIG.endpoints.complaints.comments(id), params);
    }
    
    // Add a comment to a complaint
    async addComment(id, comment) {
        return this.post(API_CONFIG.endpoints.complaints.addComment(id), {
            content: comment
        });
    }
    
    // Delete a comment
    async deleteComment(complaintId, commentId) {
        return this.delete(API_CONFIG.endpoints.complaints.deleteComment(complaintId, commentId));
    }
    
    // Update complaint status
    async updateStatus(id, status, comment = "") {
        return this.patch(API_CONFIG.endpoints.complaints.updateStatus(id), {
            status: status,
            comment: comment
        });
    }
    
    // Get similar complaints
    async getSimilarComplaints(id) {
        return this.get(API_CONFIG.endpoints.complaints.similar(id));
    }
    
    // Get nearby complaints based on location
    async getNearbyComplaints(latitude, longitude, radius = 5) {
        return this.get(API_CONFIG.endpoints.complaints.nearby, {
            latitude,
            longitude,
            radius
        });
    }
}

// User API service
class UserAPI extends API {
    // Get user profile
    async getProfile() {
        return this.get(API_CONFIG.endpoints.user.profile);
    }
    
    // Update user profile
    async updateProfile(userData) {
        const response = await this.put(API_CONFIG.endpoints.user.updateProfile, userData);
        
        // Update stored user data
        if (response) {
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const updatedUser = { ...currentUser, ...userData };
            localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        return response;
    }
    
    // Change password
    async changePassword(currentPassword, newPassword) {
        return this.post(API_CONFIG.endpoints.user.changePassword, {
            currentPassword,
            newPassword
        });
    }
}

// Notifications API service
class NotificationsAPI extends API {
    // Get user notifications
    async getNotifications(params = {}) {
        return this.get(API_CONFIG.endpoints.notifications.list, params);
    }
    
    // Mark notification as read
    async markAsRead(id) {
        return this.patch(API_CONFIG.endpoints.notifications.markRead(id));
    }
    
    // Mark all notifications as read
    async markAllAsRead() {
        return this.patch(API_CONFIG.endpoints.notifications.markAllRead);
    }
}

// Statistics API service
class StatisticsAPI extends API {
    // Get summary statistics
    async getSummary(params = {}) {
        return this.get(API_CONFIG.endpoints.statistics.summary, params);
    }
    
    // Get statistics by category
    async getByCategory(params = {}) {
        return this.get(API_CONFIG.endpoints.statistics.byCategory, params);
    }
    
    // Get statistics by status
    async getByStatus(params = {}) {
        return this.get(API_CONFIG.endpoints.statistics.byStatus, params);
    }
    
    // Get statistics by time
    async getByTime(params = {}) {
        return this.get(API_CONFIG.endpoints.statistics.byTime, params);
    }
    
    // Get statistics by location
    async getByLocation(params = {}) {
        return this.get(API_CONFIG.endpoints.statistics.byLocation, params);
    }
    
    // Get resolution time statistics
    async getResolutionTime(params = {}) {
        return this.get(API_CONFIG.endpoints.statistics.resolutionTime, params);
    }
    
    // Get trend statistics
    async getTrends(params = {}) {
        return this.get(API_CONFIG.endpoints.statistics.trends, params);
    }
}

// Contact API service
class ContactAPI extends API {
    // Send contact form
    async sendContactForm(formData) {
        return this.post(API_CONFIG.endpoints.contact.send, formData);
    }
}

// Initialize API services
const authApi = new AuthAPI();
const complaintsApi = new ComplaintsAPI();
const userApi = new UserAPI();
const notificationsApi = new NotificationsAPI();
const statisticsApi = new StatisticsAPI();
const contactApi = new ContactAPI();