import os
import sys
import uvicorn

# If run from repo root, ensure backend is on sys.path and is cwd
backend_dir = os.path.join(os.path.dirname(__file__), "backend")
if os.path.exists(backend_dir):
    os.chdir(backend_dir)
    sys.path.insert(0, backend_dir)

port_str = os.environ.get("PORT", "8000")
try:
    port = int(port_str)
except ValueError:
    port = 8000

if __name__ == "__main__":
    print(f"Starting DepthWizard backend on 0.0.0.0:{port}...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, log_level="info")
