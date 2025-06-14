document.addEventListener('DOMContentLoaded', async () => {
    const itemId = new URLSearchParams(window.location.search).get('id');
    const editItemForm = document.getElementById('editItemForm');
    const itemNameInput = document.getElementById('itemName');
    const itemDescriptionTextarea = document.getElementById('itemDescription');
    const itemCategoryInput = document.getElementById('itemCategory');
    const currentImageElement = document.getElementById('currentImage');
    const itemImageInput = document.getElementById('itemImage');
    const outletPricesContainer = document.getElementById('outletPricesContainer');
    const addOutletPriceButton = document.getElementById('addOutletPrice');
    const messageDiv = document.getElementById('message');
    const logoutBtn = document.getElementById('logoutBtn');

    let allOutlets = [];

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

    // Fetch all outlets for dropdowns
    const fetchOutlets = async () => {
        const token = getToken();
        if (!token) return;
        try {
            const response = await fetch('/api/outlets', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                allOutlets = await response.json();
            } else {
                console.error('Failed to fetch outlets');
            }
        } catch (error) {
            console.error('Error fetching outlets:', error);
        }
    };

    // Function to add a new outlet price group
    const addOutletPriceGroup = (outletId = '', price = '') => {
        const div = document.createElement('div');
        div.className = 'form-group outlet-price-group';
        div.innerHTML = `
            <label>Outlet & Price:</label>
            <select class="outlet-select" required>
                <option value="">Select Outlet</option>
                ${allOutlets.map(outlet => `
                    <option value="${outlet._id}" ${outlet._id === outletId ? 'selected' : ''}>
                        ${outlet.name}
                    </option>
                `).join('')}
            </select>
            <input type="number" class="price-input" placeholder="Price" value="${price}" required>
            <button type="button" class="btn remove-outlet-price">Remove</button>
        `;
        outletPricesContainer.appendChild(div);

        div.querySelector('.remove-outlet-price').addEventListener('click', () => {
            div.remove();
        });
    };

    // Fetch item details and populate form
    const fetchItemDetails = async () => {
        const token = getToken();
        if (!token) return;

        if (!itemId) {
            messageDiv.textContent = 'No item ID found in URL.';
            messageDiv.style.color = 'red';
            return;
        }

        try {
            const response = await fetch(`/api/items/${itemId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const item = await response.json();
                itemNameInput.value = item.name;
                itemDescriptionTextarea.value = item.description || '';
                itemCategoryInput.value = item.category || '';
                if (item.image) {
                    currentImageElement.src = `/uploads/items/${item.image}`;
                    currentImageElement.style.display = 'block';
                } else {
                    currentImageElement.style.display = 'none';
                }

                outletPricesContainer.innerHTML = ''; // Clear existing
                item.outletPrices.forEach(op => {
                    addOutletPriceGroup(op.outlet._id, op.price);
                });

            } else {
                messageDiv.textContent = `Failed to fetch item details: ${response.statusText}`;
                messageDiv.style.color = 'red';
            }
        } catch (error) {
            console.error('Error fetching item details:', error);
            messageDiv.textContent = 'An error occurred while fetching item details.';
            messageDiv.style.color = 'red';
        }
    };

    // Handle form submission
    editItemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageDiv.textContent = ''; // Clear previous messages

        const token = getToken();
        if (!token) return;

        const formData = new FormData();
        formData.append('name', itemNameInput.value);
        formData.append('description', itemDescriptionTextarea.value);
        formData.append('category', itemCategoryInput.value);

        if (itemImageInput.files.length > 0) {
            formData.append('image', itemImageInput.files[0]);
        }

        const outletPrices = [];
        document.querySelectorAll('.outlet-price-group').forEach(group => {
            const outletId = group.querySelector('.outlet-select').value;
            const price = parseFloat(group.querySelector('.price-input').value);
            if (outletId && !isNaN(price)) {
                outletPrices.push({ outlet: outletId, price: price });
            }
        });
        formData.append('outletPrices', JSON.stringify(outletPrices));

        try {
            const response = await fetch(`/api/items/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                messageDiv.textContent = data.message || 'Item updated successfully!';
                messageDiv.style.color = 'green';
                // Optionally redirect or refresh data
                // window.location.href = '/admin/items.html';
            } else {
                messageDiv.textContent = data.message || 'Failed to update item.';
                messageDiv.style.color = 'red';
            }
        } catch (error) {
            console.error('Error updating item:', error);
            messageDiv.textContent = 'An error occurred during item update.';
            messageDiv.style.color = 'red';
        }
    });

    addOutletPriceButton.addEventListener('click', () => addOutletPriceGroup());

    // Initial fetches
    await fetchOutlets();
    fetchItemDetails();
}); 