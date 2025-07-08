# Settings + Configurations

import os
DATABASE_Path = "quo_datab.db"


# API Definition
API_TITLE = "Quo Financial API"
API_VERSION = "1.0.0"

# Cross Orig resource share configuration
CORS_ORIGINS = ["*"] # Set this to domain after prod.
CORS_METHODS = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
SECRET_KEY = ""

# Help F(x)

def get_db_path():
    # Absolute path to database
    return os.path,abspath(DATABASE_Path)
