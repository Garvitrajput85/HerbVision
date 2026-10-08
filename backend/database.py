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
    if not PLANT_DATA_FILE.exists():
        return []

    with PLANT_DATA_FILE.open("r", encoding="utf-8") as file:
        data = json.load(file)

    plants = data.get("plants", [])
    if isinstance(plants, list):
        return plants
    return []


def get_all_plants():
    if collection is not None:
        try:
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
