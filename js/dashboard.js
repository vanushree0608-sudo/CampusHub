// CampusHub Dashboard

fetch("http://localhost:3000/api/auth/me", {
    credentials: "include"
})

.then(response => response.json())

.then(data => {

    if (data.user) {

        console.log("Logged-in user:", data.user);

        const welcomeTitle = document.querySelector("#welcomeTitle");

        if (welcomeTitle) {
            welcomeTitle.textContent =
                `Welcome back, ${data.user.full_name} 👋`;
        }

    } else {

        alert("Please login first.");
        window.location.href = "login.html";

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