from users import UserManager
from graphs import Graphs

def view_account_stats(userManager: UserManager):
    for user in userManager.all_users():
        analysis = user.account_analysis()
        
        print(analysis)
        
def view_catagory_averages(userManager: UserManager):
    all_average_categories = userManager.get_total_average()
   
    for user in userManager.all_users():
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
                
def graphTest(userManager: UserManager):
    for user in userManager.all_users():
        AllTransactions = user.get_transaction_group()
        x, y = AllTransactions.category_total_points()
        
        graph = Graphs(x, y, "Total Spending by Month", "Category", "Total")
        graph.plot_line()
        graph.plot_bar()