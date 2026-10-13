
const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const session = require("express-session");

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const borrowRoutes = require("./routes/borrowRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const db = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Shared login session
const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || "campushub-local-secret-change-this",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        sameSite: "lax"
    }
});

app.use(sessionMiddleware);

// Existing API routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/borrow", borrowRoutes);
app.use("/api/notifications", notificationRoutes);

// Frontend
app.use(express.static(path.join(__dirname, "..")));

app.get("/", (req, res) => {
    res.send("CampusHub Backend is Running! 🚀");
});

// HTTP + Socket.IO
const server = http.createServer(app);
const io = new Server(server);

app.set("io", io);
io.engine.use(sessionMiddleware);

// Require a logged-in user
io.use((socket, next) => {
    if (socket.request.session?.userId) {
        return next();
    }

    next(new Error("Please login first."));
});

// Join only projects the user can access
const onlineUsers = new Set();
io.on("connection", (socket) => {
    const userId = socket.request.session.userId;

    if (userId) {
    onlineUsers.add(Number(userId));

    io.emit("onlineUsers", Array.from(onlineUsers));
}

    socket.on("joinProject", (projectId) => {
        if (!Number.isInteger(Number(projectId)) ||
            Number(projectId) <= 0) {
            return;
        }

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
            if (err || !rows.length) {
                return;
            }

            socket.join(`project:${Number(projectId)}`);
            socket.emit("projectJoined", Number(projectId));
        });
    });
socket.on("typing", (projectId) => {
    if (!Number.isInteger(Number(projectId)) || Number(projectId) <= 0) {
        return;
    }

    const room = `project:${Number(projectId)}`;

    if (socket.rooms.has(room)) {
        socket.to(room).emit("userTyping", {
            projectId: Number(projectId),
            userId
        });
    }
});
    socket.on("disconnect", () => {
    console.log("Chat disconnected:", socket.id);

    if (userId) {
        const stillConnected = Array.from(io.sockets.sockets.values())
            .some(s => Number(s.request.session.userId) === Number(userId));

        if (!stillConnected) {
            onlineUsers.delete(Number(userId));
            io.emit("onlineUsers", Array.from(onlineUsers));
        }
    }
});
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`CampusHub server running on port ${PORT}`);
});