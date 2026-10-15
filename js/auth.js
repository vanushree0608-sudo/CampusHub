// CampusHub Authentication


// ================================
// Signup
// ================================

const signupForm = document.querySelector("#signupForm");

if (signupForm) {

    signupForm.addEventListener("submit", function(event) {

        event.preventDefault();

        const inputs = signupForm.querySelectorAll("input");

        const fullName = inputs[0].value.trim();
        const username = inputs[1].value.trim();
        const email = inputs[2].value.trim();
        const password = inputs[3].value;
        const confirmPassword = inputs[4].value;
        const registerNumber = inputs[5].value.trim();
        const collegeName = inputs[6].value.trim();


        // Check empty fields

        if (
            !fullName ||
            !username ||
            !email ||
            !password ||
            !confirmPassword ||
            !registerNumber ||
            !collegeName
        ) {
            alert("Please fill in all fields.");
            return;
        }


        // Check email

        if (!email.includes("@")) {
            alert("Please enter a valid email address.");
            return;
        }


        // Check password length

        if (password.length < 8) {
            alert("Password must contain at least 8 characters.");
            return;
        }


        // Check password confirmation

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }


        // Send account details to backend

        fetch("https://campushub-production-69eb.up.railway.app/api/auth/register", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                fullName: fullName,
                username: username,
                email: email,
                password: password,
                registerNumber: registerNumber,
                collegeName: collegeName

            })

        })

        .then(response => response.json())

        .then(data => {

            alert(data.message);


            // After successful signup,
            // directly open Dashboard

            if (data.message === "Account created successfully!") {

                window.location.href = "dashboard.html";

            }

        })

        .catch(error => {

            console.error("Signup error:", error);

            alert("Unable to connect to the server.");

        });

    });

}



// ================================
// Login
// ================================

const loginForm = document.querySelector("#loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", function(event) {

        event.preventDefault();

        const inputs = loginForm.querySelectorAll("input");

        const usernameOrEmail = inputs[0].value.trim();
        const password = inputs[1].value;

        if (!usernameOrEmail || !password) {
            alert("Please enter username/email and password.");
            return;
        }

        fetch("/api/auth/login", {
            credentials: "include",

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                usernameOrEmail: usernameOrEmail,
                password: password
            })

        })

        .then(response => response.json())

        .then(data => {

            alert(data.message);

            if (data.message === "Login successful!") {
                window.location.href = "dashboard.html";
            }

        })

        .catch(error => {

            console.error("Login error:", error);

            alert("Unable to connect to the server.");

        });

    });

}
