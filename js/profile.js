
// CampusHub - Load Saved Profile

const editProfileBtn = document.getElementById("editProfileBtn");

if (editProfileBtn) {
    editProfileBtn.addEventListener("click", function () {
        window.location.href = "edit-profile.html";
    });
}

fetch("/api/auth/me", {
    credentials: "include"
})
.then(async response => {
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Unable to load profile.");
    }

    return data;
})
.then(data => {
    const user = data.user;

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    // Basic profile details
    document.getElementById("profileUsername").textContent =
        user.full_name || user.username || "Username";

    document.getElementById("profileBio").textContent =
        user.bio || "No bio added yet.";

    document.getElementById("profileCollege").textContent =
        user.college_name || "College";

    document.getElementById("profileAbout").textContent =
        user.bio || "No information added yet.";

    document.getElementById("profileInitial").textContent =
        (user.full_name || user.username || "?").charAt(0).toUpperCase();

    // Skills
    const skillsContainer = document.getElementById("skillsContainer");
    if (skillsContainer) {
        skillsContainer.innerHTML = "";

        const skills = (user.skills || "")
            .split(",")
            .map(skill => skill.trim())
            .filter(Boolean);

        if (skills.length === 0) {
            skillsContainer.textContent = "No skills added yet";
        } else {
            skills.forEach(skill => {
                const tag = document.createElement("span");
                tag.className = "skill-tag";
                tag.textContent = skill;
                skillsContainer.appendChild(tag);
            });
        }
    }
})
.catch(error => {
    console.error("Profile loading error:", error);
});

// Load project count
fetch("/api/projects/", {
    credentials: "include"
})
.then(response => response.json())
.then(data => {
    const projectCount = document.getElementById("projectCount");

    if (projectCount) {
        projectCount.textContent =
            data.projects ? data.projects.filter(project =>
                String(project.user_id) === String(data.currentUserId)
            ).length : 0;
    }
})
.catch(error => {
    console.error("Project count error:", error);
});
