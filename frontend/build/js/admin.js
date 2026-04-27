document.addEventListener("DOMContentLoaded", () => {
  // Auth guard
  const user = api.getUser();
  if (!api.isLoggedIn() || !user?.is_admin) {
    window.location.href = "login.html";
    return;
  }

  // Set avatar
  const avatar = document.getElementById("admin-avatar");
  if (avatar) avatar.textContent = (user.username || "A").charAt(0).toUpperCase();

  // Default section
  showSection("dashboard");
});


//  Section Navigation 

function showSection(name) {
  // Hide all sections
  document.querySelectorAll("[id^='section-']").forEach((s) => s.classList.add("hidden"));

  // Deactivate all nav items
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.classList.remove("bg-white/10", "text-white");
    btn.classList.add("text-white/70");
  });

  // Show target section
  const section = document.getElementById(`section-${name}`);
  if (section) section.classList.remove("hidden");

  // Activate nav item
  const navBtn = document.getElementById(`nav-${name}`);
  if (navBtn) {
    navBtn.classList.add("bg-white/10", "text-white");
    navBtn.classList.remove("text-white/70");
  }

  // Update page title
  const titles = {
    dashboard: ["Dashboard", "Overview of your store"],
    products: ["Manage Products", "Add, edit and remove products"],
    users: ["Manage Users", "View and manage all users"],
    orders: ["Orders", "View all customer orders"],
  };
  const [title, subtitle] = titles[name] || ["Admin", ""];
  document.getElementById("page-title").textContent = title;
  document.getElementById("page-subtitle").textContent = subtitle;

  // Load data for section
  if (name === "dashboard") loadDashboard();
  if (name === "products") loadAdminProducts();
  if (name === "users") loadAdminUsers();
  if (name === "orders") loadAdminOrders();

  // Close mobile sidebar
  closeSidebar();
}


//  Sidebar Toggle 

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  const isOpen = !sidebar.classList.contains("-translate-x-full");
  if (isOpen) {
    closeSidebar();
  } else {
    sidebar.classList.remove("-translate-x-full");
    overlay.classList.remove("hidden");
  }
}

function closeSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  sidebar.classList.add("-translate-x-full");
  overlay.classList.add("hidden");
}

function handleSignOut() {
  api.removeToken();
  window.location.href = "login.html";
}


//  Dashboard 

async function loadDashboard() {
  try {
    const [orders, users, products] = await Promise.all([
      api.get("/admin/orders?limit=200"),
      api.get("/admin/users?limit=200"),
      api.get("/admin/products?limit=200"),
    ]);

    document.getElementById("stat-orders").textContent = orders.length;
    document.getElementById("stat-users").textContent = users.length;
    document.getElementById("stat-products").textContent = products.length;

    const revenue = orders.reduce((sum, o) => sum + Number(o.amount), 0);
    document.getElementById("stat-revenue").textContent =
      `₦${revenue.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

    // Recent 5 orders
    const tbody = document.getElementById("dashboard-orders");
    const recent = orders.slice(0, 5);
    if (!recent.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-gray-400">No orders yet.</td></tr>`;
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


//  Products 

async function loadAdminProducts() {
  const tbody = document.getElementById("admin-products-list");
  const countEl = document.getElementById("products-count");
  try {
    const products = await api.get("/admin/products?limit=200");
    if (countEl) countEl.textContent = `${products.length} products`;

    if (!products.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-gray-400">No products yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = products.map((p) => `
      <tr class="border-b border-gray-50 hover:bg-gray-50/50">
        <td class="py-3 px-4">
          <img src="${p.image_url || 'img/placeholder.jpg'}"
            class="w-12 h-14 object-cover rounded-lg border border-gray-100"
            onerror="this.src='img/placeholder.jpg'">
        </td>
        <td class="py-3 px-4">
          <p class="font-semibold text-[#3b2a1a] leading-tight">${p.name}</p>
          <p class="text-xs text-gray-400 mt-0.5 max-w-[160px] truncate">${p.description || "—"}</p>
        </td>
        <td class="py-3 px-4 font-bold text-[#3b2a1a]">
          ₦${Number(p.price).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
        </td>
        <td class="py-3 px-4">
          <span class="px-2 py-1 rounded-full text-xs font-semibold
            ${p.stock_quantity > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}">
            ${p.stock_quantity} in stock
          </span>
        </td>
        <td class="py-3 px-4">
          <div class="flex items-center gap-2">
            <button onclick="editProduct(${JSON.stringify(p).replace(/"/g, '&quot;')})"
              class="text-[#c17f24] hover:text-[#a66d1a] text-xs font-semibold border border-[#c17f24]/30 hover:border-[#c17f24] px-3 py-1.5 rounded-lg transition-all">
              Edit
            </button>
            <button onclick="deleteProduct(${p.id})"
              class="text-red-400 hover:text-red-600 text-xs font-semibold border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-all">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-red-400">Failed to load products.</td></tr>`;
  }
}

// Image preview
function previewImage(input) {
  const preview = document.getElementById("image-preview");
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

// Edit product — populate form
function editProduct(product) {
  document.getElementById("edit-product-id").value = product.id;
  document.getElementById("p-name").value = product.name;
  document.getElementById("p-description").value = product.description || "";
  document.getElementById("p-price").value = product.price;
  document.getElementById("p-stock").value = product.stock_quantity;

  // Show current image in preview
  const preview = document.getElementById("image-preview");
  const placeholder = document.getElementById("image-placeholder");
  if (product.image_url) {
    preview.src = product.image_url;
    preview.classList.remove("hidden");
    placeholder.classList.add("hidden");
  }

  document.getElementById("product-form-title").textContent = "Edit Product";
  document.getElementById("product-submit-btn").textContent = "Save Changes";
  document.getElementById("cancel-edit-btn").classList.remove("hidden");

  // Scroll form into view
  document.getElementById("product-form").scrollIntoView({ behavior: "smooth" });
}

function cancelEdit() {
  document.getElementById("edit-product-id").value = "";
  document.getElementById("product-form").reset();
  document.getElementById("product-form-title").textContent = "Add New Product";
  document.getElementById("product-submit-btn").textContent = "Add Product";
  document.getElementById("cancel-edit-btn").classList.add("hidden");

  // Reset preview
  document.getElementById("image-preview").classList.add("hidden");
  document.getElementById("image-placeholder").classList.remove("hidden");

  // Clear alerts
  document.getElementById("product-error").classList.add("hidden");
  document.getElementById("product-success").classList.add("hidden");
}

// Form submit — add or update
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("product-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("product-submit-btn");
    const errorEl = document.getElementById("product-error");
    const successEl = document.getElementById("product-success");
    const editId = document.getElementById("edit-product-id").value;

    const formData = new FormData();
    formData.append("name", document.getElementById("p-name").value.trim());
    formData.append("description", document.getElementById("p-description").value.trim());
    formData.append("price", document.getElementById("p-price").value);
    formData.append("stock_quantity", document.getElementById("p-stock").value);
    const imageFile = document.getElementById("p-image").files[0];
    if (imageFile) formData.append("image", imageFile);

    btn.disabled = true;
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
      btn.disabled = false;
      btn.textContent = editId ? "Save Changes" : "Add Product";
    }
  });
});

