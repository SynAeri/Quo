# Handling API endpoints + Quo setup

from fastapi import FastAPI, HTTPException # FastAPI: Framework, Exception: error responses for frontend

from fastapi.middleware.cors import CORSMiddleware
from pydantic.version import version_info # Basic communication

# Import modules from other files
import config
import database
from models import SignupRequest, LoginRequest, BasiqConnectionReq 

# Quo initialisation
app = FastAPI(title=config.API_TITLE, version=config.API_VERSION) # Better than hardcoding, incase future edits refer to config.py

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

    database.init_database # referencing a method from database
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

# Login endpoint
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
async def verify_token():
    pass

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
async def saveBasiqConnection(connection_data: BasiqConnectionReq):
    # Saves bank connections when implementing Basiq
    print(f"saving.. {connection_data.userID}")
    return {"success"}
