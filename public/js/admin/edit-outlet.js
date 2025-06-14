document.addEventListener('DOMContentLoaded', async () => {
    const outletId = new URLSearchParams(window.location.search).get('id');
    const editOutletForm = document.getElementById('editOutletForm');
    const outletNameInput = document.getElementById('outletName');
    const outletDescriptionTextarea = document.getElementById('outletDescription');
    const outletLocationInput = document.getElementById('outletLocation');
    const currentImageElement = document.getElementById('currentImage');
    const outletImageInput = document.getElementById('outletImage');
    const messageDiv = document.getElementById('message');
    const logoutBtn = document.getElementById('logoutBtn');

    // Helper to get token
    const getToken = () => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            window.location.href = '/admin/login.html';
            return null;
        }
        return token;
    };

    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('adminToken');
            window.location.href = '/admin/login.html';
        });
    }

    // Fetch outlet details and populate form
    const fetchOutletDetails = async () => {
        const token = getToken();
        if (!token) return;

        if (!outletId) {
            messageDiv.textContent = 'No outlet ID found in URL.';
            messageDiv.style.color = 'red';
            return;
        }

        try {
            const response = await fetch(`/api/outlets/${outletId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const outlet = await response.json();
                outletNameInput.value = outlet.name;
                outletDescriptionTextarea.value = outlet.description || '';
                outletLocationInput.value = outlet.location || '';
                if (outlet.image) {
                    currentImageElement.src = `/uploads/outlets/${outlet.image}`;
                    currentImageElement.style.display = 'block';
                } else {
                    currentImageElement.style.display = 'none';
                }

            } else {
                messageDiv.textContent = `Failed to fetch outlet details: ${response.statusText}`;
                messageDiv.style.color = 'red';
            }
        } catch (error) {
            console.error('Error fetching outlet details:', error);
            messageDiv.textContent = 'An error occurred while fetching outlet details.';
            messageDiv.style.color = 'red';
        }
    };

    // Handle form submission
    editOutletForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageDiv.textContent = ''; // Clear previous messages

        const token = getToken();
        if (!token) return;

        const formData = new FormData();
        formData.append('name', outletNameInput.value);
        formData.append('description', outletDescriptionTextarea.value);
        formData.append('location', outletLocationInput.value);

        if (outletImageInput.files.length > 0) {
            formData.append('image', outletImageInput.files[0]);
        }

        try {
            const response = await fetch(`/api/outlets/${outletId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                messageDiv.textContent = data.message || 'Outlet updated successfully!';
                messageDiv.style.color = 'green';
                // Optionally redirect or refresh data
                // window.location.href = '/admin/outlets.html';
            } else {
                messageDiv.textContent = data.message || 'Failed to update outlet.';
                messageDiv.style.color = 'red';
            }
        } catch (error) {
            console.error('Error updating outlet:', error);
            messageDiv.textContent = 'An error occurred during outlet update.';
            messageDiv.style.color = 'red';
        }
    });

    // Initial fetch
    fetchOutletDetails();
}); 