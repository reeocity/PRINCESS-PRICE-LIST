document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const outletId = params.get('outlet');
    const menuContainer = document.getElementById('menuItems');
    const outletName = document.getElementById('outletName');
    const outletDesc = document.getElementById('outletDesc');
    if (!outletId) {
        menuContainer.innerHTML = '<p>Invalid outlet.</p>';
        return;
    }
    try {
        // Fetch outlet info
        const outletRes = await fetch(`/api/outlets/${outletId}`);
        const outlet = await outletRes.json();
        outletName.textContent = outlet.name;
        outletDesc.textContent = outlet.description;
        // Fetch items for this outlet
        const res = await fetch(`/api/items/outlet/${outletId}`);
        const items = await res.json();
        if (!items.length) {
            menuContainer.innerHTML = '<p>No menu items found for this outlet.</p>';
            return;
        }
        menuContainer.innerHTML = items.map(item => `
            <div class="menu-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="menu-item-content">
                    <div class="menu-item-header">
                        <h3 class="menu-item-title">${item.name}</h3>
                        ${(() => {
                            const outletPrice = item.outletPrices.find(op => op.outlet._id === outletId);
                            return `<span class="menu-item-price">₦${outletPrice ? outletPrice.price : 'N/A'}</span>`;
                        })()}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        menuContainer.innerHTML = '<p>Failed to load menu items.</p>';
    }
}); 