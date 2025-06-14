document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.querySelector('.outlets-grid');
    if (!grid) return;
    try {
        const res = await fetch('/api/outlets');
        const outlets = await res.json();
        grid.innerHTML = outlets.map(outlet => `
            <div class="outlet-card">
                <img src="${outlet.image}" alt="${outlet.name}">
                <div class="outlet-info">
                    <h2>${outlet.name}</h2>
                    <p>${outlet.description}</p>
                    <a href="outlets/menu.html?outlet=${outlet._id}" class="btn">View Menu</a>
                </div>
            </div>
        `).join('');
    } catch (err) {
        grid.innerHTML = '<p>Failed to load outlets.</p>';
    }
}); 