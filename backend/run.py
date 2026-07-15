"""BASS PHONK API - run.py
Uvicorn runner script that loads environment and starts the server.
"""

import os
import uvicorn
from dotenv import load_dotenv

load_dotenv()

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    debug = os.getenv("DEBUG", "false").lower() == "true"

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="debug" if debug else "info",
        workers=1 if debug else 4,
    )
