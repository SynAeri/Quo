import requests
from requests.auth import HTTPBasicAuth
import base64
api_key = "OGZmYTY5YWYtODhlMy00YTU3LThmMzMtYTVlMGE3YzA5OGY3OmFiN2E4NzU4LWNkYjktNGQ5Ny05NDYyLTIxYjI0OTUwOGVkYw=="
encoded_key = base64.b64encode(f"{api_key}:".encode('utf-8')).decode('utf-8')
print(f"Base64 Encoded API Key: {encoded_key}")

url = "https://au-api.basiq.io/token"

headers = {
    "accept": "application/json",
    "content-type": "application/x-www-form-urlencoded",
    "Authorization": "Basic OGZmYTY5YWYtODhlMy00YTU3LThmMzMtYTVlMGE3YzA5OGY3OmFiN2E4NzU4LWNkYjktNGQ5Ny05NDYyLTIxYjI0OTUwOGVkYw==",
    "basiq-version": "3.0"
}

response = requests.post(url, headers=headers)

print(response.text)