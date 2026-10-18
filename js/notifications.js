// CampusHub Notifications

const API_BASE =
    "https://campushub-production-69eb.up.railway.app";

console.log("notifications.js loaded");

// ===============================
// Load Notifications
// ===============================

async function loadNotifications() {
    const container =
        document.querySelector("#notificationsContainer");

    if (!container) return;

    try {
        const response = await fetch(
            `${API_BASE}/api/notifications`,
            {
                credentials: "include"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Could not load notifications."
            );
        }

        console.log("Notifications received:", data);

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

            const heading = document.createElement("h3");
            heading.textContent = "🔔 Notification";

            const message = document.createElement("p");
            message.textContent = notification.message || "";

            const date = document.createElement("small");

            date.textContent = notification.created_at
                ? new Date(notification.created_at).toLocaleString()
                : "";

            notificationCard.appendChild(heading);
            notificationCard.appendChild(message);
            notificationCard.appendChild(date);

            container.appendChild(notificationCard);
        });

    } catch (error) {
        console.error("Notification loading error:", error);

        container.innerHTML =
            "<p>Unable to load notifications. Please refresh and try again.</p>";
    }
}

loadNotifications();
