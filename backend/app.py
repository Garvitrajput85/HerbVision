import json
import hmac
import os
import re
import subprocess
import sys
from pathlib import Path
from threading import Lock

ROOT_PATH = Path(__file__).resolve().parents[1]
ML_ENV_PATH = ROOT_PATH / ".venv-ml"
if os.name == "nt":
    ML_PYTHON = ML_ENV_PATH / "Scripts" / "python.exe"
else:
    ML_PYTHON = ML_ENV_PATH / "bin" / "python"

# Use the ML interpreter only when it can also run the API. A partially-created
# ML environment must not prevent the Flask endpoints from starting.
if ML_PYTHON.exists() and Path(sys.prefix).resolve() != ML_ENV_PATH.resolve():
    try:
        subprocess.run(
            [str(ML_PYTHON), "-c", "import flask, pymongo"],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=10,
        )
    except (subprocess.SubprocessError, OSError):
        pass
    else:
        os.execv(str(ML_PYTHON), [str(ML_PYTHON), str(Path(__file__).resolve()), *sys.argv[1:]])

if ML_ENV_PATH.exists():
    candidate_paths = [
        ML_ENV_PATH / "lib" / f"python{sys.version_info.major}.{sys.version_info.minor}" / "site-packages",
        ML_ENV_PATH / "Lib" / "site-packages",
    ]
    for candidate in candidate_paths:
        if candidate.exists() and str(candidate) not in sys.path:
            sys.path.insert(0, str(candidate))


def _load_admin_token_from_env_file():
    """Load only the admin key from backend/.env without overwriting the shell."""
    env_file = Path(__file__).resolve().parent / ".env"
    if os.getenv("ADMIN_TOKEN") or not env_file.is_file():
        return
    for line in env_file.read_text(encoding="utf-8").splitlines():
        key, separator, value = line.partition("=")
        if separator and key.strip() == "ADMIN_TOKEN":
            os.environ["ADMIN_TOKEN"] = value.strip().strip("\"'")
            return


_load_admin_token_from_env_file()

try:
    from .database import get_all_plants, find_plant_by_id, search_plants, save_all_plants
except ImportError:
    from database import get_all_plants, find_plant_by_id, search_plants, save_all_plants

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

PLANT_DATA_FILE = Path(__file__).resolve().parent / "data" / "plants" / "plant_details.json"
MODEL_PATH = Path(__file__).resolve().parents[1] / "ML" / "medicinal_plant_model.pth"
CLASS_NAMES_PATH = MODEL_PATH.with_name("classes.json")
MIN_PLANT_CONFIDENCE = float(os.getenv("PLANT_MIN_CONFIDENCE", "0.60"))
_model = None
_class_names = None
_model_lock = Lock()


def _load_plant_model():
    """Load the trained EfficientNetV2-S once, on the first prediction request."""
    global _model, _class_names
    if _model is not None:
        return _model, _class_names

    with _model_lock:
        if _model is not None:
            return _model, _class_names

        import torch
        from torch import nn
        from torchvision import models

        # Keep ImageFolder's alphabetical class order exactly as saved by training.
        if CLASS_NAMES_PATH.is_file():
            with CLASS_NAMES_PATH.open("r", encoding="utf-8") as file:
                labels = json.load(file)
            if isinstance(labels, dict):
                labels = labels.get("class_names")
        else:
            labels = None

        if not isinstance(labels, list) or not labels or not all(isinstance(x, str) for x in labels):
            raise ValueError(
                "Class labels are missing. Add ML/classes.json as an ordered JSON array "
                "matching the training ImageFolder.classes order."
            )
        if not MODEL_PATH.is_file():
            raise FileNotFoundError(f"PyTorch checkpoint not found: {MODEL_PATH}")

        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model = models.efficientnet_v2_s(weights=None)
        in_features = model.classifier[1].in_features
        model.classifier = nn.Sequential(
            nn.Dropout(p=0.3, inplace=True),
            nn.Linear(in_features, 512),
            nn.BatchNorm1d(512),
            nn.SiLU(),
            nn.Dropout(p=0.4),
            nn.Linear(512, len(labels)),
        )
        try:
            state = torch.load(MODEL_PATH, map_location=device, weights_only=True)
        except TypeError:  # Compatibility with older PyTorch releases.
            state = torch.load(MODEL_PATH, map_location=device)
        if isinstance(state, dict) and "state_dict" in state:
            state = state["state_dict"]
        if isinstance(state, dict) and state and all(key.startswith("module.") for key in state):
            state = {key.removeprefix("module."): value for key, value in state.items()}
        model.load_state_dict(state)
        model.to(device).eval()
        _model = (model, device)
        _class_names = labels
        return _model, _class_names


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


