// Admin Items Management
const getToken = () => localStorage.getItem('adminToken');

// Fetch all items and outlets
async function fetchItemsAndOutlets() {
    const token = getToken();
    const [itemsRes, outletsRes] = await Promise.all([
        fetch('/api/items', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/outlets', { headers: { 'Authorization': `Bearer ${token}` } })
    ]);
    const items = await itemsRes.json();
    const outlets = await outletsRes.json();
    return { items, outlets };
}

// Create outlet price input group
function createOutletPriceInput(outlets, outletId = '', price = '') {
    
    const div = document.createElement('div');
    div.className = 'outlet-price-group';
    div.innerHTML = `
        <select class="outlet-select" required>
            <option value="">Select Outlet</option>
            ${outlets.map(o => `<option value="${o._id}" ${o._id === outletId ? 'selected' : ''}>${o.name}</option>`).join('')}
        </select>
        <input type="number" class="outlet-price" placeholder="Price" value="${price}" required>
        <button type="button" class="remove-outlet-price">Remove</button>
    `;
    return div;
}

// Initialize outlet prices
function initializeOutletPrices(outlets) {
    const container = document.getElementById('outletPricesList');
    container.innerHTML = '';
    container.appendChild(createOutletPriceInput(outlets));
}

// Add new outlet price input
function addOutletPrice(outlets) {
    const container = document.getElementById('outletPricesList');
    container.appendChild(createOutletPriceInput(outlets));
}

// Render all items
// Render all items
function renderItems(items) {
    const list = document.getElementById('itemsList');
    list.innerHTML = items.map(item => `
        <div class="item-card medium-grid">
            <img src="${item.image}" alt="${item.name}" style="width: 120px; height: 120px; object-fit: cover; margin: 0.5rem auto; display: block; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <div style="padding: 0.5rem 0; text-align: center;">
                <h3 style="font-size: 1rem; margin: 0.5rem 0 0.3rem 0;">${item.name}</h3>
                <div class="outlet-prices" style="margin-bottom: 0.5rem;">
                    ${item.outletPrices.map(op => `
                        <p style=\"margin:0;font-size:0.8rem;\"><b>${op.outlet.name}:</b> ₦${op.price}</p>
                    `).join('')}
                </div>
                <div class="item-actions" style="justify-content: center;">
                    <button class="edit-btn" onclick="editItem('${item._id}')">Edit</button>
                    <button class="delete-btn" onclick="deleteItem('${item._id}')">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Edit item (placeholder for now)
function editItem(id) {
    // alert('Edit item functionality for ' + id + ' will be implemented here.');
    // In a real application, you would redirect to an edit page or open a modal
    window.location.href = `/admin/edit-item.html?id=${id}`;
}

// Add new item
async function addItem(e) {
    e.preventDefault();
    const token = getToken();
    const form = document.getElementById('addItemForm');
    const formData = new FormData();
    
    formData.append('name', document.getElementById('itemName').value);
    formData.append('description', document.getElementById('itemDescription').value);
    formData.append('category', document.getElementById('itemCategory').value);
    formData.append('image', document.getElementById('itemImage').files[0]);

    // Collect outlet prices
    const outletPrices = [];
    document.querySelectorAll('.outlet-price-group').forEach(group => {
        const outletId = group.querySelector('.outlet-select').value;
        const price = group.querySelector('.outlet-price').value;
        if (outletId && price) {
            outletPrices.push({ outlet: outletId, price: parseFloat(price) });
        }
    });
    formData.append('outletPrices', JSON.stringify(outletPrices));

    try {
        const res = await fetch('/api/items', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();
        if (res.ok) {
            alert('Item added!');
            form.reset();
            loadItems();
        } else {
            alert(data.message || 'Error adding item');
        }
    } catch (err) {
        alert('Error adding item');
    }
}

// Delete item
async function deleteItem(id) {
    if (!confirm('Delete this item?')) return;
    const token = getToken();
    try {
        const res = await fetch(`/api/items/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            loadItems();
        } else {
            alert('Error deleting item');
        }
    } catch (err) {
        alert('Error deleting item');
    }
}

// Load items and outlets
async function loadItems() {
    const { items, outlets } = await fetchItemsAndOutlets();
    initializeOutletPrices(outlets);
    renderItems(items);
}

document.addEventListener('DOMContentLoaded', () => {
    if (!getToken()) window.location.href = '/admin/login.html';
    loadItems();
    
    // Add event listeners
    document.getElementById('addItemForm').addEventListener('submit', addItem);
    document.getElementById('addOutletPrice').addEventListener('click', () => {
        const outlets = Array.from(document.querySelectorAll('.outlet-select option'))
            .map(opt => ({ _id: opt.value, name: opt.textContent }));
        addOutletPrice(outlets);
    });
    
    // Event delegation for remove buttons
    document.getElementById('outletPricesList').addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-outlet-price')) {
            const container = document.getElementById('outletPricesList');
            if (container.children.length > 1) {
                e.target.closest('.outlet-price-group').remove();
            } else {
                alert('At least one outlet price is required');
            }
        }
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login.html';
    });

    // Purge all items
    document.getElementById('purgeItemsBtn').addEventListener('click', async () => {
        if (!confirm('Are you sure you want to delete ALL items? This action cannot be undone.')) {
            return;
        }

        const token = getToken();
        if (!token) return;

        try {
            const response = await fetch('/api/items/purge', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message || 'All items purged successfully!');
                loadItems(); // Refresh the item list
            } else {
                alert(data.message || 'Failed to purge items.');
            }
        } catch (error) {
            console.error('Error purging items:', error);
            alert('An error occurred during the purge operation.');
        }
    });
});

// Expose deleteItem globally
window.deleteItem = deleteItem; 