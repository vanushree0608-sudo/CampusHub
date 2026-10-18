// CampusHub Projects

console.log("CampusHub projects.js loaded");


// ===============================
// Create Project
// ===============================

const createProjectBtn =
    document.querySelector("#createProjectBtn");

if (createProjectBtn) {

    createProjectBtn.addEventListener("click", function () {

        window.location.href = "create-project.html";

    });

}


// ===============================
// Load Projects
// ===============================

fetch("https://campushub-production-69eb.up.railway.app/api/projects/", {
    credentials: "include"
})
.then(response => response.json())
.then(data => {

    console.log("Projects received:", data);
    console.log("Logged-in user ID:", data.currentUserId);

console.log(
    "Project owner IDs:",
    data.projects?.map(project => ({
        name: project.project_name,
        ownerId: project.user_id
    }))
);

    const projectsContainer =
        document.querySelector("#projectsContainer");

    if (!projectsContainer) return;

    projectsContainer.innerHTML = "";


    if (!data.projects || data.projects.length === 0) {

        projectsContainer.innerHTML =
            "<p>No projects available yet.</p>";

        return;

    }


    data.projects.forEach(project => {

        const projectCard =
            document.createElement("div");

        projectCard.className = "feature-card";


        // ===============================
        // Owner / Other Student
        // ===============================

        let actionButton = "";

        const isOwner =
            Number(project.user_id) ===
            Number(data.currentUserId);


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


        // ===============================
        // Project Information
        // ===============================

        projectCard.innerHTML = `

            <h2>🚀 ${project.project_name}</h2>

            <p>${project.description}</p>

            <p>
                <strong>Skills:</strong>
                ${project.skills_required || "Not specified"}
            </p>

            <p>
                <strong>Members Needed:</strong>
                ${project.members_needed}
            </p>

            <p>
                <strong>Deadline:</strong>
                ${project.deadline || "Not specified"}
            </p>

            <p>
                <strong>Status:</strong>
                ${project.status}
            </p>

            <p>
                <strong>Posted by:</strong>
                @${project.username}
            </p>

            ${actionButton}

<button
    class="chat-btn"
    data-id="${project.id}"
    onclick="window.location.href='chat.html?projectId=${project.id}'">
    💬 Team Chat
</button>

        `;


        // ===============================
        // Load Requests For Owner
        // ===============================

        if (isOwner) {

            fetch(`/api/projects/${project.id}/requests`, {
                credentials: "include"
            })
            .then(response => response.json())
            .then(requestData => {

                console.log(
                    "Requests:",
                    requestData
                );


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

                requestsSection.style.borderTop =
                    "1px solid #26384a";


                requestsSection.innerHTML = `
                    <h3>🔔 Join Requests</h3>
                `;


                requestData.requests.forEach(request => {

                    const requestItem =
                        document.createElement("div");

                    requestItem.style.marginTop = "15px";


                    requestItem.innerHTML = `

                        <p>
                            <strong>
                                ${request.full_name}
                            </strong>

                            (@${request.username})
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


                    requestsSection.appendChild(
                        requestItem
                    );

                });


                projectCard.appendChild(
                    requestsSection
                );

            })
            .catch(error => {

                console.error(
                    "Error loading requests:",
                    error
                );

            });

        }


        // ===============================
        // Load Team Members
        // ===============================

        fetch(`/api/projects/${project.id}/members`, {
            credentials: "include"
        })
        .then(response => response.json())
        .then(memberData => {

            console.log(
                "Team members:",
                memberData
            );


            const membersSection =
                document.createElement("div");


            membersSection.style.marginTop = "20px";

            membersSection.style.paddingTop = "15px";

            membersSection.style.borderTop =
                "1px solid #26384a";


            membersSection.innerHTML = `
                <h3>👥 Team Members</h3>
            `;


            if (
                !memberData.members ||
                memberData.members.length === 0
            ) {

                membersSection.innerHTML += `
                    <p>No team members yet.</p>
                `;

            } else {

                memberData.members.forEach(member => {

                    const memberItem =
                        document.createElement("p");


                    memberItem.style.marginTop = "10px";


                    memberItem.innerHTML = `
                        👤
                        <strong>
                            ${member.full_name}
                        </strong>
                        (@${member.username})
                    `;


                    membersSection.appendChild(
                        memberItem
                    );

                });

            }


            projectCard.appendChild(
                membersSection
            );

        })
        .catch(error => {

            console.error(
                "Error loading team members:",
                error
            );

        });


        // Add project card
        projectsContainer.appendChild(
            projectCard
        );

    });

})
.catch(error => {

    console.error(
        "Error loading projects:",
        error
    );


    const projectsContainer =
        document.querySelector("#projectsContainer");


    if (projectsContainer) {

        projectsContainer.innerHTML =
            "<p>Unable to load projects.</p>";

    }

});


// ===============================
// Delete Project
// ===============================

document.addEventListener("click", function (event) {

    if (!event.target.classList.contains("delete-btn")) {
        return;
    }


    const projectId =
        event.target.dataset.id;


    const confirmDelete =
        confirm(
            "Are you sure you want to delete this project?"
        );


    if (!confirmDelete) {
        return;
    }


    fetch(`/api/projects/${projectId}`, {

        method: "DELETE",

        credentials: "include"

    })
    .then(response => response.json())
    .then(data => {

        alert(data.message);


        if (
            data.message ===
            "Project deleted successfully!"
        ) {

            location.reload();

        }

    })
    .catch(error => {

        console.error(
            "Delete error:",
            error
        );

        alert(
            "Unable to delete project."
        );

    });

});


// ===============================
// Request To Join
// ===============================

document.addEventListener("click", function (event) {

    if (!event.target.classList.contains("request-btn")) {
        return;
    }


    const projectId =
        event.target.dataset.id;


    console.log(
        "Sending request for project:",
        projectId
    );


    fetch(`/api/projects/${projectId}/request`, {

        method: "POST",

        credentials: "include",

        headers: {
            "Content-Type": "application/json"
        }

    })
    .then(response => {

        console.log(
            "Request status:",
            response.status
        );

        return response.json();

    })
    .then(data => {

        console.log(
            "Request response:",
            data
        );


        alert(data.message);


        if (
            data.message ===
            "Join request sent successfully!"
        ) {

            event.target.disabled = true;

            event.target.textContent =
                "Request Sent";

        }

    })
    .catch(error => {

        console.error(
            "Request error:",
            error
        );

        alert(
            "Unable to send request."
        );

    });

});


// ===============================
// Accept Join Request
// ===============================

document.addEventListener("click", function (event) {

    if (!event.target.classList.contains("accept-btn")) {
        return;
    }


    const requestId =
        event.target.dataset.requestId;


    fetch(`/api/projects/requests/${requestId}/accept`, {

        method: "POST",

        credentials: "include"

    })
    .then(response => response.json())
    .then(data => {

        alert(data.message);


        if (
            data.message ===
            "Request accepted successfully!"
        ) {

            location.reload();

        }

    })
    .catch(error => {

        console.error(
            "Accept request error:",
            error
        );

        alert(
            "Unable to accept request."
        );

    });

});


// ===============================
// Reject Join Request
// ===============================

document.addEventListener("click", function (event) {

    if (!event.target.classList.contains("reject-btn")) {
        return;
    }


    const requestId =
        event.target.dataset.requestId;


    fetch(`/api/projects/requests/${requestId}/reject`, {

        method: "POST",

        credentials: "include"

    })
    .then(response => response.json())
    .then(data => {

        alert(data.message);


        if (
            data.message ===
            "Request rejected successfully!"
        ) {

            location.reload();

        }

    })
    .catch(error => {

        console.error(
            "Reject request error:",
            error
        );

        alert(
            "Unable to reject request."
        );

    });

});