def _admin_authorized():
    expected = os.getenv("ADMIN_TOKEN", "")
    supplied = request.headers.get("X-Admin-Token", "")
    return bool(expected) and hmac.compare_digest(expected.encode("utf-8"), supplied.encode("utf-8"))


def _admin_auth_error():
    if not os.getenv("ADMIN_TOKEN"):
        return jsonify({
            "success": False,
            "message": "Admin access is not configured. Set ADMIN_TOKEN in backend/.env and restart the backend.",
        }), 503
    return jsonify({"success": False, "message": "Admin key is incorrect or has expired."}), 401


def _clean_string(value, *, limit=4000):
    return str(value or "").strip()[:limit]


def _clean_string_list(value):
    if isinstance(value, str):
        value = re.split(r"[\n,]", value)
    if not isinstance(value, list):
        return []
    return [_clean_string(item, limit=300) for item in value if _clean_string(item, limit=300)]


def _validated_plant(payload, existing=None):
    if not isinstance(payload, dict):
        raise ValueError("Send plant details as a JSON object.")
    existing = existing or {}
    plant_id = _clean_string(payload.get("id", existing.get("id", "")), limit=100).lower()
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", plant_id):
        raise ValueError("Plant ID must use lowercase letters, numbers, and single hyphens.")
    name = _clean_string(payload.get("name", existing.get("name", "")), limit=200)
    scientific_name = _clean_string(payload.get("scientific_name", existing.get("scientific_name", "")), limit=300)
    if not name or not scientific_name:
        raise ValueError("Plant name and scientific name are required.")

    plant = {
        **existing,
        "id": plant_id,
        "name": name,
        "scientific_name": scientific_name,
        "plant_family": _clean_string(payload.get("plant_family", existing.get("plant_family", "")), limit=200),
        "description": _clean_string(payload.get("description", existing.get("description", ""))),
        "medicine_properties": _clean_string(payload.get("medicine_properties", existing.get("medicine_properties", ""))),
        "uses": _clean_string_list(payload.get("uses", existing.get("uses", []))),
        "benefits": _clean_string(payload.get("benefits", existing.get("benefits", ""))),
        "parts_commonly_used": _clean_string_list(payload.get("parts_commonly_used", existing.get("parts_commonly_used", []))),
        "growing": _clean_string(payload.get("growing", existing.get("growing", ""))),
        "hindi_name": _clean_string(payload.get("hindi_name", existing.get("hindi_name", "")), limit=200),
        "local_names": _clean_string_list(payload.get("local_names", existing.get("local_names", []))),
        "popular_names": _clean_string_list(payload.get("popular_names", existing.get("popular_names", []))),
    }
    leaf_features = payload.get("leaf_features", existing.get("leaf_features", {}))
    if isinstance(leaf_features, dict):
        plant["leaf_features"] = {
            _clean_string(key, limit=100): _clean_string(value, limit=500)
            for key, value in leaf_features.items()
            if _clean_string(key, limit=100) and _clean_string(value, limit=500)
        }
    return plant


@app.route("/api/admin/plants", methods=["GET", "POST"])
def admin_plants():
    if not _admin_authorized():
        return _admin_auth_error()

    plants = get_all_plants()
    if request.method == "GET":
        return jsonify({"success": True, "count": len(plants), "plants": plants})

    try:
        plant = _validated_plant(request.get_json(silent=True))
        if any(str(item.get("id", "")).casefold() == plant["id"] for item in plants):
            return jsonify({"success": False, "message": "A plant with this ID already exists."}), 409
        plants.append(plant)
        save_all_plants(plants)
        return jsonify({"success": True, "plant": plant}), 201
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400


