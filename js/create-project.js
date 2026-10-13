const createProjectForm =
    document.querySelector("#createProjectForm");

if (createProjectForm) {

    createProjectForm.addEventListener("submit", function(event) {

        event.preventDefault();

        const projectName =
            document.querySelector("#projectName").value.trim();

        const description =
            document.querySelector("#projectDescription").value.trim();

        const skillsRequired =
            document.querySelector("#skillsRequired").value.trim();

        const membersNeeded =
            document.querySelector("#membersNeeded").value;

        const deadline =
            document.querySelector("#deadline").value;


        fetch("http://localhost:3000/api/projects/create", {

            method: "POST",

            credentials: "include",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                projectName: projectName,
                description: description,
                skillsRequired: skillsRequired,
                membersNeeded: membersNeeded,
                deadline: deadline

            })

        })

        .then(response => response.json())

        .then(data => {

            alert(data.message);

            if (data.message === "Project created successfully!") {

                window.location.href = "projects.html";

            }

        })

        .catch(error => {

            console.error("Project creation error:", error);

            alert("Unable to connect to the server.");

        });

    });

}