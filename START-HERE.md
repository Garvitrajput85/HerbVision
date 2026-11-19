# HerbVisionAI

On this Intel Mac, start the backend and frontend together from the project root:

```sh
./start.sh
```

The script uses Python 3.12 and starts the UI at `http://localhost:3000`. If `PLANTNET_API_KEY` is configured in `backend/.env` (or the shell), image identification uses PlantNet; if the key is missing or PlantNet is unavailable, it falls back to the bundled local PyTorch model.

To force local identification, start with `HERBVISION_LOCAL_MODE=1 ./start.sh`. PlantNet requires your own valid API key in `backend/.env`; the app keeps that key on the backend and never sends it to the browser.
