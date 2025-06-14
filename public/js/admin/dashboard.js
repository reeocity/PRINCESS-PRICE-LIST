// Check authentication
const checkAuth = () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/admin/login.html';
    }
    return token;
};

// Fetch dashboard data
const fetchDashboardData = async () => {
    const token = checkAuth();
    try {
        const [itemsResponse, outletsResponse, usersResponse] = await Promise.all([
            fetch('/api/items', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }),
            fetch('/api/outlets', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }),
            fetch('/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
        ]);

        const items = await itemsResponse.json();
        const outlets = await outletsResponse.json();
        const users = await usersResponse.json();

        // Update stats
        document.getElementById('totalItems').textContent = items.length;
        document.getElementById('totalOutlets').textContent = outlets.length;
        document.getElementById('totalUsers').textContent = users.length;

        // Display recent items
        const recentItems = items.slice(0, 6); // Get 6 most recent items
        displayRecentItems(recentItems);
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
    }
};

// Display recent items
const displayRecentItems = (items) => {
    const recentItemsContainer = document.getElementById('recentItems');
    recentItemsContainer.innerHTML = items.map(item => `
        <div class="item-card">
            <img src="${item.image}" alt="${item.name}">
            <div class="item-card-content">
                <h3>${item.name}</h3>
                <p>$${item.price.toFixed(2)}</p>
                <p>${item.category}</p>
                <div class="item-actions">
                    <button class="edit-btn" onclick="editItem('${item._id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="delete-btn" onclick="deleteItem('${item._id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
};

// Handle logout
const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login.html';
};

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardData();
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
});

// Edit item
const editItem = (itemId) => {
    window.location.href = `/admin/edit-item.html?id=${itemId}`;
};

// Delete item
const deleteItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    const token = checkAuth();
    try {
        const response = await fetch(`/api/items/${itemId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            fetchDashboardData(); // Refresh the dashboard
        } else {
            alert('Error deleting item');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        alert('Error deleting item');
    }
}; 