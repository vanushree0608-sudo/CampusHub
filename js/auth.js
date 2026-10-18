// CampusHub Custom Purple Popup

function showCampusHubAlert(message) {
    return new Promise(resolve => {
        const overlay = document.createElement("div");

        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(20, 18, 45, 0.55);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            padding: 20px;
        `;

        const popup = document.createElement("div");

        popup.style.cssText = `
            background: white;
            color: #252044;
            width: 100%;
            max-width: 340px;
            padding: 28px 24px;
            border-radius: 18px;
            text-align: center;
            box-shadow: 0 15px 45px rgba(0,0,0,0.2);
            font-family: Arial, sans-serif;
        `;

        const title = document.createElement("h2");
        title.textContent = "CampusHub 💜";
        title.style.cssText = `
            color: #4338ca;
            margin: 0 0 16px;
            font-size: 24px;
        `;

        const text = document.createElement("p");
        text.textContent = String(message);
        text.style.cssText = `
            font-size: 16px;
            line-height: 1.5;
            margin: 0 0 24px;
            overflow-wrap: anywhere;
        `;

        const button = document.createElement("button");
        button.textContent = "OK";
        button.style.cssText = `
            background: #4338ca;
            color: white;
            border: none;
            border-radius: 10px;
            padding: 12px 36px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
        `;

        popup.append(title, text, button);
        overlay.appendChild(popup);
        document.body.appendChild(overlay);

        button.addEventListener("click", () => {
            overlay.remove();
            resolve();
        });

        button.focus();
    });
}
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

            credentials: "include",

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

        .then(async data => {

    await showCampusHubAlert(data.message);

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

        fetch("https://campushub-production-69eb.up.railway.app/api/auth/login", {
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

           await showCampusHubAlert(data.message);

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
