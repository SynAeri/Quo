# Handling API endpoints + Quo setup
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, Header # FastAPI: Framework, Exception: error responses for frontend

from fastapi.middleware.cors import CORSMiddleware

from pydantic.version import version_info # Basic communication

from typing import Optional


# Basiq Token Gen
import requests
import base64
import os

# Import modules from other files
import config
import database
from models import SignupRequest, LoginRequest, BasiqConnectionReq, BasiqTokenRequest, BasiqTokenResponse

# Quo initialisation
app = FastAPI(title=config.API_TITLE, version=config.API_VERSION) # Better than hardcoding, incase future edits refer to config.py

load_dotenv()
# ==================================================== #
#                  CORS setup                          #
# ==================================================== #

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=config.CORS_METHODS,
    allow_headers=["*"],
)


# ==================================================== #
#                  Startup Quo                         #
# ==================================================== #

@app.on_event("startup")
def startup():
    # When server initialises
    
    print("Financial thingy working..")

    database.init_database() # referencing a method from database
    # Creates database tables

# ==================================================== #
#                  Auth Endpoints                      #
# ==================================================== #

# API Endpoints
@app.get("/")
async def root():
# basically when someone checks localhost:xxx/
    return{
        "message": "Quo is running",
        "version": config.API_VERSION,
        "database": "SQLITE"
    }

# AUTH endpoints
@app.post("/api/auth/signup")
async def signup(user_data: SignupRequest): # user data is auto validated by SignupRequest method in model
    # endpoint handles user registration
    # Auto validated via SignupRequest model
    
    print(f"Signup lodged: {user_data.email}") # since we look at data via email we print just this

    result = database.create_user(
          user_data.email,
          user_data.password,
          user_data.firstName,
          user_data.lastName
    )
    # call create_user() fx and pass all needed data 
    # will yield a dictionary with success or errors

    # Error handler
    if "error" in result:
        if "already exists" in result["error"]: # we made error check in dict just making extra sure
            raise HTTPException(status_code=400, detail=result["error"]) # raise HTTPException 400 for bad request to frontend
        else:
            raise HTTPException(status_code=500, detail=result["error"]) # raise HTTPException 500 for bad internal request to frontend

    # NOW: Creation of Basiq user
    try:
        basiq_user = await create_basiq_user(
            email=user_data.email,
            firstName=user_data.firstName,
            lastName=user_data.lastName
        )
        
        # Storing basiq userID in databse
        database.update_user_basiq_id(result["user_id"], basiq_user["id"])

        print(f" Created Basiq User: {basiq_user['id']}")

    except Exception as e:
        print(f"⚠️ Failed to create Basiq user: {e}")
        # You might want to delete the app user or handle this error
        # For now, we'll continue without Basiq user

    # Return Success otherwise

    return {
            "success": True,
            "message": "User created successfully",
            "user": {
                "id": str(result["user_id"]),         # Convert number to string
                "email": result["email"],
                "firstName": result["first_name"],
                "lastName": result["last_name"]
            },
            "token": f"jwt_token_{result['user_id']}"  # Create simple token
    }            
    # Gets sent to frotnend via return

# New function to create Basiq user
async def create_basiq_user(email: str, firstName: str, lastName: str):
    basiq_api_key = os.getenv("BASIQ_API_KEY")
    
    if not basiq_api_key:
        raise Exception("Basiq API key not configured")
    
    # Use the same format as your working code
    auth_string = basiq_api_key
       
    # First get a SERVER_ACCESS token - COPY YOUR WORKING HEADERS
    token_response = requests.post(
        "https://au-api.basiq.io/token",
        headers={
            "accept": "application/json",
            "content-type": "application/x-www-form-urlencoded",  # CHANGE THIS!
            "Authorization": f"Basic {auth_string}",
            "basiq-version": "3.0"  # ADD THIS!
        },
        data={  # CHANGE FROM json= TO data=
            "scope": "SERVER_ACCESS"
        }
    )
    
    if token_response.status_code != 200:
        print(f"❌ Server token error: {token_response.status_code} - {token_response.text}")
        raise Exception("Failed to get Basiq server token")
    
    server_token = token_response.json()["access_token"]
    print(f"✅ Got server token")
    
    # Now create the Basiq user
    user_response = requests.post(
        "https://au-api.basiq.io/users",
        headers={
            "accept": "application/json",
            "content-type": "application/json",
            "authorization": f"Bearer {server_token}",
            "basiq-version": "3.0"  # ADD THIS HERE TOO
        },
        json={
            "email": email,
            "firstName": firstName,
            "lastName": lastName
        }
    )
    
    if user_response.status_code != 201:
        print(f"❌ User creation error: {user_response.status_code} - {user_response.text}")
        raise Exception(f"Failed to create Basiq user: {user_response.text}")
    
    print(f"✅ Created Basiq user successfully")
    return user_response.json()# Login endpoint

