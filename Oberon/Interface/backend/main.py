import os
from fastapi import FastAPI
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware


load_dotenv()
app = FastAPI()

# Allow CORS for the frontend's origin (replace with actual frontend URL if different)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

@app.get("/")
def read_root():
    return {
        "message": "Oberon, api from backend",
        "api_key": os.getenv("BASIQ_API_KEY") 
        }