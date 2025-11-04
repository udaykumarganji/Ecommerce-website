// --- GLOBAL STATE ---
let products = []; // All products loaded from JSON
let cart = JSON.parse(localStorage.getItem('smartcart_cart')) || []; // Cart items
let currentTheme = localStorage.getItem('smartcart_theme') || 'light';

// --- DOM ELEMENTS (Common) ---
const cartCountBadge = document.getElementById('cart-count');
const themeToggleButton = document.getElementById('theme-toggle');
const scrollToTopButton = document.getElementById('scroll-to-top');

// --- UTILITY FUNCTIONS ---

// Function to fetch products from JSON
async function fetchProducts() {
    if (products.length === 0) { // Only fetch if not already loaded
        try {
            const response = await fetch('products.json');
            products = await response.json();
            // Assign categories if not present in each product for consistency (optional)
            products = products.map(p => ({ ...p, category: p.category || 'Uncategorized' }));
        } catch (error) {
            console.error('Error loading products:', error);
            // Fallback to dummy data if JSON fails
            products = [
                { id: 1, name: "Fallback Laptop", price: 500, image: "images/placeholder.webp", category: "Electronics", description: "A simple laptop.", rating: 3.5 },
                { id: 2, name: "Fallback Watch", price: 50, image: "images/placeholder.webp", category: "Wearables", description: "A simple watch.", rating: 2.0 }
            ];
        }
    }
    return products;
}

// Function to update cart count badge
function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCountBadge) {
        cartCountBadge.textContent = totalItems;
    }
}

// Function to save cart to localStorage
function saveCart() {
    localStorage.setItem('smartcart_cart', JSON.stringify(cart));
}

// Function to display a toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.classList.add('toast', type);
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger reflow to ensure transition works
    void toast.offsetWidth;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 3000); // Toast visible for 3 seconds
}

// Function to add a product to the cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        showToast('Product not found!', 'error');
        return;
    }

    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    saveCart();
    updateCartCount();
    showToast(`${product.name} added to cart!`);
}

// Function to remove a product from the cart
function removeFromCart(productId) {
    const product = products.find(p => p.id === productId);
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartCount();
    if (product) {
        showToast(`${product.name} removed from cart.`, 'error');
    } else {
        showToast('Item removed from cart.', 'error');
    }
    // Re-render cart if on the cart page
    if (document.body.classList.contains('cart-page')) {
        renderCart();
    }
}

// Function to change quantity in cart
function changeQuantity(productId, amount) {
    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantity += amount;
        if (cartItem.quantity <= 0) {
            removeFromCart(productId);
        }
        saveCart();
        updateCartCount();
        // Re-render cart if on the cart page
        if (document.body.classList.contains('cart-page')) {
            renderCart();
        }
    }
}

