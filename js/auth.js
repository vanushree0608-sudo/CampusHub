// =====================================
// CampusHub Custom Purple Popup
// =====================================

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

        popup.setAttribute("role", "dialog");
        popup.setAttribute("aria-modal", "true");
        popup.setAttribute("aria-labelledby", "campushub-popup-title");

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
        title.id = "campushub-popup-title";
        title.textContent = "CampusHub 💜";

        title.style.cssText = `
            color: #4338ca;
            margin: 0 0 16px;
            font-size: 24px;
        `;

        const text = document.createElement("p");
        text.textContent = String(message || "Please try again.");

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

        function closePopup() {
            overlay.remove();
            document.removeEventListener("keydown", handleKeydown);
            resolve();
        }

        function handleKeydown(event) {
            if (event.key === "Escape") {
                closePopup();
            }
        }

        button.addEventListener("click", closePopup);
        document.addEventListener("keydown", handleKeydown);

        popup.append(title, text, button);
        overlay.appendChild(popup);
        document.body.appendChild(overlay);

        button.focus();
    });
}


// =====================================
// Helper: Read Server Response
// =====================================

async function readAuthResponse(response) {
    try {
        return await response.json();
    } catch (error) {
        throw new Error(
            `Unexpected server response (${response.status}). Please try again.`
        );
    }
}


// =====================================
// CampusHub Authentication
// =====================================


// =====================================
// Signup
// =====================================

const signupForm = document.querySelector("#signupForm");

if (signupForm) {
    signupForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const inputs = signupForm.querySelectorAll("input");

        if (inputs.length < 7) {
            console.error("Signup form is missing required input fields.");

            await showCampusHubAlert(
                "The signup form is incomplete. Please contact support."
            );

            return;
        }

        const fullName = inputs[0].value.trim();
        const username = inputs[1].value.trim();
        const email = inputs[2].value.trim();
        const password = inputs[3].value;
        const confirmPassword = inputs[4].value;
        const registerNumber = inputs[5].value.trim();
        const collegeName = inputs[6].value.trim();

        // Validate required fields
        if (
            !fullName ||
            !username ||
            !email ||
            !password ||
            !confirmPassword ||
            !registerNumber ||
            !collegeName
        ) {
            await showCampusHubAlert("Please fill in all fields.");
            return;
        }

        // Validate email
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            await showCampusHubAlert(
                "Please enter a valid email address."
            );
            return;
        }

        // Validate password length
        if (password.length < 8) {
            await showCampusHubAlert(
                "Password must contain at least 8 characters."
            );
            return;
        }

        // Validate password confirmation
        if (password !== confirmPassword) {
            await showCampusHubAlert("Passwords do not match.");
            return;
        }

        const submitButton =
            signupForm.querySelector('button[type="submit"]');

        if (submitButton) {
            submitButton.disabled = true;
        }

        try {
            const response = await fetch(
                "https://campushub-production-69eb.up.railway.app/api/auth/register",
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        fullName,
                        username,
                        email,
                        password,
                        registerNumber,
                        collegeName
                    })
                }
            );

            const data = await readAuthResponse(response);

            await showCampusHubAlert(
                data.message ||
                (response.ok
                    ? "Request completed."
                    : "Could not create account.")
            );

            if (
                response.ok &&
                data.message === "Account created successfully!"
            ) {
                window.location.href = "dashboard.html";
            }

        } catch (error) {
            console.error("Signup error:", error);

            await showCampusHubAlert(
                "Unable to connect to the server. Please try again."
            );

        } finally {
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    });
}


// =====================================
// Login
// =====================================

const loginForm = document.querySelector("#loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const inputs = loginForm.querySelectorAll("input");

        if (inputs.length < 2) {
            await showCampusHubAlert(
                "The login form is incomplete. Please refresh the page."
            );
            return;
        }

        const usernameOrEmail = inputs[0].value.trim();
        const password = inputs[1].value;

        if (!usernameOrEmail || !password) {
            await showCampusHubAlert(
                "Please enter username/email and password."
            );
            return;
        }

        const submitButton =
            loginForm.querySelector('button[type="submit"]');

        if (submitButton) {
            submitButton.disabled = true;
        }

        try {
            const response = await fetch(
                "https://campushub-production-69eb.up.railway.app/api/auth/login",
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        usernameOrEmail,
                        password
                    })
                }
            );

            const data = await readAuthResponse(response);

            await showCampusHubAlert(
                data.message ||
                (response.ok
                    ? "Login request completed."
                    : "Unable to log in.")
            );

            if (
                response.ok &&
                data.message === "Login successful!"
            ) {
                window.location.href = "dashboard.html";
            }

        } catch (error) {
            console.error("Login error:", error);

            await showCampusHubAlert(
                "Unable to connect to the server. Please try again."
            );

        } finally {
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    });
}
