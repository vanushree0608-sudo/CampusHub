
const express = require("express");
const router = express.Router();
const db = require("../database");

// =====================================
// Helper: Check project owner or member
// =====================================

function checkProjectAccess(projectId, userId, callback) {
    const sql = `
        SELECT p.id
        FROM projects p
        LEFT JOIN project_members pm
            ON pm.project_id = p.id
            AND pm.user_id = ?
        WHERE p.id = ?
          AND (p.user_id = ? OR pm.user_id IS NOT NULL)
        LIMIT 1
    `;

    db.query(sql, [userId, projectId, userId], (err, rows) => {
        if (err) return callback(err);
        callback(null, rows.length > 0);
    });
}

// =====================================
// Get All Projects
// =====================================


router.get("/", (req, res) => {
    const query = `
        SELECT
            p.*,
            u.username,
            u.full_name
        FROM projects p
        JOIN users u ON u.id = p.user_id
        ORDER BY p.id DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Get all projects error:", err);
            return res.status(500).json({
                message: "Could not fetch projects."
            });
        }

        return res.json({
            projects: results,
            currentUserId: req.session.userId || null
        });
    });
});


// =====================================
// Create Project
// =====================================

router.post("/create", (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            message: "Please login first."
        });
    }

    const {
        projectName,
        description,
        skillsRequired,
        membersNeeded,
        deadline
    } = req.body;

    if (
        !projectName ||
        !description ||
        membersNeeded === undefined ||
        membersNeeded === null ||
        membersNeeded === ""
    ) {
        return res.status(400).json({
            message: "Please fill in all required fields."
        });
    }

    const query = `
        INSERT INTO projects
            (user_id, project_name, description,
             skills_required, members_needed, deadline)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        query,
        [
            req.session.userId,
            projectName,
            description,
            skillsRequired || null,
            membersNeeded,
            deadline || null
        ],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Could not create project."
                });
            }

            return res.status(201).json({
                message: "Project created successfully!",
                projectId: result.insertId
            });
        }
    );
});

// =====================================
// Delete Project
// =====================================

router.delete("/:id", (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            message: "Please login first."
        });
    }

    const query = `
        DELETE FROM projects
        WHERE id = ? AND user_id = ?
    `;

    db.query(
        query,
        [req.params.id, req.session.userId],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Could not delete project."
                });
            }

            if (result.affectedRows === 0) {
                return res.status(403).json({
                    message: "You can only delete your own projects."
                });
            }

            return res.json({
                message: "Project deleted successfully!"
            });
        }
    );
});

// =====================================
// Request To Join Project
// =====================================

router.post("/:id/request", (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            message: "Please login first."
        });
    }

    const projectId = req.params.id;
    const requesterId = req.session.userId;

    db.query(
        "SELECT user_id FROM projects WHERE id = ?",
        [projectId],
        (err, projects) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Database error."
                });
            }

            if (projects.length === 0) {
                return res.status(404).json({
                    message: "Project not found."
                });
            }

            const ownerId = projects[0].user_id;

            if (Number(ownerId) === Number(requesterId)) {
                return res.status(400).json({
                    message: "You cannot request your own project."
                });
            }

            const checkSql = `
                SELECT id
                FROM project_requests
                WHERE project_id = ?
                  AND requester_id = ?
                  AND status IN ('Pending', 'Accepted')
            `;

            db.query(
                checkSql,
                [projectId, requesterId],
                (err, existing) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({
                            message: "Database error."
                        });
                    }

                    if (existing.length > 0) {
                        return res.status(400).json({
                            message:
                                "You have already requested or joined this project."
                        });
                    }

                    const insertSql = `
                        INSERT INTO project_requests
                            (project_id, requester_id, owner_id)
                        VALUES (?, ?, ?)
                    `;

                    db.query(
                        insertSql,
                        [projectId, requesterId, ownerId],
                        (err) => {
                            if (err) {
                                console.error(err);
                                return res.status(500).json({
                                    message: "Could not send request."
                                });
                            }

                            const notificationSql = `
                                INSERT INTO notifications
                                    (user_id, message, type)
                                VALUES (?, ?, 'project_request')
                            `;

                            db.query(
                                notificationSql,
                                [
                                    ownerId,
                                    "Someone requested to join your project."
                                ],
                                (notificationError) => {
                                    if (notificationError) {
                                        console.error(
                                            "Notification error:",
                                            notificationError
                                        );
                                    }

                                    return res.status(201).json({
                                        message:
                                            "Join request sent successfully!"
                                    });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});

// =====================================
// Get Join Requests For My Projects
// =====================================

router.get("/requests", (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            message: "Please login first."
        });
    }

    const query = `
        SELECT
            pr.id,
            pr.project_id,
            pr.requester_id,
            pr.status,
            pr.created_at,
            p.project_name,
            u.username,
            u.full_name
        FROM project_requests pr
        JOIN projects p ON pr.project_id = p.id
        JOIN users u ON pr.requester_id = u.id
        WHERE pr.owner_id = ?
        ORDER BY pr.created_at DESC
    `;

    db.query(query, [req.session.userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Could not fetch requests."
            });
        }

        return res.json({ requests: results });
    });
});

