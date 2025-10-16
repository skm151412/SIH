/**
 * WebSocket Service for real-time updates
 */

class WebSocketService {
    constructor() {
        this.socket = null;
        this.stompClient = null;
        this.connected = false;
        this.subscriptions = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 5000; // 5 seconds
        this.baseUrl = API_CONFIG.baseUrl.replace('http', 'ws');
    }

    /**
     * Initialize the WebSocket connection
     */
    init() {
        if (this.connected) return;
        
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('WebSocket: User not authenticated, skipping connection');
            return;
        }
        
        try {
            // Connect to WebSocket endpoint with auth token
            const socketUrl = `${this.baseUrl.replace('/api', '')}/ws?token=${token}`;
            this.socket = new WebSocket(socketUrl);
            
            // Create STOMP client over the WebSocket
            this.stompClient = Stomp.over(this.socket);
            
            // Disable debug logs in production
            this.stompClient.debug = null;
            
            // Connect to the STOMP broker
            this.stompClient.connect({}, this.onConnected.bind(this), this.onError.bind(this));
            
            console.log('WebSocket: Connecting...');
        } catch (error) {
            console.error('WebSocket: Error initializing connection', error);
        }
    }
    
    /**
     * Callback for successful connection
     */
    onConnected() {
        this.connected = true;
        this.reconnectAttempts = 0;
        console.log('WebSocket: Connected successfully');
        
        // Subscribe to complaint updates
        this.subscribe('/topic/complaints', this.handleComplaintUpdate.bind(this));
        
        // Subscribe to system notifications
        this.subscribe('/topic/notifications', this.handleNotification.bind(this));
        
        // Subscribe to statistics updates
        this.subscribe('/topic/statistics', this.handleStatisticsUpdate.bind(this));
        
        // Broadcast connection event
        const event = new CustomEvent('websocket-connected');
        document.dispatchEvent(event);
    }
    
    /**
     * Callback for connection error
     */
    onError(error) {
        this.connected = false;
        console.error('WebSocket: Connection error', error);
        
        // Try to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`WebSocket: Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            
            setTimeout(() => {
                this.init();
            }, this.reconnectInterval);
        } else {
            console.error('WebSocket: Maximum reconnection attempts reached');
        }
    }
    
    /**
     * Subscribe to a topic
     * @param {string} topic - The topic to subscribe to
     * @param {function} callback - Callback function when message is received
     * @param {object} headers - Optional headers
     * @returns {string} Subscription ID
     */
    subscribe(topic, callback, headers = {}) {
        if (!this.connected || !this.stompClient) {
            console.warn(`WebSocket: Cannot subscribe to ${topic}, not connected`);
            return null;
        }
        
        const subscription = this.stompClient.subscribe(topic, message => {
            try {
                const payload = JSON.parse(message.body);
                callback(payload);
            } catch (error) {
                console.error(`WebSocket: Error processing message from ${topic}`, error);
            }
        }, headers);
        
        // Store the subscription
        this.subscriptions.set(topic, subscription);
        console.log(`WebSocket: Subscribed to ${topic}`);
        
        return subscription.id;
    }
    
    /**
     * Unsubscribe from a topic
     * @param {string} topic - The topic to unsubscribe from
     */
    unsubscribe(topic) {
        if (this.subscriptions.has(topic)) {
            const subscription = this.subscriptions.get(topic);
            subscription.unsubscribe();
            this.subscriptions.delete(topic);
            console.log(`WebSocket: Unsubscribed from ${topic}`);
        }
    }
    
    /**
     * Disconnect the WebSocket
     */
    disconnect() {
        if (this.stompClient && this.connected) {
            // Unsubscribe from all topics
            this.subscriptions.forEach((subscription, topic) => {
                subscription.unsubscribe();
            });
            this.subscriptions.clear();
            
            // Disconnect the client
            this.stompClient.disconnect();
            this.connected = false;
            console.log('WebSocket: Disconnected');
        }
    }
    
    /**
     * Send a message to a specific destination
     * @param {string} destination - The destination endpoint
     * @param {object} body - The message body
     */
    send(destination, body) {
        if (!this.connected || !this.stompClient) {
            console.warn(`WebSocket: Cannot send to ${destination}, not connected`);
            return;
        }
        
        this.stompClient.send(destination, {}, JSON.stringify(body));
        console.log(`WebSocket: Message sent to ${destination}`, body);
    }
    
    /**
     * Handle real-time complaint updates
     * @param {object} data - The complaint data
     */
    handleComplaintUpdate(data) {
        console.log('WebSocket: Received complaint update', data);
        
        // Dispatch custom event with the updated complaint data
        const event = new CustomEvent('complaint-update', { detail: data });
        document.dispatchEvent(event);
        
        // Also update notification badge if needed
        this.updateNotificationBadge();
    }
    
    /**
     * Handle real-time notifications
     * @param {object} data - The notification data
     */
    handleNotification(data) {
        console.log('WebSocket: Received notification', data);
        
        // Dispatch custom event with the notification data
        const event = new CustomEvent('new-notification', { detail: data });
        document.dispatchEvent(event);
        
        // Update notification badge
        this.updateNotificationBadge();
        
        // Show toast notification
        if (typeof showToast === 'function') {
            showToast(data.message, 'info');
        }
    }
    
    /**
     * Handle real-time statistics updates
     * @param {object} data - The statistics data
     */
    handleStatisticsUpdate(data) {
        console.log('WebSocket: Received statistics update', data);
        
        // Dispatch custom event with the updated statistics
        const event = new CustomEvent('statistics-update', { detail: data });
        document.dispatchEvent(event);
    }
    
    /**
     * Update notification badge count
     */
    updateNotificationBadge() {
        // Count unread notifications
        apiService.get('/api/notifications/unread-count')
            .then(response => {
                const count = response.count || 0;
                const badge = document.getElementById('notificationBadge');
                
                if (badge) {
                    if (count > 0) {
                        badge.textContent = count > 99 ? '99+' : count;
                        badge.style.display = 'flex';
                    } else {
                        badge.style.display = 'none';
                    }
                }
            })
            .catch(error => {
                console.error('Error updating notification badge:', error);
            });
    }
}

// Create a singleton instance
const webSocketService = new WebSocketService();