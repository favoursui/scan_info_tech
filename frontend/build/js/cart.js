document.addEventListener("DOMContentLoaded", loadCart);

async function loadCart() {
  if (!api.isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }

  const container = document.getElementById("cart-container");
  const loading = document.getElementById("cart-loading");
  const empty = document.getElementById("cart-empty");
  const summary = document.getElementById("cart-summary");

  try {
    const items = await api.get("/cart/my-cart");
    if (loading) loading.classList.add("hidden");

    if (!items.length) {
      if (empty) empty.classList.remove("hidden");
      return;
    }

    if (summary) summary.classList.remove("hidden");
    renderCartItems(items, container);
    renderCartSummary(items);
  } catch (err) {
    if (loading) loading.classList.add("hidden");
    if (container)
      container.innerHTML = `<p class="text-red-500 text-center py-10">Failed to load cart.</p>`;
  }
}

function renderCartItems(items, container) {
  if (!container) return;
  container.innerHTML = items
    .map(
      (item) => `
    <div id="cart-item-${item.id}" class="card flex gap-4 p-4 items-start">
      <img
        src="${item.product?.image_url || "img/placeholder.jpg"}"
        alt="${item.product?.name}"
        class="w-24 h-28 object-cover rounded-lg"
        onerror="this.src='img/placeholder.jpg'"
      >
      <div class="flex-1">
        <p class="text-xs text-[#c17f24] font-semibold uppercase tracking-widest">Scan Info Tech</p>
        <h3 class="font-bold text-[#3b2a1a] text-base">${item.product?.name}</h3>
        <p class="text-gray-400 text-sm">
          ₦${Number(item.product?.price).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
        </p>
        <div class="flex items-center gap-3 mt-3">
          <button onclick="changeQty(${item.id}, ${item.quantity - 1})"
            class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 text-lg font-bold">−</button>
          <span class="font-semibold text-[#3b2a1a]" id="qty-${item.id}">${item.quantity}</span>
          <button onclick="changeQty(${item.id}, ${item.quantity + 1})"
            class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 text-lg font-bold">+</button>
          <button onclick="removeItem(${item.id})"
            class="ml-4 text-red-400 hover:text-red-600 text-sm font-medium">Remove</button>
        </div>
      </div>
      <div class="text-right">
        <p class="font-bold text-[#3b2a1a]" id="subtotal-${item.id}">
          ₦${(Number(item.product?.price) * item.quantity).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  `
    )
    .join("");
}

function renderCartSummary(items) {
  const total = items.reduce(
    (sum, item) => sum + Number(item.product?.price) * item.quantity,
    0
  );

  const formatted = `₦${total.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

  const totalEl = document.getElementById("cart-total");
  const totalFinalEl = document.getElementById("cart-total-final");
  if (totalEl) totalEl.textContent = formatted;
  if (totalFinalEl) totalFinalEl.textContent = formatted;

  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.onclick = () => checkoutAll(items);
  }
}

async function changeQty(cartId, newQty) {
  try {
    if (newQty === 0) {
      await removeItem(cartId);
      return;
    }
    await api.patch("/cart/update-qty", { cart_id: cartId, quantity: newQty });
    loadCart();
  } catch (err) {
    alert(err.detail || "Failed to update quantity.");
  }
}

async function removeItem(cartId) {
  try {
    await api.patch("/cart/update-qty", { cart_id: cartId, quantity: 0 });
    loadCart();
  } catch (err) {
    alert(err.detail || "Failed to remove item.");
  }
}

async function checkoutAll(items) {
  const btn = document.getElementById("checkout-btn");
  if (btn) btn.disabled = true;
  let successCount = 0;

  for (const item of items) {
    try {
      await api.post("/orders/checkout", { cart_id: item.id });
      successCount++;
    } catch (err) {
      console.error(`Checkout failed for cart item ${item.id}:`, err.detail);
    }
  }

  if (successCount > 0) {
    alert(`${successCount} item(s) checked out successfully!`);
    window.location.href = "orders.html";
  } else {
    alert("Checkout failed. Please try again.");
    if (btn) btn.disabled = false;
  }
}