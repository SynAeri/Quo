# analysis/transactionAnalysis/deepAnalysis/categoryAssigner.py
import re
from collections import defaultdict, Counter
from typing import List, Dict, Tuple, Set
import string
from ...globals.transactions import Transaction, AllTransactions

class EnhancedTransactionAnalysis:
    def __init__(self, transactions: List[Transaction]):
        self.transactions = transactions
        self.stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
            'before', 'after', 'above', 'below', 'between', 'under', 'pty', 'ltd',
            'inc', 'corp', 'co', 'payment', 'transfer', 'purchase', 'transaction'
        }
        
    def extract_keywords(self, text: str) -> List[str]:
        """Extract meaningful keywords from transaction description"""
        # Convert to lowercase and remove special characters
        text = text.lower()
        text = re.sub(r'[^\w\s]', ' ', text)
        
        # Split into words
        words = text.split()
        
        # Remove stop words and short words
        keywords = [
            word for word in words 
            if word not in self.stop_words 
            and len(word) > 2
            and not word.isdigit()
        ]
        
        return keywords
    
    def analyze_unknown_transactions(self) -> Dict[str, List[Transaction]]:
        """Group unknown transactions by extracted topics"""
        unknown_transactions = [
            tx for tx in self.transactions 
            if tx.category.lower() in ['unknown', 'uncategorized', 'other']
        ]
        
        # Extract keywords from all unknown transactions
        keyword_freq = Counter()
        tx_keywords = {}
        
        for tx in unknown_transactions:
            keywords = self.extract_keywords(tx.description)
            tx_keywords[tx] = keywords
            keyword_freq.update(keywords)
        
        # Get top keywords (these become our sub-categories)
        top_keywords = [word for word, count in keyword_freq.most_common(20) if count >= 3]
        
        # Group transactions by dominant keyword
        grouped = defaultdict(list)
        
        for tx, keywords in tx_keywords.items():
            # Find the most relevant top keyword for this transaction
            assigned = False
            for keyword in keywords:
                if keyword in top_keywords:
                    grouped[keyword.title()].append(tx)
                    assigned = True
                    break
            
            if not assigned:
                grouped['Other'].append(tx)
        
        return dict(grouped)
    
    def get_enhanced_category_analysis(self) -> Dict:
        """Get spending by category with sub-categories for unknowns and broad categories"""
        # Standard category analysis
        category_totals = defaultdict(float)
        category_transactions = defaultdict(list)
        
        for tx in self.transactions:
            category_totals[tx.category] += tx.amount
            category_transactions[tx.category].append(tx)
        
        # Analyze broad categories
        broad_categories = ['unknown', 'uncategorized', 'other', 'non-depository financing']
        enhanced_data = {}
        
        for category, transactions in category_transactions.items():
            if category.lower() in broad_categories:
                # Break down into sub-categories
                if category.lower() in ['unknown', 'uncategorized', 'other']:
                    sub_analysis = self.analyze_unknown_transactions()
                else:
                    # For other broad categories, analyze by merchant/description patterns
                    sub_analysis = self.analyze_by_merchant_patterns(transactions)
                
                enhanced_data[category] = {
                    'total': category_totals[category],
                    'transaction_count': len(transactions),
                    'subcategories': {
                        subcat: {
                            'amount': sum(tx.amount for tx in txs),
                            'count': len(txs),
                            'transactions': txs
                        }
                        for subcat, txs in sub_analysis.items()
                    }
                }
            else:
                enhanced_data[category] = {
                    'total': category_totals[category],
                    'transaction_count': len(transactions),
                    'subcategories': None  # No breakdown needed
                }
        
        return enhanced_data
    
    def analyze_by_merchant_patterns(self, transactions: List[Transaction]) -> Dict[str, List[Transaction]]:
        """Analyze transactions by merchant/description patterns"""
        merchant_groups = defaultdict(list)
        
        for tx in transactions:
            # Extract potential merchant name (first few words)
            words = self.extract_keywords(tx.description)
            if words:
                merchant_key = ' '.join(words[:2]).title()
                merchant_groups[merchant_key].append(tx)
            else:
                merchant_groups['Other'].append(tx)
        
        # Only keep groups with multiple transactions
        filtered_groups = {
            k: v for k, v in merchant_groups.items() 
            if len(v) >= 2 or k == 'Other'
        }
        
        return filtered_groups
    
    def get_correlation_matrix(self) -> Dict[str, Dict[str, float]]:
        """Find correlations between transaction patterns"""
        #  could be expanded to find patterns like:
        # - Transactions that often occur together
        # - Time-based patterns
        # - Amount-based patterns
        
        keyword_cooccurrence = defaultdict(lambda: defaultdict(int))
        
        # Group transactions by day
        from collections import defaultdict
        daily_transactions = defaultdict(list)
        
        for tx in self.transactions:
            day_key = tx.date.date()
            daily_transactions[day_key].append(tx)
        
        # Find keywords that appear together on the same day
        for day, txs in daily_transactions.items():
            day_keywords = set()
            for tx in txs:
                keywords = self.extract_keywords(tx.description)
                day_keywords.update(keywords)
            
            # Count co-occurrences
            keywords_list = list(day_keywords)
            for i, kw1 in enumerate(keywords_list):
                for kw2 in keywords_list[i+1:]:
                    keyword_cooccurrence[kw1][kw2] += 1
                    keyword_cooccurrence[kw2][kw1] += 1
        
        return dict(keyword_cooccurrence)
