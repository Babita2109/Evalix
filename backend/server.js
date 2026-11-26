
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const { db, testConnection } = require("./config/db");

const app = express();

// Middleware
app.use(helmet());

app.use(cors({
    origin: "http://localhost:5173"
}));

app.use(express.json());

// Home Route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to SkillTrack API"
    });
});

// Health Check
app.get("/api/health", async (req, res) => {
    try {
        await db.query("SELECT 1");

        res.json({
            success: true,
            server: "Running",
            database: "Connected"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            database: "Disconnected",
            message: error.message
        });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await testConnection();

        app.listen(PORT, () => {
            console.log(`SkillTrack API running on port ${PORT}`);
            console.log(`http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
}

startServer();
