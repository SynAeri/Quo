import os
from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

@app.get("/")
def read_root():
    return {
        "message": "Oberon, api from backend",
        "api_key": os.getenv("BASIQ_API_KEY") 
        }