// =====================================
// Get Requests For A Specific Project
// =====================================

router.get("/:id/requests", (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            message: "Please login first."
        });
    }

    const query = `
        SELECT
            pr.id,
            pr.requester_id,
            pr.status,
            u.username,
            u.full_name
        FROM project_requests pr
        JOIN users u ON pr.requester_id = u.id
        WHERE pr.project_id = ?
          AND pr.owner_id = ?
        ORDER BY pr.created_at DESC
    `;

    db.query(
        query,
        [req.params.id, req.session.userId],
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Could not fetch project requests."
                });
            }

            return res.json({ requests: results });
        }
    );
});

// =====================================
// Accept Project Join Request
// =====================================

router.post("/requests/:id/accept", (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            message: "Please login first."
        });
    }

    const requestId = req.params.id;
    const ownerId = req.session.userId;

    const findSql = `
        SELECT project_id, requester_id, owner_id, status
        FROM project_requests
        WHERE id = ?
    `;

    db.query(findSql, [requestId], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Database error."
            });
        }

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Request not found."
            });
        }

        const request = rows[0];

        if (Number(request.owner_id) !== Number(ownerId)) {
            return res.status(403).json({
                message: "You are not allowed to accept this request."
            });
        }

        if (request.status !== "Pending") {
            return res.status(400).json({
                message: "This request has already been processed."
            });
        }

        const addMemberSql = `
            INSERT INTO project_members (project_id, user_id)
            SELECT ?, ?
            WHERE NOT EXISTS (
                SELECT 1
                FROM project_members
                WHERE project_id = ? AND user_id = ?
            )
        `;

        db.query(
            addMemberSql,
            [
                request.project_id,
                request.requester_id,
                request.project_id,
                request.requester_id
            ],
            (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({
                        message: "Could not add project member."
                    });
                }

                const updateSql = `
                    UPDATE project_requests
                    SET status = 'Accepted'
                    WHERE id = ? AND status = 'Pending'
                `;

                db.query(updateSql, [requestId], (err, result) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({
                            message:
                                "Member added but request status could not be updated."
                        });
                    }

                    if (result.affectedRows === 0) {
                        return res.status(409).json({
                            message: "This request has already been processed."
                        });
                    }

                    const notificationSql = `
                        INSERT INTO notifications
                            (user_id, message, type)
                        VALUES (?, ?, 'project_request_accepted')
                    `;

                    db.query(
                        notificationSql,
                        [
                            request.requester_id,
                            "Your request to join the project was accepted!"
                        ],
                        (notificationError) => {
                            if (notificationError) {
                                console.error(
                                    "Notification error:",
                                    notificationError
                                );
                            }

                            return res.json({
                                message: "Request accepted successfully!"
                            });
                        }
                    );
                });
            }
        );
    });
});

// =====================================
// Reject Project Join Request
// =====================================

router.post("/requests/:id/reject", (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            message: "Please login first."
        });
    }

    const findSql = `
        SELECT owner_id, requester_id, status
        FROM project_requests
        WHERE id = ?
    `;

    db.query(findSql, [req.params.id], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Database error."
            });
        }

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Request not found."
            });
        }

        const request = rows[0];

        if (Number(request.owner_id) !== Number(req.session.userId)) {
            return res.status(403).json({
                message: "You are not allowed to reject this request."
            });
        }

        if (request.status !== "Pending") {
            return res.status(400).json({
                message: "This request has already been processed."
            });
        }

        const updateSql = `
            UPDATE project_requests
            SET status = 'Rejected'
            WHERE id = ? AND status = 'Pending'
        `;

        db.query(updateSql, [req.params.id], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Could not reject request."
                });
            }

            if (result.affectedRows === 0) {
                return res.status(409).json({
                    message: "This request has already been processed."
                });
            }

            const notificationSql = `
                INSERT INTO notifications (user_id, message, type)
                VALUES (?, ?, 'project_request_rejected')
            `;

            db.query(
                notificationSql,
                [
                    request.requester_id,
                    "Your request to join the project was rejected."
                ],
                (notificationError) => {
                    if (notificationError) {
                        console.error(
                            "Notification error:",
                            notificationError
                        );
                    }

                    return res.json({
                        message: "Request rejected successfully!"
                    });
                }
            );
        });
    });
});

