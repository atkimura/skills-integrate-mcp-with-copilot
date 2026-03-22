document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const adminNote = document.getElementById("admin-note");
  const accountButton = document.getElementById("account-button");
  const accountPanel = document.getElementById("account-panel");
  const accountStatus = document.getElementById("account-status");
  const openLoginButton = document.getElementById("open-login-button");
  const logoutButton = document.getElementById("logout-button");
  const loginModal = document.getElementById("login-modal");
  const closeLoginButton = document.getElementById("close-login-button");
  const loginForm = document.getElementById("login-form");

  let isTeacherAuthenticated = false;
  let teacherUsername = null;

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function updateAdminUI() {
    signupForm.querySelectorAll("input, select, button").forEach((element) => {
      element.disabled = !isTeacherAuthenticated;
    });

    adminNote.textContent = isTeacherAuthenticated
      ? `Teacher mode enabled for ${teacherUsername}.`
      : "Teacher login is required to register or unregister students.";

    adminNote.className = isTeacherAuthenticated ? "success-banner" : "info-banner";
    accountStatus.textContent = isTeacherAuthenticated
      ? `Logged in as ${teacherUsername}`
      : "Viewing as student";

    openLoginButton.classList.toggle("hidden", isTeacherAuthenticated);
    logoutButton.classList.toggle("hidden", !isTeacherAuthenticated);
  }

  async function loadAuthState() {
    try {
      const response = await fetch("/auth/me", { credentials: "same-origin" });
      const result = await response.json();

      isTeacherAuthenticated = result.authenticated;
      teacherUsername = result.username;
      updateAdminUI();
    } catch (error) {
      console.error("Error loading auth state:", error);
      isTeacherAuthenticated = false;
      teacherUsername = null;
      updateAdminUI();
    }
  }

  function toggleAccountPanel() {
    accountPanel.classList.toggle("hidden");
  }

  function openLoginModal() {
    loginModal.classList.remove("hidden");
    accountPanel.classList.add("hidden");
  }

  function closeLoginModal() {
    loginModal.classList.add("hidden");
    loginForm.reset();
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span>${
                        isTeacherAuthenticated
                          ? `<button class="delete-btn" data-activity="${name}" data-email="${email}">Remove</button>`
                          : ""
                      }</li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
        return;
      }

      showMessage(result.message, "success");
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
        return;
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        showMessage(result.detail || "Login failed", "error");
        return;
      }

      isTeacherAuthenticated = true;
      teacherUsername = result.username;
      updateAdminUI();
      closeLoginModal();
      fetchActivities();
      showMessage(result.message, "success");
    } catch (error) {
      showMessage("Failed to log in. Please try again.", "error");
      console.error("Error logging in:", error);
    }
  });

  logoutButton.addEventListener("click", async () => {
    try {
      const response = await fetch("/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      const result = await response.json();

      isTeacherAuthenticated = false;
      teacherUsername = null;
      updateAdminUI();
      fetchActivities();
      showMessage(result.message || "Logged out", "success");
    } catch (error) {
      showMessage("Failed to log out. Please try again.", "error");
      console.error("Error logging out:", error);
    }
  });

  accountButton.addEventListener("click", toggleAccountPanel);
  openLoginButton.addEventListener("click", openLoginModal);
  closeLoginButton.addEventListener("click", closeLoginModal);

  document.addEventListener("click", (event) => {
    if (!accountPanel.contains(event.target) && !accountButton.contains(event.target)) {
      accountPanel.classList.add("hidden");
    }

    if (event.target === loginModal) {
      closeLoginModal();
    }
  });

  // Initialize app
  loadAuthState().then(fetchActivities);
});
