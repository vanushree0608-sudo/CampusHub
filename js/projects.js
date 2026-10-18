// CampusHub Projects
const API_BASE = "https://campushub-production-69eb.up.railway.app";

console.log("CampusHub projects.js loaded");

// Send API requests to Railway with the login session cookie.
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
// Create Project Button
// ===============================
const createProjectBtn =
    document.querySelector("#createProjectBtn");

if (createProjectBtn) {
    createProjectBtn.addEventListener("click", function () {
        window.location.href = "create-project.html";
    });
}

// ===============================
// Load Projects and Logged-in User
// ===============================
async function loadProjects() {
    const projectsContainer =
        document.querySelector("#projectsContainer");

    if (!projectsContainer) return;

    try {
        // Get the actual logged-in user and available projects.
        const [meResponse, projectsResponse] = await Promise.all([
            fetch(`${API_BASE}/api/auth/me`, {
                credentials: "include"
            }),

            fetch(`${API_BASE}/api/projects/`, {
                credentials: "include"
            })
        ]);

        let meData;
        let projectsData;

        try {
            meData = await meResponse.json();
            projectsData = await projectsResponse.json();
        } catch (error) {
            throw new Error(
                "The server returned an unreadable response."
            );
        }

        if (!meResponse.ok || !meData.user) {
            alert("Please login first.");
            window.location.href = "login.html";
            return;
        }

        if (!projectsResponse.ok) {
            throw new Error(
                projectsData.message || "Unable to load projects."
            );
        }

        // Prefer the ID from the authenticated user endpoint.
        const currentUserId =
            meData.user.id ?? projectsData.currentUserId;

        console.log("Projects received:", projectsData);
        console.log("Logged-in user ID:", currentUserId);

        console.log(
            "Project owner IDs:",
            (projectsData.projects || []).map(project => ({
                name: project.project_name,
                ownerId: project.user_id
            }))
        );

        projectsContainer.innerHTML = "";

        if (
            !projectsData.projects ||
            projectsData.projects.length === 0
        ) {
            projectsContainer.innerHTML =
                "<p>No projects available yet.</p>";

            return;
        }

        projectsData.projects.forEach(project => {
            const projectCard =
                document.createElement("div");

            projectCard.className = "feature-card";

            // Check whether the logged-in user owns this project.
            const isOwner =
                currentUserId != null &&
                Number(project.user_id) === Number(currentUserId);

            let actionButton = "";

            if (isOwner) {
                actionButton = `
                    <button
                        class="delete-btn"
                        data-id="${project.id}">
                        Delete Project
                    </button>
                `;
            } else {
                actionButton = `
                    <button
                        class="request-btn"
                        data-id="${project.id}">
                        Request to Join
                    </button>
                `;
            }

            // Display project information.
            projectCard.innerHTML = `
                <h2>🚀 ${project.project_name || "Untitled Project"}</h2>

                <p>${project.description || "No description provided."}</p>

                <p>
                    <strong>Skills:</strong>
                    ${project.skills_required || "Not specified"}
                </p>

                <p>
                    <strong>Members Needed:</strong>
                    ${project.members_needed ?? "Not specified"}
                </p>

                <p>
                    <strong>Deadline:</strong>
                    ${project.deadline || "Not specified"}
                </p>

                <p>
                    <strong>Status:</strong>
                    ${project.status || "Open"}
                </p>

                <p>
                    <strong>Posted by:</strong>
                    @${project.username || "unknown"}
                </p>

                ${actionButton}

                <button
                    class="chat-btn"
                    data-id="${project.id}">
                    💬 Team Chat
                </button>
            `;

            // Open the project's team chat.
            const chatButton =
                projectCard.querySelector(".chat-btn");

            chatButton.addEventListener("click", function () {
                window.location.href =
                    `chat.html?projectId=${project.id}`;
            });

            // Load join requests only for the project owner.
            if (isOwner) {
                loadProjectRequests(project.id, projectCard);
            }

            // Load the project's team members.
            loadTeamMembers(project.id, projectCard);

            projectsContainer.appendChild(projectCard);
        });

    } catch (error) {
        console.error("Error loading projects:", error);

        projectsContainer.innerHTML =
            "<p>Unable to load projects. Please refresh and try again.</p>";
    }
}

