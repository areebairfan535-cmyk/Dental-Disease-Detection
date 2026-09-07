"""
MOCK dental AI server — for local development only.

This does NOT analyse the image. It returns a canned result so the app's upload
→ analyse → save → history flow can be exercised without a real model or an API
key behind it.

Every response is labelled `"mock": true` and carries a warning string, so a
mock result can never be mistaken for a real one further up the stack. If you
point the app at this and see a diagnosis, that diagnosis is fiction.

Run:
    py -m pip install flask flask-cors
    py mock-ai-server/app.py

Then, in backend/.env:
    DENTAL_AI_URL=http://127.0.0.1:5000

Never run this anywhere but your own machine, and never in front of anyone who
might take the output seriously.
"""

import sys
import traceback

try:
    from flask import Flask, jsonify, request
    from flask_cors import CORS
except ImportError:
    sys.exit("Missing packages. Run:  py -m pip install flask flask-cors")

app = Flask(__name__)

# Localhost only. This must never be reachable from another machine.
CORS(app, resources={r"/*": {"origins": ["http://localhost:*", "http://127.0.0.1:*"]}})
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50 MB

WARNING = "MOCK RESPONSE — no model analysed this image. Not a diagnosis."

# One fixed result, deliberately. An earlier version picked at random, which
# made the app look like it was analysing when it was not — the same photo
# would come back "Cavity" once and "Healthy" the next time. A constant answer
# is obviously fake, which is the point.
CANNED = {
    "result": "Cavity",
    "advice": "Visit a dentist for a filling.",
    "confidence": 0.0,
    "mock": True,
    "warning": WARNING,
}


@app.route("/", methods=["GET"])
def root():
    return jsonify({
        "status": "Mock dental AI server running",
        "mock": True,
        "warning": WARNING,
    }), 200


@app.route("/predict", methods=["POST", "OPTIONS"])
def predict():
    if request.method == "OPTIONS":
        return "", 204

    try:
        if "image" not in request.files:
            return jsonify({"error": "No image file provided", "mock": True}), 400

        image = request.files["image"]
        if image.filename == "":
            return jsonify({"error": "No file selected", "mock": True}), 400

        data = image.read()
        print(f"received {image.filename} ({len(data)} bytes) — returning canned result")
        return jsonify(CANNED), 200

    except Exception as exc:
        print(f"ERROR: {exc}")
        print(traceback.format_exc())
        # Message only — no traceback in the response body.
        return jsonify({"error": str(exc), "mock": True}), 500


if __name__ == "__main__":
    print("=" * 60)
    print("  MOCK dental AI server")
    print("  Returns a canned result. It does not analyse anything.")
    print("  Local development only.")
    print("=" * 60)
    # 127.0.0.1, not 0.0.0.0 — this should not be reachable over the network.
    # debug=False — the Werkzeug debugger allows remote code execution.
    app.run(host="127.0.0.1", port=5000, debug=False)
