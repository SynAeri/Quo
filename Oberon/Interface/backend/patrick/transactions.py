from datetime import datetime
from collections import defaultdict
import calendar

from graphs import Graphs

class Transaction:
    def __init__(self, description: str, category: str, date: str, amount: float, mode: str):
        self.description = description
        self.category = category
        self.date = datetime.strptime(date, '%Y-%m-%dT%H:%M:%SZ')
        self.amount = amount
        self.mode = mode
        
    def is_transfer(self):
        if self.mode == "transfer":
            return True
        else:
            return False
        
class AllTransactions:
    def __init__(self, transactions: list[Transaction]):
        self.transactions = transactions
        self.grouped = self.group_by_year_and_month()
    
    def group_by_year_and_month(self):
        grouped = defaultdict(lambda: defaultdict(list))
        for tx in self.transactions:
            year = tx.date.year
            month_num = tx.date.month
            month_name = calendar.month_name[month_num]
            grouped[year][(month_num, month_name)].append(tx)
        return grouped
    
    def get_total_by_category(self):
        totals = defaultdict(float)
        for tx in self.transactions:
            totals[tx.category] += tx.amount
        return dict(totals)
    
        
    def get_average_by_category(self):
        totals = defaultdict(float)
        counts = defaultdict(int)

        for tx in self.transactions:
            totals[tx.category] += tx.amount
            counts[tx.category] += 1

        averages = {}
        for category in totals:
            averages[category] = round(totals[category] / counts[category], 2)

        return averages
            
    
    def summary_string(self):
        lines = []
        for year, months in self.grouped.items():
            total_year = 0
            lines.append(f"\n====== Year: {year} ======")
            for (month_num, month_name) in sorted(months.keys()):
                lines.append(f"\n  -- Month: {month_name} --")
                total_month = 0
                for tx in months[(month_num, month_name)]:
                    total_year += tx.amount
                    total_month += tx.amount
                    lines.append(
                        f"      {tx.date.strftime('%Y-%m-%d')} | ${tx.amount:.2f}  |  {tx.category} | {tx.description} ({tx.mode})"
                    )
                lines.append(f"        TOTAL {month_name}: ${total_month:.2f}")
            lines.append(f"\n        TOTAL {year}: ${total_year:.2f}")
            
        return "\n".join(lines)
            
    def graph_transactions(self, format):
        newGraph = Graphs(self)
        newGraph.plot_totals(format, 2024)