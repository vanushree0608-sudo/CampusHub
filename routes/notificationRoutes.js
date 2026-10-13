const express = require("express");
const router = express.Router();
const db = require("../database");

// ===============================
// Get Notifications
// ===============================

router.get("/", (req, res) => {

    // Check login
    if (!req.session.userId) {
        return res.status(401).json({
            message: "Please login first."
        });
    }

    const userId = req.session.userId;

    const sql = `
        SELECT *
        FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
    `;

    db.query(sql, [userId], (err, results) => {

        if (err) {
            console.error("Notification error:", err);

            return res.status(500).json({
                message: "Unable to load notifications."
            });
        }

        res.json({
            notifications: results
        });

    });

});

module.exports = router;