// --- THEME TOGGLE ---
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    currentTheme = theme;
    localStorage.setItem('smartcart_theme', theme);
    if (themeToggleButton) {
        themeToggleButton.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

function toggleTheme() {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
}

// --- SCROLL TO TOP ---
function toggleScrollToTopButton() {
    if (scrollToTopButton) {
        if (window.scrollY > 300) { // Show button after scrolling 300px
            scrollToTopButton.style.display = 'block';
        } else {
            scrollToTopButton.style.display = 'none';
        }
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- PAGE SPECIFIC LOGIC ---

// --- HOME PAGE LOGIC ---
async function initHomePage() {
    document.body.classList.add('home-page'); // Add a class for page-specific CSS/JS

    await fetchProducts(); // Ensure products are loaded

    // Banner Slider
    const sliderImages = document.querySelectorAll('.slider-image');
    const prevBtn = document.querySelector('.slider-nav .prev');
    const nextBtn = document.querySelector('.slider-nav .next');
    let currentSlide = 0;

    function showSlide(index) {
        sliderImages.forEach((img, i) => {
            img.classList.remove('active');
            if (i === index) {
                img.classList.add('active');
            }
        });
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % sliderImages.length;
        showSlide(currentSlide);
    }

    function prevSlide() {
        currentSlide = (currentSlide - 1 + sliderImages.length) % sliderImages.length;
        showSlide(currentSlide);
    }

    if (sliderImages.length > 0) {
        showSlide(currentSlide);
        prevBtn.addEventListener('click', prevSlide);
        nextBtn.addEventListener('click', nextSlide);
        setInterval(nextSlide, 5000); // Auto-advance every 5 seconds
    }

    // Render Featured Products
    const featuredProductsContainer = document.getElementById('featured-products-grid');
    if (featuredProductsContainer) {
        const featuredProducts = products.slice(0, 4); // Show first 4 as featured
        featuredProductsContainer.innerHTML = featuredProducts.map(product => `
            <div class="product-card">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <div class="rating">${'⭐'.repeat(Math.floor(product.rating))}</div>
                    <p class="price">\$${product.price.toFixed(2)}</p>
                    <button class="btn add-to-cart-btn" data-id="${product.id}">Add to Cart</button>
                </div>
            </div>
        `).join('');

        // Attach event listeners for 'Add to Cart' buttons
        featuredProductsContainer.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (e) => addToCart(parseInt(e.target.dataset.id)));
        });
    }
}

// --- PRODUCTS PAGE LOGIC ---
async function initProductsPage() {
    document.body.classList.add('products-page');

    await fetchProducts(); // Ensure products are loaded

    const productGrid = document.getElementById('product-listing-grid');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');

    // Populate category filter options
    const categories = [...new Set(products.map(p => p.category))];
    categoryFilter.innerHTML = '<option value="all">All Categories</option>' +
                               categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');

    function renderProducts(filteredProducts) {
        if (!productGrid) return;
        if (filteredProducts.length === 0) {
            productGrid.innerHTML = '<p class="empty-message">No products found matching your criteria.</p>';
            return;
        }

        productGrid.innerHTML = filteredProducts.map(product => `
            <div class="product-card">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <div class="rating">${'⭐'.repeat(Math.floor(product.rating))}</div>
                    <p class="price">\$${product.price.toFixed(2)}</p>
                    <button class="btn add-to-cart-btn" data-id="${product.id}">Add to Cart</button>
                </div>
            </div>
        `).join('');

        productGrid.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (e) => addToCart(parseInt(e.target.dataset.id)));
        });
    }

    function filterAndSearchProducts() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;

        let filtered = products;

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());
        }

        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchTerm) ||
                p.description.toLowerCase().includes(searchTerm) ||
                p.category.toLowerCase().includes(searchTerm)
            );
        }
        renderProducts(filtered);
    }

    // Initial render
    renderProducts(products);

    // Event listeners for filters
    searchInput.addEventListener('input', filterAndSearchProducts);
    categoryFilter.addEventListener('change', filterAndSearchProducts);

    // Apply category filter from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const initialCategory = urlParams.get('category');
    if (initialCategory) {
        categoryFilter.value = initialCategory;
        filterAndSearchProducts();
    }
}

