
import os
from pathlib import Path

import mysql.connector
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

BASE_DIR = Path(__file__).resolve().parent


def get_connection():
    host = os.getenv("DB_HOST", "").strip()

    if not host:
        raise RuntimeError("DB_HOST is missing or empty in the Render environment")

    print(
        f"Database host configured: "
        f"{'cloud' if host not in ('localhost', '127.0.0.1') else 'localhost'}"
    )

    is_local = host in ("localhost", "127.0.0.1")

    config = {
        "host": host,
        "port": int(os.getenv("DB_PORT", "3306")),
        "user": os.getenv("DB_USER", "root"),
        "password": os.getenv("DB_PASSWORD", ""),
        "database": os.getenv("DB_NAME", "fintrack_db"),
    }

    if not is_local:
        config.update({
            "ssl_ca": str(BASE_DIR / "ca.pem"),
            "ssl_verify_cert": True,
            "ssl_verify_identity": True,
        })

    return mysql.connector.connect(**config)
