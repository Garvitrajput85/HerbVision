# Plant leaf data

Save every plant as one object inside the `plants` array in `plant_details.json`.
The `id` must be unique, lowercase, and use hyphens instead of spaces.

```json
{
  "id": "neem",
  "name": "Neem",
  "scientific_name": "Azadirachta indica",
  "icon": "🌱",
  "uses": ["Skin care", "Traditional antibacterial use"],
  "benefits": "Short description of the plant's benefits.",
  "growing": "Sunlight, soil, and watering requirements.",
  "leaf_features": {
    "color": "Dark green",
    "shape": "Long and pointed with serrated edges",
    "arrangement": "Pinnate"
  }
}
```

Add this object after the Tulsi object, with a comma between objects. Restart the backend after editing the JSON file.

Available endpoints:

- `GET /api/plants` — all saved plants
- `GET /api/plants/neem` — one plant by ID
