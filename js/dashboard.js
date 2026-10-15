
// CampusHub Dashboard

fetch("https://campushub-production-69eb.up.railway.app/api/auth/me", {
    credentials: "include"
})
.then(async response => {
    const data = await response.json();

    console.log("Session check status:", response.status);
    console.log("Session check response:", data);

    if (response.ok && data.user) {
        const welcomeTitle = document.querySelector("#welcomeTitle");

        if (welcomeTitle) {
            welcomeTitle.textContent =
                `Welcome back, ${data.user.full_name} 👋`;
        }
    } else {
        alert("Login session not recognized. Please check the browser console.");
    }
})
.catch(error => {
    console.error("Dashboard error:", error);
});

const profileLink = document.querySelector(".nav-links a:nth-child(2)");

if (profileLink) {
    profileLink.addEventListener("click", function(event) {
        event.preventDefault();
        window.location.href = "profile.html";
    });
}
