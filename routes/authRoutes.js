const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../database");

const router = express.Router();

router.post("/register", async (req, res) => {

    const {
        fullName,
        username,
        email,
        password,
        registerNumber,
        collegeName
    } = req.body;

    // Check required fields
    if (
        !fullName ||
        !username ||
        !email ||
        !password ||
        !registerNumber ||
        !collegeName
    ) {
        return res.status(400).json({
            message: "Please fill in all required fields."
        });
    }

    // Validate email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
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

        // Check if username, email or register number already exists
        const checkQuery = `
            SELECT id FROM users
            WHERE username = ? OR email = ? OR register_number = ?
        `;

        db.query(
            checkQuery,
            [username, email, registerNumber],
            async (err, results) => {

                if (err) {
                    console.log(err);
                    return res.status(500).json({
                        message: "Database error."
                    });
                }

                if (results.length > 0) {
                    return res.status(409).json({
                        message: "Username, email or register number already exists."
                    });
                }

                // Hash password
                const hashedPassword = await bcrypt.hash(password, 10);

                // Insert user
                const insertQuery = `
                    INSERT INTO users
                    (full_name, username, email, password, register_number, college_name)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;

                db.query(
                    insertQuery,
                    [
                        fullName,
                        username,
                        email,
                        hashedPassword,
                        registerNumber,
                        collegeName
                    ],
                    (err, result) => {

                        if (err) {
                            console.log(err);
                            return res.status(500).json({
                                message: "Could not create account."
                            });
                        }

                        res.status(201).json({
                            message: "Account created successfully!",
                            userId: result.insertId
                        });
                    }
                );
            }
        );

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Server error."
        });
    }
});
// ================================
// Login
// ================================

router.post("/login", (req, res) => {

    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
        return res.status(400).json({
            message: "Please enter username/email and password."
        });
    }

    const query = `
        SELECT * FROM users
        WHERE username = ? OR email = ?
    `;

    db.query(
        query,
        [usernameOrEmail, usernameOrEmail],
        async (err, results) => {

            if (err) {
                console.log(err);

                return res.status(500).json({
                    message: "Database error."
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    message: "Invalid username/email or password."
                });
            }

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
        console.log("Session save error:", sessionError);
        return res.status(500).json({
            message: "Could not save login session."
        });
    }

    res.status(200).json({
        message: "Login successful!",
        userId: user.id,
        username: user.username
    });
});
        }
    );
});
// ================================
// Get Current Logged-in User
// ================================

router.get("/me", (req, res) => {

    if (!req.session.userId) {
        return res.status(401).json({
            message: "Not logged in."
        });
    }

    const query = `
        SELECT id, full_name, username, email, college_name,
               profile_picture, bio, skills, account_type, points, status
        FROM users
        WHERE id = ?
    `;

    db.query(query, [req.session.userId], (err, results) => {

        if (err) {
            console.log(err);

            return res.status(500).json({
                message: "Database error."
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        res.status(200).json({
            user: results[0]
        });
    });
});
// ================================
// Update Profile
// ================================

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
    } = req.body;

    if (!fullName || !collegeName) {
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
            fullName,
            collegeName,
            bio || null,
            skills || null,
            accountType || "public",
            req.session.userId
        ],
        (err) => {

            if (err) {
                console.log(err);

                return res.status(500).json({
                    message: "Could not update profile."
                });
            }

            res.status(200).json({
                message: "Profile updated successfully!"
            });

        }
    );

});
// Find Project Partners
router.get("/students", (req, res) => {
    const currentUserId = req.session?.userId;

    const query = `
        SELECT id, username, college_name, bio, skills
        FROM users
        ORDER BY username ASC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({
                message: "Could not load students."
            });
        }

        const students = results
            .filter(student => Number(student.id) !== Number(currentUserId))
            .map(student => ({
                id: student.id,
                username: student.username,
                college: student.college_name,
                bio: student.bio,
                skills: student.skills
            }));

        res.json({ students });
    });
});
router.get("/test-session", (req, res) => {
    res.json({
        sessionUserId: req.session.userId || null,
        sessionUsername: req.session.username || null
    });
});

module.exports = router;
