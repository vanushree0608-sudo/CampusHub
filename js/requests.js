// CampusHub Project Requests

console.log("requests.js loaded");

// Load project requests
fetch("/api/projects/requests", {
    credentials: "include"
})
.then(response => response.json())
.then(data => {

    console.log("Requests received:", data);

    const requestsContainer =
        document.querySelector("#requestsContainer");

    if (!requestsContainer) return;

    requestsContainer.innerHTML = "";

    if (!data.requests || data.requests.length === 0) {

        requestsContainer.innerHTML =
            "<p>No project requests yet.</p>";

        return;
    }

    data.requests.forEach(request => {

        const requestCard =
            document.createElement("div");

        requestCard.className = "feature-card";

        requestCard.innerHTML = `
            <h2>🚀 ${request.project_name}</h2>

            <p>
                <strong>${request.full_name}</strong>
                (@${request.username})
                wants to join your project.
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
                        data-id="${request.id}">
                        Accept
                    </button>

                    <button
                        class="reject-btn"
                        data-id="${request.id}">
                        Reject
                    </button>
                `
                : ""
            }
        `;

        requestsContainer.appendChild(requestCard);
    });

})
.catch(error => {

    console.error("Error loading requests:", error);

    const requestsContainer =
        document.querySelector("#requestsContainer");

    if (requestsContainer) {

        requestsContainer.innerHTML =
            "<p>Unable to load requests.</p>";
    }
});