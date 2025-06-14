// Menu Items Management
class MenuManager {
    constructor() {
        this.menuItems = [];
        this.currentCategory = 'all';
        this.init();
    }

    async init() {
        await this.fetchMenuItems();
        this.setupEventListeners();
        this.renderMenuItems();
    }

    async fetchMenuItems() {
        try {
            const response = await fetch('/api/items');
            this.menuItems = await response.json();
        } catch (error) {
            console.error('Error fetching menu items:', error);
            // For development, use sample data
            this.menuItems = this.getSampleData();
        }
    }

    setupEventListeners() {
        const categoryButtons = document.querySelectorAll('.category-btn');
        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.handleCategoryChange(button);
            });
        });
    }

    handleCategoryChange(button) {
        // Update active button
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');

        // Update current category and render items
        this.currentCategory = button.dataset.category;
        this.renderMenuItems();
    }

    renderMenuItems() {
        const menuContainer = document.getElementById('menuItems');
        const filteredItems = this.currentCategory === 'all' 
            ? this.menuItems 
            : this.menuItems.filter(item => item.category === this.currentCategory);

        menuContainer.innerHTML = filteredItems.map(item => this.createMenuItemHTML(item)).join('');
    }

    createMenuItemHTML(item) {
        // Format price with comma for thousands and Nigerian Naira symbol
        const formattedPrice = new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 2 // Ensure two decimal places for currency
        }).format(item.price);

        return `
            <div class="menu-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="menu-item-content">
                    <div class="menu-item-header">
                        <h3 class="menu-item-title">${item.name}</h3>
                        <span class="menu-item-price">${formattedPrice}</span>
                    </div>
                    <p class="menu-item-description">${item.description}</p>
                    <span class="menu-item-category">${item.category}</span>
                </div>
            </div>
        `;
    }

    // Sample data for development
    getSampleData() {
        return [
            {
                id: 1,
                name: 'Classic Burger',
                description: 'Juicy beef patty with fresh vegetables and special sauce',
                price: 12.99,
                category: 'main',
                image: '../images/burger.jpg'
            },
            {
                id: 2,
                name: 'Caesar Salad',
                description: 'Fresh romaine lettuce with parmesan and croutons',
                price: 8.99,
                category: 'starters',
                image: '../images/salad.jpg'
            },
            {
                id: 3,
                name: 'Chocolate Cake',
                description: 'Rich chocolate cake with ganache frosting',
                price: 6.99,
                category: 'desserts',
                image: '../images/cake.jpg'
            },
            {
                id: 4,
                name: 'Fresh Orange Juice',
                description: 'Freshly squeezed orange juice',
                price: 4.99,
                category: 'drinks',
                image: '../images/juice.jpg'
            }
        ];
    }
}

// Initialize Menu Manager
document.addEventListener('DOMContentLoaded', () => {
    new MenuManager();
}); 