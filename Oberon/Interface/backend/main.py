# Handling API endpoints + Quo setup
# ToDo: split sections in files for better code management since code size > 2000 LOC
# ToDo: Manage the calculation code and re-arrange them into files such as models.py
# ToDo: Refactor entire codebase with extra comments and file purpose to increase visiblity 

from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, Header # FastAPI: Framework, Exception: error responses for frontend

from fastapi.middleware.cors import CORSMiddleware

from pydantic.version import version_info # Basic communication

from typing import Optional


# analysis imports
from analysis.globals.users import User, UserManager
# from analysis.transactionAnalysis.graphs import Graphs
from analysis.globals.transactions import *
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import hashlib


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

@app.get("/api/debug/test-category-grouper")
async def test_category_grouper():
    """Test the CategoryGrouper with sample data"""
    try:
        from analysis.transactionAnalysis.deepAnalysis.categoryGrouper import CategoryGrouper
        
        # Test data matching your screenshot
        test_categories = [
            {"name": "Cafes, Restaurants and Takeaway Food Services", "amount": 2450},
            {"name": "Department Stores", "amount": 1641},
            {"name": "Fuel Retailing", "amount": 1312},
            {"name": "Health and General Insurance", "amount": 1072},
            {"name": "Electricity Distribution", "amount": 840},
            {"name": "Supermarket and Grocery Stores", "amount": 11818}
        ]
        
        grouper = CategoryGrouper()
        result = grouper.group_categories(test_categories)
        
        # Convert to array format
        grouped_array = []
        for group_name, group_data in result.items():
            grouped_array.append({
                'name': group_name,
                'total': group_data['total'],
                'percentage': group_data['percentage'],
                'categories': group_data['subcategories']
            })
        
        return {
            "success": True,
            "input_categories": len(test_categories),
            "output_groups": len(grouped_array),
            "grouped_data": grouped_array,
            "raw_result": result
        }
        
    except Exception as e:
        import traceback
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
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

# ==================================================== #
#                  Analysis Endpoin                    #
# ==================================================== #

