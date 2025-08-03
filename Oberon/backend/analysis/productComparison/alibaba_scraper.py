# Alibaba_Scraper

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import re

# Issues & Potential Solutions:
# 1. doesn't get and give link of cheapest product 
# can fix pretty quick

# 2. just does cheapest product with rating above min rating, doesn't look at what the product actually is and whether it is the same thing
# can maybe add a "Not what you wanted?" section and show the other products that fit the criteria (by storing all potential cheapest products 
# in an array), hopefully one matches properly

# 3. if description is not helpful / unrelated to actual product, will be hard to come to a good solution
# maybe alongside the "Not what you wanted" prompt, have a thing asking them "What is the product that you want?" and they can input what they
# want e.g. "lava lamp", then that input can replace the "search_terms" input into the function, and we can scrape again

# 4. only works for alibaba
# i believe the code i have written is fairly reproducible for similar sites, mainly just have to change the elements it accesses according to
# diff sites names

# 5. transaction is a payment of a full shopping order with multiple products
# maybe ask them to enter the product names they ordered, separated by commas or something, and we can perform a scrape on each product name
# otherwise, could maybe ask them to upload digital receipt which we can scrape for product names (if there is a consistent format to the receipts)
# potentially upload physical receipt and we scan the image for product names (not sure if this is possible)

# 6. lots of transactions aren't shopping, and there's no tag for shopping, need to filter type to ONLY check "payment" type transactions
# unsure if i did the payment type only filter properly

# 7. efficiency could be improved
# as jordan mentioned, selenium is open source, could just take only the functions i use in selenium, although unsure how much time that would save
# i've avoided using time.sleep() as it just guarantees more time, webdriverwait till expected conditions are met is better as it only waits 
# as much as necessary


# description = "noise cancelling headphones"
# amount = 20.0
def scrape_alibaba(search_terms, amount):
    # initialises the cheapest price to the input amount (actual transaction price)
    cheapest_products = []
    driver = None
    
    try:
        # Setup Chrome driver
        driver = webdriver.Chrome()
        driver.get("https://www.alibaba.com")
        
        # Wait for search bar and search
        search_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input.search-bar-input"))
        )
        
        search_input.clear()
        search_input.send_keys(search_terms)
        search_input.send_keys(Keys.RETURN)
        
        # Wait for results to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".organic-list"))
        )
        
        # Get products
        products = driver.find_elements(By.CSS_SELECTOR, ".fy23-search-card")[:20]  # Limit to 20
        
        print(f"Found {len(products)} products on page")
        
        for product in products:
            try:
                # Get product details
                name_elem = product.find_element(By.CSS_SELECTOR, "h2")
                price_elem = product.find_element(By.CSS_SELECTOR, ".search-card-e-price-main")
                
                # Skip price ranges
                if '-' in price_elem.text:
                    continue
                
                # Extract price
                price_text = price_elem.text
                price_value = float(re.sub(r'[^\d.]', '', price_text))
                
                # Only include if cheaper than transaction amount
                if price_value < amount:
                    # Get link
                    link = "#"
                    try:
                        link_elem = product.find_element(By.CSS_SELECTOR, "a")
                        link = link_elem.get_attribute("href")
                        if not link.startswith("http"):
                            link = "https://www.alibaba.com" + link
                    except:
                        pass
                    
                    # Get rating if available
                    rating = 0.0
                    try:
                        rating_elem = product.find_element(By.CSS_SELECTOR, ".search-card-e-review")
                        rating_text = rating_elem.text
                        if rating_text:
                            rating = float(rating_text[:3])
                    except:
                        pass
                    
                    product_data = {
                        'name': name_elem.text[:150],  # Limit name length
                        'price': price_value,
                        'rating': rating,
                        'link': link
                    }
                    
                    cheapest_products.append(product_data)
                    print(f"Added product: {product_data['name'][:50]}... - ${price_value}")
                    
            except Exception as e:
                print(f"Error parsing product: {e}")
                continue
        
        # Sort by price
        cheapest_products.sort(key=lambda x: x['price'])
        
        print(f"Found {len(cheapest_products)} cheaper alternatives")
        
        # Return top 5 cheapest
        return cheapest_products[:5]
        
    except Exception as e:
        print(f"Scraping error: {e}")
        return []
        
    finally:
        if driver:
            driver.quit()