// --- CART PAGE LOGIC ---
async function initCartPage() {
    document.body.classList.add('cart-page');

    await fetchProducts(); // Ensure products are loaded (for product details like images if not stored in cart directly)

    const cartItemsContainer = document.getElementById('cart-items-container');
    const subtotalEl = document.getElementById('subtotal');
    const shippingEl = document.getElementById('shipping');
    const totalEl = document.getElementById('total');
    const checkoutBtn = document.getElementById('checkout-btn');

    function calculateCartTotals() {
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const shipping = subtotal > 0 ? 10.00 : 0.00; // Example: \$10 shipping if cart not empty
        const total = subtotal + shipping;

        if (subtotalEl) subtotalEl.textContent = subtotal.toFixed(2);
        if (shippingEl) shippingEl.textContent = shipping.toFixed(2);
        if (totalEl) totalEl.textContent = total.toFixed(2);

        if (checkoutBtn) {
            checkoutBtn.disabled = cart.length === 0;
            if (cart.length === 0) {
                checkoutBtn.classList.add('btn-secondary');
                checkoutBtn.classList.remove('btn-primary');
            } else {
                checkoutBtn.classList.remove('btn-secondary');
                checkoutBtn.classList.add('btn-primary');
            }
        }

        if (cart.length === 0 && cartItemsContainer) {
            cartItemsContainer.innerHTML = '<p class="empty-cart-message">Your cart is empty. <a href="products.html">Start Shopping!</a></p>';
        }
    }

    window.renderCart = function() { // Make global for external calls if needed (e.g., from removeFromCart)
        if (!cartItemsContainer) return;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart-message">Your cart is empty. <a href="products.html">Start Shopping!</a></p>';
        } else {
            cartItemsContainer.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <p class="price">\$${item.price.toFixed(2)}</p>
                        <div class="quantity-controls">
                            <button onclick="changeQuantity(${item.id}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="changeQuantity(${item.id}, 1)">+</button>
                        </div>
                    </div>
                    <button class="remove-item" onclick="removeFromCart(${item.id})">Remove</button>
                </div>
            `).join('');
        }
        calculateCartTotals();
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            showToast('Proceeding to checkout (not functional in this demo).', 'success');
            // Here you'd typically redirect to a checkout page or perform an AJAX request
        });
    }

    renderCart();
}

// --- CONTACT PAGE LOGIC ---
function initContactPage() {
    document.body.classList.add('contact-page');

    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Prevent default form submission

            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const messageInput = document.getElementById('message');

            let isValid = true;

            // Basic Name Validation
            if (nameInput.value.trim() === '') {
                displayError(nameInput, 'Name is required.');
                isValid = false;
            } else {
                clearError(nameInput);
            }

            // Basic Email Validation
            if (emailInput.value.trim() === '') {
                displayError(emailInput, 'Email is required.');
                isValid = false;
            } else if (!isValidEmail(emailInput.value.trim())) {
                displayError(emailInput, 'Please enter a valid email address.');
                isValid = false;
            } else {
                clearError(emailInput);
            }

            // Basic Message Validation
            if (messageInput.value.trim() === '') {
                displayError(messageInput, 'Message cannot be empty.');
                isValid = false;
            } else {
                clearError(messageInput);
            }

            if (isValid) {
                // Here you would typically send the form data to a server
                showToast('Message sent successfully!', 'success');
                contactForm.reset(); // Clear the form
            } else {
                showToast('Please correct the errors in the form.', 'error');
            }
        });
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function displayError(inputElement, message) {
        let errorSpan = inputElement.nextElementSibling;
        if (!errorSpan || !errorSpan.classList.contains('error-message')) {
            errorSpan = document.createElement('span');
            errorSpan.classList.add('error-message');
            inputElement.parentNode.insertBefore(errorSpan, inputElement.nextSibling);
        }
        errorSpan.textContent = message;
        inputElement.style.borderColor = 'var(--error-color)';
    }

    function clearError(inputElement) {
        const errorSpan = inputElement.nextElementSibling;
        if (errorSpan && errorSpan.classList.contains('error-message')) {
            errorSpan.remove();
        }
        inputElement.style.borderColor = 'var(--border-color)';
    }
}

// --- GLOBAL INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Apply saved theme
    applyTheme(currentTheme);

    // Initialize common elements
    updateCartCount();
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', toggleTheme);
    }
    if (scrollToTopButton) {
        scrollToTopButton.addEventListener('click', scrollToTop);
    }
    window.addEventListener('scroll', toggleScrollToTopButton);


    // Initialize page-specific scripts
    const path = window.location.pathname;

    if (path.includes('products.html')) {
        initProductsPage();
    } else if (path.includes('cart.html')) {
        initCartPage();
    } else if (path.includes('contact.html')) {
        initContactPage();
    } else { // Default to home page if no specific match
        initHomePage();
    }
});