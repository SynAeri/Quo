from alibaba_scraper import scrape_alibaba
from users import User, UserManager
from transactions import Transaction, AllTransactions
import time

# unsure about this file, especially print_results function
# asks for an rating for each payment transaction in the user's history, which is a LOT
# unsure if i'm accessing transaction details correctly (description and amount)

def find_cheapest_products(user_id):
    # Initialize user with Basiq API
    user = User(user_id=user_id, filter_transfer=True, filter_loans=True)
    transactions = user.get_transaction_group().transactions
    
    results = []
    
    for tx in transactions:       
        # min_rating = float(input("What is the minimum rating for this product that you would buy? (1 d.p float under 5.0): "))     
        print(f"\nProcessings transaction: {tx.description} (${tx.amount})")
        
        if (tx.type == 'payment'):
            # Search Alibaba for matching products
            cheapest_product = scrape_alibaba(
                search_terms=tx.description,
                amount=tx.amount,
                # minimum_rating=min_rating
            )
            
            if cheapest_product:
                savings = tx.amount - cheapest_product['price']
                results.append({
                    'transaction': tx,
                    'product': cheapest_product,
                    'potential_savings': savings,
                    'savings_percentage': (savings / tx.amount) * 100
                })
                
        # except Exception as e:
        #     print(f"Error processing transaction {tx.description}: {e}")
        #     continue
    
    return results

def print_results(results):
    print("\n=== Potential Savings Report ===")
    total_savings = 0
    original_spending = 0
    
    for result in sorted(results, key=lambda x: x['potential_savings'], reverse=True):
        tx = result['transaction']
        product = result['product']
        
        print(f"\nTransaction: {tx.description}")
        print(f"Date: {tx.date.strftime('%Y-%m-%d')}")
        print(f"Amount Paid: ${tx.amount:.2f}")
        print(f"\nFound cheaper alternative:")
        print(f"Product: {product['name']}")
        print(f"Price: ${product['price']:.2f}")
        print(f"Rating: {product['rating']}/5")
        print(f"Potential Savings: ${result['potential_savings']:.2f} ({result['savings_percentage']:.1f}%)")
        
        total_savings += result['potential_savings']
        original_spending += tx.amount
    
    print("\n=== Summary ===")
    print(f"Total Original Spending: ${original_spending:.2f}")
    print(f"Total Potential Savings: ${total_savings:.2f}")
    print(f"Potential Savings Percentage: {(total_savings/original_spending)*100:.1f}%")

if __name__ == "__main__":
    user_id = "d92eff61-8af1-4b8c-955c-8ae6299f497e"  # Test user id
    # min_rating = 4.0  # Set your desired minimum rating
    
    results = find_cheapest_products(user_id)
    print_results(results)