@app.post("/api/auth/login")
async def login(credentials: LoginRequest): # credentials is auto validated by LoginRequest method in model
    
    print(f"login lodged {credentials.email}")

    # call DB functions
    result = database.verify_user(credentials.email, credentials.password) # Checks if the email/pass fits

    if "error" in result:
        # wrong password or user not found
        print(f"login failed: {result['error']}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
        # 401: Unauthorised to frontend

    # Return success otherwise
    print(f"user {credentials.email} logged in success")

    return {
        "success": True,
        "message": "Login successful",
        "user": {
            "id": str(result["user_id"]),
            "email": result["email"],
            "firstName": result["first_name"],
            "lastName": result["last_name"]
        },
        "token": f"jwt_token_{result['user_id']}"
    }

# Verification token validation to add later
@app.get("/api/auth/verify")
async def verify_token(authorization: Optional[str] = Header(None)):
    """
    Verify JWT token and return user data
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    # Extract token from "Bearer <token>" format
    try:
        token_parts = authorization.split(" ")
        if len(token_parts) != 2 or token_parts[0] != "Bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization format")
        
        token = token_parts[1]
        
        # For now, extract user_id from simple token format "jwt_token_{user_id}"
        # In production, you should use proper JWT validation
        if not token.startswith("jwt_token_"):
            raise HTTPException(status_code=401, detail="Invalid token format")
        
        user_id = token.replace("jwt_token_", "")
        
        # Get user data from database using the existing function
        user_data = database.get_user_by_id(user_id)
        
        if "error" in user_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Return user data in the format the frontend expects
        # Note: database.get_user_by_id returns different keys than what we need
        return {
            "valid": True,
            "user": {
                "id": str(user_data["id"]),  # Changed from "user_id" to "id"
                "email": user_data["email"],
                "firstName": user_data["first_name"],
                "lastName": user_data["last_name"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Token verification error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")


# ==================================================== #
#                  Debugging Endpoints                 #
# ==================================================== #

@app.get("/api/debug/users")
async def get_all_users():
    result = database.get_all_users()
    
    return {
        "user total": result["total"],
        "users": result["users"]
    }

# ==================================================== #
#                  Basiq Endpoint                      #
# ==================================================== #

@app.post("/api/basiq/save-connection")
async def save_basiq_connection(connection_data: BasiqConnectionReq):
    """Save bank connection details after successful Basiq connection"""
    try:
        print(f"Saving connection for user: {connection_data.userId}")
        
        # Save to database
        result = database.save_basiq_connection(
            user_id=int(connection_data.userId),
            basiq_user_id=connection_data.basiqUserId,
            institution_name=connection_data.institutionName,
            account_ids=connection_data.accountIds
        )
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return {
            "success": True,
            "message": "Connection saved successfully"
        }
        
    except Exception as e:
        print(f"Error saving connection: {e}")
        raise HTTPException(status_code=500, detail="Failed to save connection")


@app.get("/api/basiq/check-connection/{user_id}")
async def check_user_connection(user_id: str):
    """Check if user has active Basiq connections"""
    try:
        # Get user connections from database
        connections = database.get_user_basiq_connections(int(user_id))
        
        if "error" in connections:
            raise HTTPException(status_code=500, detail=connections["error"])
        
        has_connections = len(connections.get("connections", [])) > 0
        
        return {
            "has_connections": has_connections,
            "connections": connections.get("connections", []),
            "connection_count": len(connections.get("connections", []))
        }
        
    except Exception as e:
        print(f"Error checking connections: {e}")
        raise HTTPException(status_code=500, detail="Failed to check connections")

# ==================================================== #
#                  Client Endpoint                     #
# ==================================================== #

@app.get("/api/client-token")
async def get_client_token(userId: str):
    try:
        user_data = database.get_user_by_id(userId)

        if "error" in user_data:
            raise HTTPException(status_code=404, detail="User not found")
            
        basiq_user_id = user_data.get("basiq_user_id")

        if not basiq_user_id:
            raise HTTPException(status_code=400, detail="User has no Basiq account")
        
        basiq_api_key = os.getenv("BASIQ_API_KEY")
        auth_string = basiq_api_key
                
        response = requests.post(
            "https://au-api.basiq.io/token",
            headers={
                "accept": "application/json",
                "content-type": "application/x-www-form-urlencoded",
                "Authorization": f"Basic {auth_string}",
                "basiq-version": "3.0"
            },
            data={  # CHANGE FROM json= TO data=
                "scope": "CLIENT_ACCESS",
                "userId": basiq_user_id
            }
        )
        
        if response.status_code != 200:
            print(f"Token generation error: {response.text}")
            raise HTTPException(status_code=500, detail="Failed to get Basiq token")
        
        token_data = response.json()
        
        return {
            "access_token": token_data["access_token"],
            "basiq_user_id": basiq_user_id
        }
        
    except Exception as e:
        print(f"Error getting Basiq token: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate client token")
