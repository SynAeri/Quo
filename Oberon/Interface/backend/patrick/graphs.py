import matplotlib.pyplot as plt

class Graphs:
    def __init__(self, TransactionGroup):
        self.transactions = TransactionGroup
    
    def plot_totals(self, method, target_year):
        grouped_data = self.transactions.group_by_year_and_month()
        
        if method == "yearly":
            yearly_totals = {}

            for year, months in grouped_data.items():
                total = 0
                for transactions in months.values():
                    for tx in transactions:
                        total += tx.amount
                yearly_totals[year] = total

            years = list(map(int, yearly_totals.keys()))
            totals = list(yearly_totals.values())

            plt.figure(figsize=(8, 5))
            plt.bar(years, totals)
            plt.xticks(years)
            plt.xlabel("Year")
            plt.ylabel("Total Spent ($)")
            plt.title("Total Amount Spent Per Year")
            plt.tight_layout()
            plt.savefig("Yearly_Spending.png")
        
        if method == "monthly":
            monthly_totals = []

            for year, months in grouped_data.items():
                if year != target_year:
                    continue 

                for (month_num, month_name), transactions in months.items():
                    total = sum(tx.amount for tx in transactions)
                    label = f"{month_name}"
                    monthly_totals.append((month_num, label, total))

            monthly_totals.sort(key=lambda x: x[0])

            labels = [label for _, label, _ in monthly_totals]
            values = [total for _, _, total in monthly_totals]

            plt.figure(figsize=(10, 5))
            plt.bar(labels, values)
            plt.xlabel(f"Months in {target_year}")
            plt.ylabel("Total Spent ($)")
            plt.title(f"Monthly Spending in {target_year}")
            plt.tight_layout()
            plt.savefig(f"Monthly_Spending.png")