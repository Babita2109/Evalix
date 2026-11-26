
const mysql = require("mysql2/promise");
require("dotenv").config();

const db = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "skilltrack_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testConnection() {
    try {
        const connection = await db.getConnection();
        console.log("MySQL Database Connected Successfully!");
        connection.release();
    } catch (error) {
        console.error("Database Connection Failed:", error.message);
        throw error;
    }
}

module.exports = { db, testConnection };
