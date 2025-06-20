from collections import defaultdict
from basiq_manager import BasiqAPI

from transactions import Transaction, AllTransactions

class User:
    def __init__(self, user_id: str, filter_transfer: bool):
        self.user_id = user_id
        self.filter_transfer = filter_transfer
        self.BasiqManager = self.create_API_Interface()
        self.transactions = self.fetch_transactions()
        self.accounts = self.get_accounts()
    
    def create_API_Interface(self):
        return BasiqAPI(api_key="OGZmYTY5YWYtODhlMy00YTU3LThmMzMtYTVlMGE3YzA5OGY3Ojk3YzJhODE4LWU5ZjMtNDI5MC1iNzkyLWJkZjI5ZmU5M2NhMg==", User=self)
    
    def fetch_transactions(self):
        data = self.BasiqManager.getTransactionData(self.filter_transfer)
        if not data:
            return "Error Retrieving Transactions"
        
        transactions = []
        for tx in data:
            new_transaction = Transaction(tx['description'], tx['category'], tx['date'], tx['amount'], tx['mode'])
            transactions.append(new_transaction)
        
        return transactions
        
    def get_accounts(self):
        return self.BasiqManager.get_accounts()
        
    def get_transaction_group(self):
        return AllTransactions(self.transactions)
    
class UserManager:
    def __init__(self):
        self.users = {}
        
    def add_user(self, user: User):
        self.users[user.user_id] = user
        
    def fetch_all_transactions(self):
        for user in self.users.values():
            user.fetch_transactions()
            
    def fetch_user(self, user_id: str):
        return self.users[user_id]
    
    def all_users(self):
        return list(self.users.values())
    
    def get_total_average(self):
        total_amounts = defaultdict(float)
        total_counts = defaultdict(int)

        for user in self.users.values():
            transaction_group = user.get_transaction_group()
            for tx in transaction_group.transactions:
                total_amounts[tx.category] += tx.amount
                total_counts[tx.category] += 1

        averages = {}
        for category in total_amounts:
            averages[category] = round(total_amounts[category] / total_counts[category], 2)

        return averages