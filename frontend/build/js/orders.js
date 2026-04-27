document.addEventListener("DOMContentLoaded", loadOrders);

async function loadOrders() {
  if (!api.isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }

  const container = document.getElementById("orders-container");
  const loading = document.getElementById("orders-loading");
  const empty = document.getElementById("orders-empty");

  try {
    const orders = await api.get("/orders/history");
    if (loading) loading.classList.add("hidden");

    if (!orders.length) {
      if (empty) empty.classList.remove("hidden");
      return;
    }

    if (container) {
      container.innerHTML = orders.map((o) => orderRow(o)).join("");
    }
  } catch (err) {
    if (loading) loading.classList.add("hidden");
    if (container) container.innerHTML = `<p class="text-red-500 text-center py-10">Failed to load orders.</p>`;
  }
}

function orderRow(o) {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };
  const color = statusColors[o.order_status] || "bg-gray-100 text-gray-700";

  return `
    <div class="card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <p class="text-xs text-gray-400 mb-1">Order #${o.id} · ${new Date(o.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}</p>
        <p class="font-bold text-[#3b2a1a] text-base">Product ID: ${o.product_id}</p>
        <p class="text-sm text-gray-500">Qty: ${o.quantity} · Unit Price: ₦${Number(o.unit_price).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</p>
      </div>
      <div class="flex flex-col items-end gap-2">
        <span class="font-bold text-[#3b2a1a] text-lg">₦${Number(o.amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
        <span class="text-xs font-semibold px-3 py-1 rounded-full capitalize ${color}">${o.order_status}</span>
      </div>
    </div>
  `;
}