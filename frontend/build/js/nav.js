document.addEventListener("DOMContentLoaded", () => {
  renderNav();
  updateCartBadge();
});

function renderNav() {
  const user = api.getUser();
  const isLoggedIn = api.isLoggedIn();

  const navHTML = `
    <nav class="fixed w-full bg-[#f5efe6] border-b border-[#e0d0bc] top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">

          <!-- Logo & Brand -->
          <a href="index.html" class="flex items-center gap-3">
            <img src="img/logo.png" alt="Logo"
              class="w-10 h-10 rounded-full object-cover"
              onerror="this.style.display='none'">
            <span class="font-serif font-bold text-xl text-[#3b2a1a]">Scan Info Tech</span>
          </a>

          <!-- Desktop Nav Links -->
          <div class="hidden md:flex items-center gap-8">
            <a href="index.html" class="nav-link">Home</a>
            <a href="index.html" class="nav-link">Shop</a>
            <a href="about.html" class="nav-link">About Us</a>
          </div>

          <!-- Desktop Right Actions -->
          <div class="hidden md:flex items-center gap-3">
            ${isLoggedIn ? `
              <a href="orders.html"
                class="border border-[#3b2a1a] text-[#3b2a1a] hover:bg-[#3b2a1a] hover:text-white text-sm font-semibold py-2 px-4 rounded transition-all duration-200">
                Orders
              </a>
              <button onclick="handleSignOut()"
                class="bg-[#3b2a1a] hover:bg-[#c17f24] text-white text-sm font-semibold py-2 px-4 rounded transition-all duration-200">
                Sign Out
              </button>
              <div class="w-9 h-9 rounded-full bg-[#c17f24] text-white flex items-center justify-center font-bold text-sm uppercase">
                ${user?.username?.charAt(0) || "U"}
              </div>
            ` : `
              <a href="login.html"
                class="border border-[#3b2a1a] text-[#3b2a1a] hover:bg-[#3b2a1a] hover:text-white text-sm font-semibold py-2 px-4 rounded transition-all duration-200">
                Sign In
              </a>
            `}

            <!-- Cart Icon -->
            <a href="cart.html" class="relative">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-[#3b2a1a]" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span id="cart-badge" class="badge hidden">0</span>
            </a>
          </div>

          <!-- Mobile: Cart + Hamburger -->
          <div class="flex md:hidden items-center gap-4">
            <a href="cart.html" class="relative">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-[#3b2a1a]" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span id="cart-badge-mobile" class="badge hidden">0</span>
            </a>
            <button onclick="toggleMobileMenu()" class="text-[#3b2a1a]">
              <svg id="hamburger-icon" xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg id="close-icon" xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 hidden" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Full Screen Menu -->
      <div id="mobile-menu"
        class="fixed inset-0 bg-[#f5efe6] z-40 flex-col items-center justify-center gap-8 text-center hidden"
        style="top: 64px;">
        <div class="flex flex-col items-center gap-8 mt-16">
          <a href="index.html" onclick="closeMobileMenu()"
            class="text-2xl font-serif font-bold text-[#3b2a1a] hover:text-[#c17f24]">Home</a>
          <a href="index.html" onclick="closeMobileMenu()"
            class="text-2xl font-serif font-bold text-[#3b2a1a] hover:text-[#c17f24]">Shop</a>
          <a href="about.html" onclick="closeMobileMenu()"
            class="text-2xl font-serif font-bold text-[#3b2a1a] hover:text-[#c17f24]">About Us</a>
          ${isLoggedIn ? `
            <a href="orders.html" onclick="closeMobileMenu()"
              class="text-2xl font-serif font-bold text-[#3b2a1a] hover:text-[#c17f24]">Orders</a>
            <button onclick="handleSignOut()"
              class="btn-primary text-xl px-10 py-3 rounded-full">Sign Out</button>
            <div class="w-14 h-14 rounded-full bg-[#c17f24] text-white flex items-center justify-center font-bold text-2xl uppercase mt-2">
              ${user?.username?.charAt(0) || "U"}
            </div>
          ` : `
            <a href="login.html" onclick="closeMobileMenu()"
              class="btn-primary text-xl px-10 py-3 rounded-full">Sign In</a>
          `}
        </div>
      </div>
    </nav>
  `;

  const navContainer = document.getElementById("navbar");
  if (navContainer) navContainer.innerHTML = navHTML;
}

function toggleMobileMenu() {
  const menu = document.getElementById("mobile-menu");
  const hamburger = document.getElementById("hamburger-icon");
  const close = document.getElementById("close-icon");
  const isHidden = menu.classList.contains("hidden");

  if (isHidden) {
    menu.classList.remove("hidden");
    menu.classList.add("flex");
    hamburger.classList.add("hidden");
    close.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  } else {
    closeMobileMenu();
  }
}

function closeMobileMenu() {
  const menu = document.getElementById("mobile-menu");
  const hamburger = document.getElementById("hamburger-icon");
  const close = document.getElementById("close-icon");
  menu.classList.add("hidden");
  menu.classList.remove("flex");
  hamburger.classList.remove("hidden");
  close.classList.add("hidden");
  document.body.style.overflow = "";
}

function handleSignOut() {
  api.removeToken();
  window.location.href = "login.html";
}

async function updateCartBadge() {
  if (!api.isLoggedIn()) return;
  try {
    const items = await api.get("/cart/my-cart");
    const count = items.length;
    const badges = [
      document.getElementById("cart-badge"),
      document.getElementById("cart-badge-mobile"),
    ];
    badges.forEach((b) => {
      if (!b) return;
      if (count > 0) {
        b.textContent = count;
        b.classList.remove("hidden");
      } else {
        b.classList.add("hidden");
      }
    });
  } catch {
    // not logged in or error
  }
}