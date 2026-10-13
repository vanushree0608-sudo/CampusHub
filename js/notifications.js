// CampusHub Notifications

console.log("notifications.js loaded");


// ===============================
// Load Notifications
// ===============================

fetch("/api/notifications", {
    credentials: "include"
})
.then(response => response.json())
.then(data => {

    console.log("Notifications received:", data);

    const container =
        document.querySelector("#notificationsContainer");

    if (!container) return;

    container.innerHTML = "";


    if (
        !data.notifications ||
        data.notifications.length === 0
    ) {

        container.innerHTML =
            "<p>No notifications yet.</p>";

        return;
    }


    data.notifications.forEach(notification => {

        const notificationCard =
            document.createElement("div");

        notificationCard.className = "feature-card";


        notificationCard.innerHTML = `

            <h3>🔔 Notification</h3>

            <p>
                ${notification.message}
            </p>

            <small>
                ${new Date(
                    notification.created_at
                ).toLocaleString()}
            </small>

        `;


        container.appendChild(notificationCard);

    });

})
.catch(error => {

    console.error(
        "Notification loading error:",
        error
    );

    const container =
        document.querySelector("#notificationsContainer");

    if (container) {

        container.innerHTML =
            "<p>Unable to load notifications.</p>";

    }

});