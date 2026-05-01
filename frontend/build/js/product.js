let currentProduct = null;
let selectedQty = 1;

document.addEventListener("DOMContentLoaded", loadProduct);

async function loadProduct() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    showNotFound();
    return;
  }

  try {
    const product = await api.get(`/products/${id}`);
    currentProduct = product;
    renderProduct(product);
  } catch (err) {
    showNotFound();
  }
}

function renderProduct(p) {
  const loading = document.getElementById("product-loading");
  const detail = document.getElementById("product-detail");
  if (loading) loading.classList.add("hidden");
  if (detail) detail.classList.remove("hidden");

  // Breadcrumb
  const breadcrumb = document.getElementById("breadcrumb-name");
  if (breadcrumb) breadcrumb.textContent = p.name;

  // Page title
  document.title = `${p.name} — Scan Info Tech`;

  // Image
  const img = document.getElementById("product-image");
  if (img) {
    img.src = p.image_url || "img/placeholder.jpg";
    img.alt = p.name;
  }

  // Name
  const name = document.getElementById("product-name");
  if (name) name.textContent = p.name;

  // Price
  const price = document.getElementById("product-price");
  if (price)
    price.textContent = `₦${Number(p.price).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

  // Description
  const desc = document.getElementById("product-description");
  if (desc) desc.textContent = p.description || "No description available.";

  // SKU — format: SCN-00001 (zero padded to 5 digits)
  const sku = document.getElementById("product-sku");
  if (sku) sku.textContent = `SCN-${String(p.id).padStart(5, "0")}`;

  // Stock
  const stockBadge = document.getElementById("product-stock-badge");
  const stockText = document.getElementById("product-stock-text");
  const addBtn = document.getElementById("add-to-cart-btn");
  const buyBtn = document.getElementById("buy-now-btn");

  if (p.stock_quantity > 0) {
    if (stockBadge) {
      stockBadge.textContent = `${p.stock_quantity} in stock`;
      stockBadge.className = "text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700";
    }
    if (stockText) stockText.textContent = `${p.stock_quantity} available`;
  } else {
    if (stockBadge) {
      stockBadge.textContent = "Out of Stock";
      stockBadge.className = "text-xs font-semibold px-3 py-1 rounded-full bg-red-100 text-red-600";
    }
    if (stockText) stockText.textContent = "Out of Stock";
    if (addBtn) {
      addBtn.disabled = true;
      addBtn.classList.add("opacity-50", "cursor-not-allowed");
    }
    if (buyBtn) {
      buyBtn.disabled = true;
      buyBtn.classList.add("opacity-50", "cursor-not-allowed");
    }
  }
}

function showNotFound() {
  const loading = document.getElementById("product-loading");
  const notFound = document.getElementById("product-not-found");
  if (loading) loading.classList.add("hidden");
  if (notFound) notFound.classList.remove("hidden");
}

function changeQty(delta) {
  if (!currentProduct) return;
  const max = currentProduct.stock_quantity;
  selectedQty = Math.min(Math.max(1, selectedQty + delta), max);
  const display = document.getElementById("qty-display");
  if (display) display.textContent = selectedQty;
}

async function handleAddToCart() {
  if (!api.isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }
  if (!currentProduct) return;

  const btn = document.getElementById("add-to-cart-btn");
  btn.disabled = true;
  btn.textContent = "Adding...";

  try {
    await api.post("/cart/add", {
      product_id: currentProduct.id,
      quantity: selectedQty,
    });
    showToast(`"${currentProduct.name}" added to cart!`);
    updateCartBadge();
  } catch (err) {
    showToast(err.detail || "Failed to add to cart.", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Add to Cart";
  }
}

async function handleBuyNow() {
  if (!api.isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }
  if (!currentProduct) return;

  const btn = document.getElementById("buy-now-btn");
  btn.disabled = true;
  btn.textContent = "Processing...";

  try {
    // Add to cart first
    const cartItem = await api.post("/cart/add", {
      product_id: currentProduct.id,
      quantity: selectedQty,
    });

    // Then checkout immediately
    await api.post("/orders/checkout", { cart_id: cartItem.cart_id });
    showToast("Order placed successfully!");
    setTimeout(() => {
      window.location.href = "orders.html";
    }, 1200);
  } catch (err) {
    showToast(err.detail || "Failed to place order.", "error");
    btn.disabled = false;
    btn.textContent = "Buy Now";
  }
}

function shareProduct() {
  if (navigator.share) {
    navigator.share({
      title: currentProduct?.name || "Scan Info Tech Product",
      url: window.location.href,
    });
  } else {
    navigator.clipboard.writeText(window.location.href);
    showToast("Link copied to clipboard!");
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