/**
 * Authentication services
 */

// DOM Elements - will be initialized on page load
let loginForm, registerForm, logoutButton, errorMessageContainer;

// Initialize authentication functionality
function initAuth() {
    // Detect page type and initialize appropriate functionality
    const currentPage = window.location.pathname.split('/').pop();
    
    // Initialize login functionality if on login page
    if (currentPage === 'login.html') {
        initLoginPage();
    }
    
    // Initialize register functionality if on register page
    if (currentPage === 'register.html') {
        initRegisterPage();
    }
    
    // Initialize logout functionality on all pages
    initLogout();
    
    // Check authentication status and update UI
    updateAuthUI();
    
    // Add event listeners for password visibility toggle
    setupPasswordVisibility();
    
    // Initialize notifications if available and user is logged in
    if (typeof notificationService !== 'undefined' && authApi.isAuthenticated()) {
        notificationService.init();
    }
}

// Initialize login page functionality
function initLoginPage() {
    loginForm = document.getElementById('loginForm');
    // Support either #errorMessage (shared pattern) or legacy #alertBox id on login page
    errorMessageContainer = document.getElementById('errorMessage') || document.getElementById('alertBox');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Check if user is already logged in
    if (authApi.isAuthenticated()) {
        // Redirect to dashboard or home page
        redirectAfterLogin();
    }
}

// Initialize register page functionality
function initRegisterPage() {
    registerForm = document.getElementById('registerForm');
    errorMessageContainer = document.getElementById('errorMessage');
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
        
        // Add password validation
        const passwordField = document.getElementById('password');
        const confirmPasswordField = document.getElementById('confirmPassword');
        
        if (passwordField && confirmPasswordField) {
            passwordField.addEventListener('input', validatePassword);
            confirmPasswordField.addEventListener('input', validatePasswordMatch);
        }
    }
    
    // Check if user is already logged in
    if (authApi.isAuthenticated()) {
        // Redirect to dashboard or home page
        redirectAfterLogin();
    }
}

// Initialize logout functionality
function initLogout() {
    // Find logout buttons on the page
    const logoutButtons = document.querySelectorAll('.logout-button');
    
    if (logoutButtons.length > 0) {
        logoutButtons.forEach(button => {
            button.addEventListener('click', handleLogout);
        });
    }
}

// Update UI based on authentication status
function updateAuthUI() {
    const isAuthenticated = authApi.isAuthenticated();
    
    // Get all elements that should show only when logged in
    const authenticatedElements = document.querySelectorAll('.auth-required');
    
    // Get all elements that should show only when logged out
    const unauthenticatedElements = document.querySelectorAll('.unauth-required');
    
    // Get all elements that should show only for admins
    const adminElements = document.querySelectorAll('.admin-required');
    
    // Get all elements that should show only for municipal officers
    const officerElements = document.querySelectorAll('.officer-required');
    
    // Get user data if authenticated
    let user = null;
    if (isAuthenticated) {
        user = authApi.getCurrentUser();
    }
    
    // Update UI elements visibility based on authentication status
    authenticatedElements.forEach(element => {
        element.style.display = isAuthenticated ? '' : 'none';
    });
    
    unauthenticatedElements.forEach(element => {
        element.style.display = !isAuthenticated ? '' : 'none';
    });
    
    // Update admin-only elements
    adminElements.forEach(element => {
        element.style.display = (isAuthenticated && authApi.isAdmin()) ? '' : 'none';
    });
    
    // Update officer-only elements
    officerElements.forEach(element => {
        element.style.display = (isAuthenticated && authApi.isMunicipalOfficer()) ? '' : 'none';
    });
    
    // Update user information elements
    if (isAuthenticated && user) {
        // Find user name elements
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(element => {
            element.textContent = user.name || user.username;
        });
        
        // Find user avatar elements
        const userAvatarElements = document.querySelectorAll('.user-avatar');
        userAvatarElements.forEach(element => {
            if (user.avatar) {
                element.src = user.avatar;
                element.alt = user.name || user.username;
            } else {
                // Set default avatar
                element.src = '/images/default-avatar.png';
                element.alt = user.name || user.username;
            }
        });
    }
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    // Show loading state
    toggleLoadingState(loginForm, true);
    hideErrorMessage();
    
    // Get form data
    const formData = new FormData(loginForm);
    const email = formData.get('email');
    const password = formData.get('password');
    const rememberMe = formData.get('rememberMe') === 'on';
    
    // Failsafe: revert loading state if stuck beyond 8s
    const safetyTimer = setTimeout(() => {
        toggleLoadingState(loginForm, false);
    }, 8000);

    try {
        // Attempt to login
        const user = await authApi.login(email, password);
        console.debug('Login success user:', user);
        
        // If remember me is checked, store in localStorage
        if (rememberMe) {
            localStorage.setItem('rememberEmail', email);
        } else {
            localStorage.removeItem('rememberEmail');
        }
        
        // Redirect to appropriate page
        redirectAfterLogin();
    } catch (error) {
        console.error('Login error:', error);
        showErrorMessage(error.message || 'Login failed. Please check your credentials.');
    } finally {
        clearTimeout(safetyTimer);
        // Hide loading state
        toggleLoadingState(loginForm, false);
    }
}

