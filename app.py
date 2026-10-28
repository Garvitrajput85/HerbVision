import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if os.name == 'nt':
    ML_PYTHON = ROOT / '.venv-ml' / 'Scripts' / 'python.exe'
else:
    ML_PYTHON = ROOT / '.venv-ml' / 'bin' / 'python'

if ML_PYTHON.exists() and str(ML_PYTHON) != sys.executable:
    os.execv(str(ML_PYTHON), [str(ML_PYTHON), str(ROOT / 'backend' / 'app.py'), *sys.argv[1:]])

from backend.app import app


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)
