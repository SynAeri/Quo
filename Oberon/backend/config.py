# config.py
# Settings + Configurations
import os
from os.path import abspath

# Database configuration for Railway
if os.getenv("RAILWAY_ENVIRONMENT"):
    # Production on Railway - use volume
    DATABASE_PATH = "/data/quo_datab.db"
else:
    # Local development
    DATABASE_PATH = "quo_datab.db"

# API Definition
API_TITLE = "Quo Financial API"
API_VERSION = "1.0.0"

# CORS configuration - get from environment or use defaults
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,https://quo-frontend.up.railway.app").split(",")
CORS_METHODS = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]

# Secret key from environment (important for production!)
SECRET_KEY = os.getenv("SECRET_KEY", "your-default-dev-secret-key-change-this")

# Helper function
def get_db_path():
    # Absolute path to database
    return os.path.abspath(DATABASE_PATH)  
