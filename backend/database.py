import json
import os
import re
from pathlib import Path

from pymongo import MongoClient
from pymongo.errors import PyMongoError

try:
    import certifi
except ImportError:  # pragma: no cover
    certifi = None


BASE_DIR = Path(__file__).resolve().parent
PLANT_DATA_FILE = BASE_DIR / "data" / "plants" / "plant_details.json"
FRONTEND_PLANT_DATA_FILE = BASE_DIR.parent / "frontend" / "plant_details.json"
ADMIN_CATALOG_FILE = BASE_DIR / "data" / "plants" / "admin_catalog.json"
ADMIN_CATALOG_ID = "herbvision_admin_catalog"

MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb+srv://garvitrajput85_db_user:xunQmVFJk5i6ahnJ@cluster0.0v9ydkr.mongodb.net/"
)
MONGO_DB = os.getenv("MONGO_DB", "HerbVision")
PLANTS_COLLECTION = "Plants"

client = None
collection = None
plants_collection = None


def _connect_mongo():
    global client, collection, plants_collection

    try:
        mongo_kwargs = {
            "serverSelectionTimeoutMS": 5000,
        }

        if certifi is not None:
            mongo_kwargs["tls"] = True
            mongo_kwargs["tlsCAFile"] = certifi.where()

        client = MongoClient(MONGO_URI, **mongo_kwargs)
        client.admin.command("ping")

        db = client[MONGO_DB]
        collection = db[PLANTS_COLLECTION]
        plants_collection = collection
        return collection
    except (PyMongoError, OSError, ValueError) as exc:
        print(f"MongoDB unavailable: {exc}")
        client = None
        collection = None
        plants_collection = None
        return None


_connect_mongo()


def load_local_plants():
    """Load the backend records plus the fuller catalog bundled with the UI."""
    if ADMIN_CATALOG_FILE.is_file():
        with ADMIN_CATALOG_FILE.open("r", encoding="utf-8") as file:
            catalog = json.load(file)
        plants = catalog.get("plants", []) if isinstance(catalog, dict) else catalog
        if isinstance(plants, list):
            return plants

    plants_by_id = {}

    for data_file in (FRONTEND_PLANT_DATA_FILE, PLANT_DATA_FILE):
        if not data_file.is_file():
            continue

        with data_file.open("r", encoding="utf-8") as file:
            data = json.load(file)

        plants = data.get("plants", []) if isinstance(data, dict) else data
        if not isinstance(plants, list):
            continue

        for plant in plants:
            if not isinstance(plant, dict):
                continue
            plant_id = str(plant.get("id") or plant.get("name") or "").strip().casefold()
            if not plant_id:
                continue

            # Keep richer catalog values when a backend override leaves a field blank.
            existing = plants_by_id.get(plant_id, {})
            plants_by_id[plant_id] = {
                **existing,
                **{key: value for key, value in plant.items() if value not in (None, "", [], {})},
            }

    return list(plants_by_id.values())


def get_all_plants():
    if collection is not None:
        try:
            admin_catalog = collection.find_one({"_id": ADMIN_CATALOG_ID}, {"_id": 0})
            if admin_catalog and isinstance(admin_catalog.get("plants"), list):
                return admin_catalog["plants"]

            docs = list(collection.find({}, {"_id": 0}))
            plants = []

            for doc in docs:
                nested = doc.get("plants")
                if isinstance(nested, list):
                    plants.extend(nested)
                elif "id" in doc:
                    plants.append(doc)

            if plants:
                return plants
        except (PyMongoError, OSError, ValueError) as exc:
            print(f"MongoDB read failed, falling back to local data: {exc}")

    return load_local_plants()


def save_all_plants(plants):
    """Persist the admin-managed catalog in MongoDB and the local fallback."""
    ADMIN_CATALOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    temporary_file = ADMIN_CATALOG_FILE.with_suffix(".tmp")
    temporary_file.write_text(
        json.dumps({"plants": plants}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    temporary_file.replace(ADMIN_CATALOG_FILE)

    if collection is not None:
        try:
            collection.replace_one(
                {"_id": ADMIN_CATALOG_ID},
                {"plants": plants},
                upsert=True,
            )
        except (PyMongoError, OSError, ValueError) as exc:
            print(f"MongoDB catalog save failed; local catalog is saved: {exc}")

    return plants


def find_plant_by_id(plant_id):
    plant_id = str(plant_id).strip()
    if not plant_id:
        return None

    if collection is not None:
        try:
            safe_id = re.escape(plant_id)
            document = collection.find_one(
                {
                    "plants.id": {
                        "$regex": f"^{safe_id}$",
                        "$options": "i",
                    }
                },
                {"_id": 0, "plants.$": 1},
            )

            if document and "plants" in document and document["plants"]:
                return document["plants"][0]
        except (PyMongoError, OSError, ValueError) as exc:
            print(f"MongoDB lookup failed, falling back to local data: {exc}")

    for plant in load_local_plants():
        if str(plant.get("id", "")).casefold() == plant_id.casefold():
            return plant

    return None


def search_plants(query):
    query = (query or "").strip()
    if not query:
        return []

    normalized = query.casefold()
    plants = get_all_plants()

    matches = []
    for plant in plants:
        name = str(plant.get("name", "")).casefold()
        scientific = str(plant.get("scientific_name", "")).casefold()
        if normalized in name or normalized in scientific:
            matches.append(plant)

    return matches


if __name__ == "__main__":
    plant_id = input("Enter plant ID: ").strip()
    plant = find_plant_by_id(plant_id)

    if plant:
        print("\nPlant Found!")
        print("=" * 40)
        print(json.dumps(plant, indent=2, ensure_ascii=False))
    else:
        print("\nPlant not found.")
