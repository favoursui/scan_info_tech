document.addEventListener("DOMContentLoaded", loadProducts);

async function loadProducts() {
  const grid = document.getElementById("products-grid");
  const loading = document.getElementById("products-loading");
  const empty = document.getElementById("products-empty");
  if (!grid) return;

  try {
    const products = await api.get("/products?skip=0&limit=100");
    if (loading) loading.classList.add("hidden");

    if (!products.length) {
      if (empty) empty.classList.remove("hidden");
      return;
    }

    grid.innerHTML = products.map((p) => productCard(p)).join("");
  } catch (err) {
    if (loading) loading.classList.add("hidden");
    grid.innerHTML = `
      <p class="col-span-4 text-center text-red-400 py-10">
        Failed to load products. Please try again.
      </p>`;
  }
}

function productCard(p) {
  const outOfStock = p.stock_quantity === 0;
  return `
    <div class="bg-white rounded-lg overflow-hidden group cursor-pointer">

      <!-- Image -->
      <div class="relative overflow-hidden bg-gray-100" style="aspect-ratio: 3/4;">
        <img
          src="${p.image_url || 'img/placeholder.jpg'}"
          alt="${p.name}"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onerror="this.src='img/placeholder.jpg'"
        >
        ${outOfStock ? `
          <div class="absolute inset-0 bg-black/30 flex items-center justify-center">
            <span class="bg-white text-[#3b2a1a] text-xs font-bold px-4 py-1.5 rounded-full">
              Out of Stock
            </span>
          </div>
        ` : ""}
      </div>

      <!-- Info -->
      <div class="p-4">
        <p class="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-1">
          Scan Info Tech
        </p>
        <h3 class="font-bold text-[#3b2a1a] text-base leading-snug mb-1">
          ${p.name}
        </h3>
        <p class="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">
          ${p.description || ""}
        </p>
        <div class="flex items-center justify-between">
          <span class="font-bold text-[#3b2a1a] text-base">
            ₦${Number(p.price).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </span>
          <button
            onclick="addToCart(${p.id}, '${p.name.replace(/'/g, "\\'")}')"
            ${outOfStock ? "disabled" : ""}
            class="bg-[#3b2a1a] hover:bg-[#c17f24] text-white text-sm font-semibold px-5 py-2 rounded transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  `;
}

async function addToCart(productId, productName) {
  if (!api.isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }
  try {
    await api.post("/cart/add", { product_id: productId, quantity: 1 });
    showToast(`"${productName}" added to cart!`);
    updateCartBadge();
  } catch (err) {
    showToast(err.detail || "Failed to add to cart.", "error");
  }
}

function showToast(msg, type = "success") {
  const existing = document.getElementById("toast-msg");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "toast-msg";
  toast.className = `fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm
    font-medium transition-all duration-300 ${type === "error" ? "bg-red-500" : "bg-[#3b2a1a]"}`;
  toast.textContent = msg;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}