/* ============================================================
   script.js — Indah's Beauté Atelier E-Commerce (FIREBASE VERSION)
   Single Source of Truth: All data stored in Firestore
   Developed by Indah Kirana Putri
   ============================================================ */

// ========== GLOBAL STATE ==========
let products = [];
let cart = [];
let orders = [];
let currentFilter = "semua";
let searchQuery = "";
let appliedVoucher = null;
let currentUser = null;
let unsubscribeProducts = null;
let unsubscribeCart = null;
let unsubscribeOrders = null;

const CATEGORY_LABEL_TO_KEY = {
  "skincare": "skincare",
  "bodycare": "bodycare",
  "haircare": "haircare",
  "makeup": "makeup",
  "perfume": "parfum",
  "parfum": "parfum",
  "semua": "semua",
  "Skincare": "skincare",
  "Bodycare": "bodycare",
  "Haircare": "haircare",
  "Makeup": "makeup",
  "Perfume": "parfum",
  "Parfum": "parfum"
};

const vouchers = {
  BEAUTE20: { value: 10, maxDiscount: 50000 },
  LIFA10: { value: 10, maxDiscount: 50000 }
};

// ========== INITIALIZATION ==========
function initializeApp() {
  console.log("🚀 Initializing Indah's Beauté Atelier...");

  // Check Firebase is ready
  if (typeof db === 'undefined') {
    console.error("❌ Firebase not initialized. Please check firebase-config.js");
    return;
  }

  // Listen to auth state
  auth.onAuthStateChanged((user) => {
    currentUser = user;
    updateNavAuth();
    
    if (user) {
      console.log("✅ User logged in:", user.email);
      // Setup cart listener for logged-in user
      if (unsubscribeCart) unsubscribeCart();
      unsubscribeCart = CartService.loadCartRealtime(user.uid, (items) => {
        cart = items;
        updateCartUI();
      });

      // Setup orders listener for logged-in user
      if (unsubscribeOrders) unsubscribeOrders();
      unsubscribeOrders = OrdersService.loadUserOrdersRealtime(user.uid, (userOrders) => {
        orders = userOrders;
      });
    } else {
      console.log("⚠️ User not logged in");
      cart = [];
      orders = [];
      updateNavAuth();
    }
  });

  // Load products (real-time, for all users)
  if (unsubscribeProducts) unsubscribeProducts();
  unsubscribeProducts = ProductsService.loadProductsRealtime((loadedProducts) => {
    products = loadedProducts;
    renderProducts(currentFilter);
    updateDetailAddToCartButton();
  });

  // Seed default products on first load
  ProductsService.seedDefaultProducts();

  // Initialize UI
  lucide.createIcons();
  updateDetailAddToCartButton();
  renderProducts("semua");
}

// Listen for Firebase initialization
if (typeof db !== 'undefined') {
  window.addEventListener('DOMContentLoaded', initializeApp);
  // Also call immediately if DOM is already ready
  if (document.readyState === 'loading') {
    // Wait for DOMContentLoaded
  } else {
    initializeApp();
  }
} else {
  console.warn("⚠️ Firebase SDK loading, will initialize when ready");
  // Retry after a delay
  setTimeout(() => {
    if (typeof db !== 'undefined') initializeApp();
  }, 2000);
}

// ========== NAVIGATION & AUTH ==========
function updateNavAuth() {
  const loginItem = document.getElementById("navLoginItem");
  const userItem = document.getElementById("navUserItem");
  const userName = document.getElementById("navUserName");

  if (!loginItem || !userItem) return;

  if (currentUser) {
    loginItem.style.display = "none";
    userItem.style.display = "flex";
    if (userName) {
      const displayName = currentUser.email?.split('@')[0] || "User";
      userName.textContent = "👤 " + capitalizeFirst(displayName);
    }
  } else {
    loginItem.style.display = "";
    userItem.style.display = "none";
  }
}

async function logoutUser() {
  try {
    await auth.signOut();
    cart = [];
    orders = [];
    showToast("👋 Berhasil keluar.");
  } catch (error) {
    console.error("❌ Logout error:", error);
    showToast("❌ Gagal keluar.");
  }
}

