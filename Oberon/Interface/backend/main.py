import os
from fastapi import FastAPI
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware


load_dotenv()
app = FastAPI(
    title="Quo Financial Risk Analyzer API",
    description="AI-powered financial risk assessment tool",
    version="1.0.0"
)


# Use cors to connect frontend thing to backend thing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Frontend URL
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

# Error handling
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return {"error": "Endpoint not found", "status": 404}

@app.exception_handler(500)
async def server_error_handler(request, exc):
    return {"error": "Internal server error", "status": 500}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
