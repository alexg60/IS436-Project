(function () {
  const CURRENT_USER_KEY = "summitRidgeCurrentUser";

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || "null");
    } catch (_error) {
      return null;
    }
  }

  function setCurrentUser(user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }

  function clearCurrentUser() {
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatDate(value) {
    if (!value) return "N/A";
    return new Date(value).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  }

  async function fetchJson(url, options) {
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  function updateUserContext() {
    const user = getCurrentUser();
    const note = document.querySelector(".topbar-note");
    if (note && user) {
      note.textContent = `Signed in as ${user.full_name} • ${user.role.replaceAll("_", " ")}`;
    }
  }

  function initAuthButton() {
    const authButton = document.querySelector("[data-auth-button='true']");
    if (!authButton) return;

    const user = getCurrentUser();
    if (!user) {
      authButton.textContent = "Login";
      authButton.href = "./summit_ridge_it_login.html";
      return;
    }

    authButton.textContent = "Sign Out";
    authButton.href = "./summit_ridge_it_ticketing_homepage.html";
    authButton.addEventListener("click", (event) => {
      event.preventDefault();
      clearCurrentUser();
      window.location.href = "./summit_ridge_it_ticketing_homepage.html";
    });
  }

  function initProtectedLinks() {
    const protectedLinks = document.querySelectorAll("[data-protected-link='true']");
    if (!protectedLinks.length) return;

    const user = getCurrentUser();
    protectedLinks.forEach((link) => {
      if (!user) {
        link.classList.add("is-locked");
        link.setAttribute("aria-label", `${link.textContent.trim()} requires login`);
        link.addEventListener("click", (event) => {
          event.preventDefault();
          window.location.href = "./summit_ridge_it_login.html";
        });
      } else {
        link.classList.remove("is-locked");
      }
    });
  }

  function initAdminOnlyContent() {
    const adminOnlyItems = document.querySelectorAll("[data-admin-only='true']");
    if (!adminOnlyItems.length) return;

    const user = getCurrentUser();
    const isAdmin = user && user.role === "admin";
    adminOnlyItems.forEach((item) => {
      item.hidden = !isAdmin;
    });
  }

  async function initLoginPage() {
    const form = document.querySelector(".login-form");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = form.email.value.trim();
      const password = form.password.value;
      if (!email || !password) return;

      try {
        const user = await fetchJson("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        setCurrentUser(user);
        window.location.href = "./summit_ridge_it_ticketing_homepage.html";
      } catch (error) {
        alert(error.message);
      }
    });
  }

  async function initCreateTicketPage() {
    const form = document.querySelector(".ticket-form");
    if (!form) return;

    const user = getCurrentUser();
    const categorySelect = document.querySelector("#category_id");
    const submittedByInput = document.querySelector("#submitted_by");

    try {
      const categories = await fetchJson("/api/categories");
      if (categorySelect) {
        categorySelect.innerHTML = [
          '<option value="">Select category</option>',
          ...categories.map(
            (category) =>
              `<option value="${category.category_id}">${escapeHtml(category.category_name)}</option>`
          )
        ].join("");
      }
    } catch (error) {
      console.error(error);
    }

    if (user && submittedByInput) {
      submittedByInput.value = user.user_id;
      submittedByInput.readOnly = true;
      submittedByInput.setAttribute("aria-readonly", "true");
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      try {
        const ticket = await fetchJson("/api/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        alert(`Ticket #${ticket.ticket_id} created successfully.`);
        window.location.href = "./summit_ridge_my_tickets.html";
      } catch (error) {
        alert(error.message);
      }
    });
  }

  async function initAddAssetPage() {
    const form = document.querySelector("[data-asset-form='true']");
    if (!form) return;

    const user = getCurrentUser();
    const errorNote = document.querySelector("[data-admin-form-empty]");

    if (!user || user.role !== "admin") {
      if (errorNote) {
        errorNote.hidden = false;
        errorNote.textContent = "Only admins can add assets.";
      }
      form.querySelectorAll("input, select, textarea, button").forEach((field) => {
        field.disabled = true;
      });
      return;
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());
      payload.created_by = user.user_id;

      try {
        const asset = await fetchJson("/api/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        alert(`Asset #${asset.asset_id} added successfully.`);
        window.location.href = "./summit_ridge_assets.html";
      } catch (error) {
        alert(error.message);
      }
    });
  }

  async function initAddLicensePage() {
    const form = document.querySelector("[data-license-form='true']");
    if (!form) return;

    const user = getCurrentUser();
    const errorNote = document.querySelector("[data-admin-form-empty]");

    if (!user || user.role !== "admin") {
      if (errorNote) {
        errorNote.hidden = false;
        errorNote.textContent = "Only admins can add licenses.";
      }
      form.querySelectorAll("input, select, textarea, button").forEach((field) => {
        field.disabled = true;
      });
      return;
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());
      payload.created_by = user.user_id;

      try {
        const license = await fetchJson("/api/licenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        alert(`License #${license.license_id} added successfully.`);
        window.location.href = "./summit_ridge_licenses.html";
      } catch (error) {
        alert(error.message);
      }
    });
  }

  function statusClass(status) {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "in progress") return "pill-progress";
    if (normalized === "pending") return "pill-pending";
    if (normalized === "resolved" || normalized === "closed") return "pill-resolved";
    return "pill-open";
  }

  function priorityClass(priority) {
    const normalized = String(priority || "").toLowerCase();
    if (normalized === "critical") return "pill-critical";
    if (normalized === "high") return "pill-high";
    if (normalized === "medium") return "pill-medium";
    return "pill-low";
  }

  const TICKET_STATUSES = ["Open", "In Progress", "Pending", "Resolved", "Closed"];

  async function updateTicketStatus(ticketId, status, changedBy) {
    return fetchJson(`/api/tickets/${ticketId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        changed_by: changedBy,
        status
      })
    });
  }

  async function initTicketsPage() {
    const tableBody = document.querySelector("[data-ticket-table-body]");
    if (!tableBody) return;

    const user = getCurrentUser();
    const emptyState = document.querySelector("[data-ticket-empty]");
    const heading = document.querySelector("[data-ticket-heading]");
    const total = document.querySelector("[data-summary-total]");
    const progress = document.querySelector("[data-summary-progress]");
    const pending = document.querySelector("[data-summary-pending]");
    const adminActionsHeader = document.querySelector("[data-admin-actions-header]");

    if (!user) {
      tableBody.innerHTML = "";
      if (heading) heading.textContent = "Sign in to view your tickets";
      if (emptyState) {
        emptyState.hidden = false;
        emptyState.textContent = "No user is signed in yet. Use the login page first, then come back here.";
      }
      return;
    }

    const isAdmin = user.role === "admin";
    if (adminActionsHeader) {
      adminActionsHeader.hidden = !isAdmin;
    }
    if (heading) {
      heading.textContent = isAdmin ? "All available tickets" : `${user.full_name}'s tickets`;
    }

    try {
      const endpoint = isAdmin
        ? "/api/tickets"
        : `/api/tickets?user_id=${encodeURIComponent(user.user_id)}`;
      const tickets = await fetchJson(endpoint);
      const progressCount = tickets.filter((ticket) => ticket.status === "In Progress").length;
      const pendingCount = tickets.filter((ticket) => ticket.status === "Pending").length;

      if (total) total.textContent = tickets.length;
      if (progress) progress.textContent = progressCount;
      if (pending) pending.textContent = pendingCount;

      if (!tickets.length) {
        tableBody.innerHTML = "";
        if (emptyState) {
          emptyState.hidden = false;
          emptyState.textContent = isAdmin
            ? "There are no tickets in the system yet."
            : "No tickets are currently tied to this user.";
        }
        return;
      }

      if (emptyState) emptyState.hidden = true;

      tableBody.innerHTML = tickets.map((ticket) => `
        <tr>
          <td>
            <span class="ticket-title">#${ticket.ticket_id} ${escapeHtml(ticket.title)}</span>
            <span class="ticket-subtext">Submitted by ${escapeHtml(ticket.submitted_by_name)}${ticket.assigned_to_name ? ` • assigned to ${escapeHtml(ticket.assigned_to_name)}` : " • unassigned"}</span>
          </td>
          <td>
            ${isAdmin ? `
              <div class="status-editor">
                <select class="status-select" data-status-select="${ticket.ticket_id}">
                  ${TICKET_STATUSES.map((status) => `
                    <option value="${status}" ${status === ticket.status ? "selected" : ""}>${status}</option>
                  `).join("")}
                </select>
                <span class="pill ${statusClass(ticket.status)}">${escapeHtml(ticket.status)}</span>
              </div>
            ` : `<span class="pill ${statusClass(ticket.status)}">${escapeHtml(ticket.status)}</span>`}
          </td>
          <td><span class="pill ${priorityClass(ticket.priority)}">${escapeHtml(ticket.priority)}</span></td>
          <td>${escapeHtml(ticket.category_name)}</td>
          <td>${escapeHtml(ticket.store_location || "N/A")}</td>
          <td>${escapeHtml(ticket.device_id || ticket.device_type || "N/A")}</td>
          <td>${escapeHtml(formatDate(ticket.updated_at))}</td>
          ${isAdmin ? `
            <td>
              <button class="btn btn-secondary btn-small" data-status-save="${ticket.ticket_id}">Save</button>
            </td>
          ` : ""}
        </tr>
      `).join("");

      if (isAdmin) {
        tableBody.querySelectorAll("[data-status-save]").forEach((button) => {
          button.addEventListener("click", async () => {
            const ticketId = button.getAttribute("data-status-save");
            const select = tableBody.querySelector(`[data-status-select="${ticketId}"]`);
            if (!select) return;

            try {
              button.disabled = true;
              button.textContent = "Saving...";
              await updateTicketStatus(ticketId, select.value, user.user_id);
              await initTicketsPage();
            } catch (error) {
              alert(error.message);
              button.disabled = false;
              button.textContent = "Save";
            }
          });
        });
      }
    } catch (error) {
      if (emptyState) {
        emptyState.hidden = false;
        emptyState.textContent = error.message;
      }
    }
  }

  function assetStatusClass(status) {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "in repair") return "pill-pending";
    if (normalized === "retired" || normalized === "missing") return "pill-critical";
    return "pill-open";
  }

  async function initAssetsPage() {
    const tableBody = document.querySelector("[data-assets-table-body]");
    if (!tableBody) return;

    const user = getCurrentUser();
    const emptyState = document.querySelector("[data-assets-empty]");
    const heading = document.querySelector("[data-assets-heading]");

    if (!user) {
      if (heading) heading.textContent = "Sign in to view assets";
      if (emptyState) {
        emptyState.hidden = false;
        emptyState.textContent = "Login is required to access asset tracking.";
      }
      tableBody.innerHTML = "";
      return;
    }

    if (user.role !== "admin") {
      if (heading) heading.textContent = "Admin access required";
      if (emptyState) {
        emptyState.hidden = false;
        emptyState.textContent = "Only admins can view tracked assets.";
      }
      tableBody.innerHTML = "";
      return;
    }

    try {
      const assets = await fetchJson(`/api/assets?user_id=${encodeURIComponent(user.user_id)}`);
      if (!assets.length) {
        if (emptyState) {
          emptyState.hidden = false;
          emptyState.textContent = "No assets are currently stored in the system.";
        }
        tableBody.innerHTML = "";
        return;
      }

      if (emptyState) emptyState.hidden = true;

      tableBody.innerHTML = assets.map((asset) => `
        <tr>
          <td>
            <span class="ticket-title">#${asset.asset_id} ${escapeHtml(asset.asset_name)}</span>
            <span class="ticket-subtext">${escapeHtml(asset.serial_number || "No serial number")}</span>
          </td>
          <td>${escapeHtml(asset.device_type)}</td>
          <td>${escapeHtml(asset.make_model || "N/A")}</td>
          <td>${escapeHtml(asset.assigned_to_name || "Unassigned")}</td>
          <td>${escapeHtml(asset.store_location || "N/A")}</td>
          <td><span class="pill ${assetStatusClass(asset.status)}">${escapeHtml(asset.status)}</span></td>
          <td>${escapeHtml(asset.warranty_expiry || "N/A")}</td>
        </tr>
      `).join("");
    } catch (error) {
      if (emptyState) {
        emptyState.hidden = false;
        emptyState.textContent = error.message;
      }
    }
  }

  async function initLicensesPage() {
    const tableBody = document.querySelector("[data-licenses-table-body]");
    if (!tableBody) return;

    const user = getCurrentUser();
    const emptyState = document.querySelector("[data-licenses-empty]");
    const heading = document.querySelector("[data-licenses-heading]");

    if (!user) {
      if (heading) heading.textContent = "Sign in to view licenses";
      if (emptyState) {
        emptyState.hidden = false;
        emptyState.textContent = "Login is required to access license tracking.";
      }
      tableBody.innerHTML = "";
      return;
    }

    if (user.role !== "admin") {
      if (heading) heading.textContent = "Admin access required";
      if (emptyState) {
        emptyState.hidden = false;
        emptyState.textContent = "Only admins can view tracked licenses.";
      }
      tableBody.innerHTML = "";
      return;
    }

    try {
      const licenses = await fetchJson(`/api/licenses?user_id=${encodeURIComponent(user.user_id)}`);
      if (!licenses.length) {
        if (emptyState) {
          emptyState.hidden = false;
          emptyState.textContent = "No licenses are currently stored in the system.";
        }
        tableBody.innerHTML = "";
        return;
      }

      if (emptyState) emptyState.hidden = true;

      tableBody.innerHTML = licenses.map((license) => {
        const totalSeats = Number(license.total_seats || 0);
        const seatsInUse = Number(license.seats_in_use || 0);
        const availableSeats = totalSeats - seatsInUse;
        return `
          <tr>
            <td>
              <span class="ticket-title">#${license.license_id} ${escapeHtml(license.software_name)}</span>
              <span class="ticket-subtext">${escapeHtml(license.notes || "No notes")}</span>
            </td>
            <td>${escapeHtml(license.vendor || "N/A")}</td>
            <td>${escapeHtml(totalSeats)}</td>
            <td>${escapeHtml(seatsInUse)}</td>
            <td>${escapeHtml(availableSeats)}</td>
            <td>${escapeHtml(license.expiry_date || "N/A")}</td>
            <td>${escapeHtml(license.purchased_date || "N/A")}</td>
          </tr>
        `;
      }).join("");
    } catch (error) {
      if (emptyState) {
        emptyState.hidden = false;
        emptyState.textContent = error.message;
      }
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    updateUserContext();
    initAuthButton();
    initAdminOnlyContent();
    initProtectedLinks();
    initLoginPage();
    initCreateTicketPage();
    initAddAssetPage();
    initAddLicensePage();
    initTicketsPage();
    initAssetsPage();
    initLicensesPage();
  });
})();
