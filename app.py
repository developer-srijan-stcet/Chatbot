from flask import Flask, render_template, request, jsonify
import google.generativeai as genai
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

app = Flask(__name__)

# Load Gemini API key
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY not set in environment variables")
genai.configure(api_key=API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash")

# PostgreSQL connection
DB_URL = os.getenv("DATABASE_URL")
if not DB_URL:
    raise ValueError("DATABASE_URL not set in environment variables")

def get_conn():
    return psycopg2.connect(DB_URL, cursor_factory=RealDictCursor)

# Create table if not exists
with get_conn() as conn:
    with conn.cursor() as cur:
        cur.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            role VARCHAR(10),
            content TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
    conn.commit()

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    user_message = request.json.get("message")

    try:
        # Save user message
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("INSERT INTO messages (role, content) VALUES (%s,%s)", ("user", user_message))
            conn.commit()

        # Generate bot response
        response = model.generate_content(user_message)
        bot_reply = response.text

        # Save bot reply
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("INSERT INTO messages (role, content) VALUES (%s,%s)", ("bot", bot_reply))
            conn.commit()

        return jsonify({"reply": bot_reply})
    except Exception as e:
        return jsonify({"reply": f"Error: {str(e)}"})

@app.route("/history", methods=["GET"])
def history():
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT role, content, timestamp FROM messages ORDER BY timestamp")
            messages = cur.fetchall()
    return jsonify(messages)

if __name__ == "__main__":
    app.run(debug=True)