// Handle registration form submission
async function handleRegister(event) {
    event.preventDefault();
    
    // Show loading state
    toggleLoadingState(registerForm, true);
    hideErrorMessage();
    
    // Get form data
    const formData = new FormData(registerForm);

    // Map to backend RegisterRequest shape
    const userData = {
        name: formData.get('name')?.trim(),
        email: formData.get('email')?.trim(),
        phone: formData.get('phone')?.trim(),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword'),
        terms: formData.get('termsAgree') === 'on'
    };
    
    // Validate passwords match
    if (userData.password !== userData.confirmPassword) {
        showErrorMessage('Passwords do not match.');
        toggleLoadingState(registerForm, false);
        return;
    }
    // Validate required fields
    if (!userData.name || !userData.email || !userData.phone) {
        showErrorMessage('Please fill in all required fields.');
        toggleLoadingState(registerForm, false);
        return;
    }
    if (!userData.terms) {
        showErrorMessage('You must accept the Terms and Privacy Policy.');
        toggleLoadingState(registerForm, false);
        return;
    }
    
    try {
        // Attempt to register
        // Build payload for backend
        const payload = {
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            password: userData.password
        };
        const response = await authApi.register(payload);
        
        // Check if registration was successful
        if (response && response.email) {
            showSuccessMessage('Registration successful! Redirecting to login...');
            setTimeout(() => window.location.href = 'login.html', 1500);
        } else {
            showErrorMessage('Unexpected response from server.');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showErrorMessage(error.message || 'Registration failed. Please try again.');
    } finally {
        // Hide loading state
        toggleLoadingState(registerForm, false);
    }
}

// Handle logout
function handleLogout(event) {
    event.preventDefault();
    
    // Disconnect notifications SSE if it exists
    if (typeof notificationService !== 'undefined') {
        notificationService.disconnect();
    }
    
    // Call logout from API service
    authApi.logout();
    
    // Redirect to home page
    window.location.href = 'index.html';
}

// Redirect user after login based on role
function redirectAfterLogin() {
    // Get return URL if available (for redirecting back after login)
    const urlParams = new URLSearchParams(window.location.search);
    const returnUrl = urlParams.get('returnUrl');
    
    if (returnUrl) {
        window.location.href = returnUrl;
    } else {
        // Check user role and redirect accordingly
        const user = authApi.getCurrentUser();
        
        if (user && authApi.isAdmin()) {
            window.location.href = 'admin-dashboard.html';
        } else if (user && authApi.isMunicipalOfficer()) {
            window.location.href = 'officer-dashboard.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    }
}

// Validate password strength
function validatePassword() {
    const password = document.getElementById('password').value;
    const passwordStrength = document.getElementById('passwordStrength');
    const strengthBar = document.getElementById('strengthBar');
    
    if (!passwordStrength || !strengthBar) return;
    
    // Password strength criteria
    const hasLength = password.length >= 8;
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    // Calculate strength score (0-4)
    let strength = 0;
    if (hasLength) strength++;
    if (hasLowerCase && hasUpperCase) strength++;
    if (hasNumber) strength++;
    if (hasSpecial) strength++;
    
    // Update strength bar
    const percent = (strength / 4) * 100;
    strengthBar.style.width = `${percent}%`;
    
    // Set color based on strength
    if (strength === 0) {
        strengthBar.style.backgroundColor = '#ddd';
        passwordStrength.textContent = 'Password strength';
    } else if (strength === 1) {
        strengthBar.style.backgroundColor = '#ff4d4d';
        passwordStrength.textContent = 'Weak';
    } else if (strength === 2) {
        strengthBar.style.backgroundColor = '#ffa64d';
        passwordStrength.textContent = 'Moderate';
    } else if (strength === 3) {
        strengthBar.style.backgroundColor = '#4dc3ff';
        passwordStrength.textContent = 'Good';
    } else {
        strengthBar.style.backgroundColor = '#4CAF50';
        passwordStrength.textContent = 'Strong';
    }
}

// Validate that passwords match
function validatePasswordMatch() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const matchMessage = document.getElementById('passwordMatch');
    
    if (!matchMessage) return;
    
    if (password === confirmPassword && confirmPassword !== '') {
        matchMessage.textContent = 'Passwords match';
        matchMessage.style.color = '#4CAF50';
    } else if (confirmPassword !== '') {
        matchMessage.textContent = 'Passwords do not match';
        matchMessage.style.color = '#ff4d4d';
    } else {
        matchMessage.textContent = '';
    }
}

// Setup password visibility toggle
function setupPasswordVisibility() {
    const passwordToggles = document.querySelectorAll('.password-toggle');
    
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const passwordField = document.getElementById(this.dataset.target);
            
            if (passwordField) {
                if (passwordField.type === 'password') {
                    passwordField.type = 'text';
                    this.innerHTML = '<i class="fa fa-eye-slash"></i>';
                } else {
                    passwordField.type = 'password';
                    this.innerHTML = '<i class="fa fa-eye"></i>';
                }
            }
        });
    });
}

