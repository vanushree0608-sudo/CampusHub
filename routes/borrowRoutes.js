
const express = require("express");
const router = express.Router();
const db = require("../database");
router.get("/test", (req, res) => {
    res.send("Borrow routes are working!");
});


 // Get all available items with the owner's name
router.get("/items", (req, res) => {
    const currentUserId = req.session?.userId;
        const sql = `
        SELECT
            borrow_items.*,
            users.username AS owner_name
        FROM borrow_items
        JOIN users ON borrow_items.user_id = users.id
        WHERE borrow_items.availability = 'available'
        ORDER BY borrow_items.created_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({
                message: "Could not load items"
            });
        }

        res.json({
    items: results,
    currentUserId: currentUserId || null
});
    });
});


/* Add a new item to the borrowing list */
router.post("/items", (req, res) => {
    const userId = req.session?.userId;
    const { item_name, description, category } = req.body;

    if (!userId) {
        return res.status(401).json({
            message: "Please log in first"
        });
    }

    if (!item_name || !item_name.trim()) {
        return res.status(400).json({
            message: "Item name is required"
        });
    }

    const sql = `
        INSERT INTO borrow_items
        (user_id, item_name, description, category)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            userId,
            item_name.trim(),
            description || "",
            category || "Other"
        ],
        (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    message: "Could not add item"
                });
            }

            res.status(201).json({
                message: "Item added successfully",
                itemId: result.insertId
            });
        }
    );
});

/* Request to borrow an item */
router.post("/items/:id/request", (req, res) => {
    const borrowerId = req.session?.userId;
    const itemId = Number(req.params.id);

    if (!borrowerId) {
        return res.status(401).json({
            message: "Please log in first"
        });
    }

    if (!Number.isInteger(itemId) || itemId <= 0) {
        return res.status(400).json({
            message: "Invalid item"
        });
    }

    db.query(
        `SELECT id, user_id, availability
         FROM borrow_items
         WHERE id = ?`,
        [itemId],
        (err, items) => {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    message: "Could not check item"
                });
            }

            if (items.length === 0 ||
                items[0].availability !== "available") {
                return res.status(404).json({
                    message: "Item is not available"
                });
            }

            if (Number(items[0].user_id) === Number(borrowerId)) {
                return res.status(400).json({
                    message: "You cannot request your own item"
                });
            }

            db.query(
                `SELECT id FROM borrow_requests
                 WHERE item_id = ? AND borrower_id = ?
                 AND request_status IN ('pending', 'approved')`,
                [itemId, borrowerId],
                (checkErr, existing) => {
                    if (checkErr) {
                        console.log(checkErr);
                        return res.status(500).json({
                            message: "Could not check existing request"
                        });
                    }

                    if (existing.length > 0) {
                        return res.status(409).json({
                            message: "You already have an active request"
                        });
                    }

                    db.query(
                        `INSERT INTO borrow_requests
                         (item_id, borrower_id, owner_id)
                         VALUES (?, ?, ?)`,
                        [itemId, borrowerId, items[0].user_id],
                        (insertErr) => {
                            if (insertErr) {
                                console.log(insertErr);
                                return res.status(500).json({
                                    message: "Could not send request"
                                });
                            }

                            res.status(201).json({
                                message: "Borrow request sent to the owner"
                            });
                        }
                    );
                }
            );
        }
    );
});
// Get my borrowings
router.get("/my-borrowings", (req, res) => {
    const userId = req.session?.userId;

    if (!userId) {
        return res.status(401).json({
            message: "Please log in first"
        });
    }

    const sql = `
        SELECT
            borrow_requests.id AS request_id,
            borrow_requests.request_status,
            borrow_requests.requested_at,
            borrow_requests.due_date,
            borrow_items.item_name,
            borrow_items.description,
            users.username AS owner_name
        FROM borrow_requests
        JOIN borrow_items
            ON borrow_requests.item_id = borrow_items.id
        JOIN users
            ON borrow_items.user_id = users.id
        WHERE borrow_requests.borrower_id = ?
        ORDER BY borrow_requests.requested_at DESC
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({
                message: "Could not load your borrowings"
            });
        }

        res.json({ borrowings: results });
    });
});

/* Get borrowing requests for items I own */
router.get("/owner-requests", (req, res) => {
    const ownerId = req.session?.userId;

    if (!ownerId) {
        return res.status(401).json({
            message: "Please log in first"
        });
    }

    const sql = `
        SELECT
            borrow_requests.id AS request_id,
            borrow_requests.request_status,
            borrow_requests.requested_at,
            borrow_items.item_name,
            borrow_items.id AS item_id,
            users.username AS borrower_name
        FROM borrow_requests
        JOIN borrow_items
            ON borrow_requests.item_id = borrow_items.id
        JOIN users
            ON borrow_requests.borrower_id = users.id
        WHERE borrow_requests.owner_id = ?
        ORDER BY borrow_requests.requested_at DESC
    `;

    db.query(sql, [ownerId], (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({
                message: "Could not load incoming requests"
            });
        }

        res.json({ requests: results });
    });
});

/* Owner approves or rejects a borrowing request */
router.put("/requests/:id/status", (req, res) => {
    const ownerId = req.session?.userId;
    const requestId = Number(req.params.id);
    const { status } = req.body;

    if (!ownerId) {
        return res.status(401).json({
            message: "Please log in first"
        });
    }

    if (!Number.isInteger(requestId) || requestId <= 0) {
        return res.status(400).json({
            message: "Invalid request"
        });
    }

    if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({
            message: "Status must be approved or rejected"
        });
    }

    const sql = `
        SELECT id, item_id, request_status
        FROM borrow_requests
        WHERE id = ? AND owner_id = ?
    `;

    db.query(sql, [requestId, ownerId], (err, requests) => {
        if (err) {
            console.log(err);
            return res.status(500).json({
                message: "Could not check request"
            });
        }

        if (requests.length === 0) {
            return res.status(404).json({
                message: "Request not found or you are not the owner"
            });
        }

        if (requests[0].request_status !== "pending") {
            return res.status(409).json({
                message: "This request has already been processed"
            });
        }

        db.query(
            `UPDATE borrow_requests
             SET request_status = ?
             WHERE id = ? AND owner_id = ?
             AND request_status = 'pending'`,
            [status, requestId, ownerId],
            (updateErr, result) => {
                if (updateErr) {
                    console.log(updateErr);
                    return res.status(500).json({
                        message: "Could not update request"
                    });
                }

                res.json({
                    message: `Borrow request ${status} successfully`,
                    status
                });
            }
        );
    });
});

module.exports = router;