// ===============================
// Load Join Requests For Project Owner
// ===============================
async function loadProjectRequests(projectId, projectCard) {
    try {
        const requestData = await apiRequest(
            `/api/projects/${projectId}/requests`
        );

        console.log("Requests:", requestData);

        if (
            !requestData.requests ||
            requestData.requests.length === 0
        ) {
            return;
        }

        const requestsSection =
            document.createElement("div");

        requestsSection.style.marginTop = "20px";
        requestsSection.style.paddingTop = "15px";
        requestsSection.style.borderTop = "1px solid #26384a";

        requestsSection.innerHTML =
            "<h3>🔔 Join Requests</h3>";

        requestData.requests.forEach(request => {
            const requestItem =
                document.createElement("div");

            requestItem.style.marginTop = "15px";

            requestItem.innerHTML = `
                <p>
                    <strong>${request.full_name || "Student"}</strong>
                    (@${request.username || "unknown"})
                    wants to join this project.
                </p>

                <p>
                    <strong>Status:</strong>
                    ${request.status}
                </p>

                ${
                    request.status === "Pending"
                        ? `
                            <button
                                class="accept-btn"
                                data-request-id="${request.id}">
                                Accept
                            </button>

                            <button
                                class="reject-btn"
                                data-request-id="${request.id}">
                                Reject
                            </button>
                        `
                        : ""
                }
            `;

            requestsSection.appendChild(requestItem);
        });

        projectCard.appendChild(requestsSection);

    } catch (error) {
        console.error("Error loading requests:", error);
    }
}

// ===============================
// Load Team Members
// ===============================
async function loadTeamMembers(projectId, projectCard) {
    try {
        const memberData = await apiRequest(
            `/api/projects/${projectId}/members`
        );

        console.log("Team members:", memberData);

        const membersSection =
            document.createElement("div");

        membersSection.style.marginTop = "20px";
        membersSection.style.paddingTop = "15px";
        membersSection.style.borderTop = "1px solid #26384a";

        membersSection.innerHTML =
            "<h3>👥 Team Members</h3>";

        if (
            !memberData.members ||
            memberData.members.length === 0
        ) {
            membersSection.innerHTML +=
                "<p>No team members yet.</p>";

        } else {
            memberData.members.forEach(member => {
                const memberItem =
                    document.createElement("p");

                memberItem.style.marginTop = "10px";

                memberItem.textContent =
                    `👤 ${member.full_name || "Student"} ` +
                    `(@${member.username || "unknown"})`;

                membersSection.appendChild(memberItem);
            });
        }

        projectCard.appendChild(membersSection);

    } catch (error) {
        console.error("Error loading team members:", error);
    }
}

// ===============================
// Delete Project
// ===============================
document.addEventListener("click", async function (event) {
    const button = event.target.closest(".delete-btn");

    if (!button) return;

    const projectId = button.dataset.id;

    const confirmDelete = confirm(
        "Are you sure you want to delete this project?"
    );

    if (!confirmDelete) return;

    try {
        const data = await apiRequest(
            `/api/projects/${projectId}`,
            {
                method: "DELETE"
            }
        );

        alert(data.message || "Project deleted.");

        if (data.message === "Project deleted successfully!") {
            location.reload();
        }

    } catch (error) {
        console.error("Delete error:", error);

        alert(error.message || "Unable to delete project.");
    }
});

// ===============================
// Request To Join
// ===============================
document.addEventListener("click", async function (event) {
    const button = event.target.closest(".request-btn");

    if (!button) return;

    const projectId = button.dataset.id;

    console.log("Sending request for project:", projectId);

    try {
        const data = await apiRequest(
            `/api/projects/${projectId}/request`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("Request response:", data);

        alert(data.message || "Request processed.");

        if (data.message === "Join request sent successfully!") {
            button.disabled = true;
            button.textContent = "Request Sent";
        }

    } catch (error) {
        console.error("Request error:", error);

        alert(error.message || "Unable to send request.");
    }
});

// ===============================
// Accept Join Request
// ===============================
document.addEventListener("click", async function (event) {
    const button = event.target.closest(".accept-btn");

    if (!button) return;

    const requestId = button.dataset.requestId;

    try {
        const data = await apiRequest(
            `/api/projects/requests/${requestId}/accept`,
            {
                method: "POST"
            }
        );

        alert(data.message || "Request processed.");

        if (data.message === "Request accepted successfully!") {
            location.reload();
        }

    } catch (error) {
        console.error("Accept request error:", error);

        alert(error.message || "Unable to accept request.");
    }
});

// ===============================
// Reject Join Request
// ===============================
document.addEventListener("click", async function (event) {
    const button = event.target.closest(".reject-btn");

    if (!button) return;

    const requestId = button.dataset.requestId;

    try {
        const data = await apiRequest(
            `/api/projects/requests/${requestId}/reject`,
            {
                method: "POST"
            }
        );

        alert(data.message || "Request processed.");

        if (data.message === "Request rejected successfully!") {
            location.reload();
        }

    } catch (error) {
        console.error("Reject request error:", error);

        alert(error.message || "Unable to reject request.");
    }
});

// Start loading the projects.
loadProjects();