async function deleteProduct(id) {
  if (!confirm("Are you sure you want to delete this product? This cannot be undone.")) return;
  try {
    await api.delete(`/inventory/product/${id}`);
    loadAdminProducts();
    loadDashboard();
  } catch (err) {
    alert(err.detail || "Failed to delete product.");
  }
}


//  Users 

async function loadAdminUsers() {
  const tbody = document.getElementById("admin-users-list");
  const countEl = document.getElementById("users-count");
  try {
    const users = await api.get("/admin/users?limit=200");
    if (countEl) countEl.textContent = `${users.length} users`;

    if (!users.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-gray-400">No users yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = users.map((u) => `
      <tr class="border-b border-gray-50 hover:bg-gray-50/50">
        <td class="py-3 px-5">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-[#c17f24] text-white flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
              ${u.username.charAt(0)}
            </div>
            <span class="font-semibold text-[#3b2a1a] text-sm">${u.username}</span>
          </div>
        </td>
        <td class="py-3 px-5 text-gray-400 text-sm">${u.email}</td>
        <td class="py-3 px-5">
          ${u.is_suspended
            ? `<span class="px-2 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-500">Suspended</span>`
            : `<span class="px-2 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-600">Active</span>`
          }
        </td>
        <td class="py-3 px-5">
          ${u.is_admin
            ? `<span class="px-2 py-1 rounded-full text-xs font-semibold bg-[#c17f24]/10 text-[#c17f24]">Admin</span>`
            : `<span class="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">User</span>`
          }
        </td>
        <td class="py-3 px-5 text-gray-400 text-xs">
          ${new Date(u.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}
        </td>
        <td class="py-3 px-5">
          <div class="flex items-center gap-2 flex-wrap">
            ${!u.is_admin ? `
              <button onclick="makeAdmin('${u.username}')"
                class="text-[#c17f24] hover:text-white hover:bg-[#c17f24] text-xs font-semibold border border-[#c17f24]/40 px-3 py-1.5 rounded-lg transition-all">
                Make Admin
              </button>
            ` : ""}
            ${!u.is_suspended ? `
              <button onclick="suspendUser('${u.username}')"
                class="text-red-400 hover:text-white hover:bg-red-500 text-xs font-semibold border border-red-200 px-3 py-1.5 rounded-lg transition-all">
                Suspend
              </button>
            ` : `
              <button onclick="reactivateUser('${u.username}')"
                class="text-green-500 hover:text-white hover:bg-green-500 text-xs font-semibold border border-green-300 px-3 py-1.5 rounded-lg transition-all">
                Reactivate
              </button>
            `}
          </div>
        </td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-red-400">Failed to load users.</td></tr>`;
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
  const errorEl = document.getElementById("user-action-error");
  successEl.classList.add("hidden");
  errorEl.classList.add("hidden");

  const el = type === "success" ? successEl : errorEl;
  el.textContent = msg;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 4000);
}


//  Orders 

async function loadAdminOrders() {
  const tbody = document.getElementById("admin-orders-list");
  const countEl = document.getElementById("orders-count");
  try {
    const orders = await api.get("/admin/orders?limit=200");
    if (countEl) countEl.textContent = `${orders.length} orders`;

    if (!orders.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-gray-400">No orders yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = orders.map((o) => `
      <tr class="border-b border-gray-50 hover:bg-gray-50/50">
        <td class="py-3 px-5 font-bold text-[#3b2a1a]">#${o.id}</td>
        <td class="py-3 px-5 text-gray-500">${o.user_id}</td>
        <td class="py-3 px-5 text-gray-500">${o.product_id}</td>
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
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-red-400">Failed to load orders.</td></tr>`;
  }
}


//  Helpers 

function statusBadge(status) {
  const map = {
    pending: "bg-yellow-50 text-yellow-600",
    confirmed: "bg-blue-50 text-blue-600",
    shipped: "bg-purple-50 text-purple-600",
    delivered: "bg-green-50 text-green-600",
    cancelled: "bg-red-50 text-red-500",
  };
  const color = map[status] || "bg-gray-100 text-gray-500";
  return `<span class="px-2 py-1 rounded-full text-xs font-semibold capitalize ${color}">${status}</span>`;
}