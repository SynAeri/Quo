# All database Operations
# Has all database logic
import os
import sqlite3
import hashlib
from config import get_db_path # Flexibility

def init_database():
    # Initialises db file and tables when server starts
    # call this f(x) once server startup
    # Create directory if it doesn't exist (important for Railway)
    db_path = get_db_path()
    db_dir = os.path.dirname(db_path)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir)
    conn = sqlite3.connect(db_dir)

    # Creates database file in case it does not exist

    cursor = conn.cursor()
    # Cursor initialisation for executing SQL

    # USERS DATABASE TABLE
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # USERS BASIQ CONNECTION DATABASE
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS basiq_connection (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            basiq_user_id TEXT,
            institution_name TEXT,
            account_ids TEXT,
            connection_status TEXT DEFAULT 'active',
            connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)

    conn.commit()
    # Save changes

    conn.close()
    # Close connections

    print("database initialised")


def get_connection():
    # Connect to database
    return sqlite3.connect(get_db_path())

def hash_password(password: str):
    # Convert password to hash

    return hashlib.sha256(password.encode()).hexdigest() # Encode in sha256 algorithm


# ==================================================== #
#                  User Database Functions             #
# ==================================================== #

def create_user(email: str, password: str, first_name: str, last_name: str):
    # This function handles user creation
    # Returns dictionary with result and takes care of error cases too

    conn = get_connection()
    # Get database connection
    
    cursor = conn.cursor()
    # Get cursor for SQL commands
    
    try:
        # Check for possibility of existing users
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        
        if cursor.fetchone():
            # If cursor.fetchone() returns something, user exists
            return {"error": "User already exists"}
        
        password_hash = hash_password(password)
        # Convert plain password to secure hash
        
        cursor.execute("""
            INSERT INTO users (email, password_hash, first_name, last_name) 
            VALUES (?, ?, ?, ?)
        """, (email, password_hash, first_name, last_name))
        # Add new user to database
        # tuple provides values for the ? placeholders
        
        user_id = cursor.lastrowid
        # Get the ID of the user we just created
        
        conn.commit()
        # Save changes to database
        
        # Return if success
        return {
            "success": True,
            "user_id": user_id,
            "email": email,
            "first_name": first_name,
            "last_name": last_name
        }
        # Return dictionary with user data
        
    except sqlite3.Error as e:
        # If any database operation fails Return error dictionary
        return {"error": f"Database error: {e}"}
        
    finally:
        conn.close()

def verify_user(email: str, password: str):
    # This function checks if email/password combination is correct
    # Used for login
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Find user via email
        cursor.execute("""
            SELECT id, email, password_hash, first_name, last_name
            FROM users WHERE email = ?
        """, (email,))
        # SQL: "Get all user data for this email"
        
        user = cursor.fetchone()
        # Get first result (should be only one due to UNIQUE keys (will add future considerations for other stuff later))
        
        if not user:
            return {"error": "User not found"}
        
        # from user variable defined, extract data from database fetchone()
        user_id, email, stored_hash, first_name, last_name = user
        # Unpack tuple into individual variables
        # user[0] = user_id, user[1] = email, etc.
        
        # Password Verification
        if hash_password(password) != stored_hash:
            # Hash the input password and compare with stored hash
            return {"error": "Invalid password"}
        
        # if password matches and user found then return success
        return {
            "success": True,
            "user_id": user_id,
            "email": email,
            "first_name": first_name,
            "last_name": last_name
        }
        
    except sqlite3.Error as e:
        # In the case that errors occur in verification can see exception
        return {"error": f"Database error: {e}"}
    finally:
        conn.close()

def get_all_users():
    # This function returns all users in the database
    # Used by debug endpoints
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT id, email, first_name, last_name, created_at
            FROM users ORDER BY created_at DESC
        """)
        # SQL: "Get all users, newest first"
        # ORDER BY created_at DESC: Sort by creation date, newest first
        
        users = cursor.fetchall()
        # Get ALL results from query (not just first one)
        # Returns list of tuples
        
        user_list = []
        # Create empty list to store user data
        
        for user in users:
            # Loop through each user tuple
            user_list.append({
                "id": user[0],        # First column: id
                "email": user[1],     # Second column: email
                "firstName": user[2], # Third column: first_name
                "lastName": user[3],  # Fourth column: last_name
                "createdAt": user[4]  # Fifth column: created_at
            })
            # Convert tuple to dictionary and add to list
        
        return {"users": user_list, "total": len(user_list)}
        # Return dictionary with user list and count
        
    except sqlite3.Error as e:
        return {"error": f"Database error: {e}"}
    finally:
        conn.close()

def get_database_stats():
    """Get database statistics"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # total user count
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        
        # count connections
        cursor.execute("SELECT COUNT(*) FROM basiq_connection")
        connection_count = cursor.fetchone()[0]
        
        return {
            "total_users": user_count,
            "total_connections": connection_count,
            "database_file": get_db_path() 
        }
        
    except sqlite3.Error as e:
        return {"error": f"Database error: {e}"}
    finally:
        conn.close()

