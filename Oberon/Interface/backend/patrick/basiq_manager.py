import requests
import json
api_key = "OGZmYTY5YWYtODhlMy00YTU3LThmMzMtYTVlMGE3YzA5OGY3Ojk3YzJhODE4LWU5ZjMtNDI5MC1iNzkyLWJkZjI5ZmU5M2NhMg==" ## For Tests
 
class BasiqAPI:
    def __init__(self, api_key: str, User):
        self.api_key = api_key
        self.user = User
        self.auth_token = self.getToken()
        
    def getToken(self):
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

    def grab_identites(self):
        
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
            
            identites = []
            if response.status_code == 200:
                data = response.json()
                for identity in data['data']:
                    if identity['type'] == "identity":
                        identites.append(identity['id'])
                        
            return identites
        except Exception as e:
            print(f"Failed getting identities: {e}")
        
    def getTransactionData(self, Transfers: bool):
        
        if not self.auth_token:
            print("Error when obtaining Auth Token (Getting Transaction Data)")
            return
        
        current_data = []
        
        headers = {
        "accept": "application/json",
        "authorization": f"Bearer {self.auth_token}"
        }
        
        url = f"https://au-api.basiq.io/users/{self.user.user_id}/transactions?limit=500"
        try:
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                
                for i in data['data']:
                    mode = i.get('class')
                    
                    if not Transfers:
                        if mode != "transfer":
                            description = i.get('description', 'No Description')
                            post_date = i.get('postDate', 'No Date')
                            sub_class = i.get('subClass')
                            transaction_amount = i.get('amount')

                            if sub_class:
                                category = sub_class.get('title', 'No Category')
                            else:
                                category = 'No Category'

                            current_data.append({
                                'description': description,
                                'category': category,
                                'date': post_date,
                                'amount': abs(float(transaction_amount)),
                                'mode': mode
                                })
                    else:
                        description = i.get('description', 'No Description')
                        post_date = i.get('postDate', 'No Date')
                        sub_class = i.get('subClass')
                        transaction_amount = i.get('amount')

                        if sub_class:
                            category = sub_class.get('title', 'No Category')
                        else:
                            category = 'No Category'

                        current_data.append({
                            'description': description,
                            'category': category,
                            'date': post_date,
                            'amount': abs(float(transaction_amount)),
                            'mode': mode
                            })
                
                return current_data
            else:
                print(f"Error: {response.status_code}, {response.text}")
                return None
        except Exception as e:
            print(f"Error occured when sending API Request {e}")
            return None
    
    def get_accounts(self):
        
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
                for account in data['data']:
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