@app.get("/api/analysis/deepAnalysis.subscriptionDetectorspendingByCategory/{user_id}")
async def getSpendByCat(user_id: str):
    # use graph representing spend analysis

    """ 
    Goal:
    get current user instance 
    collate transaction data 
    Create graph via frontend 
    """ 

        # user creation
    try:
        user_data = database.get_user_by_id(user_id)

        if "error" in user_data:
            raise HTTPException(status_code=404, detail="User not found")
        
        basiq_user_id = user_data.get("basiq_user_id")

        if not basiq_user_id:
            print(f"User {user_id} has no Basiq ID")
            return {
                "categories": [],
                "total": 0,
                "highest": {
                    "category": "No data",
                    "amount": 0
                },
                "message": "No bank account connected"
            }

        print(f"DEBUG Getting spending analysis for user {user_id} with Basiq ID: {basiq_user_id}")

        # Create user instance with the Basiq user ID
        user = User(basiq_user_id, filter_transfer=True, filter_loans=True)
     
        
        # Check if transactions were fetched successfully
        if isinstance(user.transactions, str):  # Error case
            print(f"Failed to fetch transactions: {user.transactions}")
            return {
                "categories": [],
                "total": 0,
                "highest": {
                    "category": "No data",
                    "amount": 0
                },
                "message": "Unable to fetch transaction data"
            }

        # Get all transactions
        allTransactions = user.get_transaction_group()
        
        # Get category totals
        categories, amounts = allTransactions.category_total_points()
        
        print(f"Categories found: {len(categories)}")

        # Handle empty data
        if not categories or not amounts:
            return {
                "categories": [],
                "total": 0,
                "highest": {
                    "category": "No data",
                    "amount": 0
                },
                "message": "No transactions found"
            }
        
        # Calculate totals
        total = sum(amounts)
        max_amount = max(amounts)
        max_index = amounts.index(max_amount)
        
        # Return format for recharts
        return {
            "categories": [
                {"name": cat, "amount": amt}
                for cat, amt in zip(categories, amounts)
            ],
            "total": total,
            "highest": {
                "category": categories[max_index],
                "amount": max_amount
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in spending analysis: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to get spending analysis: {str(e)}")


# Deep Analysis
@app.get("/api/analysis/enhancedSpendingByCategory/{user_id}")
async def getEnhancedSpendByCat(user_id: str):
    """
    Get enhanced spending analysis with subcategories for unknown/broad categories
    """
    try:
        # Get user's Basiq ID
        user_data = database.get_user_by_id(user_id)
        
        if "error" in user_data:
            raise HTTPException(status_code=404, detail="User not found")
        
        basiq_user_id = user_data.get("basiq_user_id")
        
        if not basiq_user_id:
            return {
                "categories": [],
                "enhanced_categories": {},
                "total": 0,
                "message": "No bank account connected"
            }
        
        # Create user instance
        user = User(basiq_user_id, filter_transfer=True, filter_loans=True)
        
        if isinstance(user.transactions, str):
            return {
                "categories": [],
                "enhanced_categories": {},
                "total": 0,
                "message": "Unable to fetch transaction data"
            }
        
        # Standard analysis
        allTransactions = user.get_transaction_group()
        categories, amounts = allTransactions.category_total_points()
        
        # Enhanced analysis
        from analysis.transactionAnalysis.deepAnalysis.categoryAssigner import EnhancedTransactionAnalysis
        enhanced_analyzer = EnhancedTransactionAnalysis(user.transactions)
        enhanced_data = enhanced_analyzer.get_enhanced_category_analysis()
        
        # Format response
        total = sum(amounts) if amounts else 0
        
        # Prepare enhanced categories (ones that have subcategories)
        enhanced_categories = {}
        for cat, data in enhanced_data.items():
            if data['subcategories']:
                enhanced_categories[cat] = {
                    'total': data['total'],
                    'count': data['transaction_count'],
                    'subcategories': [
                        {
                            'name': subcat,
                            'amount': subdata['amount'],
                            'count': subdata['count']
                        }
                        for subcat, subdata in data['subcategories'].items()
                    ]
                }
        
        return {
            "categories": [
                {"name": cat, "amount": amt}
                for cat, amt in zip(categories, amounts)
            ],
            "enhanced_categories": enhanced_categories,
            "total": total,
            "insights": {
                "unknown_ratio": enhanced_data.get('Unknown', {}).get('total', 0) / total if total > 0 else 0,
                "categories_with_subcategories": list(enhanced_categories.keys())
            }
        }
        
    except Exception as e:
        print(f"Error in enhanced spending analysis: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))



# In your main.py, update the getGroupedSpendingByPeriod endpoint:
# Remove the redirect to getSpendingByAccount and handle account filtering within this endpoint

@app.get("/api/analysis/groupedSpendingByPeriod/{user_id}")
async def getGroupedSpendingByPeriod(
    user_id: str, 
    period: str = "month",
    group_categories: bool = True,
    account_id: Optional[str] = None
):
    """
    Get spending analysis with AI-grouped categories
    """
    try:
        print(f"=== Starting grouped spending analysis ===")
        print(f"User ID: {user_id}, Period: {period}, Group: {group_categories}, Account: {account_id}")
        
        # IMPORTANT: Comment out or remove this redirect
        # if account_id:
        #     return await getSpendingByAccount(user_id, account_id, period)
        
        # Get user's Basiq ID
        user_data = database.get_user_by_id(user_id)
        
        if "error" in user_data:
            raise HTTPException(status_code=404, detail="User not found")
        
        basiq_user_id = user_data.get("basiq_user_id")
        
        if not basiq_user_id:
            return {
                "categories": [],
                "grouped_categories": [],
                "total": 0,
                "period": period,
                "message": "No bank account connected"
            }
        
        # Handle account-specific filtering
        
        if account_id:
            print(f"=====CHECKING ACCOUNT ID ==== {account_id}")
            # Fetch account-specific transactions from Basiq
            
            # Get Basiq token
            basiq_api_key = os.getenv("BASIQ_API_KEY")
            auth_string = basiq_api_key
            
            token_response = requests.post(
                "https://au-api.basiq.io/token",
                headers={
                    "accept": "application/json",
                    "content-type": "application/x-www-form-urlencoded",
                    "Authorization": f"Basic {auth_string}",
                    "basiq-version": "3.0"
                },
                data={"scope": "SERVER_ACCESS"}
            )
            
            if token_response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to get Basiq token")
            
            server_token = token_response.json()["access_token"]
            
            # Fetch transactions for specific account
            transactions_url = f"https://au-api.basiq.io/users/{basiq_user_id}/transactions?filter=account.id.eq('{account_id}')"
            
            # No params needed since filter is in the URL
            print(f"=== BASIQ API REQUEST ===")
            print(f"URL: {transactions_url}")
            print(f"Requesting transactions for account: {account_id}")
            
            transactions_response = requests.get(
                transactions_url,
                headers={
                    "Authorization": f"Bearer {server_token}",
                    "Accept": "application/json",
                    "basiq-version": "3.0"
                }
                # No params parameter needed
            )
            
            if transactions_response.status_code != 200:
                print(f"❌ Basiq API Error: {transactions_response.status_code}")
                print(f"Response: {transactions_response.text}")
                raise HTTPException(status_code=500, detail="Failed to fetch transactions")
            
            transactions_data = transactions_response.json()
            raw_transactions = transactions_data.get("data", [])

            print(f"=== ACCOUNT FILTERING DEBUG ===")
            print(f"Account ID: {account_id}")
            print(f"Total raw transactions from Basiq: {len(raw_transactions)}")
            
            # Check if transactions are actually from the requested account
            account_ids_in_response = set()
            for tx in raw_transactions[:10]:  # Check first 10 transactions
                tx_account_id = tx.get("account", {}).get("id") if isinstance(tx.get("account"), dict) else tx.get("account")
                account_ids_in_response.add(tx_account_id)
                print(f"  Transaction: {tx.get('description', 'N/A')[:30]} | Account: {tx_account_id}")

            if len(account_ids_in_response) == 1 and account_id in account_ids_in_response:
                print(f"✅ Filter working correctly - all transactions from account: {account_id}")
            else:
                print(f"⚠️ Filter issue - found accounts: {account_ids_in_response}")
            print(f"==============================")

            print(f"Unique account IDs in response: {account_ids_in_response}")
            print(f"All transactions from requested account? {account_ids_in_response == {account_id}}")
            print(f"==============================")

            # Convert Basiq transactions to Transaction objects
            from analysis.globals.transactions import Transaction
            from datetime import datetime
            
            filtered_transactions = []
            for tx in raw_transactions:

                # Only include expenses
                if float(tx.get("amount", 0)) < 0:
                    tx_date_str = tx.get("postDate") or tx.get("transactionDate")
                    
                    # Fix: Check if it's already a datetime object
                    if isinstance(tx_date_str, datetime):
                        tx_date = tx_date_str
                    elif isinstance(tx_date_str, str):
                        tx_date = datetime.strptime(tx_date_str[:10], "%Y-%m-%d")
                    else:
                        tx_date = datetime.now()
                    
                    # Apply period filter
                    now = datetime.now()
                    include_tx = False
                    
                    if period == "month":
                        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                        include_tx = tx_date >= start_of_month
                    elif period == "year":
                        start_of_year = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
                        include_tx = tx_date >= start_of_year
                    else:  # "all"
                        include_tx = True
                    
                    if include_tx:
                        # Extract category
                        category_name = "Uncategorized"
                        
                        # Try enriched data
                        enrich = tx.get("enrich", {})
                        if enrich:
                            category_data = enrich.get("category", {})
                            if category_data:
                                anzsic = category_data.get("anzsic", {})
                                if anzsic:
                                    class_data = anzsic.get("class", {})
                                    if class_data:
                                        category_name = class_data.get("title", "Uncategorized")
                        
                        # Fallback to subClass
                        if category_name == "Uncategorized":
                            subclass_obj = tx.get("subClass", {})
                            if subclass_obj:
                                category_name = subclass_obj.get("title", "Uncategorized")
                        
                        trans_obj = Transaction(
                            description=tx.get("description", ""),  # First parameter
                            category=category_name,                  # Second parameter
                            date=tx_date.strftime('%Y-%m-%dT%H:%M:%SZ'),  # Third parameter (as string!)
                            amount=abs(float(tx.get("amount", 0))),  # Fourth parameter
                            mode="expense"                           # Fifth parameter
                        )

                        filtered_transactions.append(trans_obj)
            print(f"Filtered transactions (after date/expense filter): {len(filtered_transactions)}")
            print(f"==============================")
            # Get account name
            account_name = account_id
            try:
                account_response = requests.get(
                    f"https://au-api.basiq.io/users/{basiq_user_id}/accounts/{account_id}",
                    headers={
                        "Authorization": f"Bearer {server_token}",
                        "Accept": "application/json",
                        "basiq-version": "3.0"
                    }
                )
                if account_response.status_code == 200:
                    account_data = account_response.json()
                    account_name = account_data.get("name", account_id)
            except:
                pass
            
            period_label = f"{now.strftime('%B %Y')}" if period == "month" else str(now.year) if period == "year" else "All Time"
            
        else:
            # Use existing logic for all accounts
            user = User(basiq_user_id, filter_transfer=True, filter_loans=True)
            
            if isinstance(user.transactions, str):
                return {
                    "categories": [],
                    "grouped_categories": [],
                    "total": 0,
                    "period": period,
                    "message": "Unable to fetch transaction data"
                }
            
            # Filter transactions by date
            from datetime import datetime, timedelta
            now = datetime.now()
            
            if period == "month":
                start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                filtered_transactions = [
                    tx for tx in user.transactions 
                    if tx.date >= start_of_month
                ]
                period_label = f"{now.strftime('%B %Y')}"
            elif period == "year":
                start_of_year = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
                filtered_transactions = [
                    tx for tx in user.transactions 
                    if tx.date >= start_of_year
                ]
                period_label = f"{now.year}"
            else:  # "all"
                filtered_transactions = user.transactions
                period_label = "All Time"
            
            account_name = None
        
        print(f"Filtered transactions count: {len(filtered_transactions)}")
        
        # Standard analysis
        from analysis.globals.transactions import AllTransactions
        filtered_group = AllTransactions(filtered_transactions)
        categories, amounts = filtered_group.category_total_points()
        
        print(f"Categories found: {len(categories)}")
        
        if not categories:
            return {
                "categories": [],
                "grouped_categories": [],
                "enhanced_categories": {},
                "total": 0,
                "period": period,
                "period_label": period_label,
                "num_transactions": 0,
                "account_name": account_name,
                "message": f"No transactions found for {period_label}"
            }
        
        # Prepare category data
        category_data = [
            {"name": cat, "amount": amt}
            for cat, amt in zip(categories, amounts)
        ]
        
        total_spending = sum(amounts)
        
        # Group categories if requested
        grouped_categories_array = []
        category_insights = {}
        
        if group_categories:
            try:
                print("Attempting to group categories...")
                
                from analysis.transactionAnalysis.deepAnalysis.categoryGrouper import CategoryGrouper
                grouper = CategoryGrouper()
                
                print(f"Grouping {len(category_data)} categories")
                grouped_dict = grouper.group_categories(category_data)
                
                print(f"group_categories returned type: {type(grouped_dict)}")
                print(f"Grouped into {len(grouped_dict)} groups")
                
                # Convert to array format
                for group_name, group_info in grouped_dict.items():
                    grouped_categories_array.append({
                        'name': group_name,
                        'total': group_info['total'],
                        'percentage': group_info['percentage'],
                        'categories': group_info['subcategories']
                    })
                
                # Sort by total descending
                grouped_categories_array.sort(key=lambda x: x['total'], reverse=True)
                
                # Get category insights
                if hasattr(grouper, 'get_category_insights'):
                    category_insights = grouper.get_category_insights(grouped_dict)
                
                print(f"Created {len(grouped_categories_array)} groups")
                
            except Exception as e:
                print(f"Error in category grouping: {e}")
                import traceback
                traceback.print_exc()
                grouped_categories_array = []
        
        # Enhanced analysis for unknown categories
        enhanced_categories = {}
        try:
            from analysis.transactionAnalysis.deepAnalysis.categoryAssigner import EnhancedTransactionAnalysis
            
            special_categories = ['unknown', 'uncategorized', 'other', 'no category']
            
            for cat_name in categories:
                if cat_name.lower() in special_categories:
                    cat_transactions = [
                        tx for tx in filtered_transactions 
                        if tx.category.lower() == cat_name.lower()
                    ]
                    
                    if cat_transactions:
                        analyzer = EnhancedTransactionAnalysis(cat_transactions)
                        unknown_analysis = analyzer.analyze_unknown_transactions()
                        
                        subcats = []
                        for subcat_name, subcat_txs in unknown_analysis.items():
                            subcats.append({
                                'name': subcat_name,
                                'amount': sum(tx.amount for tx in subcat_txs),
                                'count': len(subcat_txs)
                            })
                        
                        if subcats:
                            enhanced_categories[cat_name] = {
                                'total': sum(tx.amount for tx in cat_transactions),
                                'count': len(cat_transactions),
                                'subcategories': sorted(subcats, key=lambda x: x['amount'], reverse=True)
                            }
        except Exception as e:
            print(f"Enhanced analysis error: {e}")
        
        # Calculate monthly stats
        from collections import defaultdict
        monthly_totals = defaultdict(float)
        for tx in filtered_transactions:
            month_key = tx.date.strftime('%Y-%m')
            monthly_totals[month_key] += tx.amount
        
        num_months = len(monthly_totals) if monthly_totals else 1
        avg_monthly = total_spending / num_months if num_months > 0 else 0
        
        response = {
            "categories": category_data,
            "grouped_categories": grouped_categories_array,
            "enhanced_categories": enhanced_categories,
            "total": total_spending,
            "period": period,
            "period_label": period_label,
            "average_monthly": avg_monthly,
            "num_transactions": len(filtered_transactions),
            "account_name": account_name,
            "insights": {
                "category_insights": category_insights,
                "num_months": num_months,
                "total_categories": len(categories),
                "total_groups": len(grouped_categories_array),
                "has_uncategorized": any(cat.lower() in ['unknown', 'uncategorized', 'other', 'no category'] for cat in categories) if categories else False
            }
        }
        
        print(f"=== Returning response with {len(grouped_categories_array)} groups ===")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in grouped spending analysis: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ==================================================== #
#                  Account Management                  #
# ==================================================== #

@app.get("/api/accounts/{user_id}")
async def get_user_accounts(user_id: str):
    """Get all bank accounts for a user"""
    try:
        print(f"Fetching accounts for user: {user_id}")
        
        # First, get user data to ensure user exists and has basiq_user_id
        user_data = database.get_user_by_id(user_id)
        
        # Handle different return types from database
        if user_data is None:
            print(f"User {user_id} not found")
            raise HTTPException(status_code=404, detail="User not found")
        
        if isinstance(user_data, str):
            print(f"Database returned string error: {user_data}")
            raise HTTPException(status_code=404, detail="User not found")
            
        if isinstance(user_data, dict) and "error" in user_data:
            print(f"Database returned error dict: {user_data['error']}")
            raise HTTPException(status_code=404, detail=user_data["error"])
        
        # Safely get basiq_user_id
        basiq_user_id = None
        if isinstance(user_data, dict):
            basiq_user_id = user_data.get("basiq_user_id")
        
        if not basiq_user_id:
            print(f"User {user_id} has no Basiq account")
            return {
                "accounts": [],
                "message": "No Basiq account connected",
                "defaultAccountId": None
            }
        
        # Get user's connections from database
        connections_result = database.get_user_basiq_connections(int(user_id))
        
        # Handle different return types for connections
        if connections_result is None:
            connections_list = []
        elif isinstance(connections_result, str):
            print(f"Connections query returned string: {connections_result}")
            connections_list = []
        elif isinstance(connections_result, dict):
            if "error" in connections_result:
                print(f"Connections error: {connections_result['error']}")
                connections_list = []
            else:
                connections_list = connections_result.get("connections", [])
        else:
            connections_list = []
        
        # Get Basiq API key
        basiq_api_key = os.getenv("BASIQ_API_KEY")
        if not basiq_api_key:
            raise HTTPException(status_code=500, detail="Basiq API key not configured")
            
        auth_string = basiq_api_key
        
        # Get server token
        print("Getting Basiq server token...")
        token_response = requests.post(
            "https://au-api.basiq.io/token",
            headers={
                "accept": "application/json",
                "content-type": "application/x-www-form-urlencoded",
                "Authorization": f"Basic {auth_string}",
                "basiq-version": "3.0"
            },
            data={"scope": "SERVER_ACCESS"}
        )
        
        if token_response.status_code != 200:
            print(f"Failed to get Basiq token: {token_response.status_code} - {token_response.text}")
            raise HTTPException(status_code=500, detail="Failed to get Basiq token")
        
        server_token = token_response.json()["access_token"]
        
        # Get accounts from Basiq
        print(f"Fetching accounts from Basiq for user: {basiq_user_id}")
        accounts_response = requests.get(
            f"https://au-api.basiq.io/users/{basiq_user_id}/accounts",
            headers={
                "accept": "application/json",
                "authorization": f"Bearer {server_token}",
                "basiq-version": "3.0"
            }
        )
        
        print(f"Basiq accounts response status: {accounts_response.status_code}")
        
        if accounts_response.status_code != 200:
            print(f"Failed to fetch accounts from Basiq: {accounts_response.text}")
            # Return empty accounts list instead of failing
            return {
                "accounts": [],
                "message": "Unable to fetch accounts from Basiq",
                "defaultAccountId": None
            }
        
        # Parse the response
        try:
            accounts_data = accounts_response.json()
            print(f"Basiq response structure: {accounts_data.keys() if isinstance(accounts_data, dict) else type(accounts_data)}")
            
            # Basiq API typically returns data in a 'data' field
            accounts_list = accounts_data.get("data", [])
            print(f"Found {len(accounts_list)} accounts from Basiq")
            
            # Debug: print first account structure if available
            if accounts_list and len(accounts_list) > 0:
                print(f"First account keys: {accounts_list[0].keys()}")
                
        except Exception as e:
            print(f"Error parsing Basiq response: {e}")
            print(f"Raw response: {accounts_response.text[:500]}")  # First 500 chars
            return {
                "accounts": [],
                "message": "Error parsing account data",
                "defaultAccountId": None
            }
        
        # Format accounts for frontend
        formatted_accounts = []
        for account in accounts_list:
            try:
                # Debug the account structure
                print(f"Processing account: {account.get('id', 'no-id')}")
                
                # Extract account details - adjust field names based on actual Basiq response
                account_data = {
                    "id": account.get("id", ""),
                    "name": account.get("name") or account.get("accountName") or "Unknown Account",
                    "accountNo": account.get("accountNo") or account.get("accountNumber") or "****",
                    "balance": float(account.get("balance", 0)),
                    "availableBalance": float(account.get("availableBalance") or account.get("available", 0)),
                    "accountType": account.get("type") or account.get("class", {}).get("type", "Unknown"),
                    "institution": "",  # Will be filled below
                    "status": account.get("status", "active"),
                    "lastUpdated": account.get("lastUpdated") or account.get("lastRefreshed", "")
                }
                
                # Handle institution data (might be nested)
                institution = account.get("institution", {})
                if isinstance(institution, dict):
                    account_data["institution"] = institution.get("name", "Unknown Bank")
                elif isinstance(institution, str):
                    account_data["institution"] = institution
                else:
                    # Try to get institution from connection
                    connection = account.get("connection", {})
                    if isinstance(connection, dict):
                        inst = connection.get("institution", {})
                        if isinstance(inst, dict):
                            account_data["institution"] = inst.get("name", "Unknown Bank")
                
                # Only include active accounts or if status field doesn't exist
                if account.get("status", "active") != "closed":
                    formatted_accounts.append(account_data)
                    
            except Exception as e:
                print(f"Error formatting account {account.get('id', 'unknown')}: {e}")
                continue
        
        # Determine default account ID
        default_account_id = None
        if formatted_accounts:
            # Use the first account as default
            default_account_id = formatted_accounts[0]["id"]
            
            # Or use the first account ID from connections if available
            if connections_list and len(connections_list) > 0:
                first_connection = connections_list[0]
                if isinstance(first_connection, dict):
                    account_ids = first_connection.get("account_ids", [])
                    if account_ids and len(account_ids) > 0:
                        default_account_id = account_ids[0]
        
        print(f"Returning {len(formatted_accounts)} accounts")
        
        return {
            "accounts": formatted_accounts,
            "defaultAccountId": default_account_id,
            "message": "Success"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in get_user_accounts: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))



# Replace your spendingByAccount endpoint with this simpler version

@app.get("/api/analysis/spendingByAccount/{user_id}/{account_id}")
async def getSpendingByAccount(
    user_id: str, 
    account_id: str,
    period: str = "month"
):
    """Get spending analysis for a specific account using simple query parameter"""
    try:
        print(f"Getting spending for user {user_id}, account {account_id}, period {period}")
        
        user_data = database.get_user_by_id(user_id)
        
        if "error" in user_data:
            raise HTTPException(status_code=404, detail="User not found")
        
        basiq_user_id = user_data.get("basiq_user_id")
        
        if not basiq_user_id:
            return {
                "categories": [],
                "total": 0,
                "message": "No bank account connected"
            }
        
        # Get Basiq token
        basiq_api_key = os.getenv("BASIQ_API_KEY")
        auth_string = basiq_api_key
        
        token_response = requests.post(
            "https://au-api.basiq.io/token",
            headers={
                "accept": "application/json",
                "content-type": "application/x-www-form-urlencoded",
                "Authorization": f"Basic {auth_string}",
                "basiq-version": "3.0"
            },
            data={"scope": "SERVER_ACCESS"}
        )
        
        if token_response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to get Basiq token")
        
        server_token = token_response.json()["access_token"]
        
        # Set up the request URL
        transactions_url = f"https://au-api.basiq.io/users/{basiq_user_id}/transactions"
        
        # Simple query parameters
        params = {
            "limit": 500,
            "account.id": account_id  # Direct parameter instead of filter
        }
        
        print(f"Fetching from: {transactions_url}")
        print(f"With params: {params}")
        
        # Make the request
        transactions_response = requests.get(
            transactions_url,
            headers={
                "Authorization": f"Bearer {server_token}",
                "Accept": "application/json",
                "basiq-version": "3.0"
            },
            params=params
        )
        
        print(f"Basiq response status: {transactions_response.status_code}")
        
        if transactions_response.status_code != 200:
            print(f"Basiq error: {transactions_response.text}")
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to fetch transactions: {transactions_response.status_code}"
            )
        
        transactions_data = transactions_response.json()
        raw_transactions = transactions_data.get("data", [])
        
        print(f"Fetched {len(raw_transactions)} transactions for account {account_id}")
        
        # Apply date filtering in Python since we're not using the filter parameter
        from datetime import datetime, timedelta
        now = datetime.now()
        
        if period != "all":
            if period == "month":
                start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            elif period == "year":
                start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            else:
                start_date = now - timedelta(days=365)
            
            # Filter transactions by date
            filtered_transactions = []
            for tx in raw_transactions:
                tx_date_str = tx.get("postDate") or tx.get("transactionDate")
                if tx_date_str:
                    tx_date = datetime.strptime(tx_date_str[:10], "%Y-%m-%d")
                    if tx_date >= start_date:
                        filtered_transactions.append(tx)
            
            raw_transactions = filtered_transactions
            print(f"After date filtering: {len(raw_transactions)} transactions")
        
        if not raw_transactions:
            # Get account name for better UX
            account_name = "Unknown Account"
            try:
                account_response = requests.get(
                    f"https://au-api.basiq.io/users/{basiq_user_id}/accounts/{account_id}",
                    headers={
                        "Authorization": f"Bearer {server_token}",
                        "Accept": "application/json",
                        "basiq-version": "3.0"
                    }
                )
                if account_response.status_code == 200:
                    account_data = account_response.json()
                    account_name = account_data.get("name", "Unknown Account")
            except:
                pass
            
            return {
                "categories": [],
                "total": 0,
                "message": f"No transactions found for {account_name} in {period}",
                "account_id": account_id,
                "account_name": account_name,
                "transaction_count": 0,
                "period": period,
                "period_label": f"{now.strftime('%B %Y')}" if period == "month" else str(now.year) if period == "year" else "All Time"
            }
        
        # Process transactions by category
        from collections import defaultdict
        category_totals = defaultdict(float)
        
        # Debug: Let's see what the transaction data looks like
        if raw_transactions:
           # print(f"Sample transaction: {raw_transactions[0]}")
            print(f"Category field: {raw_transactions[0].get('category')}")
            print(f"SubClass field: {raw_transactions[0].get('subClass')}")
        
        for tx in raw_transactions:
            # Get transaction details
            amount = abs(float(tx.get("amount", 0)))
            
            # Get category - use the enriched data first
            category_name = "Uncategorized"  # Default
            
            # Try enriched category data first (most accurate)
            enrich = tx.get("enrich", {})
            if enrich and isinstance(enrich, dict):
                category_data = enrich.get("category", {})
                if category_data and isinstance(category_data, dict):
                    anzsic = category_data.get("anzsic", {})
                    if anzsic and isinstance(anzsic, dict):
                        # Try class first, then group, then subdivision
                        class_data = anzsic.get("class", {})
                        if class_data and isinstance(class_data, dict):
                            category_name = class_data.get("title", "Uncategorized")
                        elif anzsic.get("group", {}).get("title"):
                            category_name = anzsic["group"]["title"]
                        elif anzsic.get("subdivision", {}).get("title"):
                            category_name = anzsic["subdivision"]["title"]
            
            # If still uncategorized, try subClass
            if category_name == "Uncategorized":
                subclass_obj = tx.get("subClass", {})
                if subclass_obj and isinstance(subclass_obj, dict):
                    title = subclass_obj.get("title")
                    if title:
                        category_name = title
            
            # If still uncategorized, use class field with better names
            if category_name == "Uncategorized":
                class_name = tx.get("class")
                if class_name:
                    # Convert class to readable format
                    category_map = {
                        "bank-fee": "Bank Fees",
                        "payment": "General Payment",
                        "cash-withdrawal": "Cash Withdrawal",
                        "transfer": "Transfers",
                        "loan-interest": "Loan Interest",
                        "refund": "Refunds",
                        "direct-credit": "Income",
                        "interest": "Interest Earned",
                        "loan-repayment": "Loan Repayment"
                    }
                    category_name = category_map.get(class_name, class_name.replace("-", " ").title())
            
            # Debug first few transactions
            if len(category_totals) < 5:
               # print(f"TX: {tx.get('description')[:40]} | Cat: {category_name} | Amount: ${amount}")
                pass
            
            # Only count expenses (negative amounts)
            if float(tx.get("amount", 0)) < 0:
                category_totals[category_name] += amount
        
        # Convert to expected format
        category_data = [
            {"name": cat, "amount": amt}
            for cat, amt in category_totals.items()
        ]
        
        # Sort by amount
        category_data.sort(key=lambda x: x["amount"], reverse=True)
        
        # Apply grouping
        grouped_categories = {}
        grouped_categories_array = []  # Array format for frontend
        category_insights = {}
        try:
            from analysis.transactionAnalysis.deepAnalysis.categoryGrouper import CategoryGrouper
            grouper = CategoryGrouper()
            if category_data:  # Only group if we have categories
                grouped_categories = grouper.group_categories(category_data)
                # print(f"Grouped categories result: {grouped_categories}")
                
                # Convert grouped categories to array format for frontend
                if grouped_categories:
                    for group_name, categories in grouped_categories.items():
                        if isinstance(categories, list):
                            # Calculate total for this group
                            group_total = sum(cat.get('amount', 0) for cat in categories)
                            grouped_categories_array.append({
                                'name': group_name,
                                'total': group_total,
                                'percentage': (group_total / total_amount * 100) if total_amount > 0 else 0,
                                'categories': categories
                            })
                
                # Get insights if the grouper has this method
                if hasattr(grouper, 'get_category_insights'):
                    category_insights = grouper.get_category_insights(grouped_categories)
                    print(f"Category insights: {category_insights}")
        except Exception as e:
            print(f"Error grouping categories: {e}")
            import traceback
            traceback.print_exc()
        
        # Enhanced analysis for unknown categories
        enhanced_categories = {}
        try:
            # Convert Basiq transactions to Transaction objects for analysis
            from analysis.globals.transactions import Transaction
            from analysis.transactionAnalysis.deepAnalysis.categoryAssigner import EnhancedTransactionAnalysis
            
            special_categories = ['unknown', 'uncategorized', 'other', 'no category']
            
            for cat_name in category_totals.keys():
                if cat_name.lower() in special_categories:
                    # Get all transactions for this category
                    cat_transactions = []
                    for tx in raw_transactions:
                        # Extract category using the same logic
                        tx_cat = "Uncategorized"
                        
                        # Try enriched category data first
                        enrich = tx.get("enrich", {})
                        if enrich and isinstance(enrich, dict):
                            category_data = enrich.get("category", {})
                            if category_data and isinstance(category_data, dict):
                                anzsic = category_data.get("anzsic", {})
                                if anzsic and isinstance(anzsic, dict):
                                    class_data = anzsic.get("class", {})
                                    if class_data and isinstance(class_data, dict):
                                        tx_cat = class_data.get("title", "Uncategorized")
                                    elif anzsic.get("group", {}).get("title"):
                                        tx_cat = anzsic["group"]["title"]
                        
                        # Try subClass if still uncategorized
                        if tx_cat == "Uncategorized":
                            subclass_obj = tx.get("subClass", {})
                            if subclass_obj and isinstance(subclass_obj, dict):
                                title = subclass_obj.get("title")
                                if title:
                                    tx_cat = title
                        
                        # Use class field as last resort
                        if tx_cat == "Uncategorized":
                            class_name = tx.get("class")
                            if class_name:
                                category_map = {
                                    "bank-fee": "Bank Fees",
                                    "payment": "General Payment",
                                    "cash-withdrawal": "Cash Withdrawal",
                                    "transfer": "Transfers",
                                    "loan-interest": "Loan Interest",
                                    "refund": "Refunds",
                                    "direct-credit": "Income",
                                    "interest": "Interest Earned",
                                    "loan-repayment": "Loan Repayment"
                                }
                                tx_cat = category_map.get(class_name, class_name.replace("-", " ").title())
                        
                        if tx_cat.lower() == cat_name.lower() and float(tx.get("amount", 0)) < 0:
                            # Convert to Transaction object
                            tx_date_str = tx.get("postDate") or tx.get("transactionDate")
                            tx_date = datetime.strptime(tx_date_str[:10], "%Y-%m-%d") if tx_date_str else datetime.now()
                            
                            trans_obj = Transaction(
                                amount=abs(float(tx.get("amount", 0))),
                                date=tx_date,
                                description=tx.get("description", ""),
                                category=tx_cat,
                                mode="expense"  # Add the required mode parameter
                            )
                            cat_transactions.append(trans_obj)
                    
                    if cat_transactions:
                        analyzer = EnhancedTransactionAnalysis(cat_transactions)
                        unknown_analysis = analyzer.analyze_unknown_transactions()
                        
                        subcats = []
                        for subcat_name, subcat_txs in unknown_analysis.items():
                            subcats.append({
                                'name': subcat_name,
                                'amount': sum(tx.amount for tx in subcat_txs),
                                'count': len(subcat_txs)
                            })
                        
                        if subcats:
                            enhanced_categories[cat_name] = {
                                'total': sum(tx.amount for tx in cat_transactions),
                                'count': len(cat_transactions),
                                'subcategories': sorted(subcats, key=lambda x: x['amount'], reverse=True)
                            }
        except Exception as e:
            print(f"Enhanced analysis error: {e}")
        
        total_amount = sum(cat["amount"] for cat in category_data)
        
        # Get account name
        account_name = account_id  # Default
        try:
            account_response = requests.get(
                f"https://au-api.basiq.io/users/{basiq_user_id}/accounts/{account_id}",
                headers={
                    "Authorization": f"Bearer {server_token}",
                    "Accept": "application/json",
                    "basiq-version": "3.0"
                }
            )
            if account_response.status_code == 200:
                account_data = account_response.json()
                account_name = account_data.get("name", account_id)
        except:
            pass
        
        # Calculate monthly average
        num_months = 1
        if period == "year":
            num_months = 12
        elif period == "all" and raw_transactions:
            # Calculate based on date range
            dates = []
            for tx in raw_transactions:
                tx_date_str = tx.get("postDate") or tx.get("transactionDate")
                if tx_date_str:
                    dates.append(datetime.strptime(tx_date_str[:10], "%Y-%m-%d"))
            if dates:
                min_date = min(dates)
                max_date = max(dates)
                num_months = max(1, ((max_date.year - min_date.year) * 12 + max_date.month - min_date.month))
        
        avg_monthly = total_amount / num_months if num_months > 0 else total_amount
        
        return {
            "categories": category_data,
            "grouped_categories": grouped_categories_array,  # Use array format
            "enhanced_categories": enhanced_categories,
            "total": total_amount,
            "account_id": account_id,
            "account_name": account_name,
            "transaction_count": len(raw_transactions),
            "period": period,
            "period_label": f"{now.strftime('%B %Y')}" if period == "month" else str(now.year) if period == "year" else "All Time",
            "average_monthly": avg_monthly,
            "num_transactions": len(raw_transactions),
            "insights": {
                "total_categories": len(category_data),
                "has_uncategorized": any(cat["name"].lower() in ['unknown', 'uncategorized', 'other', 'no category', 'general payment'] for cat in category_data),
                "num_months": num_months,
                "category_insights": category_insights,
                "unknown_ratio": enhanced_categories.get('Uncategorized', {}).get('total', 0) / total_amount if total_amount > 0 and 'Uncategorized' in enhanced_categories else 0,
                "categories_with_subcategories": list(enhanced_categories.keys()) if enhanced_categories else []
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in account spending analysis: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

async def fallback_account_analysis(user_id: str, basiq_user_id: str, account_id: str, period: str):
    """Fallback method using the User class without account filtering"""
    try:
        # Use the existing analysis but note it's for all accounts
        from analysis.globals.users import User
        user = User(basiq_user_id, filter_transfer=True, filter_loans=True)
        
        # Get all transactions
        from datetime import datetime
        now = datetime.now()
        
        # Filter by period
        if period == "month":
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            filtered_transactions = [tx for tx in user.transactions if tx.date >= start_date]
        elif period == "year":
            start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            filtered_transactions = [tx for tx in user.transactions if tx.date >= start_date]
        else:
            filtered_transactions = user.transactions
        
        # Analyze
        from analysis.globals.transactions import AllTransactions
        transaction_group = AllTransactions(filtered_transactions)
        categories, amounts = transaction_group.category_total_points()
        
        category_data = [
            {"name": cat, "amount": amt}
            for cat, amt in zip(categories, amounts)
        ]
        
        # Group categories
        from analysis.transactionAnalysis.deepAnalysis.categoryGrouper import CategoryGrouper
        grouper = CategoryGrouper()
        grouped_categories = grouper.group_categories(category_data) if category_data else {}
        
        return {
            "categories": category_data,
            "grouped_categories": grouped_categories,
            "total": sum(amounts) if amounts else 0,
            "account_id": account_id,
            "transaction_count": len(filtered_transactions),
            "period": period,
            "period_label": f"{now.strftime('%B %Y')}" if period == "month" else str(now.year) if period == "year" else "All Time",
            "message": "Note: Showing all accounts combined (account filtering not available)",
            "insights": {
                "total_categories": len(categories),
                "has_uncategorized": "Unknown" in categories or "Uncategorized" in categories
            }
        }
        
    except Exception as e:
        print(f"Error in fallback analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================================================== #
#             Advanced Analysis Endpoints              #
# ==================================================== #

@app.get("/api/analysis/trends/{user_id}")
async def getSpendingTrends(
    user_id: str,
    months: int = 6,
    account_id: Optional[str] = None
):
    """Get spending trends over time with predictive insights"""
    try:
        user_data = database.get_user_by_id(user_id)
        
        if "error" in user_data:
            raise HTTPException(status_code=404, detail="User not found")
        
        basiq_user_id = user_data.get("basiq_user_id")
        
        if not basiq_user_id:
            return {"error": "No bank account connected"}
        
        # Create user instance
        user = User(basiq_user_id, filter_transfer=True, filter_loans=True)
        
        # Get all transactions (account filtering not supported in trends yet)
        transactions = user.transactions
        
        # Note: Account filtering would require fetching from Basiq API directly
        if account_id:
            print(f"Note: Account filtering not implemented in trends endpoint yet")
            # For now, show all transactions with a note
            pass
        
        # Group transactions by month
        from collections import defaultdict
        from datetime import datetime, timedelta
        from dateutil.relativedelta import relativedelta
        
        monthly_data = defaultdict(lambda: defaultdict(float))
        category_totals = defaultdict(float)
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - relativedelta(months=months)
        
        # Filter and group transactions
        for tx in transactions:
            if tx.date >= start_date:
                month_key = tx.date.strftime('%Y-%m')
                monthly_data[month_key][tx.category] += tx.amount
                category_totals[tx.category] += tx.amount
        
        # Sort months chronologically
        sorted_months = sorted(monthly_data.keys())
        
        # Prepare trend data
        trends = []
        for month in sorted_months:
            month_total = sum(monthly_data[month].values())
            trends.append({
                "month": month,
                "total": month_total,
                "categories": dict(monthly_data[month])
            })
        
        # Calculate statistics and predictions
        if len(trends) >= 3:
            try:
                # Try to import numpy for predictions
                import numpy as np
                
                # Simple linear regression for prediction
                x = np.array(range(len(trends)))
                y = np.array([t["total"] for t in trends])
                
                # Calculate trend line
                A = np.vstack([x, np.ones(len(x))]).T
                m, c = np.linalg.lstsq(A, y, rcond=None)[0]
                
                # Predict next month
                next_month_prediction = m * len(trends) + c
                
                # Calculate volatility (standard deviation)
                volatility = np.std(y)
                
                insights = {
                    "trend": "increasing" if m > 0 else "decreasing",
                    "average_monthly": np.mean(y),
                    "next_month_prediction": max(0, next_month_prediction),
                    "volatility": volatility,
                    "volatility_rating": "high" if volatility > np.mean(y) * 0.3 else "moderate" if volatility > np.mean(y) * 0.15 else "low",
                    "change_rate": m,
                    "months_analyzed": len(trends)
                }
            except ImportError as e:
                print(f"NumPy import error: {e}")
                # Fallback calculations without numpy
                totals = [t["total"] for t in trends]
                avg_monthly = sum(totals) / len(totals)
                
                # Simple trend detection
                first_half_avg = sum(totals[:len(totals)//2]) / (len(totals)//2)
                second_half_avg = sum(totals[len(totals)//2:]) / (len(totals) - len(totals)//2)
                
                insights = {
                    "trend": "increasing" if second_half_avg > first_half_avg else "decreasing",
                    "average_monthly": avg_monthly,
                    "next_month_prediction": avg_monthly,  # Simple prediction
                    "volatility": 0,
                    "volatility_rating": "unknown",
                    "change_rate": 0,
                    "months_analyzed": len(trends)
                }
        else:
            insights = {
                "message": "Not enough data for trend analysis",
                "months_analyzed": len(trends)
            }
        
        # Identify spending patterns
        patterns = []
        
        # Seasonal patterns
        if len(trends) >= 12:
            try:
                import numpy as np
                monthly_averages = defaultdict(list)
                for trend in trends:
                    month_num = int(trend["month"].split("-")[1])
                    monthly_averages[month_num].append(trend["total"])
                
                # Find high spending months
                avg_by_month = {k: np.mean(v) for k, v in monthly_averages.items()}
                overall_avg = np.mean(list(avg_by_month.values()))
                
                high_months = [k for k, v in avg_by_month.items() if v > overall_avg * 1.2]
                if high_months:
                    patterns.append({
                        "type": "seasonal",
                        "description": f"Higher spending typically in months: {high_months}"
                    })
            except ImportError:
                # Simple seasonal detection without numpy
                monthly_averages = defaultdict(list)
                for trend in trends:
                    month_num = int(trend["month"].split("-")[1])
                    monthly_averages[month_num].append(trend["total"])
                
                # Calculate averages manually
                avg_by_month = {}
                for k, v in monthly_averages.items():
                    avg_by_month[k] = sum(v) / len(v) if v else 0
                
                if avg_by_month:
                    overall_avg = sum(avg_by_month.values()) / len(avg_by_month)
                    high_months = [k for k, v in avg_by_month.items() if v > overall_avg * 1.2]
                    if high_months:
                        patterns.append({
                            "type": "seasonal",
                            "description": f"Higher spending typically in months: {high_months}"
                        })
        
        # Category growth patterns
        category_trends = defaultdict(list)
        for trend in trends:
            for cat, amount in trend["categories"].items():
                category_trends[cat].append(amount)
        
        growing_categories = []
        declining_categories = []
        
        for cat, amounts in category_trends.items():
            if len(amounts) >= 3:
                try:
                    import numpy as np
                    x = np.array(range(len(amounts)))
                    y = np.array(amounts)
                    A = np.vstack([x, np.ones(len(x))]).T
                    m, _ = np.linalg.lstsq(A, y, rcond=None)[0]
                    
                    if m > np.mean(amounts) * 0.1:  # Growing by more than 10% of average
                        growing_categories.append(cat)
                    elif m < -np.mean(amounts) * 0.1:  # Declining by more than 10% of average
                        declining_categories.append(cat)
                except ImportError:
                    # Simple trend detection without numpy
                    first_half = sum(amounts[:len(amounts)//2]) / (len(amounts)//2) if len(amounts)//2 > 0 else 0
                    second_half = sum(amounts[len(amounts)//2:]) / (len(amounts) - len(amounts)//2) if (len(amounts) - len(amounts)//2) > 0 else 0
                    avg = sum(amounts) / len(amounts) if amounts else 0
                    
                    if second_half > first_half * 1.1:  # Growing
                        growing_categories.append(cat)
                    elif second_half < first_half * 0.9:  # Declining
                        declining_categories.append(cat)
        
        if growing_categories:
            patterns.append({
                "type": "category_growth",
                "description": f"Increasing spending in: {', '.join(growing_categories[:3])}"
            })
        
        if declining_categories:
            patterns.append({
                "type": "category_decline",
                "description": f"Decreasing spending in: {', '.join(declining_categories[:3])}"
            })
        
        return {
            "trends": trends,
            "insights": insights,
            "patterns": patterns,
            "top_categories": sorted(
                [(cat, total) for cat, total in category_totals.items()],
                key=lambda x: x[1],
                reverse=True
            )[:5]
        }
        
    except Exception as e:
        print(f"Error in trend analysis: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analysis/savings-opportunities/{user_id}")
async def getSavingsOpportunities(user_id: str, account_id: Optional[str] = None):
    """Identify potential savings opportunities using AI analysis"""
    try:
        user_data = database.get_user_by_id(user_id)
        
        if "error" in user_data:
            raise HTTPException(status_code=404, detail="User not found")
        
        basiq_user_id = user_data.get("basiq_user_id")
        
        if not basiq_user_id:
            return {"opportunities": [], "total_savings_potential": 0}
        
        user = User(basiq_user_id, filter_transfer=True, filter_loans=True)
        
        # Get all transactions (account filtering not supported at transaction level)
        transactions = user.transactions
        
        # Note: If account_id is provided, we can't filter at this level
        # since the Transaction class doesn't have account_id
        if account_id:
            print(f"Note: Account-specific filtering not available for savings analysis")
        
        # Analyze last 3 months
        from datetime import datetime, timedelta
        from collections import defaultdict
        
        three_months_ago = datetime.now() - timedelta(days=90)
        recent_transactions = [tx for tx in transactions if tx.date >= three_months_ago]
        
        # Group by category and merchant
        category_spending = defaultdict(float)
        merchant_frequency = defaultdict(int)
        merchant_spending = defaultdict(float)
        subscription_candidates = []
        
        for tx in recent_transactions:
            category_spending[tx.category] += tx.amount
            merchant_frequency[tx.description] += 1
            merchant_spending[tx.description] += tx.amount
            
            # Identify potential subscriptions (recurring similar amounts)
            if 5 <= tx.amount <= 200:  # Typical subscription range
                subscription_candidates.append(tx)
        
        opportunities = []
        
        # 1. High frequency small purchases (e.g., daily coffee)
        for merchant, frequency in merchant_frequency.items():
            if frequency >= 10:  # More than 3 times a month average
                avg_amount = merchant_spending[merchant] / frequency
                if 2 <= avg_amount <= 20:  # Small purchase range
                    monthly_total = (frequency / 3) * avg_amount  # Average per month
                    opportunities.append({
                        "type": "high_frequency",
                        "category": "Reduce frequent small purchases",
                        "description": f"You spend ~${monthly_total:.0f}/month at {merchant[:30]}",
                        "suggestion": f"Reducing by 50% could save ${monthly_total * 0.5:.0f}/month",
                        "savings_potential": monthly_total * 0.5,
                        "difficulty": "easy"
                    })
        
        # 2. Category overspending (compared to typical budgets)
        typical_budget_percentages = {
            "eating out": 0.10,  # 10% of income
            "entertainment": 0.05,
            "shopping": 0.10,
            "groceries": 0.15
        }
        
        total_spending = sum(category_spending.values())
        
        for category, amount in category_spending.items():
            percentage = amount / total_spending if total_spending > 0 else 0
            
            for budget_cat, typical_pct in typical_budget_percentages.items():
                if budget_cat.lower() in category.lower() and percentage > typical_pct * 1.5:
                    monthly_amount = amount / 3  # 3 months of data
                    excess = monthly_amount - (total_spending / 3 * typical_pct)
                    
                    opportunities.append({
                        "type": "category_overspending",
                        "category": f"Reduce {category} spending",
                        "description": f"You spend {percentage*100:.0f}% on {category} (typical: {typical_pct*100:.0f}%)",
                        "suggestion": f"Reducing to typical levels could save ${excess:.0f}/month",
                        "savings_potential": excess,
                        "difficulty": "moderate"
                    })
        
        # 3. Subscription audit
        from analysis.transactionAnalysis.deepAnalysis.subscriptionDetector import SubscriptionDetector
        detector = SubscriptionDetector()
        detected_subscriptions = detector.detect_subscriptions(subscription_candidates)
        
        for sub in detected_subscriptions:
            opportunities.append({
                "type": "subscription",
                "category": "Review subscriptions",
                "description": f"Recurring charge: {sub['name']} - ${sub['amount']}/month",
                "suggestion": "Consider if this subscription is still needed",
                "savings_potential": sub['amount'],
                "difficulty": "easy"
            })
        
        # 4. Peak spending times
        time_based_spending = defaultdict(float)
        for tx in recent_transactions:
            hour = tx.date.hour
            if 22 <= hour or hour <= 4:  # Late night
                time_based_spending["late_night"] += tx.amount
            elif 6 <= hour <= 9:  # Morning
                time_based_spending["morning"] += tx.amount
        
        if time_based_spending["late_night"] > total_spending * 0.1:
            monthly_late_night = time_based_spending["late_night"] / 3
            opportunities.append({
                "type": "behavioral",
                "category": "Reduce late-night spending",
                "description": f"You spend ${monthly_late_night:.0f}/month between 10pm-4am",
                "suggestion": "Late-night purchases are often impulsive",
                "savings_potential": monthly_late_night * 0.7,
                "difficulty": "moderate"
            })
        
        # Sort by savings potential
        opportunities.sort(key=lambda x: x["savings_potential"], reverse=True)
        
        # Calculate total potential savings
        total_savings = sum(opp["savings_potential"] for opp in opportunities[:5])  # Top 5 realistic
        
        # Add note about account filtering if requested
        response = {
            "opportunities": opportunities[:10],  # Return top 10
            "total_savings_potential": total_savings,
            "analysis_period": "Last 3 months",
            "personalized_tips": generate_savings_tips(opportunities)
        }
        
        if account_id:
            response["note"] = "Analysis includes all accounts (account-specific filtering not available)"
        
        return response
        
    except Exception as e:
        print(f"Error in savings analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def generate_savings_tips(opportunities):
    """Generate personalized tips based on identified opportunities"""
    tips = []
    
    # Check what types of opportunities were found
    opportunity_types = {opp["type"] for opp in opportunities}
    
    if "high_frequency" in opportunity_types:
        tips.append({
            "title": "Batch your purchases",
            "description": "Consider buying in bulk or preparing at home to reduce frequent small purchases"
        })
    
    if "subscription" in opportunity_types:
        tips.append({
            "title": "Subscription audit",
            "description": "Set a monthly reminder to review all subscriptions and cancel unused ones"
        })
    
    if "category_overspending" in opportunity_types:
        tips.append({
            "title": "Set category budgets",
            "description": "Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings"
        })
    
    if "behavioral" in opportunity_types:
        tips.append({
            "title": "Implement cooling-off periods",
            "description": "Wait 24 hours before making non-essential purchases"
        })
    
    return tips


# Add this new model class to your models.py
from pydantic import BaseModel
class BudgetRequest(BaseModel):
    income: float
    savings_goal: float
    fixed_expenses: dict[str, float]
    
    
@app.post("/api/analysis/budget-recommendations/{user_id}")
async def generateBudgetRecommendations(
    user_id: str, 
    budget_info: BudgetRequest,
    account_id: Optional[str] = None
):
    """Generate AI-powered budget recommendations based on spending patterns"""
    try:
        user_data = database.get_user_by_id(user_id)
        
        if "error" in user_data:
            raise HTTPException(status_code=404, detail="User not found")
        
        basiq_user_id = user_data.get("basiq_user_id")
        
        if not basiq_user_id:
            return {"error": "No bank account connected"}
        
        user = User(basiq_user_id, filter_transfer=True, filter_loans=True)
        
        # Get last 3 months of spending
        from datetime import datetime, timedelta
        three_months_ago = datetime.now() - timedelta(days=90)
        
        transactions = user.transactions
        if account_id:
            transactions = [tx for tx in transactions if tx.account_id == account_id]
        
        recent_transactions = [tx for tx in transactions if tx.date >= three_months_ago]
        
        # Analyze spending patterns
        from collections import defaultdict
        category_spending = defaultdict(float)
        
        for tx in recent_transactions:
            category_spending[tx.category] += tx.amount
        
        # Calculate monthly averages
        monthly_spending = {cat: amount / 3 for cat, amount in category_spending.items()}
        total_monthly_spending = sum(monthly_spending.values())
        
        # Generate budget recommendations
        available_after_fixed = budget_info.income - sum(budget_info.fixed_expenses.values())
        available_after_savings = available_after_fixed - budget_info.savings_goal
        
        recommendations = {
            "summary": {
                "monthly_income": budget_info.income,
                "fixed_expenses": sum(budget_info.fixed_expenses.values()),
                "savings_goal": budget_info.savings_goal,
                "available_for_variable": available_after_savings,
                "current_variable_spending": total_monthly_spending,
                "deficit_or_surplus": available_after_savings - total_monthly_spending
            },
            "category_budgets": {},
            "adjustments_needed": []
        }
        
        # AI-powered budget allocation
        if available_after_savings > 0:
            # Allocate budgets based on spending patterns and best practices
            for category, current_spending in monthly_spending.items():
                # Calculate recommended budget
                percentage_of_variable = current_spending / total_monthly_spending if total_monthly_spending > 0 else 0
                recommended = available_after_savings * percentage_of_variable
                
                # Apply caps based on category
                if "eating out" in category.lower():
                    recommended = min(recommended, available_after_savings * 0.15)
                elif "entertainment" in category.lower():
                    recommended = min(recommended, available_after_savings * 0.10)
                elif "groceries" in category.lower():
                    recommended = max(recommended, available_after_savings * 0.20)
                
                recommendations["category_budgets"][category] = {
                    "current": current_spending,
                    "recommended": recommended,
                    "difference": recommended - current_spending,
                    "action": "reduce" if recommended < current_spending else "maintain"
                }
                
                if recommended < current_spending * 0.8:
                    recommendations["adjustments_needed"].append({
                        "category": category,
                        "current": current_spending,
                        "target": recommended,
                        "reduction_needed": current_spending - recommended,
                        "tips": get_category_reduction_tips(category)
                    })
        
        # Add warnings if budget is unrealistic
        if available_after_savings < total_monthly_spending * 0.5:
            recommendations["warnings"] = [
                "Your savings goal may be too aggressive given current spending",
                "Consider reducing fixed expenses or increasing income"
            ]
        
        return recommendations
        
    except Exception as e:
        print(f"Error in budget recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def get_category_reduction_tips(category: str) -> list[str]:
    """Get specific tips for reducing spending in a category"""
    category_lower = category.lower()
    
    tips_map = {
        "eating out": [
            "Meal prep on Sundays",
            "Limit dining out to once per week",
            "Use restaurant deals and happy hours"
        ],
        "entertainment": [
            "Look for free local events",
            "Share streaming subscriptions",
            "Set a monthly entertainment budget"
        ],
        "shopping": [
            "Create a 30-day wish list before buying",
            "Unsubscribe from marketing emails",
            "Shop with a list"
        ],
        "transport": [
            "Consider carpooling",
            "Use public transport when possible",
            "Combine errands to save fuel"
        ]
    }
    
    for key, tips in tips_map.items():
        if key in category_lower:
            return tips
    
    return ["Track all purchases in this category", "Set a weekly budget limit"]


# ==================================================== #
#             Price Comparison                         #
# ==================================================== #

class PriceComparisonRequest(BaseModel):
    transaction_ids: list[str]
    account_id: Optional[str] = None
    
@app.get("/api/analysis/recentPayments/{user_id}")
async def getRecentPayments(
    user_id: str,
    limit: int = 20,
    account_id: Optional[str] = None
):
    """Get recent payment transactions for price comparison"""
    try:
        print(f"Getting recent payments for user: {user_id}")
        
        user_data = database.get_user_by_id(user_id)
        
        if "error" in user_data:
            raise HTTPException(status_code=404, detail="User not found")
        
        basiq_user_id = user_data.get("basiq_user_id")
        
        if not basiq_user_id:
            return {"transactions": [], "message": "No bank account connected"}
        
        from analysis.globals.users import User
        user = User(basiq_user_id, filter_transfer=True, filter_loans=True)
        
        if isinstance(user.transactions, str):
            print(f"Error getting transactions: {user.transactions}")
            return {"transactions": [], "message": "Unable to fetch transactions"}
        
        print(f"Total transactions: {len(user.transactions)}")
        
        payment_transactions = []
        
        # Categories that are likely to be product purchases
        product_categories = [
            'supermarket', 'grocery', 'store', 'shop', 'retail',
            'electronics', 'clothing', 'department', 'pharmacy',
            'hardware', 'sporting', 'recreation', 'entertainment',
            'cafe', 'restaurant', 'takeaway', 'food', 'dining',
            'online', 'marketplace', 'merchant'
        ]
        
        # Keywords to exclude
        exclude_keywords = [
            'transfer', 'withdrawal', 'deposit', 'interest', 'fee',
            'insurance', 'rent', 'mortgage', 'utility', 'bill'
        ]
        
        for tx in user.transactions:
            # Check if it's a payment
            if tx.mode == "payment" and 3 < tx.amount < 1000:
                description_lower = tx.description.lower()
                category_lower = tx.category.lower()
                
                # Skip if it contains exclude keywords
                if any(keyword in description_lower for keyword in exclude_keywords):
                    continue
                
                # Include if category matches product categories
                is_product_category = any(cat in category_lower for cat in product_categories)
                
                # Include if it's a likely product purchase
                if is_product_category or tx.amount < 200:  # Small amounts likely products
                    # Generate ID
                    tx_id = hashlib.md5(f"{tx.description}{tx.date}{tx.amount}".encode()).hexdigest()[:10]
                    
                    payment_transactions.append({
                        "id": tx_id,
                        "description": tx.description,
                        "amount": tx.amount,
                        "date": tx.date.strftime('%Y-%m-%d'),
                        "category": tx.category
                    })
                    
                    # Debug log for first few
                    if len(payment_transactions) <= 5:
                        print(f"Added: {tx.description} | ${tx.amount} | {tx.category}")
        
        # Sort by date (most recent first)
        payment_transactions.sort(key=lambda x: x['date'], reverse=True)
        
        print(f"Found {len(payment_transactions)} payment transactions")
        
        return {
            "transactions": payment_transactions[:limit],
            "total": len(payment_transactions)
        }
        
    except Exception as e:
        print(f"Error getting recent payments: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analysis/priceComparison/{user_id}")
async def runPriceComparison(
    user_id: str,
    request: PriceComparisonRequest
):
    """Run price comparison analysis on selected transactions"""
    try:
        print(f"Running price comparison for user: {user_id}")
        print(f"Selected transactions: {request.transaction_ids}")
        
        # Import your scraper
        from analysis.productComparison.alibaba_scraper import scrape_alibaba
        from analysis.globals.users import User
        
        user_data = database.get_user_by_id(user_id)
        
        if "error" in user_data:
            raise HTTPException(status_code=404, detail="User not found")
        
        basiq_user_id = user_data.get("basiq_user_id")
        
        if not basiq_user_id:
            return {"results": [], "message": "No bank account connected"}
        
        # Get user transactions
        user = User(basiq_user_id, filter_transfer=True, filter_loans=True)
        
        if isinstance(user.transactions, str):
            return {"results": [], "message": "Unable to fetch transactions"}
        
        results = []
        
        # Create a map of transaction IDs for faster lookup
        tx_map = {}
        for tx in user.transactions:
            tx_id = hashlib.md5(f"{tx.description}{tx.date}{tx.amount}".encode()).hexdigest()[:10]
            tx_map[tx_id] = tx
        
        # Process selected transactions
        for tx_id in request.transaction_ids:
            if tx_id in tx_map:
                tx = tx_map[tx_id]
                
                try:
                    print(f"Processing: {tx.description} - ${tx.amount}")
                    
                    # Run the scraper - it should return a list
                    cheapest_products = scrape_alibaba(
                        search_terms=tx.description,
                        amount=tx.amount
                    )
                    
                    # Check if we got results
                    if cheapest_products and isinstance(cheapest_products, list) and len(cheapest_products) > 0:
                        # Get the best alternative
                        best_alternative = cheapest_products[0]
                        
                        savings = tx.amount - best_alternative['price']
                        
                        if savings > 0:  # Only include if there are actual savings
                            results.append({
                                'transaction': {
                                    'id': tx_id,
                                    'description': tx.description,
                                    'amount': tx.amount,
                                    'date': tx.date.strftime('%Y-%m-%d')
                                },
                                'product': {
                                    'name': best_alternative['name'],
                                    'price': best_alternative['price'],
                                    'rating': best_alternative.get('rating', 0),
                                    'link': best_alternative.get('link', '#')
                                },
                                'potential_savings': savings,
                                'savings_percentage': (savings / tx.amount) * 100
                            })
                            print(f"Found savings: ${savings}")
                    else:
                        print(f"No cheaper alternatives found for {tx.description}")
                    
                except Exception as e:
                    print(f"Error processing transaction {tx.description}: {e}")
                    continue
        
        # Sort by savings potential
        results.sort(key=lambda x: x['potential_savings'], reverse=True)
        
        print(f"Found {len(results)} products with savings")
        
        return {
            "results": results,
            "total_analyzed": len(request.transaction_ids),
            "savings_found": len(results)
        }
        
    except Exception as e:
        print(f"Error in price comparison: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# Optional: Test endpoint with mock data (useful for testing without selenium)
@app.get("/api/analysis/testPriceComparison/{user_id}")
async def testPriceComparison(user_id: str):
    """Test endpoint with mock data"""
    try:
        import random
        
        # Mock some transactions
        mock_transactions = [
            {"id": "1", "description": "Wireless Headphones Sony", "amount": 150.00, "date": "2024-01-15"},
            {"id": "2", "description": "USB C Cable 2m", "amount": 25.99, "date": "2024-01-10"},
            {"id": "3", "description": "Laptop Stand Aluminum", "amount": 45.00, "date": "2024-01-05"}
        ]
        
        # Mock cheaper alternatives
        mock_results = []
        for tx in mock_transactions:
            savings_pct = random.uniform(15, 35)
            cheaper_price = tx["amount"] * (1 - savings_pct / 100)
            
            mock_results.append({
                'transaction': tx,
                'product': {
                    'name': f"{tx['description']} - Alternative Brand",
                    'price': round(cheaper_price, 2),
                    'rating': round(random.uniform(4.0, 4.8), 1),
                    'link': 'https://www.alibaba.com/product-detail/example'
                },
                'potential_savings': round(tx["amount"] - cheaper_price, 2),
                'savings_percentage': round(savings_pct, 1)
            })
        
        return {
            "results": mock_results,
            "total_analyzed": len(mock_transactions),
            "savings_found": len(mock_results)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
