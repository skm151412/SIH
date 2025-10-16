/**
 * Complaint form handler
 * Manages the complaint submission process including validation, location picking, and image uploads
 */

// Global variables
let map, marker;
let uploadedImages = [];
let geocoder;

// Initialize the complaint form
function initComplaintForm() {
    const complaintForm = document.getElementById('complaintForm');
    if (!complaintForm) return;

    // Check if user is authenticated
    if (!requireAuth()) return;

    // Debug marker to confirm script executed
    console.debug('[complaints.js] initComplaintForm executing');

    // Initialize map
    initMap();
    
    // Initialize image uploads
    initImageUploads();
    
    // Set up category selection
    initCategorySelection();
    
    // Initialize form submission handler
    complaintForm.addEventListener('submit', handleComplaintSubmission);
    
    // Initialize form field validations
    initFormValidation();
}

// Initialize the map for location selection
function initMap() {
    const mapDiv = document.getElementById('map');
    if (!mapDiv) return;
    // Initialize map with default center (can be user's current location)
    map = L.map('map').setView([20.5937, 78.9629], 5); // Default center on India
    
    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Add a marker for selecting location
    marker = L.marker([20.5937, 78.9629], {
        draggable: true
    }).addTo(map);
    
    // Update form fields when marker is moved
    marker.on('dragend', updateLocationFields);
    
    // Allow clicking on map to place marker
    map.on('click', function(e) {
        marker.setLatLng(e.latlng);
        updateLocationFields();
    });
    
    // Initialize geocoder for address search
    initGeocoder();
    
    // Try to get user's current location
    getUserLocation();
}

