from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# Create FastAPI app
app = FastAPI(title="Quo Financial API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Data models
class SignupRequest(BaseModel):
    email: str
    password: str
    firstName: str
    lastName: str

class LoginRequest(BaseModel):
    email: str
    password: str

# Mock database
mock_users = {}

@app.get("/")
async def root():
    return {
        "message": "Quo Financial API is running!",
        "version": "1.0.0",
        "status": "active"
    }

@app.post("/api/auth/signup")
async def signup(user_data: SignupRequest):
    print(f"📝 Signup attempt: {user_data.email}")
    
    if user_data.email in mock_users:
        print(f"❌ User {user_data.email} already exists")
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Save user
    mock_users[user_data.email] = {
        "password": user_data.password,
        "firstName": user_data.firstName,
        "lastName": user_data.lastName,
        "id": f"user_{len(mock_users) + 1}"
    }
    
    user_info = mock_users[user_data.email]
    print(f"✅ User {user_data.email} created successfully")
    
    return {
        "success": True,
        "message": "User created successfully",
        "user": {
            "id": user_info["id"],
            "email": user_data.email,
            "firstName": user_info["firstName"],
            "lastName": user_info["lastName"]
        },
        "token": f"mock_jwt_token_{user_info['id']}"
    }

@app.post("/api/auth/login")
async def login(credentials: LoginRequest):
    print(f"🔐 Login attempt: {credentials.email}")
    
    if credentials.email not in mock_users:
        print(f"❌ User {credentials.email} not found")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_info = mock_users[credentials.email]
    
    if credentials.password != user_info["password"]:
        print(f"❌ Wrong password for {credentials.email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    print(f"✅ User {credentials.email} logged in successfully")
    
    return {
        "success": True,
        "message": "Login successful",
        "user": {
            "id": user_info["id"],
            "email": credentials.email,
            "firstName": user_info["firstName"],
            "lastName": user_info["lastName"]
        },
        "token": f"mock_jwt_token_{user_info['id']}"
    }

@app.get("/api/auth/verify")
async def verify_token():
    print("🔍 Token verification requested")
    return {
        "success": True,
        "user": {
            "id": "user_1",
            "email": "mock@example.com",
            "firstName": "Mock",
            "lastName": "User"
        }
    }

@app.get("/api/debug/users")
async def get_all_users():
    return {
        "total_users": len(mock_users),
        "users": mock_users
    }
