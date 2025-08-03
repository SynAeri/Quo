# analysis/transactionAnalysis/deepAnalysis/subscriptionDetector.py

from datetime import datetime, timedelta
from collections import defaultdict
import re
from typing import List, Dict, Any

class SubscriptionDetector:
    """
    AI-powered subscription detection from transaction data
    """
    
    def __init__(self):
        # Common subscription keywords
        self.subscription_keywords = [
            'subscription', 'monthly', 'annual', 'membership', 'premium',
            'pro', 'plus', 'prime', 'recurring', 'billing', 'renewal'
        ]
        
        # Known subscription services
        self.known_subscriptions = {
            'spotify': {'category': 'Music Streaming', 'typical_range': (9, 20)},
            'netflix': {'category': 'Video Streaming', 'typical_range': (10, 25)},
            'apple': {'category': 'Various', 'typical_range': (0.99, 50)},
            'google': {'category': 'Various', 'typical_range': (1.99, 50)},
            'amazon prime': {'category': 'Shopping/Video', 'typical_range': (10, 15)},
            'gym': {'category': 'Fitness', 'typical_range': (20, 200)},
            'adobe': {'category': 'Software', 'typical_range': (10, 60)},
            'microsoft': {'category': 'Software', 'typical_range': (5, 30)},
            'dropbox': {'category': 'Storage', 'typical_range': (10, 20)},
            'linkedin': {'category': 'Professional', 'typical_range': (30, 60)},
            'audible': {'category': 'Audiobooks', 'typical_range': (15, 25)},
            'disney': {'category': 'Video Streaming', 'typical_range': (8, 15)},
            'hulu': {'category': 'Video Streaming', 'typical_range': (8, 20)},
            'youtube': {'category': 'Video Streaming', 'typical_range': (12, 25)},
            'patreon': {'category': 'Content Support', 'typical_range': (1, 100)},
            'news': {'category': 'News/Media', 'typical_range': (5, 40)},
            'times': {'category': 'News/Media', 'typical_range': (5, 40)},
            'post': {'category': 'News/Media', 'typical_range': (5, 40)},
        }
        
    def detect_subscriptions(self, transactions: List[Any]) -> List[Dict[str, Any]]:
        """
        Detect potential subscriptions from transaction list
        """
        # Group transactions by description and amount
        transaction_groups = defaultdict(list)
        
        for tx in transactions:
            # Create a normalized key (description + rounded amount)
            key = self._normalize_description(tx.description)
            amount_key = round(tx.amount, 0)  # Round to nearest dollar
            group_key = f"{key}_{amount_key}"
            
            transaction_groups[group_key].append({
                'date': tx.date,
                'amount': tx.amount,
                'description': tx.description,
                'original_description': tx.description
            })
        
        detected_subscriptions = []
        
        # Analyze each group
        for group_key, group_transactions in transaction_groups.items():
            if len(group_transactions) >= 2:  # At least 2 occurrences
                # Check if it's a recurring pattern
                subscription_info = self._analyze_recurrence_pattern(group_transactions)
                
                if subscription_info:
                    # Enhance with category detection
                    subscription_info['category'] = self._detect_category(
                        group_transactions[0]['description']
                    )
                    subscription_info['confidence'] = self._calculate_confidence(
                        subscription_info, 
                        group_transactions
                    )
                    
                    if subscription_info['confidence'] > 0.6:  # 60% confidence threshold
                        detected_subscriptions.append(subscription_info)
        
        # Sort by amount (highest first)
        detected_subscriptions.sort(key=lambda x: x['amount'], reverse=True)
        
        return detected_subscriptions
    
    def _normalize_description(self, description: str) -> str:
        """
        Normalize transaction description for grouping
        """
        # Convert to lowercase
        normalized = description.lower()
        
        # Remove common transaction codes and numbers
        normalized = re.sub(r'\b\d{4,}\b', '', normalized)  # Remove long numbers
        normalized = re.sub(r'#\d+', '', normalized)  # Remove reference numbers
        normalized = re.sub(r'\*\d+', '', normalized)  # Remove masked numbers
        normalized = re.sub(r'[^\w\s]', ' ', normalized)  # Remove special chars
        
        # Extract key merchant name (usually first meaningful words)
        words = normalized.split()
        if words:
            # Take first 2-3 meaningful words
            meaningful_words = [w for w in words if len(w) > 2][:3]
            normalized = ' '.join(meaningful_words)
        
        return normalized.strip()
    
    def _analyze_recurrence_pattern(self, transactions: List[Dict]) -> Dict[str, Any]:
        """
        Analyze if transactions follow a subscription pattern
        """
        if len(transactions) < 2:
            return None
        
        # Sort by date
        sorted_txns = sorted(transactions, key=lambda x: x['date'])
        
        # Calculate intervals between transactions
        intervals = []
        for i in range(1, len(sorted_txns)):
            interval = (sorted_txns[i]['date'] - sorted_txns[i-1]['date']).days
            intervals.append(interval)
        
        if not intervals:
            return None
        
        # Detect pattern
        avg_interval = sum(intervals) / len(intervals)
        
        # Determine frequency
        if 25 <= avg_interval <= 35:  # Monthly
            frequency = 'monthly'
            expected_interval = 30
        elif 355 <= avg_interval <= 375:  # Annual
            frequency = 'annual'
            expected_interval = 365
        elif 83 <= avg_interval <= 97:  # Quarterly
            frequency = 'quarterly'
            expected_interval = 90
        elif 13 <= avg_interval <= 15:  # Bi-weekly
            frequency = 'bi-weekly'
            expected_interval = 14
        elif 6 <= avg_interval <= 8:  # Weekly
            frequency = 'weekly'
            expected_interval = 7
        else:
            return None  # No clear pattern
        
        # Check consistency
        consistency_score = self._calculate_interval_consistency(intervals, expected_interval)
        
        if consistency_score < 0.7:  # Not consistent enough
            return None
        
        # Get the most recent transaction info
        latest = sorted_txns[-1]
        
        return {
            'name': latest['original_description'][:50],  # Truncate long descriptions
            'amount': latest['amount'],
            'frequency': frequency,
            'last_charged': latest['date'].strftime('%Y-%m-%d'),
            'next_expected': (latest['date'] + timedelta(days=expected_interval)).strftime('%Y-%m-%d'),
            'occurrences': len(transactions),
            'consistency_score': consistency_score
        }
    
    def _calculate_interval_consistency(self, intervals: List[int], expected: int) -> float:
        """
        Calculate how consistent the intervals are
        """
        if not intervals:
            return 0.0
        
        # Calculate variance from expected interval
        variances = [abs(interval - expected) / expected for interval in intervals]
        avg_variance = sum(variances) / len(variances)
        
        # Convert to score (1.0 = perfect consistency)
        consistency = max(0, 1 - avg_variance)
        
        return consistency
    
    def _detect_category(self, description: str) -> str:
        """
        Detect subscription category using AI logic
        """
        desc_lower = description.lower()
        
        # Check against known subscriptions
        for service, info in self.known_subscriptions.items():
            if service in desc_lower:
                return info['category']
        
        # Category keywords mapping
        category_keywords = {
            'Streaming': ['stream', 'tv', 'video', 'movie', 'watch', 'entertainment'],
            'Music': ['music', 'audio', 'song', 'playlist', 'radio'],
            'Software': ['software', 'app', 'cloud', 'saas', 'tool', 'platform'],
            'Gaming': ['game', 'gaming', 'xbox', 'playstation', 'steam', 'nintendo'],
            'Fitness': ['gym', 'fitness', 'workout', 'yoga', 'health', 'training'],
            'Food': ['meal', 'food', 'delivery', 'kitchen', 'recipe'],
            'News/Media': ['news', 'magazine', 'journal', 'times', 'post', 'media'],
            'Storage': ['storage', 'backup', 'drive', 'cloud'],
            'Professional': ['professional', 'business', 'linkedin', 'career'],
            'Education': ['course', 'learning', 'education', 'tutorial', 'masterclass'],
            'Shopping': ['prime', 'membership', 'delivery', 'shopping'],
            'Other': []
        }
        
        # Check each category
        for category, keywords in category_keywords.items():
            for keyword in keywords:
                if keyword in desc_lower:
                    return category
        
        # Check for subscription keywords
        for keyword in self.subscription_keywords:
            if keyword in desc_lower:
                return 'Other Subscription'
        
        return 'Other'
    
    def _calculate_confidence(self, subscription_info: Dict, transactions: List[Dict]) -> float:
        """
        Calculate confidence score for subscription detection
        """
        confidence = 0.0
        
        # Base confidence from consistency
        confidence += subscription_info['consistency_score'] * 0.4
        
        # Confidence from number of occurrences
        occurrences = subscription_info['occurrences']
        if occurrences >= 6:
            confidence += 0.3
        elif occurrences >= 3:
            confidence += 0.2
        else:
            confidence += 0.1
        
        # Confidence from description
        desc_lower = transactions[0]['description'].lower()
        
        # Check for subscription keywords
        keyword_found = any(keyword in desc_lower for keyword in self.subscription_keywords)
        if keyword_found:
            confidence += 0.2
        
        # Check if it's a known service
        known_service = any(service in desc_lower for service in self.known_subscriptions.keys())
        if known_service:
            confidence += 0.1
        
        return min(confidence, 1.0)  # Cap at 1.0
    
    def analyze_subscription_health(self, subscriptions: List[Dict]) -> Dict[str, Any]:
        """
        Analyze overall subscription health and provide insights
        """
        if not subscriptions:
            return {
                'total_count': 0,
                'total_monthly_cost': 0,
                'insights': []
            }
        
        # Calculate totals
        total_monthly = 0
        category_breakdown = defaultdict(float)
        
        for sub in subscriptions:
            monthly_amount = self._convert_to_monthly(sub['amount'], sub['frequency'])
            total_monthly += monthly_amount
            category_breakdown[sub['category']] += monthly_amount
        
        # Generate insights
        insights = []
        
        # Total cost insight
        if total_monthly > 200:
            insights.append({
                'type': 'warning',
                'message': f'Your subscriptions total ${total_monthly:.2f}/month, which is quite high',
                'suggestion': 'Consider auditing subscriptions you rarely use'
            })
        
        # Category concentration
        if category_breakdown:
            top_category = max(category_breakdown.items(), key=lambda x: x[1])
            if top_category[1] > total_monthly * 0.5:
                insights.append({
                    'type': 'info',
                    'message': f'Over 50% of subscription spending is on {top_category[0]}',
                    'suggestion': f'Review if you need all {top_category[0]} subscriptions'
                })
        
        # Duplicate detection
        duplicates = self._detect_duplicate_services(subscriptions)
        if duplicates:
            insights.append({
                'type': 'warning',
                'message': f'Potential duplicate services detected: {", ".join(duplicates)}',
                'suggestion': 'You might be paying for similar services'
            })
        
        return {
            'total_count': len(subscriptions),
            'total_monthly_cost': total_monthly,
            'total_annual_cost': total_monthly * 12,
            'category_breakdown': dict(category_breakdown),
            'insights': insights,
            'duplicates': duplicates
        }
    
    def _convert_to_monthly(self, amount: float, frequency: str) -> float:
        """
        Convert subscription amount to monthly equivalent
        """
        conversions = {
            'monthly': 1,
            'annual': 1/12,
            'quarterly': 1/3,
            'bi-weekly': 26/12,  # 26 bi-weekly periods per year
            'weekly': 52/12  # 52 weeks per year
        }
        
        return amount * conversions.get(frequency, 1)
    
    def _detect_duplicate_services(self, subscriptions: List[Dict]) -> List[str]:
        """
        Detect potential duplicate services
        """
        duplicates = []
        
        # Group by category
        category_services = defaultdict(list)
        for sub in subscriptions:
            category_services[sub['category']].append(sub['name'])
        
        # Check for duplicates in streaming services
        streaming_services = category_services.get('Streaming', []) + category_services.get('Video Streaming', [])
        if len(streaming_services) >= 3:
            duplicates.append('Multiple streaming services')
        
        # Check for duplicates in music services
        music_services = category_services.get('Music', []) + category_services.get('Music Streaming', [])
        if len(music_services) >= 2:
            duplicates.append('Multiple music services')
        
        # Check for duplicates in cloud storage
        storage_services = category_services.get('Storage', [])
        if len(storage_services) >= 2:
            duplicates.append('Multiple cloud storage services')
        
        return duplicates
