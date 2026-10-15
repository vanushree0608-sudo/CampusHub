// CampusHub Edit Profile

// ================================
// Load Current Profile
// ================================

fetch("https://campushub-production-69eb.up.railway.app/api/auth/me", {
    credentials: "include"
})
.then(response => response.json())
.then(data => {

    if (!data.user) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    const user = data.user;

    document.querySelector("#editFullName").value =
        user.full_name || "";

    document.querySelector("#editCollege").value =
        user.college_name || "";

    document.querySelector("#editBio").value =
        user.bio || "";

    document.querySelector("#editAccountType").value =
        user.account_type || "public";

})
.catch(error => {

    console.error("Profile loading error:", error);

});


// ================================
// Save Profile Changes
// ================================

const editProfileForm =
    document.querySelector("#editProfileForm");

if (editProfileForm) {

    editProfileForm.addEventListener("submit", function(event) {

        event.preventDefault();

        const fullName =
            document.querySelector("#editFullName").value.trim();

        const collegeName =
            document.querySelector("#editCollege").value.trim();

        const bio =
            document.querySelector("#editBio").value.trim();

        const skills =
            document.querySelector("#editSkills").value.trim();

        const accountType =
            document.querySelector("#editAccountType").value;


        fetch("https://campushub-production-69eb.up.railway.app/api/auth/profile", {

            method: "PUT",

            credentials: "include",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                fullName: fullName,
                collegeName: collegeName,
                bio: bio,
                skills: skills,
                accountType: accountType

            })

        })
        .then(response => response.json())
        .then(data => {

            alert(data.message);

            if (data.message === "Profile updated successfully!") {

                window.location.href = "profile.html";

            }

        })
        .catch(error => {

            console.error("Profile update error:", error);

            alert("Unable to connect to the server.");

        });

    });

}
