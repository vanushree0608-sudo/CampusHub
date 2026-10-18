// CampusHub - Explore Projects

document.addEventListener("DOMContentLoaded", () => {

    const API_BASE =
        "https://campushub-production-69eb.up.railway.app";

    const projectsGrid =
        document.getElementById("exploreProjectsGrid");

    const searchInput =
        document.getElementById("projectSearch");

    const message =
        document.getElementById("exploreMessage");

    if (!projectsGrid || !searchInput || !message) {
        console.error(
            "Explore Projects page is missing a required HTML element."
        );
        return;
    }

    let projects = [];
    let currentUserId = null;

    const requestedProjects = new Set();

    // ===============================
    // Escape HTML safely
    // ===============================

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    function showMessage(text) {
        message.textContent = text;
    }

    // ===============================
    // Send API requests to Railway
    // ===============================

    async function apiRequest(path, options = {}) {

        const response = await fetch(`${API_BASE}${path}`, {
            ...options,

            credentials: "include",

            headers: {
                ...(options.headers || {})
            }
        });

        let data;

        try {
            data = await response.json();
        } catch (error) {
            throw new Error(
                `Server returned an unreadable response (${response.status}).`
            );
        }

        if (!response.ok) {
            throw new Error(
                data.message || `Request failed (${response.status}).`
            );
        }

        return data;
    }

    // ===============================
    // Render Projects
    // ===============================

    function renderProjects() {

        const search =
            searchInput.value.trim().toLowerCase();

        const filtered = projects.filter(project => {

            const searchableText = [
                project.project_name,
                project.description,
                project.username,
                project.skills_required
            ].join(" ").toLowerCase();

            return searchableText.includes(search);
        });

        projectsGrid.innerHTML = "";

        if (filtered.length === 0) {

            showMessage(
                projects.length === 0
                    ? "No projects available yet."
                    : "No projects match your search."
            );

            return;
        }

        showMessage("");

        filtered.forEach(project => {

            // Identify the owner by comparing account IDs.
            const isOwner =
                currentUserId != null &&
                project.user_id != null &&
                Number(project.user_id) === Number(currentUserId);

            const skills = String(
                project.skills_required || ""
            )
                .split(",")
                .map(skill => skill.trim())
                .filter(Boolean);

            const card = document.createElement("article");

            card.className = "project-card";

            const deadlineText = project.deadline
                ? escapeHTML(
                    new Date(project.deadline).toLocaleDateString(
                        "en-IN",
                        {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            timeZone: "Asia/Kolkata"
                        }
                    )
                )
                : "Not specified";

            card.innerHTML = `
                <div class="project-card-top">
                    <span class="project-status">
                        ${escapeHTML(project.status || "Open")}
                    </span>
                </div>

                <h2>
                    ${escapeHTML(
                        project.project_name || "Untitled Project"
                    )}
                </h2>

                <p class="project-description">
                    ${escapeHTML(
                        project.description || "No description provided."
                    )}
                </p>

                <p class="project-meta">
                    <strong>Created by:</strong>
                    ${escapeHTML(project.username || "Student")}
                </p>

                <p class="project-meta">
                    <strong>Members needed:</strong>
                    ${escapeHTML(
                        project.members_needed ?? "Not specified"
                    )}
                </p>

                <p class="project-meta">
                    <strong>Deadline:</strong>
                    ${deadlineText}
                </p>

                <div class="project-skills">
                    ${
                        skills.length
                            ? skills.map(skill =>
                                `<span class="skill-tag">${escapeHTML(skill)}</span>`
                              ).join("")
                            : "<span>No skills specified</span>"
                    }
                </div>

                <button
                    class="feature-button request-button"
                    type="button">
                    ${
                        isOwner
                            ? "Your Project"
                            : "Request to Join"
                    }
                </button>
            `;

            const button =
                card.querySelector(".request-button");

            if (isOwner) {

                // Owners should not request to join their own project.
                button.disabled = true;

            } else if (
                requestedProjects.has(String(project.id))
            ) {

                button.textContent = "Request Sent";
                button.disabled = true;

            } else {

                button.addEventListener("click", () => {
                    requestToJoin(project, button);
                });
            }

            projectsGrid.appendChild(card);
        });
    }

    // ===============================
    // Request to Join a Project
    // ===============================

    async function requestToJoin(project, button) {

        button.disabled = true;
        button.textContent = "Sending...";

        try {

            const data = await apiRequest(
                `/api/projects/${encodeURIComponent(project.id)}/request`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            requestedProjects.add(String(project.id));

            button.textContent = "Request Sent";

            showMessage(
                data.message || "Your join request was sent!"
            );

        } catch (error) {

            console.error(
                "Project join request error:",
                error
            );

            button.disabled = false;
            button.textContent = "Request to Join";

            showMessage(
                error.message || "Something went wrong."
            );
        }
    }

    // ===============================
    // Load Projects and Current User
    // ===============================

    async function loadProjects() {

        showMessage("Loading projects...");

        try {

            // First, identify the currently logged-in user.
            const meData = await apiRequest("/api/auth/me");

            if (!meData.user) {

                showMessage(
                    "Please log in to explore projects."
                );

                return;
            }

            currentUserId = meData.user.id ?? null;

            // Then load all available projects.
            const data = await apiRequest("/api/projects/");

            projects = Array.isArray(data.projects)
                ? data.projects
                : [];

            // Use the projects response as a fallback if needed.
            if (
                currentUserId == null &&
                data.currentUserId != null
            ) {
                currentUserId = data.currentUserId;
            }

            console.log(
                "Explore projects loaded:",
                projects
            );

            console.log(
                "Explore logged-in user ID:",
                currentUserId
            );

            renderProjects();

        } catch (error) {

            console.error(
                "Explore projects loading error:",
                error
            );

            projectsGrid.innerHTML = "";

            showMessage(
                error.message ||
                "Could not load projects. Check your server."
            );
        }
    }

    // ===============================
    // Search Projects
    // ===============================

    searchInput.addEventListener(
        "input",
        renderProjects
    );

    // Start the page.
    loadProjects();

});
