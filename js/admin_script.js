/* ============================================================
   admin_script.js — Admin Dashboard (FIREBASE VERSION)
   Manages products, orders, and admin operations via Firestore
   ============================================================ */

// ========== GLOBAL STATE ==========
let products = [];
let allOrders = [];
let currentUser = null;
let adminAuthenticated = false;
let unsubscribeProducts = null;
let unsubscribeOrders = null;

const ADMIN_PASSWORD = "admin123";  // Change this in production

// ========== INITIALIZATION ==========
function initializeAdmin() {
  console.log("🔐 Initializing Admin Panel...");

  if (typeof db === 'undefined') {
    console.error("❌ Firebase not initialized");
    return;
  }

  // Check admin session
  if (isLoggedIn()) {
    showDashboard();
  } else {
    showLoginGate();
  }

  // Listen to products (real-time)
  if (unsubscribeProducts) unsubscribeProducts();
  unsubscribeProducts = ProductsService.loadProductsRealtime((loadedProducts) => {
    products = loadedProducts;
    renderAdminPanel();
  });

  // Listen to all orders (real-time)
  if (unsubscribeOrders) unsubscribeOrders();
  unsubscribeOrders = OrdersService.loadAllOrdersRealtime((loadedOrders) => {
    allOrders = loadedOrders;
    renderAdminPanel();
  });

  // Seed default products if needed
  ProductsService.seedDefaultProducts();

  lucide.createIcons();
}

window.addEventListener('DOMContentLoaded', initializeAdmin);
if (document.readyState !== 'loading') {
  setTimeout(initializeAdmin, 1000);
}

// ========== AUTH ==========
function isLoggedIn() {
  try {
    return sessionStorage.getItem("adminSession") === "true";
  } catch {
    return false;
  }
}

function doLogin(event) {
  event?.preventDefault();
  const input = document.getElementById("adminPwd");
  const password = input?.value.trim() || "";

  if (password !== ADMIN_PASSWORD) {
    showToast("❌ Kata sandi salah.");
    return;
  }

  try {
    sessionStorage.setItem("adminSession", "true");
    if (input) input.value = "";
    showDashboard();
    showToast("✅ Admin berhasil login.");
  } catch (error) {
    console.error("Login error:", error);
    showToast("❌ Gagal login.");
  }
}

function doLogout() {
  try {
    sessionStorage.removeItem("adminSession");
    showLoginGate();
    showToast("🔒 Admin logout.");
  } catch (error) {
    console.error("Logout error:", error);
  }
}

function showLoginGate() {
  const loginGate = document.getElementById("loginGate");
  const adminPanel = document.getElementById("adminPanelSection");
  const logoutBtn = document.getElementById("logoutBtn");
  
  if (loginGate) loginGate.style.display = "flex";
  if (adminPanel) adminPanel.style.display = "none";
  if (logoutBtn) logoutBtn.style.display = "none";
}

function showDashboard() {
  const loginGate = document.getElementById("loginGate");
  const adminPanel = document.getElementById("adminPanelSection");
  const logoutBtn = document.getElementById("logoutBtn");
  
  if (loginGate) loginGate.style.display = "none";
  if (adminPanel) adminPanel.style.display = "block";
  if (logoutBtn) logoutBtn.style.display = "inline-flex";
  
  renderAdminPanel();
}

// ========== DASHBOARD RENDERING ==========
function renderAdminPanel() {
  renderStats();
  renderProductsTable();
  renderOrdersList();
  renderRecentOrders();
  renderLowStockProducts();
}

function renderStats() {
  const statProduk = document.getElementById("statProduk");
  const statPesanan = document.getElementById("statPesanan");
  const statRevenue = document.getElementById("statRevenue");
  const statStok = document.getElementById("statStok");

  if (statProduk) statProduk.textContent = products.length;
  if (statPesanan) statPesanan.textContent = allOrders.length;

  const totalRevenue = allOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  if (statRevenue) statRevenue.textContent = formatPrice(totalRevenue);

  const lowStockCount = products.filter(p => Number(p.stok) < 10).length;
  if (statStok) statStok.textContent = lowStockCount;
}

