#!/usr/bin/env python3
# test_grouper.py - Run this from your backend directory

import sys
import os

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

print(f"Python path: {sys.path[0]}")
print(f"Current directory: {os.getcwd()}")

# Test 1: Can we import the module?
print("\n1. Testing import...")
try:
    from analysis.transactionAnalysis.deepAnalysis.categoryGrouper import CategoryGrouper
    print("✅ Successfully imported CategoryGrouper")
except ImportError as e:
    print(f"❌ Import failed: {e}")
    print("\nChecking file existence...")
    
    # Check if file exists
    file_path = os.path.join(backend_dir, "analysis", "transactionAnalysis", "deepAnalysis", "categoryGrouper.py")
    if os.path.exists(file_path):
        print(f"✅ File exists at: {file_path}")
        print(f"File size: {os.path.getsize(file_path)} bytes")
        
        # Try to read first few lines
        with open(file_path, 'r') as f:
            lines = f.readlines()[:10]
            print("\nFirst 10 lines of file:")
            for i, line in enumerate(lines):
                print(f"{i+1}: {line.rstrip()}")
    else:
        print(f"❌ File NOT found at: {file_path}")
    
    sys.exit(1)

# Test 2: Can we instantiate it?
print("\n2. Testing instantiation...")
try:
    grouper = CategoryGrouper()
    print("✅ Successfully created CategoryGrouper instance")
except Exception as e:
    print(f"❌ Failed to create instance: {e}")
    sys.exit(1)

# Test 3: Test with sample data
print("\n3. Testing grouping functionality...")
test_categories = [
    {"name": "Cafes, Restaurants and Takeaway Food Services", "amount": 500},
    {"name": "Fuel Retailing", "amount": 200},
    {"name": "Health Insurance", "amount": 150},
    {"name": "Supermarket and Grocery Stores", "amount": 300},
    {"name": "General Retailing", "amount": 100},
    {"name": "Unknown", "amount": 50}
]

try:
    result = grouper.group_categories(test_categories)
    print(f"✅ Grouping successful!")
    print(f"Number of groups: {len(result)}")
    
    # Handle both dict and list returns
    if isinstance(result, dict):
        for group_name, group_data in result.items():
            if isinstance(group_data, dict):
                print(f"\n{group_name}:")
                print(f"  Total: ${group_data.get('total', 'N/A')}")
                print(f"  Categories: {len(group_data.get('subcategories', []))}")
            elif isinstance(group_data, list):
                total = sum(cat.get('amount', 0) for cat in group_data)
                print(f"\n{group_name}:")
                print(f"  Total: ${total}")
                print(f"  Categories: {len(group_data)}")
                for cat in group_data[:2]:  # Show first 2
                    print(f"    - {cat['name']}: ${cat['amount']}")
    elif isinstance(result, list):
        for group in result:
            print(f"\n{group.get('name', 'Unknown')}:")
            print(f"  Total: ${group.get('total', 0)}")
            print(f"  Categories: {len(group.get('categories', []))}")
            
except Exception as e:
    print(f"❌ Grouping failed: {e}")
    import traceback
    traceback.print_exc()

# Test 4: Check if the module has expected methods
print("\n4. Checking module contents...")
if 'grouper' in locals():
    methods = [method for method in dir(grouper) if not method.startswith('_')]
    print(f"Available methods: {methods}")
    
    if hasattr(grouper, 'get_category_insights'):
        print("✅ get_category_insights method exists")
    else:
        print("❌ get_category_insights method NOT found")

print("\n✅ All tests completed!")
