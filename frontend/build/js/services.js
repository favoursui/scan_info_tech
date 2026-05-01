document.addEventListener("DOMContentLoaded", () => {
  // Load services on services.html
  if (document.getElementById("services-grid")) {
    loadAllServices();
  }

  // Load services preview on index.html
  if (document.getElementById("services-preview-grid")) {
    loadServicesPreview();
  }

  // Booking form
  document.getElementById("booking-form")
    ?.addEventListener("submit", handleBooking);
});

// Load all services (services.html) 
async function loadAllServices() {
  const grid    = document.getElementById("services-grid");
  const loading = document.getElementById("services-loading");
  const empty   = document.getElementById("services-empty");

  try {
    const services = await api.get("/services");
    if (loading) loading.classList.add("hidden");

    if (!services.length) {
      if (empty) empty.classList.remove("hidden");
      return;
    }

    grid.innerHTML = services.map((s) => serviceCard(s)).join("");
  } catch (err) {
    if (loading) loading.classList.add("hidden");
    grid.innerHTML = `<p class="col-span-4 text-center text-red-400 py-10">
      Failed to load services.</p>`;
  }
}

// Load 8 services preview (index.html) 
async function loadServicesPreview() {
  const grid    = document.getElementById("services-preview-grid");
  const loading = document.getElementById("services-preview-loading");
  const section = document.getElementById("services-preview-section");

  try {
    const services = await api.get("/services");

    if (!services.length) {
      if (section) section.classList.add("hidden");
      return;
    }

    if (loading) loading.classList.add("hidden");

    // Show max 8
    const preview = services.slice(0, 8);
    grid.innerHTML = preview.map((s) => serviceCard(s)).join("");
  } catch (err) {
    if (loading) loading.classList.add("hidden");
  }
}

// Service card (glassmorphism) 
function serviceCard(s) {
  return `
    <div class="relative overflow-hidden rounded-sm p-6 cursor-pointer group
                transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      style="background: rgba(59,42,26,0.75); backdrop-filter: blur(16px);
             border: 1px solid rgba(255,255,255,0.12);">

      <!-- Glow blob -->
      <div class="absolute -top-6 -right-6 w-24 h-24 bg-[#c17f24]/20
                  rounded-full blur-2xl group-hover:bg-[#c17f24]/30
                  transition-all duration-300"></div>
     

      <!-- Name -->
      <h3 class="font-bold font-sans text-white text-base mb-4 relative z-10 leading-snug">
        ${s.name}
      </h3>

      <!-- Book button -->
      <button onclick="openBookingModal('${s.name.replace(/'/g, "\\'")}')"
        class="relative z-10 w-full bg-[#c17f24] hover:bg-[#a66d1a] text-white
               text-xs font-bold py-2.5 transition-all duration-200
               flex items-center justify-center gap-2">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        Book This Service
      </button>
    </div>
  `;
}

// Booking Modal 
function openBookingModal(serviceName) {
  document.getElementById("modal-service-name").textContent   = serviceName;
  document.getElementById("booking-service-name").value       = serviceName;
  document.getElementById("booking-error").classList.add("hidden");
  document.getElementById("booking-success").classList.add("hidden");
  document.getElementById("booking-form").reset();
  document.getElementById("booking-service-name").value       = serviceName;

  const modal = document.getElementById("booking-modal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  document.body.style.overflow = "hidden";
}

function closeBookingModal() {
  const modal = document.getElementById("booking-modal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  document.body.style.overflow = "";
}

// Close on backdrop click
document.getElementById("booking-modal")?.addEventListener("click", (e) => {
  if (e.target === document.getElementById("booking-modal")) {
    closeBookingModal();
  }
});

// Submit Booking 
async function handleBooking(e) {
  e.preventDefault();
  const btn       = document.getElementById("booking-btn");
  const errorEl   = document.getElementById("booking-error");
  const successEl = document.getElementById("booking-success");

  const payload = {
    service_name:  document.getElementById("booking-service-name").value,
    client_name:   document.getElementById("b-name").value.trim(),
    client_email:  document.getElementById("b-email").value.trim(),
    client_phone:  document.getElementById("b-phone").value.trim() || null,
    message:       document.getElementById("b-message").value.trim() || null,
  };

  btn.disabled    = true;
  btn.textContent = "Submitting...";
  errorEl.classList.add("hidden");
  successEl.classList.add("hidden");

  try {
    const data = await api.post("/services/book", payload);
    successEl.textContent = data.detail ||
      "Booking submitted! We'll be in touch soon.";
    successEl.classList.remove("hidden");
    document.getElementById("booking-form").reset();

    // Auto close after 3 seconds
    setTimeout(() => closeBookingModal(), 3000);
  } catch (err) {
    errorEl.textContent = err.detail || "Failed to submit booking. Please try again.";
    errorEl.classList.remove("hidden");
  } finally {
    btn.disabled    = false;
    btn.textContent = "Submit Booking";
  }
}