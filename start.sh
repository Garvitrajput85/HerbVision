#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_ENV="$ROOT_DIR/.venv-ml312"
PYTHON="$PYTHON_ENV/bin/python"
IDENTIFICATION_MODE="${HERBVISION_LOCAL_MODE:-0}"

if ! command -v python3.12 >/dev/null 2>&1; then
  echo "Python 3.12 is required for the Intel Mac PyTorch model." >&2
  exit 1
fi

if [[ ! -x "$PYTHON" ]]; then
  python3.12 -m venv "$PYTHON_ENV"
fi

if ! "$PYTHON" -c 'import flask, flask_cors, pymongo, certifi, torch, torchvision, PIL' >/dev/null 2>&1; then
  "$PYTHON" -m pip install --upgrade pip
  "$PYTHON" -m pip install -r "$ROOT_DIR/backend/requirements.txt"
fi

if [[ ! -d "$ROOT_DIR/frontend/node_modules" ]]; then
  (cd "$ROOT_DIR/frontend" && npm ci)
fi

HERBVISION_LOCAL_MODE="$IDENTIFICATION_MODE" "$PYTHON" "$ROOT_DIR/app.py" &
BACKEND_PID=$!
(cd "$ROOT_DIR/frontend" && npm run dev -- --host 127.0.0.1) &
FRONTEND_PID=$!

cleanup() {
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "HerbVision frontend: http://localhost:3000"
echo "HerbVision backend:  http://127.0.0.1:5001"
echo "Press Ctrl+C to stop both servers."
wait "$BACKEND_PID"