// Initialize geocoder for address search
function initGeocoder() {
    const addressInput = document.getElementById('address');
    const searchButton = document.getElementById('searchAddress');
    
    if (addressInput && searchButton) {
        searchButton.addEventListener('click', function() {
            const address = addressInput.value;
            if (!address) return;
            
            // Use Nominatim API for geocoding
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`)
                .then(response => response.json())
                .then(data => {
                    if (data && data.length > 0) {
                        const location = data[0];
                        const latlng = L.latLng(location.lat, location.lon);
                        
                        // Update marker and map
                        marker.setLatLng(latlng);
                        map.setView(latlng, 16);
                        
                        // Update form fields
                        updateLocationFields();
                    } else {
                        showToast('Location not found. Please try a different address.', 'error');
                    }
                })
                .catch(error => {
                    console.error('Geocoding error:', error);
                    showToast('Failed to search location. Please try again.', 'error');
                });
        });
    }
}

// Get user's current location
function getUserLocation() {
    const locateButton = document.getElementById('getCurrentLocation');
    
    if (locateButton) {
        // If not a secure context (https or localhost), geolocation will fail silently in many browsers
        const isLocalhost = /^(localhost|127\.0\.0\.1)$/i.test(location.hostname);
        if (!window.isSecureContext && !isLocalhost) {
            console.warn('Geolocation blocked: page not served from secure context.');
            locateButton.addEventListener('click', () => {
                showToast('Geolocation requires HTTPS or running on localhost. Serve the site via a local server.', 'error');
            }, { once: true });
            return; // Do not attach normal handler
        }

        // If permission already granted, auto-fetch once on load
        if (navigator.permissions && navigator.geolocation) {
            try {
                navigator.permissions.query({ name: 'geolocation' }).then(result => {
                    if (result.state === 'granted') {
                        console.debug('[complaints.js] Geolocation permission already granted, fetching automatically');
                        navigator.geolocation.getCurrentPosition(pos => {
                            const latlng = L.latLng(pos.coords.latitude, pos.coords.longitude);
                            marker.setLatLng(latlng);
                            map.setView(latlng, 16);
                            updateLocationFields();
                        });
                    }
                });
            } catch (e) {
                console.debug('Permissions API not fully supported:', e);
            }
        }

        locateButton.addEventListener('click', function() {
            console.debug('[complaints.js] Get My Location clicked');
            if (navigator.geolocation) {
                locateButton.disabled = true;
                locateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Locating...';
                
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        const latlng = L.latLng(position.coords.latitude, position.coords.longitude);
                        
                        // Update marker and map
                        marker.setLatLng(latlng);
                        map.setView(latlng, 16);
                        
                        // Update form fields
                        updateLocationFields();
                        
                        // Reset button
                        locateButton.disabled = false;
                        locateButton.innerHTML = '<i class="fas fa-location-arrow"></i> Use My Location';
                    },
                    function(error) {
                        console.error('Geolocation error:', error);
                        showToast('Failed to get your location. Please select manually.', 'error');
                        
                        // Reset button
                        locateButton.disabled = false;
                        locateButton.innerHTML = '<i class="fas fa-location-arrow"></i> Use My Location';
                    }
                );
            } else {
                showToast('Geolocation is not supported by your browser.', 'error');
            }
        });
    }
}

// Update location fields in the form
function updateLocationFields() {
    const position = marker.getLatLng();
    
    // Update hidden fields
    document.getElementById('latitude').value = position.lat;
    document.getElementById('longitude').value = position.lng;
    
    // Reverse geocode to get address
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}&zoom=18&addressdetails=1`)
        .then(response => response.json())
        .then(data => {
            if (data && data.display_name) {
                document.getElementById('address').value = data.display_name;
            }
        })
        .catch(error => {
            console.error('Reverse geocoding error:', error);
        });
}

// Initialize image uploads
function initImageUploads() {
    const imageInput = document.getElementById('images');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    
    if (imageInput && imagePreviewContainer) {
        imageInput.addEventListener('change', function() {
            // Clear previous uploads if max reached
            if (uploadedImages.length + this.files.length > API_CONFIG.maxImageUploads) {
                showToast(`You can upload maximum ${API_CONFIG.maxImageUploads} images.`, 'warning');
                return;
            }
            
            // Process each selected file
            Array.from(this.files).forEach(file => {
                // Validate file type
                if (!file.type.match('image.*')) {
                    showToast('Only image files are allowed.', 'error');
                    return;
                }
                
                // Validate file size (max 5MB)
                if (file.size > API_CONFIG.maxImageSize) {
                    showToast(`Image size should be less than ${API_CONFIG.maxImageSize / (1024 * 1024)}MB.`, 'error');
                    return;
                }
                
                // Create a new image preview
                const reader = new FileReader();
                reader.onload = function(e) {
                    // Add to uploaded images array
                    uploadedImages.push(file);
                    
                    // Create preview element
                    const previewElement = document.createElement('div');
                    previewElement.className = 'image-preview';
                    previewElement.innerHTML = `
                        <img src="${e.target.result}" alt="Complaint Image">
                        <button type="button" class="remove-image" data-index="${uploadedImages.length - 1}">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    
                    // Add to preview container
                    imagePreviewContainer.appendChild(previewElement);
                    
                    // Add remove button event
                    previewElement.querySelector('.remove-image').addEventListener('click', function() {
                        const index = parseInt(this.dataset.index);
                        removeImage(index, previewElement);
                    });
                    
                    // Show the preview container
                    imagePreviewContainer.style.display = 'flex';
                };
                
                // Read the image file
                reader.readAsDataURL(file);
            });
            
            // Reset file input
            this.value = '';
        });
    }
}

// Remove an uploaded image
function removeImage(index, element) {
    // Remove from array
    uploadedImages.splice(index, 1);
    
    // Remove from DOM
    element.remove();
    
    // Update indices for remaining elements
    const removeButtons = document.querySelectorAll('.remove-image');
    removeButtons.forEach((button, i) => {
        button.dataset.index = i;
    });
    
    // Hide container if no images
    if (uploadedImages.length === 0) {
        document.getElementById('imagePreviewContainer').style.display = 'none';
    }
}

// Initialize category selection
function initCategorySelection() {
    const categorySelect = document.getElementById('category');
    if (!categorySelect) return;
    
    // Fetch categories from API
    complaintsApi.getCategories()
        .then(categories => {
            // Clear existing options
            categorySelect.innerHTML = '<option value="">Select Category</option>';
            
            // Add categories
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Failed to load categories:', error);
            showToast('Failed to load categories. Please refresh the page.', 'error');
        });
    
    // Add subcategory handling
    categorySelect.addEventListener('change', function() {
        const subcategoryContainer = document.getElementById('subcategoryContainer');
        const subcategorySelect = document.getElementById('subcategory');
        
        if (subcategoryContainer && subcategorySelect) {
            const selectedCategory = this.value;
            
            if (selectedCategory) {
                // Fetch subcategories for selected category
                complaintsApi.getSubcategories(selectedCategory)
                    .then(subcategories => {
                        // Clear existing options
                        subcategorySelect.innerHTML = '<option value="">Select Subcategory</option>';
                        
                        // Add subcategories
                        subcategories.forEach(subcategory => {
                            const option = document.createElement('option');
                            option.value = subcategory.id;
                            option.textContent = subcategory.name;
                            subcategorySelect.appendChild(option);
                        });
                        
                        // Show subcategory container
                        subcategoryContainer.style.display = 'block';
                    })
                    .catch(error => {
                        console.error('Failed to load subcategories:', error);
                        showToast('Failed to load subcategories.', 'error');
                    });
            } else {
                // Hide subcategory container if no category selected
                subcategoryContainer.style.display = 'none';
            }
        }
    });
}

// Initialize form validation
function initFormValidation() {
    const titleInput = document.getElementById('title');
    const descriptionInput = document.getElementById('description');
    const categorySelect = document.getElementById('category');
    // severity is radio group (name="severity")
    
    // Add validation listeners
    if (titleInput) {
        titleInput.addEventListener('blur', function() {
            validateField(this, this.value.trim().length >= 5, 'Title must be at least 5 characters');
        });
    }
    
    if (descriptionInput) {
        descriptionInput.addEventListener('blur', function() {
            validateField(this, this.value.trim().length >= 20, 'Description must be at least 20 characters');
        });
    }
    
    if (categorySelect) {
        categorySelect.addEventListener('change', function() {
            validateField(this, this.value !== '', 'Please select a category');
        });
    }
    
    // radio validation handled in validateForm
}

// Validate a single field
function validateField(field, isValid, errorMessage) {
    const feedbackElement = field.nextElementSibling;
    
    if (!feedbackElement || !feedbackElement.classList.contains('invalid-feedback')) {
        // Create feedback element if it doesn't exist
        const newFeedback = document.createElement('div');
        newFeedback.className = 'invalid-feedback';
        field.parentNode.insertBefore(newFeedback, field.nextSibling);
        
        // Update reference
        field.nextElementSibling = newFeedback;
    }
    
    if (isValid) {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
        field.nextElementSibling.textContent = '';
    } else {
        field.classList.remove('is-valid');
        field.classList.add('is-invalid');
        field.nextElementSibling.textContent = errorMessage;
    }
    
    return isValid;
}

// Validate the entire form
function validateForm() {
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const category = document.getElementById('category').value;
    const severity = (document.querySelector('input[name="severity"]:checked') || {}).value || '';
    const latitude = document.getElementById('latitude').value;
    const longitude = document.getElementById('longitude').value;
    
    let isValid = true;
    
    // Validate title
    isValid = validateField(
        document.getElementById('title'), 
        title.length >= 5, 
        'Title must be at least 5 characters'
    ) && isValid;
    
    // Validate description
    isValid = validateField(
        document.getElementById('description'),
        description.length >= 20,
        'Description must be at least 20 characters'
    ) && isValid;
    
    // Validate category
    isValid = validateField(
        document.getElementById('category'),
        category !== '',
        'Please select a category'
    ) && isValid;
    
    // Validate severity
    if (!severity) { isValid = false; }
    
    // Validate location
    isValid = validateField(
        document.getElementById('address'),
        latitude !== '' && longitude !== '',
        'Please select a location on the map'
    ) && isValid;
    
    return isValid;
}

// Handle complaint submission
async function handleComplaintSubmission(event) {
    event.preventDefault();
    
    // Validate form
    if (!validateForm()) {
        showToast('Please fix the errors in the form.', 'error');
        return;
    }
    
    // Show loading state
    toggleLoadingState(document.getElementById('complaintForm'), true);
    
    // Get form data
    const formData = new FormData(event.target);
    const selectedSeverity = (document.querySelector('input[name="severity"]:checked') || {}).value || '';
    const complaintData = {
        title: formData.get('title'),
        description: formData.get('description'),
        category: formData.get('category'),
        severity: selectedSeverity,
        locationLat: parseFloat(formData.get('latitude')),
        locationLng: parseFloat(formData.get('longitude')),
        address: formData.get('address')
    };
    
    try {
        // Submit complaint
        const response = await complaintsApi.createComplaint(complaintData, uploadedImages);
        
        // Show success message
        showToast('Your complaint has been submitted successfully!', 'success');
        
        // Reset form and redirect to complaint detail
        setTimeout(() => {
            window.location.href = `complaint-detail.html?id=${response.id}`;
        }, 1500);
    } catch (error) {
        console.error('Complaint submission error:', error);
        showToast(error.message || 'Failed to submit complaint. Please try again.', 'error');
        
        // Hide loading state
        toggleLoadingState(document.getElementById('complaintForm'), false);
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
            submitButton.innerHTML = '<span class="spinner"></span> Submitting...';
        } else {
            const originalText = submitButton.getAttribute('data-original-text');
            if (originalText) {
                submitButton.textContent = originalText;
            }
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initComplaintForm);