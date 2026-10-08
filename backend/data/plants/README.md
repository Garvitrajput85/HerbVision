Save every plant as one object inside the `plants` array in `plant_details.json`.

```json
{
  "plants": [
    {
      "id": "tulsi",
      "name": "Tulsi",
      "scientific_name": "Ocimum tenuiflorum",
      "plant_family": "Lamiaceae",
      "description": "Short description.",
      "uses": "Traditional uses",
      "benefits": "Short description of the plant's benefits.",
      "growing": "Growing information."
    }
  ]
}
```

With `MONGODB_URI` and `MONGODB_DATABASE` configured in `backend/.env`, the Flask API stores these records in the `plants` array of a document in the `HerbVision.Plants` collection when that collection is empty. API endpoints:

- `GET /api/plants` — all saved plants
- `GET /api/plants/<id>` — one plant by ID
- `POST /api/users` — save a user with a JSON body such as `{"name":"Asha","email":"asha@example.com"}`. Email addresses are unique.
