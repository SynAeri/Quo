import requests
from requests.auth import HTTPBasicAuth
import base64
import json
from datetime import datetime
import calendar
from collections import defaultdict

from graphs import plot_totals

#encoded_key = base64.b64encode(f"{api_key}:".encode('utf-8')).decode('utf-8')

# Things to consider. 
# - Maybe we can store the average spending of accounts based on the accounts we can accumulate and store averages in a datastore or smthing by month, year, weeks, etc.
# - We can then compare the spending of individuals to the average to encourage saving.
# - I need more accounts to test on :(

def getToken(api_key):
    url = "https://au-api.basiq.io/token"

    headers = {
        "accept": "application/json",
        "content-type": "application/x-www-form-urlencoded",
        "Authorization": f"Basic {api_key}",
        "basiq-version": "3.0"
    }

    response = requests.post(url, headers=headers)
    response = json.loads(response.text)
    Access_Token = response['access_token']
    
    return Access_Token

    #url = "https://au-api.basiq.io/users/d92eff61-8af1-4b8c-955c-8ae6299f497e/transactions?limit=500"

def sendAPIRequestData(Access_Token):
    current_data = []
    if not Access_Token:
        return
    
    headers = {
    "accept": "application/json",
    "authorization": f"Bearer {Access_Token}"
    }
    
    userId = "d92eff61-8af1-4b8c-955c-8ae6299f497e" # Change if needed (Need more accounts to test)
    url = f"https://au-api.basiq.io/users/{userId}/transactions?limit=500"
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json() 
            for i in data['data']:
                description = i.get('description', 'No Description')
                post_date = i.get('postDate', 'No Date')
                sub_class = i.get('subClass')
                transaction_amount = i.get('amount')
                mode = i.get('class')

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
    
def group_transactions(raw_data, includeTransfers):
    grouped = defaultdict(lambda: defaultdict(list))
    for data in raw_data:
        dt = datetime.strptime(data['date'], '%Y-%m-%dT%H:%M:%SZ')
        year = dt.year
        month_num = dt.month
        month_name = calendar.month_name[month_num]

        if includeTransfers:
            grouped[year][month_num, month_name].append({
            'description': data['description'],
            'category': data['category'],
            'date': data['date'],
            'amount': data['amount'],
            'mode': data['mode']
            })
        elif data['mode'] != "transfer":
            grouped[year][month_num, month_name].append({
            'description': data['description'],
            'category': data['category'],
            'date': data['date'],
            'amount': data['amount'],
            'mode': data['mode']
            })

    return grouped

def printGroupedTransactions(current_data): ## Just for showcase
    grouped = group_transactions(current_data, True) # Boolean dictates to show bank transfers or not
    for year, months in grouped.items():
        total_year = 0
        print(f"\n====== Year: {year} ======")
        for (month_num, month_name) in sorted(months.keys()):
            print(f"\n  -- Month: {month_name} --")
            total_month = 0
            for tx in months[(month_num, month_name)]:
                total_year += tx['amount']
                total_month += tx['amount']
                print(f"      {tx['date']} | ${tx['amount']}  |  {tx['category']} | {tx['description']} ({tx['mode']})")
            print(f"        TOTAL {month_name}: ${round(total_month, 2)}")
        print(f"\n        TOTAL {year}: ${round(total_year, 2)}")
    
    plot_totals(grouped, 'yearly', 2024)

def main():
    api_key = "OGZmYTY5YWYtODhlMy00YTU3LThmMzMtYTVlMGE3YzA5OGY3Ojk3YzJhODE4LWU5ZjMtNDI5MC1iNzkyLWJkZjI5ZmU5M2NhMg==" ## Here just for tests
    AccessToken = getToken(api_key)
    data_dictionary = sendAPIRequestData(AccessToken)
    
    if not data_dictionary:
        print("Error getting transaction data/Access Token Error")
        return
    
    printGroupedTransactions(data_dictionary)

if __name__ == '__main__':
    main()