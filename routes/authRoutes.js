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

    // Validate required fields
    if (
        typeof fullName !== "string" ||
        typeof username !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string" ||
        typeof registerNumber !== "string" ||
        typeof collegeName !== "string" ||
        !fullName.trim() ||
        !username.trim() ||
        !email.trim() ||
        !password ||
        !registerNumber.trim() ||
        !collegeName.trim()
    ) {
        return res.status(400).json({
            message: "Please fill in all required fields."
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            message: "Password must contain at least 8 characters."
        });
    }

    const cleanFullName = fullName.trim();
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanRegisterNumber = registerNumber.trim();
    const cleanCollegeName = collegeName.trim();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanEmail)) {
        return res.status(400).json({
            message: "Please enter a valid email address."
        });
    }

    try {
        // Check whether the username, email or register number exists.
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
                        "SIGNUP CHECK ERROR:",
                        checkError.code,
                        checkError.sqlMessage || checkError.message
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
                    const hashedPassword =
                        await bcrypt.hash(password, 10);

                    // Include profile_picture because the database
                    // requires a value for this column.
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
                                    "SIGNUP INSERT ERROR:",
                                    insertError.code,
                                    insertError.sqlMessage ||
                                        insertError.message
                                );

                                // Temporary diagnostic response:
                                // use this to identify the database
                                // constraint preventing registration.
                                return res.status(500).json({
                                    message:
                                        "Signup error: " +
                                        (
                                            insertError.sqlMessage ||
                                            insertError.code ||
                                            "UNKNOWN"
                                        )
                                });
                            }

                            return res.status(201).json({
                                message:
                                    "Account created successfully!",
                                userId: result.insertId
                            });
                        }
                    );
                } catch (hashError) {
                    console.error(
                        "SIGNUP PROCESSING ERROR:",
                        hashError.message
                    );

                    return res.status(500).json({
                        message:
                            "Could not process account registration."
                    });
                }
            }
        );
    } catch (error) {
        console.error("REGISTRATION ERROR:", error.message);

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

    if (
        typeof usernameOrEmail !== "string" ||
        !usernameOrEmail.trim() ||
        typeof password !== "string" ||
        !password
    ) {
        return res.status(400).json({
            message: "Please enter username/email and password."
        });
    }

    const loginValue = usernameOrEmail.trim();

    const query = `
        SELECT *
        FROM users
        WHERE username = ? OR email = ?
        LIMIT 1
    `;

    db.query(
        query,
        [loginValue, loginValue.toLowerCase()],
        async (err, results) => {
            if (err) {
                console.error("LOGIN DATABASE ERROR:", err.code);

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
                            "SESSION SAVE ERROR:",
                            sessionError.message
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
                console.error("LOGIN PROCESSING ERROR:", error.message);

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
            console.error("GET USER ERROR:", err.code);

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

    if (
        typeof fullName !== "string" ||
        typeof collegeName !== "string" ||
        !fullName.trim() ||
        !collegeName.trim()
    ) {
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
                console.error("PROFILE UPDATE ERROR:", err.code);

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
            console.error("LOAD STUDENTS ERROR:", err.code);

            return res.status(500).json({
                message: "Could not load students."
            });
        }

        const students = results
            .filter(
                student =>
                    currentUserId == null ||
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