function renderProductsTable() {
  const container = document.getElementById("adminProductTable");
  if (!container) return;
  
  container.innerHTML = "";

  if (products.length === 0) {
    container.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--text-light);">📦 Belum ada produk</div>`;
    return;
  }

  const table = document.createElement("table");
  table.className = "admin-products-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>Produk</th>
        <th>Kategori</th>
        <th>Harga</th>
        <th>Stok</th>
        <th>Aksi</th>
      </tr>
    </thead>
    <tbody>
      ${products.map(product => `
        <tr>
          <td><strong>${product.nama_produk}</strong></td>
          <td>${getCategoryLabel(product.kategori)}</td>
          <td>${formatPrice(product.harga)}</td>
          <td>
            <input type="number" value="${product.stok}" min="0" style="width:60px;padding:0.4rem;"
              onchange="updateStok('${product._id}', this.value)" />
          </td>
          <td>
            <button class="btn btn-small" onclick="editProduct('${product._id}')">✏️ Edit</button>
            <button class="btn btn-small" onclick="deleteProduct('${product._id}')">🗑️ Hapus</button>
          </td>
        </tr>
      `).join('')}
    </tbody>
  `;
  
  container.appendChild(table);
}

function renderOrdersList() {
  const container = document.getElementById("adminOrderList");
  if (!container) return;
  
  container.innerHTML = "";

  if (allOrders.length === 0) {
    container.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--text-light);">📭 Belum ada pesanan</div>`;
    return;
  }

  allOrders.slice(0, 20).forEach(order => {
    const card = document.createElement("div");
    card.className = "admin-order-card";
    card.innerHTML = `
      <div class="admin-order-header">
        <strong>#${order.orderNum}</strong>
        <span class="admin-order-status">${order.status || "Pending"}</span>
      </div>
      <div class="admin-order-info">
        <div>👤 ${order.customerName}</div>
        <div>📱 ${order.customerPhone}</div>
        <div>💰 ${formatPrice(order.total)}</div>
      </div>
      <div class="admin-order-items">
        ${order.items?.map(item => `${item.nama_produk} × ${item.qty}`).join(", ")}
      </div>
      <div class="admin-order-actions">
        <select onchange="updateOrderStatus('${order._id}', this.value)" style="padding:0.4rem;">
          <option value="${order.status || 'pending'}">${order.status || 'Pending'}</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderRecentOrders() {
  const tbody = document.getElementById("dashRecentOrders");
  if (!tbody) return;
  
  tbody.innerHTML = "";

  if (allOrders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:1rem;color:var(--text-light);">Belum ada pesanan</td></tr>`;
    return;
  }

  allOrders.slice(0, 5).forEach(order => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${order.orderNum}</td>
      <td>${order.customerName}</td>
      <td>${formatPrice(order.total)}</td>
      <td><span style="background:#E8F5EE;color:#6DA58A;padding:0.2rem 0.6rem;border-radius:4px;">${order.status || "Pending"}</span></td>
      <td>${new Date(order.createdAt).toLocaleDateString("id-ID")}</td>
    `;
    tbody.appendChild(row);
  });
}

function renderLowStockProducts() {
  const tbody = document.getElementById("dashStokRendah");
  if (!tbody) return;
  
  tbody.innerHTML = "";

  const lowStock = products.filter(p => Number(p.stok) < 10);
  
  if (lowStock.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;padding:1rem;color:var(--text-light);">✓ Semua stok aman</td></tr>`;
    return;
  }

  lowStock.forEach(product => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${product.nama_produk}</td>
      <td><strong style="color:#E05050;">${product.stok}</strong></td>
      <td>
        <button class="btn btn-small" onclick="updateStok('${product._id}', ${Number(product.stok) + 10})">+10</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// ========== PRODUCT MANAGEMENT ==========
async function updateStok(productId, newStok) {
  try {
    await ProductsService.updateProduct(productId, {
      stok: Number(newStok)
    });
    showToast("✅ Stok diperbarui.");
  } catch (error) {
    console.error("Error updating stok:", error);
    showToast("❌ Gagal mengupdate stok.");
  }
}

async function deleteProduct(productId) {
  if (!confirm("Yakin hapus produk ini?")) return;

  try {
    await ProductsService.deleteProduct(productId);
    showToast("✅ Produk dihapus.");
  } catch (error) {
    console.error("Error deleting product:", error);
    showToast("❌ Gagal menghapus produk.");
  }
}

function editProduct(productId) {
  const product = products.find(p => p._id === productId);
  if (!product) return;

  const modal = showProductFormModal(product);
}

function showProductFormModal(product = null) {
  const isEdit = !!product;
  
  let overlay = document.getElementById("productFormOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "productFormOverlay";
    overlay.className = "modal-overlay";
    overlay.innerHTML = `<div class="modal-content" id="productFormModal"></div>`;
    overlay.addEventListener("click", e => { if (e.target === overlay) closeProductFormModal(); });
    document.body.appendChild(overlay);
  }

  const modal = document.getElementById("productFormModal");
  modal.innerHTML = `
    <div class="modal-header">
      <h2>${isEdit ? "Edit Produk" : "Tambah Produk"}</h2>
      <button onclick="closeProductFormModal()" class="modal-close">✕</button>
    </div>
    <form id="productForm" onsubmit="submitProductForm(event, '${isEdit ? product._id : ''}')">
      <div class="form-group">
        <label>Nama Produk</label>
        <input type="text" name="nama_produk" value="${product?.nama_produk || ''}" required />
      </div>

      <div class="form-group">
        <label>Kategori</label>
        <select name="kategori" required>
          <option value="skincare" ${product?.kategori === 'skincare' ? 'selected' : ''}>Skincare</option>
          <option value="bodycare" ${product?.kategori === 'bodycare' ? 'selected' : ''}>Bodycare</option>
          <option value="haircare" ${product?.kategori === 'haircare' ? 'selected' : ''}>Haircare</option>
          <option value="makeup" ${product?.kategori === 'makeup' ? 'selected' : ''}>Makeup</option>
          <option value="parfum" ${product?.kategori === 'parfum' ? 'selected' : ''}>Parfum</option>
        </select>
      </div>

      <div class="form-group">
        <label>Harga (Rp)</label>
        <input type="number" name="harga" value="${product?.harga || ''}" required />
      </div>

      <div class="form-group">
        <label>Stok</label>
        <input type="number" name="stok" value="${product?.stok || ''}" required />
      </div>

      <div class="form-group">
        <label>Deskripsi</label>
        <textarea name="deskripsi" rows="4">${product?.deskripsi || ''}</textarea>
      </div>

      <div class="form-group">
        <label>Foto URL (atau path lokal ./image/...)</label>
        <input type="text" name="foto_produk" value="${product?.foto_produk || ''}" placeholder="./image/produk.jpg" />
      </div>

      <div class="form-group">
        <label>Emoji</label>
        <input type="text" name="emoji" value="${product?.emoji || '🎀'}" maxlength="2" />
      </div>

      <div class="form-group">
        <label>
          <input type="checkbox" name="hot" ${product?.hot ? 'checked' : ''} />
          Produk Terlaris
        </label>
      </div>

      <div class="form-actions">
        <button type="button" onclick="closeProductFormModal()" class="btn btn-outline">Batal</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}</button>
      </div>
    </form>
  `;

  overlay.style.display = "flex";
  overlay.classList.add("open");
}

function closeProductFormModal() {
  const overlay = document.getElementById("productFormOverlay");
  if (overlay) {
    overlay.classList.remove("open");
    overlay.style.display = "none";
  }
}

async function submitProductForm(event, productId) {
  event.preventDefault();
  const form = document.getElementById("productForm");
  const formData = new FormData(form);

  const data = {
    nama_produk: formData.get("nama_produk"),
    kategori: formData.get("kategori"),
    harga: Number(formData.get("harga")),
    stok: Number(formData.get("stok")),
    deskripsi: formData.get("deskripsi"),
    foto_produk: formData.get("foto_produk"),
    emoji: formData.get("emoji"),
    hot: formData.has("hot")
  };

  try {
    if (productId) {
      // Edit
      await ProductsService.updateProduct(productId, data);
      showToast("✅ Produk berhasil diubah.");
    } else {
      // Add new
      await ProductsService.addProduct(data);
      showToast("✅ Produk berhasil ditambahkan.");
    }
    closeProductFormModal();
  } catch (error) {
    console.error("Error saving product:", error);
    showToast("❌ Gagal menyimpan produk.");
  }
}

// ========== ORDER MANAGEMENT ==========
async function updateOrderStatus(orderId, newStatus) {
  try {
    await OrdersService.updateOrderStatus(orderId, newStatus);
    showToast("✅ Status pesanan diperbarui.");
  } catch (error) {
    console.error("Error updating order:", error);
    showToast("❌ Gagal mengupdate status pesanan.");
  }
}

// ========== UTILITY ==========
function formatPrice(num) {
  return "Rp " + Number(num).toLocaleString("id-ID");
}

function getCategoryLabel(categoryKey) {
  const k = String(categoryKey || "").toLowerCase();
  if (k === "skincare") return "Skincare";
  if (k === "bodycare") return "Bodycare";
  if (k === "haircare") return "Haircare";
  if (k === "makeup") return "Makeup";
  if (k === "parfum") return "Perfume";
  return "-";
}

let toastTimeout;
function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2500);
}

function initAdminSidebarActive() {
  const path = location.pathname.split("/").pop() || "admin_dashboard.html";
  document.querySelectorAll(".ad-nav-link").forEach(link => {
    const href = link.getAttribute("href");
    if (href && path.includes(href.replace(".html", ""))) {
      link.classList.add("active");
    }
  });
}

function initDashboard() {
  if (!isLoggedIn()) {
    showLoginGate();
    return;
  }
  showDashboard();
}

console.log("✅ admin_script.js loaded");
