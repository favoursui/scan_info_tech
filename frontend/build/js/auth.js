document.addEventListener("DOMContentLoaded", () => {
  // Register
  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    const passwordInput = document.getElementById("password");
    if (passwordInput) {
      passwordInput.addEventListener("input", updatePasswordStrength);
    }
    registerForm.addEventListener("submit", handleRegister);
  }

  // Login
  const loginForm = document.getElementById("login-form");
  if (loginForm) loginForm.addEventListener("submit", handleLogin);

  // Forgot password
  const forgotForm = document.getElementById("forgot-form");
  if (forgotForm) forgotForm.addEventListener("submit", handleForgotPassword);

  // Reset password
  const resetForm = document.getElementById("reset-form");
  if (resetForm) resetForm.addEventListener("submit", handleResetPassword);

  // Toggle password visibility
  document.querySelectorAll(".toggle-password").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      input.type = input.type === "password" ? "text" : "password";
      btn.innerHTML = input.type === "password" ? eyeIcon() : eyeOffIcon();
    });
  });
});

async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById("register-btn");
  const errorEl = document.getElementById("register-error");
  const successEl = document.getElementById("register-success");

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const shipping_address = document.getElementById("shipping_address")?.value.trim() || null;
  const terms = document.getElementById("terms")?.checked;

  if (!terms) {
    showError(errorEl, "Please agree to the Terms of Service.");
    return;
  }

  setLoading(btn, true);
  clearMessages(errorEl, successEl);

  try {
    await api.post("/auth/register", { username, email, password, shipping_address });
    showSuccess(successEl, "Account created! Please check your email to verify your account.");
    e.target.reset();
    updatePasswordStrength({ target: { value: "" } });
  } catch (err) {
    showError(errorEl, err.detail || "Registration failed. Please try again.");
  } finally {
    setLoading(btn, false);
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById("login-btn");
  const errorEl = document.getElementById("login-error");
  const successEl = document.getElementById("login-success");

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  setLoading(btn, true);
  clearMessages(errorEl, successEl);

  try {
    const data = await api.post("/auth/login", { email, password });
    api.setToken(data.access_token);

    // Fetch real profile using the token
    const me = await api.get("/auth/me");
    api.setUser({
      id: me.id,
      is_admin: me.is_admin,
      username: me.username,
      email: me.email,
    });

    showSuccess(successEl, "Login successful! Redirecting...");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  } catch (err) {
    showError(errorEl, err.detail || "Login failed. Please try again.");
  } finally {
    setLoading(btn, false);
  }
}

async function handleForgotPassword(e) {
  e.preventDefault();
  const btn = document.getElementById("forgot-btn");
  const errorEl = document.getElementById("forgot-error");
  const successEl = document.getElementById("forgot-success");
  const email = document.getElementById("email").value.trim();

  setLoading(btn, true);
  clearMessages(errorEl, successEl);

  try {
    const data = await api.post("/auth/forgot-password", { email });
    showSuccess(successEl, data.detail || "OTP sent! Check your email.");
    // Store email for reset page
    localStorage.setItem("reset_email", email);
    setTimeout(() => {
      window.location.href = "reset-password.html";
    }, 1500);
  } catch (err) {
    showError(errorEl, err.detail || "Something went wrong. Try again.");
  } finally {
    setLoading(btn, false);
  }
}

async function handleResetPassword(e) {
  e.preventDefault();
  const btn = document.getElementById("reset-btn");
  const errorEl = document.getElementById("reset-error");
  const successEl = document.getElementById("reset-success");

  const email = localStorage.getItem("reset_email") || document.getElementById("email")?.value.trim();
  const otp = document.getElementById("otp").value.trim();
  const new_password = document.getElementById("new_password").value;
  const confirm_password = document.getElementById("confirm_password").value;

  if (new_password !== confirm_password) {
    showError(errorEl, "Passwords do not match.");
    return;
  }

  setLoading(btn, true);
  clearMessages(errorEl, successEl);

  try {
    const data = await api.post("/auth/reset-password", { email, otp, new_password });
    showSuccess(successEl, data.detail || "Password reset! Redirecting to login...");
    localStorage.removeItem("reset_email");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  } catch (err) {
    showError(errorEl, err.detail || "Reset failed. Check your OTP and try again.");
  } finally {
    setLoading(btn, false);
  }
}

function updatePasswordStrength(e) {
  const val = e.target.value;
  const bar = document.getElementById("strength-bar");
  const label = document.getElementById("strength-label");
  if (!bar || !label) return;

  let strength = 0;
  if (val.length >= 8) strength++;
  if (/[A-Z]/.test(val)) strength++;
  if (/[0-9]/.test(val)) strength++;
  if (/[^A-Za-z0-9]/.test(val)) strength++;

  const levels = [
    { color: "bg-red-400", text: "Weak" },
    { color: "bg-orange-400", text: "Fair" },
    { color: "bg-yellow-400", text: "Good" },
    { color: "bg-green-500", text: "Strong ✓" },
  ];

  const level = levels[Math.max(0, strength - 1)] || levels[0];
  bar.style.width = `${(strength / 4) * 100}%`;
  bar.className = `h-1.5 rounded-full transition-all duration-300 ${level.color}`;
  label.textContent = val.length > 0 ? level.text : "";
}

//  Helpers 

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

function setLoading(btn, loading) {
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? "Please wait..." : btn.dataset.label || btn.textContent;
}

function showError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
}

function showSuccess(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
}

function clearMessages(...els) {
  els.forEach((el) => {
    if (el) el.classList.add("hidden");
  });
}

function eyeIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`;
}

function eyeOffIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.194-3.558M9.88 9.88a3 3 0 104.243 4.243M3 3l18 18"/></svg>`;
}