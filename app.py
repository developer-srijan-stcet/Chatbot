from flask import Flask, render_template, request, jsonify
import google.genai as genai
import os
import psycopg
from psycopg.rows import dict_row


app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "dev-secret")

# ---------- Gemini AI ----------
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# ---------- Database ----------
DB_URL = os.getenv("DATABASE_URL")

def get_conn():
    return psycopg.connect(DB_URL, row_factory=dict_row)


# ---------- Initialize DB safely ----------
def init_db():
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id SERIAL PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    content TEXT NOT NULL,
                    msg_type TEXT NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
        conn.commit()

# Initialize DB at app startup
init_db()

# ---------- Routes ----------
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    user_msg = data.get("message")
    user_id = data.get("user_id")

    if not user_id or not user_msg:
        return jsonify({"reply": "Invalid request."})

    try:
        # Save user message
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO messages (user_id, content, msg_type) VALUES (%s, %s, %s)",
                    (user_id, user_msg, "user")
                )
            conn.commit()

        # Generate AI reply
        response = client.generate_text(
            model="gemini-2.5-flash",
            prompt=user_msg
        )
        reply_text = response.text

        # Save AI reply
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO messages (user_id, content, msg_type) VALUES (%s, %s, %s)",
                    (user_id, reply_text, "bot")
                )
            conn.commit()

        return jsonify({"reply": reply_text})

    except Exception as e:
        print("Error in /chat:", e)
        return jsonify({"reply": "Oops! Something went wrong."})

@app.route("/clear-history", methods=["POST"])
def clear_history():
    data = request.json
    user_id = data.get("user_id")

    if not user_id:
        return jsonify({"status": "error"})

    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM messages WHERE user_id = %s",
                    (user_id,)
                )
            conn.commit()

        return jsonify({"status": "success"})

    except Exception as e:
        print("Error clearing history:", e)
        return jsonify({"status": "error"})

@app.route("/history", methods=["POST"])
def history():
    data = request.json
    user_id = data.get("user_id")
    if not user_id:
        return jsonify([])

    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT content, msg_type FROM messages WHERE user_id=%s ORDER BY timestamp ASC",
                    (user_id,)
                )
                msgs = cur.fetchall()
        return jsonify(msgs)
    except Exception as e:
        print("Error in /history:", e)
        return jsonify([])

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