@app.route("/api/admin/plants/<plant_id>", methods=["PUT", "DELETE"])
def admin_plant(plant_id):
    if not _admin_authorized():
        return _admin_auth_error()

    plants = get_all_plants()
    index = next((i for i, plant in enumerate(plants) if str(plant.get("id", "")).casefold() == plant_id.casefold()), None)
    if index is None:
        return jsonify({"success": False, "message": "Plant not found."}), 404

    if request.method == "DELETE":
        del plants[index]
        save_all_plants(plants)
        return jsonify({"success": True, "count": len(plants)})

    try:
        plant = _validated_plant(request.get_json(silent=True), plants[index])
        plant["id"] = plants[index]["id"]
        plants[index] = plant
        save_all_plants(plants)
        return jsonify({"success": True, "plant": plant})
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400


@app.route("/api/analyze", methods=["POST"])
def analyze_plant():
    image_file = request.files.get("image")
    if image_file is None:
        return jsonify({"success": False, "message": "Upload an image using the 'image' field."}), 400

    try:
        import torch
        from PIL import Image, UnidentifiedImageError
        from torchvision import transforms

        (model, device), class_names = _load_plant_model()
        image = Image.open(image_file.stream).convert("RGB")
        # These are the validation transforms used in ML/model3.ipynb.
        transform = transforms.Compose([
            transforms.Resize((384, 384)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ])
        batch = transform(image).unsqueeze(0).to(device)
        with torch.inference_mode():
            probabilities = torch.softmax(model(batch), dim=1)[0].cpu()

        if probabilities.numel() != len(class_names):
            raise ValueError(
                f"Model returned {probabilities.numel()} classes but classes.json has {len(class_names)} labels."
            )
        top = torch.topk(probabilities, k=min(3, len(class_names)))
        best_index = int(top.indices[0])
        best_confidence = float(top.values[0])
        if best_confidence < MIN_PLANT_CONFIDENCE:
            return jsonify({
                "success": False,
                "message": (
                    "This image could not be confidently matched to a supported plant. "
                    "Upload a clear, close-up photo of a plant leaf."
                ),
            }), 422

        predicted_name = class_names[best_index]
        normalize_name = lambda value: "".join(character for character in str(value).casefold() if character.isalnum())
        predicted_key = normalize_name(predicted_name)
        # The training labels use a few regional spellings that differ from the
        # catalog entries. Resolve those to the matching database record.
        catalog_aliases = {
            "amrathaballi": "amruthaballi",
            "bhrami": "brahmi",
            "globeamarnath": "globeamaranth",
            "karanda": "koranda",
            "thumbai": "thumbe",
        }
        lookup_key = normalize_name(catalog_aliases.get(predicted_key, predicted_name))
        plants = get_all_plants()
        plant_profile = next((
            plant for plant in plants
            if normalize_name(plant.get("name", "")) == lookup_key
            or normalize_name(plant.get("name", "")).startswith(lookup_key)
            or normalize_name(plant.get("id", "")) == lookup_key
            or (normalize_name(plant.get("id", "")) and lookup_key.startswith(normalize_name(plant.get("id", ""))))
        ), {})
        result = {
            "name": plant_profile.get("name", predicted_name),
            "id": plant_profile.get("id", ""),
            "confidence": f"{best_confidence * 100:.2f}%",
            "icon": plant_profile.get("icon", "🌿"),
            "scientific_name": plant_profile.get("scientific_name", ""),
            "plant_family": plant_profile.get("plant_family", ""),
            "description": plant_profile.get("description", ""),
            "medicine_properties": plant_profile.get("medicine_properties", ""),
            "use": plant_profile.get("uses", []),
            "benefits": plant_profile.get("benefits", ""),
            "growing": plant_profile.get("growing", ""),
            "parts_commonly_used": plant_profile.get("parts_commonly_used", []),
            "leaf_features": plant_profile.get("leaf_features", {}),
            "note": plant_profile.get("note", ""),
            "predictions": [
                {"class": class_names[int(index)], "confidence": float(score)}
                for index, score in zip(top.indices, top.values)
            ],
        }
        return jsonify({"success": True, "result": result})
    except ImportError as exc:
        return jsonify({"success": False, "message": f"Install backend ML dependencies: {exc}"}), 503
    except UnidentifiedImageError:
        return jsonify({"success": False, "message": "The uploaded file is not a valid image."}), 400
    except (ImportError, FileNotFoundError, ValueError) as exc:
        return jsonify({"success": False, "message": str(exc)}), 503
    except Exception as exc:
        app.logger.exception("Plant image inference failed")
        return jsonify({"success": False, "message": f"Image analysis failed: {exc}"}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)
