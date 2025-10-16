// Function to check if a complaint is a potential duplicate
async function checkForDuplicates(complaint) {
    try {
        // Calculate the timestamp for 48 hours ago
        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - 48);
        
        // Get complaints in the same category and nearby location
        const params = new URLSearchParams({
            category: complaint.category,
            minLat: complaint.locationLat - 0.002, // Approximately 200m in latitude
            maxLat: complaint.locationLat + 0.002,
            minLng: complaint.locationLng - 0.002, // Approximately 200m in longitude
            maxLng: complaint.locationLng + 0.002,
            startDate: cutoffDate.toISOString()
        });
        
        const response = await fetch(`/api/complaints/search?${params}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to search for duplicates');
        }
        
        const data = await response.json();
        
        // If we found any potential duplicates, return them
        if (data.content && data.content.length > 0) {
            return data.content;
        }
        
        return [];
    } catch (error) {
        console.error('Error checking for duplicates:', error);
        return [];
    }
}

// Function to show duplicate warning modal
function showDuplicateWarning(potentialDuplicates) {
    const modal = document.getElementById('duplicateWarningModal');
    const duplicateList = document.getElementById('duplicateList');
    
    // Clear previous duplicates
    duplicateList.innerHTML = '';
    
    // Add each potential duplicate to the list
    potentialDuplicates.forEach(duplicate => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item';
        listItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h5>${duplicate.title}</h5>
                    <p class="mb-1">${duplicate.category} - ${new Date(duplicate.createdAt).toLocaleString()}</p>
                    <p class="text-muted">${duplicate.description.substring(0, 100)}${duplicate.description.length > 100 ? '...' : ''}</p>
                </div>
                <button class="btn btn-sm btn-primary view-duplicate" data-id="${duplicate.complaintId}">
                    View
                </button>
            </div>
        `;
        duplicateList.appendChild(listItem);
    });
    
    // Show the modal
    $(modal).modal('show');
}

// Handle form submission with duplicate detection
document.getElementById('complaintForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    // Get form data
    const formData = new FormData(this);
    const complaint = {
        title: formData.get('title'),
        category: formData.get('category'),
        description: formData.get('description'),
        locationLat: parseFloat(formData.get('locationLat')),
        locationLng: parseFloat(formData.get('locationLng'))
    };
    
    // Check for potential duplicates before submission
    const potentialDuplicates = await checkForDuplicates(complaint);
    
    if (potentialDuplicates.length > 0) {
        // Show warning modal
        showDuplicateWarning(potentialDuplicates);
        
        // Handle "Submit Anyway" action
        document.getElementById('submitAnyway').addEventListener('click', () => {
            submitComplaint(formData);
            $('#duplicateWarningModal').modal('hide');
        });
        
        // Handle "View Existing" action
        document.querySelectorAll('.view-duplicate').forEach(button => {
            button.addEventListener('click', () => {
                const duplicateId = button.getAttribute('data-id');
                window.location.href = `/complaint-detail.html?id=${duplicateId}`;
            });
        });
    } else {
        // No duplicates found, proceed with submission
        submitComplaint(formData);
    }
});

// Function to submit the complaint to the server
async function submitComplaint(formData) {
    try {
        const response = await fetch('/api/complaints', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            },
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit complaint');
        }
        
        const data = await response.json();
        
        // If the complaint is marked as a duplicate on the server side
        if (data.isDuplicate && data.originalComplaintId) {
            showSuccessWithDuplicateInfo(data);
        } else {
            // Show success message and redirect
            showSuccess();
            setTimeout(() => {
                window.location.href = '/complaints.html';
            }, 2000);
        }
    } catch (error) {
        console.error('Error submitting complaint:', error);
        showError('Failed to submit complaint. Please try again later.');
    }
}

// Function to show success message with duplicate info
function showSuccessWithDuplicateInfo(complaint) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-warning';
    alertDiv.innerHTML = `
        <h4>Complaint Submitted as Duplicate</h4>
        <p>Your complaint has been submitted but was marked as a duplicate of an existing complaint.</p>
        <p>You can view the original complaint 
           <a href="/complaint-detail.html?id=${complaint.originalComplaintId}">here</a>.</p>
    `;
    
    const formContainer = document.querySelector('.form-container');
    formContainer.prepend(alertDiv);
    
    // Hide the form
    document.getElementById('complaintForm').style.display = 'none';
}