// ========== PRODUCT FUNCTIONS ==========
function normalizeFilterToCategoryKey(filter) {
  if (!filter) return "semua";
  const raw = String(filter).trim();
  return CATEGORY_LABEL_TO_KEY[raw] || CATEGORY_LABEL_TO_KEY[raw.toLowerCase()] || "semua";
}

function getCategoryLabelFromKey(categoryKey) {
  const k = String(categoryKey || "").toLowerCase();
  if (k === "skincare") return "Skincare";
  if (k === "bodycare") return "Bodycare";
  if (k === "haircare") return "Haircare";
  if (k === "makeup") return "Makeup";
  if (k === "parfum") return "Perfume";
  return "-";
}

function formatPrice(num) {
  return "Rp " + num.toLocaleString("id-ID");
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getFilteredProducts(filter = currentFilter) {
  const categoryKey = normalizeFilterToCategoryKey(filter);
  const categoryFiltered = categoryKey === "semua"
    ? products
    : products.filter(product => product.kategori === categoryKey);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  if (!normalizedQuery) return categoryFiltered;

  return categoryFiltered.filter(product => {
    const haystack = `${product.nama_produk} ${product.deskripsi} ${product.kategori}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}

function renderProducts(filter = "semua") {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;
  
  grid.innerHTML = "";
  const filtered = getFilteredProducts(filter);
  
  filtered.forEach((product, index) => {
    const stockCount = Number(product.stok || 0);
    const inStock = stockCount > 0;
    const stockLabel = inStock ? `${stockCount} tersisa` : `Stok habis`;
    
    const card = document.createElement("div");
    card.className = "product-card";
    card.style.animationDelay = `${index * 0.07}s`;
    
    const imageUrl = product.foto_produk || product.image || "";
    const hasImage = imageUrl && !imageUrl.startsWith('undefined');
    
    card.innerHTML = `
      <div class="product-img-wrapper">
        ${hasImage
          ? `<img src="${imageUrl}" alt="${product.nama_produk}" style="width:100%;height:100%;object-fit:cover;" onerror="this.onerror=null; this.style.display='none'; const fallback=this.parentElement.querySelector('.product-emoji'); if (fallback) fallback.style.display='flex';">
             <div class="product-emoji" style="display:none">${product.emoji}</div>`
          : `<div class="product-emoji">${product.emoji}</div>`}
        <span class="product-badge">${getCategoryLabelFromKey(product.kategori)}</span>
        ${product.hot ? '<span class="product-badge badge-hot">🔥 Terlaris</span>' : ""}
      </div>
      <div class="product-info">
        <h3 class="product-name">${product.nama_produk}</h3>
        <div class="product-category-line">Kategori: ${getCategoryLabelFromKey(product.kategori)}</div>
        <p class="product-desc">lihat semua</p>
        <div class="product-stock">${stockLabel}</div>
        <div class="product-footer">
          <div class="product-price" style="display:flex;flex-direction:column;gap:0.25rem;">
            <span>${formatPrice(product.harga)}</span>
            <button class="see-detail-btn" type="button" onclick="showProductDetail(${product.id})">
              <i class="fa-solid fa-eye"></i> Lihat Detail
            </button>
          </div>
          <button class="add-cart-btn" onclick="addToCart(${product.id})" ${inStock ? "" : "disabled"}>+ Keranjang</button>
        </div>
      </div>`;
    
    grid.appendChild(card);
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-light);"><div style="font-size:3rem;margin-bottom:1rem">🌿</div><p>Belum ada produk dalam kategori ini.</p></div>`;
  }
}

function filterProducts(category, btn) {
  currentFilter = category;
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  if (btn) {
    btn.classList.add("active");
  } else {
    const matchedBtn = document.querySelector(`.filter-btn[data-category="${category}"]`);
    if (matchedBtn) matchedBtn.classList.add("active");
  }
  renderProducts(category);
}

function openCategory(category) {
  const normalized = normalizeFilterToCategoryKey(category);
  const uiLabel = normalized === "parfum" ? "Perfume" : capitalizeFirst(normalized);
  filterProducts(uiLabel);
  hideDetailView();

  const productsSection = document.getElementById("products");
  if (productsSection) {
    const navbarHeight = document.querySelector(".navbar")?.offsetHeight || 0;
    const topPosition = productsSection.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 16;
    window.scrollTo({ top: topPosition, behavior: "smooth" });
  }
}

// ========== PRODUCT DETAIL ==========
let lastSelectedProductId = null;
let detailReady = false;

function showProductDetail(id) {
  const normalizedId = Number(id);
  lastSelectedProductId = normalizedId;

  const detailSection = document.getElementById("detailView");
  const productsSection = document.getElementById("products");
  const detailNotFound = document.getElementById("detailNotFound");
  if (!detailSection || !productsSection) return;

  const product = products.find(p => Number(p.id) === normalizedId);

  detailSection.style.display = "block";
  detailSection.classList.remove("fade-out-left");
  detailSection.classList.add("fade-in-right");

  if (productsSection) productsSection.style.display = "none";
  if (detailNotFound) detailNotFound.style.display = product ? "none" : "block";

  if (!product) {
    document.getElementById("detailProductImage") && (document.getElementById("detailProductImage").src = "");
    document.getElementById("detailProductEmoji") && (document.getElementById("detailProductEmoji").textContent = "");
    document.getElementById("detailProductCategory") && (document.getElementById("detailProductCategory").textContent = "-");
    document.getElementById("detailProductName") && (document.getElementById("detailProductName").textContent = "-");
    document.getElementById("detailProductPrice") && (document.getElementById("detailProductPrice").textContent = "-");
    document.getElementById("detailProductStock") && (document.getElementById("detailProductStock").textContent = "-");
    document.getElementById("detailProductDesc") && (document.getElementById("detailProductDesc").textContent = "Produk tidak ditemukan.");
    const btn = document.getElementById("detailAddToCartBtn");
    if (btn) btn.disabled = true;
    return;
  }

  const btn = document.getElementById("detailAddToCartBtn");
  if (btn) {
    btn.disabled = false;
    btn.setAttribute("onclick", `addToCart(${product.id})`);
  }

  const img = document.getElementById("detailProductImage");
  if (img) {
    img.src = product.foto_produk || product.image || "";
    img.onerror = function () {
      this.onerror = null;
      this.style.display = "none";
      const emojiEl = document.getElementById("detailProductEmoji");
      if (emojiEl) emojiEl.style.display = "inline-block";
    };
  }

  const emojiEl = document.getElementById("detailProductEmoji");
  if (emojiEl) emojiEl.textContent = product.emoji || "";

  const catEl = document.getElementById("detailProductCategory");
  if (catEl) catEl.textContent = getCategoryLabelFromKey(product.kategori || "-");

  const nameEl = document.getElementById("detailProductName");
  if (nameEl) nameEl.textContent = product.nama_produk || "-";

  const priceEl = document.getElementById("detailProductPrice");
  if (priceEl) priceEl.textContent = formatPrice(product.harga || 0);

  const stockCount = Number(product.stok || 0);
  const stockEl = document.getElementById("detailProductStock");
  if (stockEl) {
    stockEl.textContent = stockCount > 0 ? `${stockCount} tersisa` : "Stok habis";
    stockEl.style.color = stockCount > 0 ? "var(--green-deep)" : "#e05050";
  }

  const descEl = document.getElementById("detailProductDesc");
  if (descEl) descEl.textContent = product.deskripsi || "-";

  renderProductDetail();
}

function renderProductDetail() {
  detailReady = true;
}

function hideDetailView() {
  const detailSection = document.getElementById("detailView");
  const productsGrid = document.getElementById("productsGrid");
  const detailNotFound = document.getElementById("detailNotFound");
  if (detailSection) {
    detailSection.style.display = "none";
    detailSection.classList.remove("fade-in-right");
    detailSection.classList.add("fade-out-left");
  }
  if (productsGrid) productsGrid.style.display = "grid";
  if (detailNotFound) detailNotFound.style.display = "none";
}

function backToProducts() {
  const detailSection = document.getElementById("detailView");
  const productsGrid = document.getElementById("productsGrid");
  if (!detailSection) return;

  detailSection.classList.remove("fade-in-right");
  detailSection.classList.add("fade-out-left");

  setTimeout(() => {
    detailSection.style.display = "none";
    if (productsGrid) productsGrid.style.display = "grid";
    window.scrollTo({ top: document.getElementById("products")?.offsetTop || 0, behavior: "smooth" });
  }, 260);
}

function updateDetailAddToCartButton() {
  const btn = document.getElementById("detailAddToCartBtn");
  if (!btn) return;

  const product = products.find(p => Number(p.id) === Number(lastSelectedProductId));
  if (!product) {
    btn.disabled = true;
    btn.setAttribute("onclick", "return false;");
    return;
  }

  btn.disabled = !(Number(product.stok || 0) > 0);
  btn.setAttribute("onclick", `addToCart(${product.id})`);
}

// ========== CART FUNCTIONS ==========
async function addToCart(productId) {
  if (!currentUser) {
    showToast("⚠️ Silakan login terlebih dahulu untuk menambah keranjang.");
    window.location.href = "login.html";
    return;
  }

  try {
    const product = products.find(p => Number(p.id) === Number(productId));
    if (!product) {
      showToast("❌ Produk tidak ditemukan.");
      return;
    }

    if (Number(product.stok) <= 0) {
      showToast("❌ Stok produk habis.");
      return;
    }

    await CartService.addToCart(currentUser.uid, productId, product, 1);
    showToast("✅ Ditambahkan ke keranjang!");
  } catch (error) {
    console.error("Error adding to cart:", error);
    showToast("❌ Gagal menambahkan ke keranjang.");
  }
}

function updateCartUI() {
  const cartCountEl = document.getElementById("cartCount");
  if (cartCountEl) {
    const totalQty = cart.reduce((sum, item) => sum + Number(item.qty), 0);
    cartCountEl.textContent = totalQty;
  }

  const cartItemsContainer = document.getElementById("cartItems");
  if (!cartItemsContainer) return;

  cartItemsContainer.innerHTML = "";

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--text-light);">Keranjang kosong 🛒</div>`;
    document.getElementById("cartTotal") && (document.getElementById("cartTotal").textContent = formatPrice(0));
    return;
  }

  let total = 0;
  cart.forEach((item) => {
    const subtotal = item.harga * item.qty;
    total += subtotal;

    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <div class="cart-item-info">
        <div class="cart-item-name">${item.nama_produk}</div>
        <div class="cart-item-price">${formatPrice(item.harga)} × ${item.qty}</div>
      </div>
      <div class="cart-item-actions">
        <button class="cart-qty-btn" onclick="updateQty('${item.productId}', ${item.qty - 1})">−</button>
        <span class="cart-qty">${item.qty}</span>
        <button class="cart-qty-btn" onclick="updateQty('${item.productId}', ${item.qty + 1})">+</button>
        <button class="cart-remove-btn" onclick="removeFromCart('${item.productId}')">🗑️</button>
      </div>`;
    cartItemsContainer.appendChild(row);
  });

  document.getElementById("cartTotal") && (document.getElementById("cartTotal").textContent = formatPrice(total));
}

async function updateQty(productId, newQty) {
  if (!currentUser) return;

  if (newQty <= 0) {
    await removeFromCart(productId);
    return;
  }

  try {
    const product = products.find(p => Number(p.id) === Number(productId));
    if (!product) return;

    if (newQty > product.stok) {
      showToast("❌ Melebihi stok tersedia.");
      return;
    }

    await CartService.updateCartQty(currentUser.uid, productId, newQty);
  } catch (error) {
    console.error("Error updating qty:", error);
    showToast("❌ Gagal mengupdate keranjang.");
  }
}

async function removeFromCart(productId) {
  if (!currentUser) return;

  try {
    await CartService.removeFromCart(currentUser.uid, productId);
    showToast("✅ Dihapus dari keranjang.");
  } catch (error) {
    console.error("Error removing from cart:", error);
    showToast("❌ Gagal menghapus dari keranjang.");
  }
}

function toggleCart() {
  const cartPanel = document.getElementById("cartPanel");
  if (cartPanel) {
    cartPanel.style.display = cartPanel.style.display === "none" ? "flex" : "none";
  }
}

// ========== UTILITY FUNCTIONS ==========
let toastTimeout;
function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2500);
}

function toggleMenu() {
  const navLinks = document.getElementById("navLinks");
  if (navLinks) {
    navLinks.style.display = navLinks.style.display === "flex" ? "none" : "flex";
  }
}

// Initialize when page loads
if (document.readyState !== 'loading') {
  initializeApp();
}

console.log("✅ script.js loaded");
