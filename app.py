from flask import Flask, render_template, request, jsonify
import google.generativeai as genai
import os
import psycopg2
from psycopg2.extras import RealDictCursor

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "dev-secret")

# ---------- Gemini AI ----------
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

# ---------- Database ----------
DB_URL = os.getenv("DATABASE_URL")

def get_conn():
    return psycopg2.connect(DB_URL, cursor_factory=RealDictCursor)

# ---------- Initialize DB (Run once) ----------
def init_db():
    with get_conn() as conn:
        with conn.cursor() as cur:
            # 🔥 FORCE FIX OLD TABLE
            #cur.execute("DROP TABLE IF EXISTS messages;")

            cur.execute("""
                CREATE TABLE messages (
                    id SERIAL PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    content TEXT NOT NULL,
                    msg_type TEXT NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
        conn.commit()

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
        reply_text = model.generate_content(user_msg).text

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
    # Run on Render port if available
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
