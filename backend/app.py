import json
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS

from database import get_all_plants, find_plant_by_id, search_plants

app = Flask(__name__)
CORS(app)

PLANT_DATA_FILE = Path(__file__).resolve().parent / "data" / "plants" / "plant_details.json"


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "HerbVisionAI Python Backend is running",
        "database": "MongoDB + Local fallback",
    })


@app.route("/api/plants", methods=["GET"])
def get_plants():
    try:
        plants = get_all_plants()
        return jsonify({
            "success": True,
            "count": len(plants),
            "plants": plants,
        })
    except Exception as exc:
        return jsonify({
            "success": False,
            "message": f"Unable to fetch plants: {str(exc)}",
        }), 500


@app.route("/api/plants/<plant_id>", methods=["GET"])
def get_plant(plant_id):
    try:
        plant = find_plant_by_id(plant_id)
        if not plant:
            return jsonify({
                "success": False,
                "message": "Plant not found",
            }), 404

        return jsonify({
            "success": True,
            "plant": plant,
        })
    except Exception as exc:
        return jsonify({
            "success": False,
            "message": f"Unable to fetch plant: {str(exc)}",
        }), 500


@app.route("/api/plants/search", methods=["GET"])
def search_plant_route():
    query = request.args.get("q", "").strip()
    try:
        plants = search_plants(query)
        return jsonify({
            "success": True,
            "count": len(plants),
            "plants": plants,
        })
    except Exception as exc:
        return jsonify({
            "success": False,
            "message": f"Search failed: {str(exc)}",
        }), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)
