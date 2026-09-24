from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException
import cv2
import numpy as np
import json
from pathlib import Path

app = Flask(__name__)
# Keep unusually large uploads from exhausting memory during image decoding.
app.config["MAX_CONTENT_LENGTH"] = 12 * 1024 * 1024
CORS(app)

PLANT_DATA_FILE = Path(__file__).parent / "data" / "plants" / "plant_details.json"


def load_plants():
    """Load plant details kept separately from application code."""
    with PLANT_DATA_FILE.open(encoding="utf-8") as data_file:
        return json.load(data_file).get("plants", [])


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "HerbVisionAI Python Backend is running"
    })


@app.route("/api/plants", methods=["GET"])
def get_plants():
    """Return all saved plant/leaf details."""
    return jsonify({"success": True, "plants": load_plants()})


@app.route("/api/plants/<plant_id>", methods=["GET"])
def get_plant(plant_id):
    for plant in load_plants():
        if plant["id"] == plant_id:
            return jsonify({"success": True, "plant": plant})

    return jsonify({"success": False, "message": "Plant not found"}), 404


@app.route("/api/analyze", methods=["POST"])
def analyze():

    try:

        # Check whether image was received
        if "image" not in request.files:
            return jsonify({
                "success": False,
                "message": "No image received"
            }), 400

        image_file = request.files["image"]

        # Read image bytes
        image_bytes = image_file.read()

        # Convert bytes to NumPy array
        image_array = np.frombuffer(
            image_bytes,
            np.uint8
        )

        # Convert NumPy array to OpenCV image
        image = cv2.imdecode(
            image_array,
            cv2.IMREAD_COLOR
        )

        if image is None:
            return jsonify({
                "success": False,
                "message": "Invalid image"
            }), 400

        # Get image dimensions
        height, width = image.shape[:2]

        print(
            f"Image received: {width} x {height}"
        )

        # ML model is not connected yet. Until then, return the first saved
        # plant record. Later replace `result` with the model's detected ID.
        plants = load_plants()
        if not plants:
            return jsonify({
                "success": False,
                "message": "No plant details found in plant_details.json"
            }), 500

        result = plants[0].copy()
        result["confidence"] = "95%"

        return jsonify({
            "success": True,
            "result": result
        })

    except Exception as e:

        if isinstance(e, HTTPException):
            raise

        app.logger.exception("Plant image analysis failed")

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


@app.errorhandler(413)
def request_too_large(_error):
    return jsonify({
        "success": False,
        "message": "Image upload is too large. Choose a smaller image (under 12 MB)."
    }), 413


if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5001,
        debug=True
    )
