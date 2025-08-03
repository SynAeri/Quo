# Functionless scraper

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import re

# Issues & Potential Solutions:
# 1. could maybe add a minimum review count? 
# not sure if necessary, adds more work for user

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


search_terms = "noise cancelling headphones"
amount = 20.0
# def scrape_alibaba(search_terms, amount):
    # initialises the cheapest price to the input amount (actual transaction price)
cheapest_product_price = amount

start_time = time.time()

driver = webdriver.Chrome()
driver.get("https://www.alibaba.com")

# waits until search bar input element is loaded then assigns it to search_input
search_input = WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.CSS_SELECTOR, "input.search-bar-input")))

# clears search input box
search_input.clear()

# enters desired input (product name / description) into search box
search_input.send_keys(f'{search_terms}')

# press enter key to search
search_input.send_keys(Keys.RETURN)

# gets wrapper of each product 
products = driver.find_elements(By.CSS_SELECTOR, ".searchx-offer-item")
cheapest_product = []
g = 0
for i in products:
    # gets name, price, and rating of each item
    name = i.find_element(By.CSS_SELECTOR, "h2")
    price = i.find_element(By.CSS_SELECTOR, ".search-card-e-price-main")
    link_element = i.find_element(By.CSS_SELECTOR, ".search-card-e-slider__link")
    link = link_element.get_attribute("href")

    # skips products that aren't orderable (they have a price range + you need to contact seller to buy)
    if '-' in price.text:
        continue

    # checks if rating is available. if not, skips that product
    try:
        rating_container = i.find_element(By.CSS_SELECTOR, ".search-card-e-review")
        # makes the rating into a float and only takes the first 3 chars (e.g. 4.4)
        rating = float(rating_container.text[:3])

    except:
        continue
    
    # skips items with rating under the input minimum rating
    # if rating < minimum_rating:
        # continue

    # removes A$ from price and converts to a float so we can compare with transaction price
    price_value = float(re.sub(r'[^\d.]', '', price.text))  
    if (price_value < cheapest_product_price):
        cheapest_product_price = price_value
        cheapest_product_name = name.text
        cheapest_product_rating = rating
        cheapest_product.append({
            'price': price_value,
            'name': name.text,
            'rating': rating,
            'link': link

        })
    print(name.text)
    print(price_value)
    print(rating)
    print(link)
    print('\n')
    g = g + 1
    
    # print(f'{g} products found above {minimum_rating} rating')

    # return cheapest_product

driver.close()

# class that each product is in: class="fy23-search-card m-gallery-product-item-v2 J-search-card-wrapper fy23-gallery-card searchx-offer-item"

print(f'The cheapest product we found was {cheapest_product_name}, with a price of ${cheapest_product_price} and a rating of {cheapest_product_rating}')
print(f'\nHere is the link to this product: \n{link}')
print("Time taken for process --- %s seconds ---" % (time.time() - start_time))
