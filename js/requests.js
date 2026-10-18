// CampusHub Project Requests

const API_BASE =
    "https://campushub-production-69eb.up.railway.app";

console.log("requests.js loaded");

// ===============================
// Load Project Requests
// ===============================

async function loadProjectRequests() {
    const container =
        document.querySelector("#requestsContainer");

    if (!container) return;

    container.textContent = "Loading project requests...";

    try {
        const response = await fetch(
            `${API_BASE}/api/projects/requests`,
            {
                credentials: "include"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to load requests."
            );
        }

        console.log("Requests received:", data);

        container.innerHTML = "";

        if (
            !data.requests ||
            data.requests.length === 0
        ) {
            container.innerHTML =
                "<p>No project requests yet.</p>";
            return;
        }

        data.requests.forEach(request => {
            const card = document.createElement("div");
            card.className = "feature-card";

            const heading = document.createElement("h2");
            heading.textContent =
                `🚀 ${request.project_name || "Project"}`;

            const description = document.createElement("p");
            description.textContent =
                `${request.full_name || "Student"} ` +
                `(@${request.username || "unknown"}) ` +
                "wants to join your project.";

            const status = document.createElement("p");
            status.textContent = `Status: ${request.status}`;

            card.appendChild(heading);
            card.appendChild(description);
            card.appendChild(status);

            if (request.status === "Pending") {
                const acceptButton =
                    document.createElement("button");

                acceptButton.className = "accept-btn";
                acceptButton.dataset.id = request.id;
                acceptButton.textContent = "Accept";

                const rejectButton =
                    document.createElement("button");

                rejectButton.className = "reject-btn";
                rejectButton.dataset.id = request.id;
                rejectButton.textContent = "Reject";

                card.appendChild(acceptButton);
                card.appendChild(rejectButton);
            }

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Error loading requests:", error);

        container.textContent =
            error.message || "Unable to load requests.";
    }
}

// ===============================
// Accept Or Reject Requests
// ===============================

document.addEventListener("click", async function (event) {
    const button = event.target.closest(
        ".accept-btn, .reject-btn"
    );

    if (!button) return;

    const requestId = button.dataset.id;

    const isAccept = button.classList.contains("accept-btn");
    const action = isAccept ? "accept" : "reject";

    if (!confirm(`Are you sure you want to ${action} this request?`)) {
        return;
    }

    button.disabled = true;
    button.textContent = "Processing...";

    try {
        const response = await fetch(
            `${API_BASE}/api/projects/requests/${encodeURIComponent(requestId)}/${action}`,
            {
                method: "POST",
                credentials: "include"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || `Unable to ${action} request.`
            );
        }

        alert(data.message || "Request updated successfully!");

        await loadProjectRequests();

    } catch (error) {
        console.error(`${action} request error:`, error);

        alert(error.message || "Unable to connect to the server.");

        button.disabled = false;
        button.textContent = isAccept ? "Accept" : "Reject";
    }
});

// Start loading.
loadProjectRequests();
