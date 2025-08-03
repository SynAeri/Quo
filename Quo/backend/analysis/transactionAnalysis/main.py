from users import User, UserManager
import interactionhandler
#encoded_key = base64.b64encode(f"{api_key}:".encode('utf-8')).decode('utf-8')

# Things to consider. 
# - Maybe we can store the average spending of accounts based on the accounts we can accumulate and store averages in a datastore or smthing by month, year, weeks, etc.
# - We can then compare the spending of individuals to the average to encourage saving.
# - I need more accounts to test on :(
    
'''
PAYLOAD TEMPLATE FOR CREATING AN ACCOUNT
payload_template = {
                "email": "gavin@hooli.com",
                "mobile": "+61410888999",
                "firstName": "Gavin",
                "middleName": "middle name",
                "lastName": "Belson",
            }
'''

def main():
    users = [
         #"d92eff61-8af1-4b8c-955c-8ae6299f497e",
         "e55dce05-5f65-4df3-9543-2c91e2082c95"
    ]
    
    manager = UserManager()
    for user_ID in users:
        user = User(user_ID, filter_transfer=True, filter_loans=True)
        manager.add_user(user)
        
        user.BasiqManager.get_single_account("272bcec6-6c6f-4d26-864a-87511249e201")
        
    #interactionhandler.graphTest(manager)
            
    
            
if __name__ == '__main__':
    main()
