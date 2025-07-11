import requests
import json
api_key = "OGZmYTY5YWYtODhlMy00YTU3LThmMzMtYTVlMGE3YzA5OGY3OjVjYjJhMmUxLWQ2MzgtNGExZi04OTUwLTU0NTVkOGQ5OWE4Ng==" ## For Tests
 
class BasiqAPI:
    # Class that incorporates most of the Basiq API requests
    def __init__(self, api_key: str, User):
        self.api_key = api_key
        self.user = User
        self.auth_token = self.getToken()
        
    def getToken(self) -> str:
        # Retrieves the token needed to be used for other API requests (VITAL)
        url = "https://au-api.basiq.io/token"

        headers = {
            "accept": "application/json",
            "content-type": "application/x-www-form-urlencoded",
            "Authorization": f"Basic {api_key}",
            "basiq-version": "3.0"
        }

        try:
            response = requests.post(url, headers=headers)
            response = json.loads(response.text)
            Access_Token = response['access_token']
            
            return Access_Token
        except Exception as e:
            print(f"Error obtaining Access Token: {e}") 

    def grab_identities(self) -> dict:
        # Retrieves identities of users (I don't really know what identities are used for but i just added it here)
        if not self.auth_token:
            print("Error when obtaining Auth Token (Grab Identities)")
            return
        
        headers = {
            "accept": "application/json",
            "authorization": f"Bearer {self.auth_token}"
        }
        
        url = f"https://au-api.basiq.io/users/{self.user.user_id}/identities"
        try:
            response = requests.get(url, headers)
            
            identities = []
            if response.status_code == 200:
                data = response.json()
                for identity in data['data']:
                    if identity['type'] == "identity":
                        identities.append(identity['id'])
                        
            return identities,
        except Exception as e:
            print(f"Failed getting identities: {e}")
        
    def getTransactionData(self, filter_transfer: bool, filter_loans: bool) -> dict:
        # The most important function in retrieving user transactions.
        # This sorts each individual transaction by their description, category, date, amount, and its mode of payment
        current_data = []
        
        def insert_transaction():
            transaction_id = i.get('id')
            description = i.get('description', 'No Description')
            type = i.get('type')
            post_date = i.get('postDate', 'No Date')
            sub_class = i.get('subClass')
            transaction_amount = i.get('amount')

            if sub_class:
                category = sub_class.get('title', 'No Category')
            else:
                category = 'No Category'

            data_payload = {
                'id' : transaction_id,
                'description': description,
                'type': type,
                'category': category,
                'date': post_date,
                'amount': abs(float(transaction_amount)),
                'mode': mode
                }
            
            current_data.append(data_payload)
        
        if not self.auth_token:
            print("Error when obtaining Auth Token (Getting Transaction Data)")
            return
                
        headers = {
        "accept": "application/json",
        "authorization": f"Bearer {self.auth_token}"
        }
        # We can remove the limit or increase it to our liking depending on how many transactions you want
        url = f"https://au-api.basiq.io/users/{self.user.user_id}/transactions?limit=500"
        try:
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                
                for i in data['data']:
                    mode = i.get('class')
                    
                    if mode == "transfer":
                        if filter_transfer:
                            continue
                        insert_transaction()
                        
                    if mode == "loan-interest" or mode == "loan-repayment":
                        if filter_loans:
                            continue
                        insert_transaction()
                        
                    insert_transaction()
                    
                   
                return current_data
            else:
                print(f"Error: {response.status_code}, {response.text}")
                return None
        except Exception as e:
            print(f"Error occured when sending API Request {e}")
            return None
    
    def get_accounts(self) -> dict:
        # This functions gets the various banking accounts of a user.
        # This could either be their saving accounts, cheque, loan accounts, etc.
        if not self.auth_token:
            print("Error when obtaining Auth Token (Grabbing Accounts)")
            return
        
        url = f"https://au-api.basiq.io/users/{self.user.user_id}/accounts"

        headers = {
            "accept": "application/json",
            "authorization": f"Bearer {self.auth_token}"
        }
        
        try:
            response = requests.get(url, headers=headers)
            accounts = []
            if response.status_code == 200:
                data = response.json()
                # The only data we get from the account is its num, name, balance and institution (ANZ, ETC)
                for account in data['data']:
                    print(account)
                    account = {
                        "accountNum": account['accountNo'],
                        "accountName": account['name'],
                        "balance": account['balance'],
                        "institution": account['institution']
                    }
                    accounts.append(account)
            
            return accounts
        except Exception as e:
            print(f"Failed getting accounts: {e}")
            
    def get_single_account(self, account_id):
        if not self.auth_token:
            print("Error when obtaining Auth Token (Grabbing Accounts)")
            return
        
        url = f"https://au-api.basiq.io/users/{self.user.user_id}/accounts/{account_id}"

        headers = {
            "accept": "application/json",
            "authorization": f"Bearer {self.auth_token}"
        }
        
        try:
            response = requests.get(url, headers=headers)
            accounts = []
            if response.status_code == 200:
                data = response.json()
                # The only data we get from the account is its num, name, balance and institution (ANZ, ETC)
                print(data)
            
            return accounts
        except Exception as e:
            print(f"Failed getting accounts: {e}")
            
    def create_account(self, user_personal_data):
        url = "https://au-api.basiq.io/users"
        
        try:
            
            payload = user_personal_data
            
            headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "authorization": f"Bearer {self.auth_token}"
            }
            
            response = requests.post(url, json=payload, headers=headers)
            
        except Exception as e:
            print(f"Error creating an account {e}")