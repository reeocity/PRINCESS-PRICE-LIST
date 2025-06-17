document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const slideshowList = document.getElementById('slideshowList');
    const logoutBtn = document.getElementById('logoutBtn');
    const imageInput = document.getElementById('images');
    const imagePreview = document.getElementById('imagePreview');
    let selectedFiles = new Map(); // Store selected files with their preview IDs

    // Check authentication
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/admin/login.html';
        return;
    }

    // Load slideshow images
    loadSlideshowImages();

    // Handle file selection
    imageInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                const previewId = 'preview-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                
                reader.onload = (e) => {
                    const previewItem = document.createElement('div');
                    previewItem.className = 'preview-item';
                    previewItem.id = previewId;
                    previewItem.innerHTML = `
                        <button type="button" class="remove-preview" onclick="removePreview('${previewId}')">×</button>
                        <img src="${e.target.result}" alt="Preview">
                        <input type="text" class="caption-input" placeholder="Caption (optional)" name="caption-${previewId}">
                    `;
                    imagePreview.appendChild(previewItem);
                    selectedFiles.set(previewId, file);
                };
                
                reader.readAsDataURL(file);
            }
        });
    });

    // Handle form submission
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (selectedFiles.size === 0) {
            alert('Please select at least one image to upload.');
            return;
        }

        const uploadPromises = Array.from(selectedFiles.entries()).map(async ([previewId, file]) => {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('isActive', 'true');
            
            // Get caption if provided
            const captionInput = document.querySelector(`#${previewId} .caption-input`);
            if (captionInput && captionInput.value.trim()) {
                formData.append('caption', captionInput.value.trim());
            }

            try {
                const response = await fetch('/api/slideshow/upload', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`Failed to upload ${file.name}`);
                }

                return response.json();
            } catch (error) {
                console.error('Error uploading:', error);
                throw error;
            }
        });

        try {
            await Promise.all(uploadPromises);
            // Clear form and preview
            uploadForm.reset();
            imagePreview.innerHTML = '';
            selectedFiles.clear();
            // Reload slideshow images
            loadSlideshowImages();
            alert('All images uploaded successfully!');
        } catch (error) {
            console.error('Error:', error);
            alert('Some images failed to upload. Please try again.');
        }
    });

    // Handle logout
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login.html';
    });

    // Function to load slideshow images
    async function loadSlideshowImages() {
        try {
            const response = await fetch('/api/slideshow', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const images = await response.json();

            if (images.length === 0) {
                slideshowList.innerHTML = '<p>No slideshow images found.</p>';
                return;
            }

            slideshowList.innerHTML = images.map(image => `
                <div class="slideshow-item" data-id="${image._id}">
                    <img src="${image.imageUrl}" alt="${image.caption || 'Slideshow image'}" style="max-width: 200px;">
                    <div class="slideshow-item-details">
                        <p><strong>Caption:</strong> ${image.caption || 'None'}</p>
                        <div class="slideshow-item-actions">
                            <button onclick="toggleImageStatus('${image._id}', ${!image.isActive})" class="btn btn-small ${image.isActive ? 'btn-success' : 'btn-warning'}">
                                ${image.isActive ? 'Active' : 'Inactive'}
                            </button>
                            <button onclick="editImage('${image._id}')" class="btn btn-small btn-primary">Edit Caption</button>
                            <button onclick="deleteImage('${image._id}')" class="btn btn-small btn-danger">Delete</button>
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error:', error);
            slideshowList.innerHTML = '<p>Error loading slideshow images.</p>';
        }
    }
});

// Function to remove a preview
window.removePreview = function(previewId) {
    const previewElement = document.getElementById(previewId);
    if (previewElement) {
        previewElement.remove();
        selectedFiles.delete(previewId);
    }
};

// Function to toggle image status
async function toggleImageStatus(id, newStatus) {
    try {
        const response = await fetch(`/api/slideshow/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({
                isActive: newStatus
            })
        });

        if (!response.ok) {
            throw new Error('Update failed');
        }

        // Reload images
        loadSlideshowImages();
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to update image status. Please try again.');
    }
}

// Function to edit image caption
async function editImage(id) {
    const newCaption = prompt('Enter new caption:');
    if (newCaption === null) return;

    try {
        const response = await fetch(`/api/slideshow/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({
                caption: newCaption
            })
        });

        if (!response.ok) {
            throw new Error('Update failed');
        }

        // Reload images
        loadSlideshowImages();
        alert('Caption updated successfully!');
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to update caption. Please try again.');
    }
}

// Function to delete image
async function deleteImage(id) {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
        const response = await fetch(`/api/slideshow/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (!response.ok) {
            throw new Error('Delete failed');
        }

        // Reload images
        loadSlideshowImages();
        alert('Image deleted successfully!');
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete image. Please try again.');
    }
} 