# ==================================================== #
#                  User Database Functions             #
# ==================================================== #
def update_user_basiq_id(user_id: str, basiq_user_id: str):
    """Store the Basiq user ID for a user after creating their Basiq account"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Check if user already has a Basiq connection record
        cursor.execute("SELECT id FROM basiq_connection WHERE user_id = ?", (user_id,))
        existing = cursor.fetchone()
        
        if existing:
            # Update existing record
            cursor.execute("""
                UPDATE basiq_connection 
                SET basiq_user_id = ? 
                WHERE user_id = ?
            """, (basiq_user_id, user_id))
        else:
            # Create new record
            cursor.execute("""
                INSERT INTO basiq_connection (user_id, basiq_user_id) 
                VALUES (?, ?)
            """, (user_id, basiq_user_id))
        
        conn.commit()
        return {"success": True}
        
    except sqlite3.Error as e:
        return {"error": f"Database error: {e}"}
    finally:
        conn.close()

def get_user_by_id(user_id: str):
    """Get user data including Basiq user ID"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT 
                u.id, u.email, u.first_name, u.last_name,
                bc.basiq_user_id, bc.institution_name, bc.connection_status
            FROM users u
            LEFT JOIN basiq_connection bc ON u.id = bc.user_id
            WHERE u.id = ?
        """, (user_id,))
        
        user = cursor.fetchone()
        
        if not user:
            return {"error": "User not found"}
        
        return {
            "id": user[0],
            "email": user[1],
            "first_name": user[2],
            "last_name": user[3],
            "basiq_user_id": user[4],
            "institution_name": user[5],
            "connection_status": user[6]
        }
        
    except sqlite3.Error as e:
        return {"error": f"Database error: {e}"}
    finally:
        conn.close()

def save_basiq_connection(user_id: int, basiq_user_id: str, institution_name: str, account_ids: list):
    """Save bank connection details after successful Basiq connection"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Convert account_ids list to string for storage
        account_ids_str = ','.join(account_ids) if account_ids else ''
        
        # Check if connection already exists
        cursor.execute("SELECT id FROM basiq_connection WHERE user_id = ?", (user_id,))
        existing = cursor.fetchone()
        
        if existing:
            # Update existing connection
            cursor.execute("""
                UPDATE basiq_connection 
                SET basiq_user_id = ?, institution_name = ?, account_ids = ?, 
                    connection_status = 'active', connected_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            """, (basiq_user_id, institution_name, account_ids_str, user_id))
        else:
            # Create new connection
            cursor.execute("""
                INSERT INTO basiq_connection 
                (user_id, basiq_user_id, institution_name, account_ids, connection_status) 
                VALUES (?, ?, ?, ?, 'active')
            """, (user_id, basiq_user_id, institution_name, account_ids_str))
        
        conn.commit()
        return {"success": True}
        
    except sqlite3.Error as e:
        return {"error": f"Database error: {e}"}
    finally:
        conn.close()

def get_user_basiq_connections(user_id: int):
    """Get all Basiq connections for a user"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT basiq_user_id, institution_name, account_ids, 
                   connection_status, connected_at
            FROM basiq_connection 
            WHERE user_id = ? AND connection_status = 'active'
        """, (user_id,))
        
        connections = cursor.fetchall()
        
        connection_list = []
        for conn_data in connections:
            account_ids = conn_data[2].split(',') if conn_data[2] else []
            connection_list.append({
                "basiq_user_id": conn_data[0],
                "institution_name": conn_data[1],
                "account_ids": account_ids,
                "connection_status": conn_data[3],
                "connected_at": conn_data[4]
            })
        
        return {"connections": connection_list}
        
    except sqlite3.Error as e:
        return {"error": f"Database error: {e}"}
    finally:
        conn.close()

def has_basiq_user(user_id: int):
    """Check if user already has a Basiq account"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT basiq_user_id FROM basiq_connection 
            WHERE user_id = ? AND basiq_user_id IS NOT NULL
        """, (user_id,))
        
        result = cursor.fetchone()
        return {
            "has_basiq_user": bool(result),
            "basiq_user_id": result[0] if result else None
        }
        
    except sqlite3.Error as e:
        return {"error": f"Database error: {e}"}
    finally:
        conn.close()


