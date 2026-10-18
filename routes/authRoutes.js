const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../database");

const router = express.Router();

// =====================================
// Register New Account
// =====================================

router.post("/register", async (req, res) => {
    const {
        fullName,
        username,
        email,
        password,
        registerNumber,
        collegeName
    } = req.body || {};

    // Check required fields
    if (
        !fullName?.trim() ||
        !username?.trim() ||
        !email?.trim() ||
        !password ||
        !registerNumber?.trim() ||
        !collegeName?.trim()
    ) {
        return res.status(400).json({
            message: "Please fill in all required fields."
        });
    }

    // Validate email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email.trim())) {
        return res.status(400).json({
            message: "Please enter a valid email address."
        });
    }

    // Validate password
    if (password.length < 8) {
        return res.status(400).json({
            message: "Password must contain at least 8 characters."
        });
    }

    try {
        const cleanFullName = fullName.trim();
        const cleanUsername = username.trim();
        const cleanEmail = email.trim().toLowerCase();
        const cleanRegisterNumber = registerNumber.trim();
        const cleanCollegeName = collegeName.trim();

        // Check for existing username, email or register number
        const checkQuery = `
            SELECT id
            FROM users
            WHERE username = ?
               OR email = ?
               OR register_number = ?
            LIMIT 1
        `;

        db.query(
            checkQuery,
            [
                cleanUsername,
                cleanEmail,
                cleanRegisterNumber
            ],
            async (checkError, results) => {
                if (checkError) {
                    console.error(
                        "Signup duplicate-check error:",
                        checkError.code,
                        checkError.message
                    );

                    return res.status(500).json({
                        message: "Could not check account details."
                    });
                }

                if (results.length > 0) {
                    return res.status(409).json({
                        message:
                            "Username, email or register number already exists."
                    });
                }

                try {
                    // Hash password
                    const hashedPassword =
                        await bcrypt.hash(password, 10);

                    // IMPORTANT:
                    // Include profile_picture explicitly because
                    // the Railway database requires this field.
                    const insertQuery = `
                        INSERT INTO users (
                            full_name,
                            username,
                            email,
                            password,
                            register_number,
                            college_name,
                            profile_picture
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `;

                    db.query(
                        insertQuery,
                        [
                            cleanFullName,
                            cleanUsername,
                            cleanEmail,
                            hashedPassword,
                            cleanRegisterNumber,
                            cleanCollegeName,
                            ""
                        ],
                        (insertError, result) => {
                            if (insertError) {
                                console.error(
                                    "Signup insert error:",
                                    insertError.code,
                                    insertError.sqlMessage ||
                                        insertError.message
                                );

                                if (
                                    insertError.code === "ER_DUP_ENTRY"
                                ) {
                                    return res.status(409).json({
                                        message:
                                            "Username, email or register number already exists."
                                    });
                                }

                                return res.status(500).json({
    message: "Signup error: " +
        (insertError.sqlMessage || insertError.code || "UNKNOWN")
});
                            }

                            return res.status(201).json({
                                message: "Account created successfully!",
                                userId: result.insertId
                            });
                        }
                    );
                } catch (hashError) {
                    console.error(
                        "Password hashing error:",
                        hashError.message
                    );

                    return res.status(500).json({
                        message: "Could not process account registration."
                    });
                }
            }
        );
    } catch (error) {
        console.error("Registration error:", error.message);

        return res.status(500).json({
            message: "Server error during registration."
        });
    }
});

// =====================================
// Login
// =====================================

router.post("/login", (req, res) => {
    const { usernameOrEmail, password } = req.body || {};

    if (!usernameOrEmail || !password) {
        return res.status(400).json({
            message: "Please enter username/email and password."
        });
    }

    const query = `
        SELECT *
        FROM users
        WHERE username = ? OR email = ?
        LIMIT 1
    `;

    db.query(
        query,
        [usernameOrEmail.trim(), usernameOrEmail.trim().toLowerCase()],
        async (err, results) => {
            if (err) {
                console.error("Login database error:", err.code);

                return res.status(500).json({
                    message: "Database error."
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    message: "Invalid username/email or password."
                });
            }

            try {
                const user = results[0];

                const passwordMatch = await bcrypt.compare(
                    password,
                    user.password
                );

                if (!passwordMatch) {
                    return res.status(401).json({
                        message: "Invalid username/email or password."
                    });
                }

                req.session.userId = user.id;
                req.session.username = user.username;

                req.session.save((sessionError) => {
                    if (sessionError) {
                        console.error(
                            "Session save error:",
                            sessionError
                        );

                        return res.status(500).json({
                            message: "Could not save login session."
                        });
                    }

                    return res.status(200).json({
                        message: "Login successful!",
                        userId: user.id,
                        username: user.username
                    });
                });
            } catch (error) {
                console.error("Login processing error:", error.message);

                return res.status(500).json({
                    message: "Could not process login."
                });
            }
        }
    );
});

// =====================================
// Get Current Logged-in User
// =====================================

router.get("/me", (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            message: "Not logged in."
        });
    }

    const query = `
        SELECT
            id,
            full_name,
            username,
            email,
            college_name,
            profile_picture,
            bio,
            skills,
            account_type,
            points,
            status
        FROM users
        WHERE id = ?
    `;

    db.query(query, [req.session.userId], (err, results) => {
        if (err) {
            console.error("Get user error:", err.code);

            return res.status(500).json({
                message: "Database error."
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        return res.status(200).json({
            user: results[0]
        });
    });
});

// =====================================
// Update Profile
// =====================================

router.put("/profile", (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            message: "Please login first."
        });
    }

    const {
        fullName,
        collegeName,
        bio,
        skills,
        accountType
    } = req.body || {};

    if (!fullName?.trim() || !collegeName?.trim()) {
        return res.status(400).json({
            message: "Full name and college name are required."
        });
    }

    const query = `
        UPDATE users
        SET full_name = ?,
            college_name = ?,
            bio = ?,
            skills = ?,
            account_type = ?
        WHERE id = ?
    `;

    db.query(
        query,
        [
            fullName.trim(),
            collegeName.trim(),
            bio || null,
            skills || null,
            accountType || "public",
            req.session.userId
        ],
        (err) => {
            if (err) {
                console.error("Profile update error:", err.code);

                return res.status(500).json({
                    message: "Could not update profile."
                });
            }

            return res.status(200).json({
                message: "Profile updated successfully!"
            });
        }
    );
});

// =====================================
// Find Project Partners
// =====================================

router.get("/students", (req, res) => {
    const currentUserId = req.session?.userId;

    const query = `
        SELECT id, username, college_name, bio, skills
        FROM users
        ORDER BY username ASC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Load students error:", err.code);

            return res.status(500).json({
                message: "Could not load students."
            });
        }

        const students = results
            .filter(
                student =>
                    Number(student.id) !== Number(currentUserId)
            )
            .map(student => ({
                id: student.id,
                username: student.username,
                college: student.college_name,
                bio: student.bio,
                skills: student.skills
            }));

        return res.json({ students });
    });
});

// =====================================
// Test Session
// =====================================

router.get("/test-session", (req, res) => {
    return res.json({
        sessionUserId: req.session.userId || null,
        sessionUsername: req.session.username || null
    });
});

module.exports = router;
