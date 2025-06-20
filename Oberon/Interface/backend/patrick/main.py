from users import User, UserManager
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
                "businessName": "Manly Accounting PTY LTD",
                "businessIdNo": "16 7645 892",
                "businessIdNoType": "ACN",
                "verificationStatus": True,
                "verificationDate": "12/01/2024"
            }
'''


def main():
    users = [
         "d92eff61-8af1-4b8c-955c-8ae6299f497e",
         "e55dce05-5f65-4df3-9543-2c91e2082c95"
    ]
    manager = UserManager()
    for user_ID in users:
        user = User(user_ID, filter_transfer=False)
        print(f"ACCOUNTS: {user_ID}")
        print(f"{user.accounts}\n")
        manager.add_user(user)
        
    all_average_categories = manager.get_total_average()

    
    for user in manager.all_users():
        user_id = user.user_id
        user_AllTransactions = user.get_transaction_group()
        user_categories = user_AllTransactions.get_average_by_category()
        
        ## NOTES:
        ## - An average of above 100% Indicates overspending in a category (Spending more than the average) --> ((percentage * 100) - 100)% more
        
        ## - An average below 100% Indicates that a user is spending (100 - (percentage * 100))% less than the average for a category: E.g 6% less than the average
        
        ## - The closer the percentage to 100% meaning that the user spends equal to the average
        
        percentages = {}
        for category in user_categories:
            user_avg = user_categories[category]
            overall_avg = all_average_categories.get(category)

            if overall_avg and overall_avg != 0:
                percent = (user_avg / overall_avg) * 100
                percentages[category] = round(percent, 2)
            else:
                percentages[category] = None 

        print(f"\nUser {user_id} Category Comparison to Overall Average:")
        for category, pct in percentages.items():
            if pct is not None:
                print(f"  {category}: {pct}% of overall average")
            else:
                print(f"  {category}: No overall data available")
            
    
            
if __name__ == '__main__':
    main()