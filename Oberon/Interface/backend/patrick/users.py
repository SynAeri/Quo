from collections import defaultdict
from basiq_manager import BasiqAPI
from typing import List, Dict, Optional

from transactions import Transaction, AllTransactions

class User:
    def __init__(self, user_id: str, filter_transfer: bool):
        self.user_id = user_id
        self.filter_transfer = filter_transfer
        self.BasiqManager = self.create_API_Interface()
        self.transactions = self.fetch_transactions()
        self.accounts = self.get_accounts()
    
    def create_API_Interface(self) -> BasiqAPI:
        return BasiqAPI(api_key="OGZmYTY5YWYtODhlMy00YTU3LThmMzMtYTVlMGE3YzA5OGY3Ojk3YzJhODE4LWU5ZjMtNDI5MC1iNzkyLWJkZjI5ZmU5M2NhMg==", User=self)
    
    def fetch_transactions(self) -> List[Transaction]:
        data = self.BasiqManager.getTransactionData(self.filter_transfer)
        if not data:
            return "Error Retrieving Transactions"
        
        transactions = []
        for tx in data:
            new_transaction = Transaction(tx['description'], tx['category'], tx['date'], tx['amount'], tx['mode'])
            transactions.append(new_transaction)
        
        return transactions
        
    def get_accounts(self) -> dict:
        return self.BasiqManager.get_accounts()
        
    def get_transaction_group(self) -> AllTransactions:
        return AllTransactions(self.transactions)
    
    def account_analysis(self) -> dict:
        # Here we calculate the sum of balances for a users different accounts
        # This function is used to calculate positive and negative balanace and aggregate them together
        
        def sum_balances(positive: bool = True) -> float:
            total = 0.0
            for account in self.accounts:
                bal = float(account['balance'])
                if positive and bal > 0:
                    total += bal
                elif not positive and bal < 0:
                    total += bal
        
            return total
        
        # This function purely calculates how much liquid cash a user has all together.
        # Right now, im only looking for cheque and savings accounts but we can add more in the future
        def calculate_liquidation() -> float:
            keywords = ('cheque', 'savings')
            liquid_total = 0.0
            
            for account in self.accounts:
                name = account['accountName'].lower()
                bal = float(account['balance'])
                
                if bal > 0:
                    for keyword in keywords:
                        if keyword in name:
                            liquid_total += bal
                            break
                        
            return liquid_total
        
        def pick_risk_allocation(surplus_ratio: float) -> str:
            if surplus_ratio < 0.20: # We can change these ratios for what we can deem fit (Im not really a investor so i don't really know)
                return "Probably shy away from investing" # We can recommend to our users what they can invest in here, i just added placeholders here
            if surplus_ratio < 0.50:
                return "Moderate aggressive in investing"
            
            return "Can take risks and be aggressive in investing"
        
        liquid_cash = calculate_liquidation()
        total_negatives = sum_balances(positive=False)
        total_debt = -total_negatives
        
        total_assets = sum_balances(positive=True)
                
        investable = liquid_cash
        
        if total_assets > 0:
            # A surplus ratio shows the fraction of your total assets that you are able to invest into
            
            surplus_ratio = investable / total_assets ## Investable Cash / Total Positive Assets
            
            # A Low Surplus Ratio indicates that you have little liquid cash available (< 0.2) --> We can change this at the pick_risk_allocation function
            # Medium Surplus Radio indicates that you can take moderate risk in investing (0.2 - 0.5)
            # High ratio indicates that more than half of you assets are liquid (> 0.5) Hence you can be more aggressive in investing
            
        else:
            surplus_ratio = 0.0
            
        verdict = pick_risk_allocation(surplus_ratio)
        
        result = {
        'total_assets':     round(total_assets, 2),
        'total_debt':       round(total_debt, 2),
        'investable':       round(investable, 2),
        'surplus_ratio':    round(surplus_ratio, 2),
        'verdict':       verdict,
        }
        
        return result
                
                
    
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