// Show error message
function showErrorMessage(message) {
    if (errorMessageContainer) {
        // Support multi-line error messages (e.g., validation field list)
        errorMessageContainer.innerHTML = '';
        const lines = (message || 'An error occurred').toString().split(/\n+/);
        if (lines.length === 1) {
            errorMessageContainer.textContent = lines[0];
        } else {
            const ul = document.createElement('ul');
            ul.style.margin = '0 0 0 1rem';
            lines.forEach(l => { const li = document.createElement('li'); li.textContent = l; ul.appendChild(li); });
            const heading = document.createElement('div');
            heading.textContent = 'Please fix the following:';
            errorMessageContainer.appendChild(heading);
            errorMessageContainer.appendChild(ul);
        }
        errorMessageContainer.className = 'alert alert-danger';
        errorMessageContainer.style.display = 'block';
        
        // Scroll to error message
        errorMessageContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Hide error message
function hideErrorMessage() {
    if (errorMessageContainer) {
        errorMessageContainer.style.display = 'none';
    }
}

// Show success message
function showSuccessMessage(message) {
    if (errorMessageContainer) {
        errorMessageContainer.textContent = message;
        errorMessageContainer.className = 'alert alert-success';
        errorMessageContainer.style.display = 'block';
        
        // Scroll to message
        errorMessageContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Toggle loading state for forms
function toggleLoadingState(form, isLoading) {
    if (!form) return;
    
    const submitButton = form.querySelector('[type="submit"]');
    
    if (submitButton) {
        submitButton.disabled = isLoading;
        
        // If button has spinner child
        const spinner = submitButton.querySelector('.spinner');
        
        if (spinner) {
            spinner.style.display = isLoading ? 'inline-block' : 'none';
        } else if (isLoading) {
            const originalText = submitButton.textContent;
            submitButton.setAttribute('data-original-text', originalText);
            submitButton.innerHTML = '<span class="spinner"></span> Loading...';
        } else {
            const originalText = submitButton.getAttribute('data-original-text');
            if (originalText) {
                submitButton.textContent = originalText;
            }
        }
    }
}

// Check if user is authenticated and redirect if not
function requireAuth() {
    if (!authApi.isAuthenticated()) {
        // Store the current URL to redirect back after login
        const currentUrl = window.location.pathname;
        window.location.href = `login.html?returnUrl=${encodeURIComponent(currentUrl)}`;
        return false;
    }
    return true;
}

// Check if the user has the required role and redirect if not
function requireRole(role) {
    if (!authApi.isAuthenticated()) {
        const currentUrl = window.location.pathname;
        window.location.href = `login.html?returnUrl=${encodeURIComponent(currentUrl)}`;
        return false;
    }
    
    let hasRequiredRole = false;
    
    if (role === USER_ROLES.ADMIN) {
        hasRequiredRole = authApi.isAdmin();
    } else if (role === USER_ROLES.MUNICIPAL_OFFICER) {
        hasRequiredRole = authApi.isMunicipalOfficer();
    } else if (role === USER_ROLES.DEPARTMENT_HEAD) {
        hasRequiredRole = authApi.isDepartmentHead();
    } else {
        // Regular user role
        hasRequiredRole = true;
    }
    
    if (!hasRequiredRole) {
        // Redirect to unauthorized page
        window.location.href = 'unauthorized.html';
        return false;
    }
    
    return true;
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', initAuth);