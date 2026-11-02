import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent

# Do not force the app to run from the ML environment unless that environment is
# actually valid for this project. The bundled ML venv is not guaranteed to have
# the app dependencies (for example, pymongo/flask in the package layout), and
# re-execing into it breaks imports when the app is launched as a package.
#
# Keep the app in the currently selected interpreter so the backend can import
# "backend.app" normally and use the local fallback catalog when MongoDB is down.

from backend.app import app


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)
