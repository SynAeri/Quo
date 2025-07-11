from datetime import datetime
from collections import defaultdict
import calendar

class Transaction:
    # Holds information about ONE transaction. (Can add functions to this however its not of use now)
    # This is only used to basically store information instead of a ugly list or dict
    
    def __init__(self, id, description: str, type: str, category: str, date: str, amount: float, mode: str):
        self.id = id
        self.description = description
        self.type = type
        self.category = category
        self.date = datetime.strptime(date, '%Y-%m-%dT%H:%M:%SZ')
        self.amount = amount
        self.mode = mode
        
class AllTransactions:
    # Holds a list of transactions, 
    def __init__(self, transactions: list[Transaction]):
        self.transactions = transactions
        self.grouped = self.group_by_year_and_month()
    
    # Groups transactions by their year and month and returns a list
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
            
    def category_total_points(self):
        totals = self.get_total_by_category()
        xPoints = list(totals.keys())
        yPoints = list(totals.values())
        
        return xPoints, yPoints
    
    def category_averages_points(self):
        averages = self.get_average_by_category()
        xPoints = list(averages.keys())
        yPoints = list(averages.values())
        
        return xPoints, yPoints
    
    def monthly_totals_points(self, year: int):
        x_points = []
        y_points = []

        if year not in self.grouped:
            print("Couldn't find that year in transactions")
            return [], []

        months = self.grouped[year]
        for (month_num, month_name) in sorted(months.keys()):
            total = sum(tx.amount for tx in months[(month_num, month_name)])
            x_points.append(month_name)
            y_points.append(total)

        return x_points, y_points