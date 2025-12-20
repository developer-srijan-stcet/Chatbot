from flask import Flask, render_template, request, jsonify, session
import google.generativeai as genai
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import uuid

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "dev-secret")

# ========== GEMINI ==========
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

# ========== DATABASE ==========
DB_URL = os.getenv("DATABASE_URL")

def get_conn():
    return psycopg2.connect(DB_URL, cursor_factory=RealDictCursor)

# ========== CREATE TABLE ==========
with get_conn() as conn:
    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                user_id TEXT,
                content TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
    conn.commit()

# ========== SESSION USER ==========
@app.before_request
def ensure_user():
    if "user_id" not in session:
        session["user_id"] = str(uuid.uuid4())

# ========== ROUTES ==========
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    user_msg = request.json.get("message")
    user_id = session["user_id"]

    try:
        # Save user message
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO messages (user_id, content) VALUES (%s,%s)",
                    (user_id, user_msg)
                )
            conn.commit()

        # Generate AI reply
        reply = model.generate_content(user_msg).text
        return jsonify({"reply": reply})

    except Exception as e:
        print("Error in /chat:", e)  # Logs error to console/Render logs
        return jsonify({"reply": "Oops! Something went wrong."})


@app.route("/history")
def history():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify([])  # fallback if session missing

    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT content FROM messages WHERE user_id=%s ORDER BY timestamp DESC",
                    (user_id,)
                )
                msgs = cur.fetchall()
        return jsonify(msgs)

    except Exception as e:
        print("Error in /history:", e)
        return jsonify([])  # return empty list instead of HTML error page


if __name__ == "__main__":
    app.run(debug=True)
