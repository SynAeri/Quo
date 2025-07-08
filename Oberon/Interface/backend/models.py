# defines structure of data through the API for signup login requests etc


from pydantic import BaseModel
from pydantic_core.core_schema import str_schema # for checking data types



# ==================================================== #
#                  Request-type models                 #
# ==================================================== #

class SignupRequest(BaseModel):
    # defines what data is required when signing up
    
    email: str
    password: str
    firstName: str
    lastName: str

    # Process:
    # Frontend sends {email:, password:}
    # Validation passes if it meets above criteria str
    # otherwise returns error

class LoginRequest(BaseModel):
    # defines what is required for login
    email: str
    password: str

    # Same as signup request
    # Returns same error if not as above


# ==================================================== #
#                  Response-type model                 #
# ==================================================== #

class userResponse(BaseModel):
    # defins user data structure for authentication
    # used both by login + signup endpoints
    
    id: str # Unique ID for user 
    email: str 
    firstName: str 
    lastName: str 

    # Will show:
    # {
    # "id": "x",
    # "email": "xx@gmail",
    # etc
    # }

class AuthResponse(BaseModel):
    # defines complete response for authentication
    
    success: bool # Outcome if operation success
    message: str # readable outcome like success etc
    user: userResponse
    token: str

# ==================================================== #
#                  BASIQ MODELS                        #
# ==================================================== #

class BasiqConnectionReq(BaseModel):
    # defines structure for bank connection
    
    userID: str #Quo user ID
    basiqUserID: str #Basiq id
    institutionName: str # Bank names
    accountIDs: list # connected account ids
    

