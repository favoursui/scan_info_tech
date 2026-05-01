// Init 
document.addEventListener("DOMContentLoaded", () => {
  const user = api.getUser();
  if (!api.isLoggedIn() || !user?.is_admin) {
    window.location.href = "login.html";
    return;
  }

  const avatar = document.getElementById("admin-avatar");
  if (avatar) avatar.textContent = (user.username || "A").charAt(0).toUpperCase();

  // Form listeners
  document.getElementById("product-form")?.addEventListener("submit", handleProductSubmit);
  document.getElementById("add-service-form")?.addEventListener("submit", handleAddService);

  showSection("dashboard");
});

// Section Navigation
function showSection(name) {
  document.querySelectorAll("[id^='section-']").forEach((s) => s.classList.add("hidden"));

  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.classList.remove("bg-white/10", "text-white");
    btn.classList.add("text-white/70");
  });

  const section = document.getElementById(`section-${name}`);
  if (section) section.classList.remove("hidden");

  const navBtn = document.getElementById(`nav-${name}`);
  if (navBtn) {
    navBtn.classList.add("bg-white/10", "text-white");
    navBtn.classList.remove("text-white/70");
  }

  const titles = {
    dashboard: ["Dashboard", "Overview of your store"],
    products:  ["Manage Products", "Add, edit and remove products"],
    users:     ["Manage Users", "View and manage all users"],
    orders:    ["Orders", "View all customer orders"],
    services:  ["Services", "Manage your service offerings"],
  };
  const [title, subtitle] = titles[name] || ["Admin", ""];
  document.getElementById("page-title").textContent = title;
  document.getElementById("page-subtitle").textContent = subtitle;

  if (name === "dashboard") loadDashboard();
  if (name === "products")  loadAdminProducts();
  if (name === "users")     loadAdminUsers();
  if (name === "orders")    loadAdminOrders();
  if (name === "services")  loadServices();

  closeSidebar();
}

// Sidebar 
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  const isOpen  = !sidebar.classList.contains("-translate-x-full");
  if (isOpen) {
    closeSidebar();
  } else {
    sidebar.classList.remove("-translate-x-full");
    overlay.classList.remove("hidden");
  }
}

function closeSidebar() {
  document.getElementById("sidebar")?.classList.add("-translate-x-full");
  document.getElementById("sidebar-overlay")?.classList.add("hidden");
}

function handleSignOut() {
  api.removeToken();
  window.location.href = "login.html";
}