// =====================================
// Get Project Team Members
// =====================================

router.get("/:id/members", (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            message: "Please login first."
        });
    }

    const query = `
        SELECT
            u.id,
            u.full_name,
            u.username,
            u.profile_picture,
            pm.joined_at
        FROM project_members pm
        JOIN users u ON pm.user_id = u.id
        WHERE pm.project_id = ?
        ORDER BY pm.joined_at ASC
    `;

    db.query(query, [req.params.id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Could not fetch team members."
            });
        }

        return res.json({ members: results });
    });
});

// =====================================
// GET: Project Chat Messages
// =====================================


router.get("/:id/messages", (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            message: "Please login first."
        });
    }

    const projectId = req.params.id;
    const userId = req.session.userId;

    checkProjectAccess(projectId, userId, (err, allowed) => {
        if (err) {
            console.error("Project access error:", err);
            return res.status(500).json({
                message: "Unable to check project access."
            });
        }

        if (!allowed) {
            return res.status(403).json({
                message: "You are not a member of this project."
            });
        }

        const markReadQuery = `
            UPDATE project_messages
            SET read_at = CURRENT_TIMESTAMP
            WHERE project_id = ?
              AND sender_id <> ?
              AND read_at IS NULL
        `;

        db.query(markReadQuery, [projectId, userId], (readErr) => {
            if (readErr) {
                console.error("Mark messages read error:", readErr);
                return res.status(500).json({
                    message: "Unable to update read receipts."
                });
            }

            const query = `
                SELECT
                    pm.id,
                    pm.project_id,
                    pm.sender_id,
                    pm.message,
                    pm.created_at,
                    pm.read_at,
                    u.full_name AS sender_name
                FROM project_messages pm
                JOIN users u ON u.id = pm.sender_id
                WHERE pm.project_id = ?
                ORDER BY pm.created_at ASC
            `;

            db.query(query, [projectId], (err, messages) => {
                if (err) {
                    console.error("Load messages error:", err);
                    return res.status(500).json({
                        message: "Unable to load messages."
                    });
                }

                return res.json({ messages });
            });
        });
    });
});


// =====================================
// POST: Send Project Chat Message
// =====================================

router.post("/:id/messages", (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            message: "Please login first."
        });
    }

    const projectId = req.params.id;
    const userId = req.session.userId;
    const message =
        typeof req.body.message === "string"
            ? req.body.message.trim()
            : "";

    if (!message) {
        return res.status(400).json({
            message: "Message cannot be empty."
        });
    }

    checkProjectAccess(projectId, userId, (err, allowed) => {
        if (err) {
            console.error("Project access error:", err);
            return res.status(500).json({
                message: "Unable to check project access."
            });
        }

        if (!allowed) {
            return res.status(403).json({
                message: "You are not a member of this project."
            });
        }

        const query = `
            INSERT INTO project_messages
                (project_id, sender_id, message)
            VALUES (?, ?, ?)
        `;

        db.query(query, [projectId, userId, message], (err, result) => {
            if (err) {
                console.error("Send message error:", err);
                return res.status(500).json({
                    message: "Unable to send message."
                });
            }

            // Fetch the saved message with sender details.
            const fetchSql = `
                SELECT
                    pm.id,
                    pm.project_id,
                    pm.sender_id,
                    pm.message,
                    pm.created_at,
                    u.full_name AS sender_name
                FROM project_messages pm
                JOIN users u ON u.id = pm.sender_id
                WHERE pm.id = ?
            `;

            db.query(fetchSql, [result.insertId], (fetchError, rows) => {
                if (fetchError) {
                    console.error("Fetch sent message error:", fetchError);

                    return res.status(500).json({
                        message: "Message saved, but could not fetch it."
                    });
                }

                const savedMessage = rows[0];
                const io = req.app.get("io");

                // Broadcast only to this project's chat room.
                if (io && savedMessage) {
                    io.to(`project:${Number(projectId)}`).emit(
                        "newMessage",
                        savedMessage
                    );
                }

                return res.status(201).json({
                    message: "Message sent successfully!",
                    messageId: result.insertId
                });
            });
        });
    });
});

// =====================================
// Export Routes
// =====================================

module.exports = router;
