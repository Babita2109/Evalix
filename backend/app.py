import os
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI(title="SkillTrack API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST", "127.0.0.1"),
            port=int(os.getenv("DB_PORT", 3306)),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_NAME", "skilltrack_db"),
        )
        return connection
    except Error as e:
        print(f"Database connection error: {e}")
        return None

@app.get("/")
def home():
    return {
        "success": True,
        "message": "Welcome to SkillTrack API"
    }

@app.get("/api/health")
def health():
    conn = get_db_connection()
    if conn and conn.is_connected():
        conn.close()
        return {
            "success": True,
            "server": "Running",
            "database": "Connected to skilltrack_db"
        }
    return {
        "success": False,
        "server": "Running",
        "database": "Connection failed"
    }