// Dashboard 
async function loadDashboard() {
  try {
    const [orders, users, products] = await Promise.all([
      api.get("/admin/orders?limit=200"),
      api.get("/admin/users?limit=200"),
      api.get("/admin/products?limit=200"),
    ]);

    document.getElementById("stat-orders").textContent   = orders.length;
    document.getElementById("stat-users").textContent    = users.length;
    document.getElementById("stat-products").textContent = products.length;

    const revenue = orders.reduce((sum, o) => sum + Number(o.amount), 0);
    document.getElementById("stat-revenue").textContent =
      `₦${revenue.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

    const tbody  = document.getElementById("dashboard-orders");
    const recent = orders.slice(0, 5);
    if (!recent.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-gray-400">
        No orders yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = recent.map((o) => `
      <tr class="border-b border-gray-50 hover:bg-gray-50/50">
        <td class="py-3 px-5 font-semibold text-[#3b2a1a]">#${o.id}</td>
        <td class="py-3 px-5 text-gray-500">${o.user_id}</td>
        <td class="py-3 px-5 font-bold text-[#3b2a1a]">
          ₦${Number(o.amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
        </td>
        <td class="py-3 px-5">${statusBadge(o.order_status)}</td>
        <td class="py-3 px-5 text-gray-400 text-xs">
          ${new Date(o.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}
        </td>
      </tr>
    `).join("");
  } catch (err) {
    console.error("Dashboard load failed:", err);
  }
}

// Products 
async function loadAdminProducts() {
  const tbody   = document.getElementById("admin-products-list");
  const countEl = document.getElementById("products-count");
  try {
    const products = await api.get("/admin/products?limit=200");
    if (countEl) countEl.textContent = `${products.length} products`;

    if (!products.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-gray-400">
        No products yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = products.map((p) => `
      <tr class="border-b border-gray-50 hover:bg-gray-50/50">
        <td class="py-3 px-4">
          <img src="${p.image_url || "img/placeholder.jpg"}"
            class="w-12 h-14 object-cover rounded-lg border border-gray-100"
            onerror="this.src='img/placeholder.jpg'">
        </td>
        <td class="py-3 px-4">
          <p class="font-semibold text-[#3b2a1a] leading-tight">${p.name}</p>
          <p class="text-xs text-gray-400 mt-0.5 max-w-[160px] truncate">
            ${p.description || "—"}
          </p>
        </td>
        <td class="py-3 px-4 font-bold text-[#3b2a1a]">
          ₦${Number(p.price).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
        </td>
        <td class="py-3 px-4">
          <span class="px-2 py-1 rounded-full text-xs font-semibold
            ${p.stock_quantity > 0
              ? "bg-green-50 text-green-600"
              : "bg-red-50 text-red-500"}">
            ${p.stock_quantity} in stock
          </span>
        </td>
        <td class="py-3 px-4">
          <div class="flex items-center gap-2">
            <button onclick="editProduct(${JSON.stringify(p).replace(/"/g, "&quot;")})"
              class="text-[#c17f24] hover:text-white hover:bg-[#c17f24] text-xs font-semibold
                     border border-[#c17f24]/30 px-3 py-1.5 rounded-lg transition-all">
              Edit
            </button>
            <button onclick="deleteProduct(${p.id})"
              class="text-red-400 hover:text-white hover:bg-red-500 text-xs font-semibold
                     border border-red-200 px-3 py-1.5 rounded-lg transition-all">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-red-400">
      Failed to load products.</td></tr>`;
  }
}

function previewImage(input) {
  const preview     = document.getElementById("image-preview");
  const placeholder = document.getElementById("image-placeholder");
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.classList.remove("hidden");
      placeholder.classList.add("hidden");
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function editProduct(product) {
  document.getElementById("edit-product-id").value  = product.id;
  document.getElementById("p-name").value           = product.name;
  document.getElementById("p-description").value    = product.description || "";
  document.getElementById("p-price").value          = product.price;
  document.getElementById("p-stock").value          = product.stock_quantity;

  const preview     = document.getElementById("image-preview");
  const placeholder = document.getElementById("image-placeholder");
  if (product.image_url) {
    preview.src = product.image_url;
    preview.classList.remove("hidden");
    placeholder.classList.add("hidden");
  }

  document.getElementById("product-form-title").textContent  = "Edit Product";
  document.getElementById("product-submit-btn").textContent  = "Save Changes";
  document.getElementById("cancel-edit-btn").classList.remove("hidden");
  document.getElementById("product-form").scrollIntoView({ behavior: "smooth" });
}

function cancelEdit() {
  document.getElementById("edit-product-id").value = "";
  document.getElementById("product-form").reset();
  document.getElementById("product-form-title").textContent = "Add New Product";
  document.getElementById("product-submit-btn").textContent = "Add Product";
  document.getElementById("cancel-edit-btn").classList.add("hidden");
  document.getElementById("image-preview").classList.add("hidden");
  document.getElementById("image-placeholder").classList.remove("hidden");
  document.getElementById("product-error").classList.add("hidden");
  document.getElementById("product-success").classList.add("hidden");
}

async function handleProductSubmit(e) {
  e.preventDefault();
  const btn       = document.getElementById("product-submit-btn");
  const errorEl   = document.getElementById("product-error");
  const successEl = document.getElementById("product-success");
  const editId    = document.getElementById("edit-product-id").value;

  const formData = new FormData();
  formData.append("name",           document.getElementById("p-name").value.trim());
  formData.append("description",    document.getElementById("p-description").value.trim());
  formData.append("price",          document.getElementById("p-price").value);
  formData.append("stock_quantity", document.getElementById("p-stock").value);
  const imageFile = document.getElementById("p-image").files[0];
  if (imageFile) formData.append("image", imageFile);

  btn.disabled    = true;
  btn.textContent = "Saving...";
  errorEl.classList.add("hidden");
  successEl.classList.add("hidden");

  try {
    if (editId) {
      await api.putForm(`/inventory/product/${editId}`, formData);
      successEl.textContent = "Product updated successfully!";
    } else {
      await api.postForm("/inventory/product", formData);
      successEl.textContent = "Product added successfully!";
    }
    successEl.classList.remove("hidden");
    cancelEdit();
    loadAdminProducts();
    loadDashboard();
  } catch (err) {
    errorEl.textContent = err.detail || "Failed to save product.";
    errorEl.classList.remove("hidden");
  } finally {
    btn.disabled    = false;
    btn.textContent = editId ? "Save Changes" : "Add Product";
  }
}

async function deleteProduct(id) {
  if (!confirm("Delete this product? This cannot be undone.")) return;
  try {
    await api.delete(`/inventory/product/${id}`);
    loadAdminProducts();
    loadDashboard();
  } catch (err) {
    alert(err.detail || "Failed to delete product.");
  }
}

// Users 
async function loadAdminUsers() {
  const tbody   = document.getElementById("admin-users-list");
  const countEl = document.getElementById("users-count");
  try {
    const users = await api.get("/admin/users?limit=200");
    if (countEl) countEl.textContent = `${users.length} users`;

    if (!users.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-gray-400">
        No users yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = users.map((u) => `
      <tr class="border-b border-gray-50 hover:bg-gray-50/50">
        <td class="py-3 px-5">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-[#c17f24] text-white flex items-center
              justify-center text-sm uppercase flex-shrink-0"
              style="font-family:'Playfair Display',serif;font-style:italic;font-weight:700;">
              ${u.username.charAt(0)}
            </div>
            <div>
              <p class="font-semibold text-[#3b2a1a] text-sm font-mono">#${u.id}</p>
              <p class="text-xs text-gray-400">${u.username}</p>
            </div>
          </div>
        </td>
        <td class="py-3 px-5 text-gray-400 text-sm">${u.email}</td>
        <td class="py-3 px-5">
          ${u.is_suspended
            ? `<span class="px-2 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-500">Suspended</span>`
            : `<span class="px-2 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-600">Active</span>`}
        </td>
        <td class="py-3 px-5">
          ${u.is_admin
            ? `<span class="px-2 py-1 rounded-full text-xs font-semibold bg-[#c17f24]/10 text-[#c17f24]">Admin</span>`
            : `<span class="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">User</span>`}
        </td>
        <td class="py-3 px-5 text-gray-400 text-xs">
          ${new Date(u.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}
        </td>
        <td class="py-3 px-5">
          <div class="flex items-center gap-2 flex-wrap">
            ${!u.is_admin ? `
              <button onclick="makeAdmin('${u.username}')"
                class="text-[#c17f24] hover:text-white hover:bg-[#c17f24] text-xs font-semibold
                       border border-[#c17f24]/40 px-3 py-1.5 rounded-lg transition-all">
                Make Admin
              </button>` : ""}
            ${!u.is_suspended ? `
              <button onclick="suspendUser('${u.username}')"
                class="text-red-400 hover:text-white hover:bg-red-500 text-xs font-semibold
                       border border-red-200 px-3 py-1.5 rounded-lg transition-all">
                Suspend
              </button>` : `
              <button onclick="reactivateUser('${u.username}')"
                class="text-green-500 hover:text-white hover:bg-green-500 text-xs font-semibold
                       border border-green-300 px-3 py-1.5 rounded-lg transition-all">
                Reactivate
              </button>`}
          </div>
        </td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-red-400">
      Failed to load users.</td></tr>`;
  }
}

async function makeAdmin(username) {
  if (!confirm(`Make "${username}" an admin?`)) return;
  try {
    await api.patch("/admin/users/make-admin", { username });
    showUserAlert("success", `${username} is now an admin.`);
    loadAdminUsers();
  } catch (err) {
    showUserAlert("error", err.detail || "Failed to make admin.");
  }
}

async function suspendUser(username) {
  if (!confirm(`Suspend "${username}"? They will not be able to login.`)) return;
  try {
    await api.patch("/admin/users/suspend", { username });
    showUserAlert("success", `${username} has been suspended.`);
    loadAdminUsers();
  } catch (err) {
    showUserAlert("error", err.detail || "Failed to suspend user.");
  }
}

async function reactivateUser(username) {
  if (!confirm(`Reactivate "${username}"?`)) return;
  try {
    await api.patch("/admin/users/reactivate", { username });
    showUserAlert("success", `${username} has been reactivated.`);
    loadAdminUsers();
  } catch (err) {
    showUserAlert("error", err.detail || "Failed to reactivate user.");
  }
}

function showUserAlert(type, msg) {
  const successEl = document.getElementById("user-action-success");
  const errorEl   = document.getElementById("user-action-error");
  successEl.classList.add("hidden");
  errorEl.classList.add("hidden");
  const el = type === "success" ? successEl : errorEl;
  el.textContent = msg;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 4000);
}

// Orders 
async function loadAdminOrders() {
  const tbody   = document.getElementById("admin-orders-list");
  const countEl = document.getElementById("orders-count");
  try {
    const orders = await api.get("/admin/orders?limit=200");
    if (countEl) countEl.textContent = `${orders.length} orders`;

    if (!orders.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-gray-400">
        No orders yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = orders.map((o) => `
      <tr class="border-b border-gray-50 hover:bg-gray-50/50">
        <td class="py-3 px-5 font-bold text-[#3b2a1a]">#${o.id}</td>
        <td class="py-3 px-5 text-gray-500">#${o.user_id}</td>
        <td class="py-3 px-5 text-gray-500">#${o.product_id}</td>
        <td class="py-3 px-5 text-gray-500">${o.quantity}</td>
        <td class="py-3 px-5 font-bold text-[#3b2a1a]">
          ₦${Number(o.amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
        </td>
        <td class="py-3 px-5">${statusBadge(o.order_status)}</td>
        <td class="py-3 px-5 text-gray-400 text-xs">
          ${new Date(o.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}
        </td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-red-400">
      Failed to load orders.</td></tr>`;
  }
}

// Services 
async function loadServices() {
  const loading = document.getElementById("services-loading");
  const list    = document.getElementById("services-list");
  const count   = document.getElementById("services-count");
  if (!list) return;

  if (loading) loading.classList.remove("hidden");
  list.innerHTML = "";

  try {
    const services = await api.get("/services");
    if (loading) loading.classList.add("hidden");
    if (count) count.textContent =
      `${services.length} service${services.length !== 1 ? "s" : ""}`;

    if (!services.length) {
      list.innerHTML = `<div class="text-center text-gray-400 py-10 text-sm">
        No services yet. Add one on the left.</div>`;
      return;
    }

    list.innerHTML = services.map((s) => `
      <div class="flex items-center justify-between px-6 py-4
                  hover:bg-gray-50/50 transition-colors group border-b border-gray-50">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-[#c17f24]/10 flex items-center
                      justify-center flex-shrink-0">
            <svg class="w-4 h-4 text-[#c17f24]" fill="none" stroke="currentColor"
              viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <div>
            <p id="service-name-${s.id}"
              class="font-semibold text-[#3b2a1a] text-sm">${s.name}</p>
            <p class="text-xs text-gray-400">
              Added ${new Date(s.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onclick="startEditService(${s.id}, '${s.name.replace(/'/g, "\\'")}')"
            class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#3b2a1a]/5
                   text-[#3b2a1a] hover:bg-[#3b2a1a]/10 transition-colors">
            Edit
          </button>
          <button onclick="deleteService(${s.id}, '${s.name.replace(/'/g, "\\'")}')"
            class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50
                   text-red-500 hover:bg-red-100 transition-colors">
            Delete
          </button>
        </div>
      </div>
    `).join("");
  } catch (err) {
    if (loading) loading.classList.add("hidden");
    list.innerHTML = `<div class="text-center text-red-400 py-8 text-sm">
      Failed to load services.</div>`;
  }
}

async function handleAddService(e) {
  e.preventDefault();
  const btn       = document.getElementById("add-service-btn");
  const errorEl   = document.getElementById("service-error");
  const successEl = document.getElementById("service-success");
  const name      = document.getElementById("s-name").value.trim();

  btn.disabled    = true;
  btn.textContent = "Adding...";
  errorEl.classList.add("hidden");
  successEl.classList.add("hidden");

  try {
    await api.post("/services", { name });
    successEl.textContent = `"${name}" added successfully!`;
    successEl.classList.remove("hidden");
    e.target.reset();
    loadServices();
  } catch (err) {
    errorEl.textContent = err.detail || "Failed to add service.";
    errorEl.classList.remove("hidden");
  } finally {
    btn.disabled    = false;
    btn.textContent = "Add Service";
  }
}

function startEditService(id, currentName) {
  const nameEl = document.getElementById(`service-name-${id}`);
  if (!nameEl) return;
  nameEl.innerHTML = `
    <div class="flex items-center gap-2">
      <input id="edit-svc-${id}" type="text" value="${currentName}"
        class="border border-[#c17f24] rounded-lg px-3 py-1.5 text-sm
               focus:outline-none focus:ring-2 focus:ring-[#c17f24]/30 bg-white w-44" />
      <button onclick="saveEditService(${id})"
        class="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#c17f24]
               text-white hover:bg-[#a66d1a] transition-colors">
        Save
      </button>
      <button onclick="loadServices()"
        class="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-gray-100
               text-gray-500 hover:bg-gray-200 transition-colors">
        Cancel
      </button>
    </div>
  `;
  document.getElementById(`edit-svc-${id}`)?.focus();
}

async function saveEditService(id) {
  const input = document.getElementById(`edit-svc-${id}`);
  const name  = input?.value.trim();
  if (!name) return;
  try {
    await api.request(`/services/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    });
    showToast("Service updated");
    loadServices();
  } catch (err) {
    showToast(err.detail || "Failed to update service.", "error");
  }
}

async function deleteService(id, name) {
  if (!confirm(`Delete service "${name}"?`)) return;
  try {
    await api.delete(`/services/${id}`);
    showToast(`"${name}" deleted`);
    loadServices();
  } catch (err) {
    showToast(err.detail || "Failed to delete service.", "error");
  }
}

// Helpers 
function statusBadge(status) {
  const map = {
    pending:   "bg-yellow-50 text-yellow-600",
    confirmed: "bg-blue-50 text-blue-600",
    shipped:   "bg-purple-50 text-purple-600",
    delivered: "bg-green-50 text-green-600",
    cancelled: "bg-red-50 text-red-500",
  };
  const color = map[status] || "bg-gray-100 text-gray-500";
  return `<span class="px-2 py-1 rounded-full text-xs font-semibold capitalize
    ${color}">${status}</span>`;
}

function showToast(msg, type = "success") {
  const existing = document.getElementById("admin-toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.id = "admin-toast";
  toast.className = `fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg
    text-white text-sm font-medium
    ${type === "error" ? "bg-red-500" : "bg-[#3b2a1a]"}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s";
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}