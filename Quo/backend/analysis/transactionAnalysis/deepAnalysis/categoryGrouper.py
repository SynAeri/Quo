# analysis/globals/category_grouper.py
from typing import Dict, List, Tuple
import re
from collections import defaultdict

class CategoryGrouper:
    """Groups transaction categories into super-categories using keyword matching and rules"""
    
    def __init__(self):
        # Define super-category mappings with keywords
        self.category_mappings = {
            'Health & Wellness': {
                'keywords': ['health', 'medical', 'pharmacy', 'doctor', 'hospital', 'clinic', 
                            'dental', 'optometry', 'therapy', 'insurance', 'medicare', 'gym', 
                            'fitness', 'sport', 'wellness', 'vitamin', 'supplement'],
                'exact_matches': ['Health Care Services', 'Health Insurance', 'General Insurance', 
                                'Sports and Recreation', 'Pharmacies']
            },
            'Transportation': {
                'keywords': ['transport', 'fuel', 'petrol', 'gas', 'parking', 'toll', 'uber', 
                            'taxi', 'bus', 'train', 'metro', 'vehicle', 'automotive', 'car'],
                'exact_matches': ['Fuel Retailing', 'Transportation Services', 'Public Transport',
                                'Vehicle Maintenance', 'Parking']
            },
            'Food & Dining': {
                'keywords': ['food', 'restaurant', 'cafe', 'coffee', 'takeaway', 'delivery',
                            'dining', 'meal', 'lunch', 'dinner', 'breakfast', 'fast food',
                            'bakery', 'bar', 'pub'],
                'exact_matches': ['Cafes, Restaurants and Takeaway Food Services', 
                                'Food Retailing', 'Supermarket and Grocery Stores']
            },
            'Shopping & Retail': {
                'keywords': ['retail', 'shopping', 'store', 'shop', 'fashion', 'clothing',
                            'electronics', 'hardware', 'department', 'online', 'ecommerce'],
                'exact_matches': ['General Retailing', 'Clothing Retailing', 'Department Stores',
                                'Online Shopping', 'Hardware Retailing']
            },
            'Financial Services': {
                'keywords': ['bank', 'finance', 'loan', 'credit', 'mortgage', 'investment',
                            'insurance', 'atm', 'withdrawal', 'deposit', 'transfer'],
                'exact_matches': ['Non-Depository Financing', 'Banking Services', 
                                'Investment Services', 'Financial Planning']
            },
            'Utilities & Services': {
                'keywords': ['electricity', 'gas', 'water', 'internet', 'phone', 'mobile',
                            'telecom', 'utility', 'council', 'rates'],
                'exact_matches': ['Utilities', 'Telecommunications', 'Internet Services',
                                'Council Services']
            },
            'Entertainment & Leisure': {
                'keywords': ['entertainment', 'movie', 'cinema', 'gaming', 'music', 'streaming',
                            'subscription', 'hobby', 'leisure', 'recreation'],
                'exact_matches': ['Entertainment Services', 'Streaming Services', 
                                'Gaming', 'Hobbies']
            },
            'Education & Professional': {
                'keywords': ['education', 'school', 'university', 'course', 'training',
                            'professional', 'conference', 'book', 'learning'],
                'exact_matches': ['Education Services', 'Professional Services', 
                                'Training and Development']
            },
            'Home & Living': {
                'keywords': ['home', 'furniture', 'appliance', 'maintenance', 'repair',
                            'cleaning', 'garden', 'hardware', 'renovation'],
                'exact_matches': ['Home Maintenance', 'Furniture and Appliances', 
                                'Home Services']
            }
        }
        
        # Categories that need special NLP processing
        self.special_categories = ['unknown', 'uncategorized', 'other', 'no category']
    
    def classify_category(self, category_name: str) -> str:
        """Classify a category into a super-category"""
        category_lower = category_name.lower()
        
        # Check exact matches first
        for super_cat, rules in self.category_mappings.items():
            if category_name in rules['exact_matches']:
                return super_cat
        
        # Check keyword matches
        for super_cat, rules in self.category_mappings.items():
            for keyword in rules['keywords']:
                if keyword in category_lower:
                    return super_cat
        
        # If no match found, return 'Other'
        return 'Other Services'
    
    def group_categories(self, categories_data: List[Dict]) -> Dict[str, Dict]:
        """
        Group categories into super-categories
        Input: [{'name': 'Health Insurance', 'amount': 1000}, ...]
        Output: {
            'Health & Wellness': {
                'total': 2000,
                'subcategories': [{'name': 'Health Insurance', 'amount': 1000}, ...],
                'percentage': 20.5
            },
            ...
        }
        """
        grouped = defaultdict(lambda: {'total': 0, 'subcategories': [], 'percentage': 0})
        total_amount = sum(cat['amount'] for cat in categories_data)
        
        for category in categories_data:
            # Check if it's a special category that needs NLP processing
            if category['name'].lower() in self.special_categories:
                super_cat = 'Uncategorized'
            else:
                super_cat = self.classify_category(category['name'])
            
            grouped[super_cat]['subcategories'].append(category)
            grouped[super_cat]['total'] += category['amount']
        
        # Calculate percentages
        for super_cat in grouped:
            grouped[super_cat]['percentage'] = (grouped[super_cat]['total'] / total_amount * 100) if total_amount > 0 else 0
        
        # Sort subcategories by amount
        for super_cat in grouped:
            grouped[super_cat]['subcategories'].sort(key=lambda x: x['amount'], reverse=True)
        
        return dict(grouped)
    
    def get_category_insights(self, grouped_data: Dict) -> Dict:
        """Generate insights about the grouped categories"""
        insights = {
            'largest_super_category': None,
            'most_diverse_category': None,
            'concentration_score': 0,  # How concentrated spending is (0-1)
            'num_super_categories': len(grouped_data),
            'recommendations': []
        }
        
        if not grouped_data:
            return insights
        
        # Find largest super category
        largest = max(grouped_data.items(), key=lambda x: x[1]['total'])
        insights['largest_super_category'] = {
            'name': largest[0],
            'amount': largest[1]['total'],
            'percentage': largest[1]['percentage']
        }
        
        # Find most diverse (most subcategories)
        most_diverse = max(grouped_data.items(), key=lambda x: len(x[1]['subcategories']))
        insights['most_diverse_category'] = {
            'name': most_diverse[0],
            'num_subcategories': len(most_diverse[1]['subcategories'])
        }
        
        # Calculate concentration score (Herfindahl index)
        total = sum(cat['total'] for cat in grouped_data.values())
        if total > 0:
            concentration = sum((cat['total'] / total) ** 2 for cat in grouped_data.values())
            insights['concentration_score'] = concentration
        
        # Generate recommendations
        if insights['concentration_score'] > 0.5:
            insights['recommendations'].append(
                "Your spending is highly concentrated. Consider diversifying your expenses."
            )
        
        if 'Uncategorized' in grouped_data and grouped_data['Uncategorized']['percentage'] > 20:
            insights['recommendations'].append(
                f"{grouped_data['Uncategorized']['percentage']:.1f}% of spending is uncategorized. "
                "Review these transactions for better insights."
            )
        
        return insights
