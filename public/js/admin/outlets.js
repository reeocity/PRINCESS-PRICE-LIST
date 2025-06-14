// Admin Outlets Management
const getToken = () => localStorage.getItem('adminToken');

// Fetch all outlets
async function fetchOutlets() {
    const token = getToken();
    const res = await fetch('/api/outlets', { headers: { 'Authorization': `Bearer ${token}` } });
    return await res.json();
}

// Render all outlets
function renderOutlets(outlets) {
    const list = document.getElementById('outletsList');
    list.innerHTML = outlets.map(outlet => `
        <div class="outlet-card">
            <div class="outlet-image-container">
                <img src="${outlet.image}" alt="${outlet.name}">
                <div class="outlet-logo-overlay">
                    <img src="/uploads/outlets/logo.png" alt="Logo" class="outlet-logo">
                </div>
                <div class="outlet-name-overlay">${outlet.name}</div>
            </div>
            <div class="outlet-card-content">
                <p>${outlet.description}</p>
                <p><b>${outlet.openingHours}</b> | ${outlet.location}</p>
                <div class="outlet-actions">
                    <button class="edit-btn" onclick="editOutlet('${outlet._id}')">Edit</button>
                    <button class="delete-btn" onclick="deleteOutlet('${outlet._id}')">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Add new outlet
async function addOutlet(e) {
    e.preventDefault();
    const token = getToken();
    const form = document.getElementById('addOutletForm');
    const formData = new FormData();
    formData.append('name', document.getElementById('outletName').value);
    formData.append('description', document.getElementById('outletDescription').value);
    formData.append('openingHours', document.getElementById('outletOpeningHours').value);
    formData.append('location', document.getElementById('outletLocation').value);
    formData.append('image', document.getElementById('outletImage').files[0]);
    try {
        const res = await fetch('/api/outlets', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();
        if (res.ok) {
            alert('Outlet added!');
            form.reset();
            loadOutlets();
        } else {
            alert(data.message || 'Error adding outlet');
        }
    } catch (err) {
        alert('Error adding outlet');
    }
}

// Delete outlet
async function deleteOutlet(id) {
    if (!confirm('Delete this outlet?')) return;
    const token = getToken();
    try {
        const res = await fetch(`/api/outlets/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            loadOutlets();
        } else {
            alert('Error deleting outlet');
        }
    } catch (err) {
        alert('Error deleting outlet');
    }
}

// Load outlets
async function loadOutlets() {
    const outlets = await fetchOutlets();
    renderOutlets(outlets);
}

document.addEventListener('DOMContentLoaded', () => {
    if (!getToken()) window.location.href = '/admin/login.html';
    loadOutlets();
    document.getElementById('addOutletForm').addEventListener('submit', addOutlet);
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login.html';
    });
});

// Expose deleteOutlet globally
window.deleteOutlet = deleteOutlet;

// Edit outlet
function editOutlet(id) {
    window.location.href = `/admin/edit-outlet.html?id=${id}`;
} 