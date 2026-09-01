from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import traceback

# Flask app initialization
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max

@app.route('/', methods=['GET'])
def root():
    return jsonify({"status": "Backend is running successfully"}), 200


@app.route('/predict', methods=['POST', 'OPTIONS'])
def predict():
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return '', 204

    try:
        print("\n=== New Request ===")
        print(f"Content-Type: {request.content_type}")
        print(f"Files received: {list(request.files.keys())}")
        
        # Check if image exists in request
        if 'image' not in request.files:
            print("ERROR: No image file in request")
            return jsonify({"error": "No image file provided"}), 400
        
        image_file = request.files['image']
        
        if image_file.filename == '':
            print("ERROR: No filename")
            return jsonify({"error": "No file selected"}), 400
        
        # Read the image file
        image_data = image_file.read()
        print(f"✓ Image received: {image_file.filename}, Size: {len(image_data)} bytes")
        
        # Dummy AI Results
        results = [
            {"result": "Cavity", "advice": "Visit a dentist for a filling."},
            {"result": "Gum Disease", "advice": "Brush twice daily and use floss."},
            {"result": "Healthy", "advice": "Everything looks great! Keep it up."}
        ]
        
        # Select random result
        prediction = random.choice(results)
        print(f"✓ Sending prediction: {prediction}")
        
        return jsonify(prediction), 200

    except Exception as e:
        error_msg = str(e)
        print(f"\n✗ ERROR: {error_msg}")
        print(traceback.format_exc())
        return jsonify({"error": error_msg}), 500


if __name__ == '__main__':
    print("=" * 50)
    print("🚀 Starting Dental AI Backend")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5000, debug=False)

if __name__ == '__main__':
    # '0.0.0.0' ka matlab hai ke ye network par har jagah se connect hoga
    app.run(host='0.0.0.0', port=5000, debug=True)