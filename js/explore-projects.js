document.addEventListener("DOMContentLoaded", () => {
    const projectsGrid = document.getElementById("exploreProjectsGrid");
    const searchInput = document.getElementById("projectSearch");
    const message = document.getElementById("exploreMessage");

    let projects = [];
    let currentUserId = null;
    const requestedProjects = new Set();

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

    function renderProjects() {
        const search = searchInput.value.trim().toLowerCase();

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
            const isOwner =
                currentUserId != null &&
                Number(project.user_id) === Number(currentUserId);

            const skills = String(project.skills_required || "")
                .split(",")
                .map(skill => skill.trim())
                .filter(Boolean);

            const card = document.createElement("article");
            card.className = "project-card";

            card.innerHTML = `
                <div class="project-card-top">
                    <span class="project-status">
                        ${escapeHTML(project.status || "Open")}
                    </span>
                </div>

                <h2>${escapeHTML(project.project_name || "Untitled Project")}</h2>

                <p class="project-description">
                    ${escapeHTML(project.description || "No description provided.")}
                </p>

                <p class="project-meta">
                    <strong>Created by:</strong>
                    ${escapeHTML(project.username || "Student")}
                </p>

                <p class="project-meta">
                    <strong>Members needed:</strong>
                    ${escapeHTML(project.members_needed ?? "Not specified")}
                </p>

                <p class="project-meta">
                    <strong>Deadline:</strong>
                    ${project.deadline
    ? escapeHTML(new Date(project.deadline).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata"
    }))
    : "Not specified"}
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

                <button class="feature-button request-button" type="button">
                    ${isOwner ? "Your Project" : "Request to Join"}
                </button>
            `;

            const button = card.querySelector(".request-button");

            if (isOwner) {
                button.disabled = true;
            } else {
                button.addEventListener("click", () => requestToJoin(project, button));
            }

            if (requestedProjects.has(String(project.id))) {
                button.textContent = "Request Sent";
                button.disabled = true;
            }

            projectsGrid.appendChild(card);
        });
    }

    async function requestToJoin(project, button) {
        button.disabled = true;
        button.textContent = "Sending...";

        try {
            const response = await fetch(
                `/api/projects/${encodeURIComponent(project.id)}/request`,
                {
                    method: "POST",
                    credentials: "include"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not send your request.");
            }

            requestedProjects.add(String(project.id));
            button.textContent = "Request Sent";
            showMessage(data.message || "Your join request was sent!");
        } catch (error) {
            button.disabled = false;
            button.textContent = "Request to Join";
            showMessage(error.message || "Something went wrong.");
        }
    }

    async function loadProjects() {
        showMessage("Loading projects...");

        try {
            const response = await fetch("/api/projects/", {
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error("Could not load projects. Check your server.");
            }

            const data = await response.json();

            projects = data.projects || [];
            currentUserId = data.currentUserId ?? null;

            renderProjects();
        } catch (error) {
            projectsGrid.innerHTML = "";
            showMessage(error.message || "Unable to load projects.");
        }
    }

    searchInput.addEventListener("input", renderProjects);

    loadProjects();
});