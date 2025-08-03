import requests
import json
url = "https://au-api.basiq.io/users/d92eff61-8af1-4b8c-955c-8ae6299f497e/transactions?limit=500"

headers = {
    "accept": "application/json",
    "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXJ0bmVyaWQiOiI4NjVmYjdhMC01NThhLTRlMDMtYmZhNy05NDIxNTNiZWQxMTAiLCJhcHBsaWNhdGlvbmlkIjoiOGZmYTY5YWYtODhlMy00YTU3LThmMzMtYTVlMGE3YzA5OGY3Iiwic2NvcGUiOiJTRVJWRVJfQUNDRVNTIiwic2FuZGJveF9hY2NvdW50Ijp0cnVlLCJjb25uZWN0X3N0YXRlbWVudHMiOmZhbHNlLCJlbnJpY2giOiJkaXNhYmxlZCIsImVucmljaF9hcGlfa2V5IjoiQWJXUGdxQUd4dzFYazZPYW1FZ2d6NVZrU0ZoSUwxNXY2dGhtUlQ3dyIsImVucmljaF9lbnRpdHkiOmZhbHNlLCJlbnJpY2hfbG9jYXRpb24iOmZhbHNlLCJlbnJpY2hfY2F0ZWdvcnkiOmZhbHNlLCJhZmZvcmRhYmlsaXR5Ijoic2FuZGJveCIsImluY29tZSI6InNhbmRib3giLCJleHBlbnNlcyI6InNhbmRib3giLCJleHAiOjE3NDQyMDgxMDIsImlhdCI6MTc0NDIwNDUwMiwidmVyc2lvbiI6IjMuMCIsImRlbmllZF9wZXJtaXNzaW9ucyI6W119.wPjplw9VUAglfFFwqy-poGTVQZUxhiaw66k92Mvs0uI"
}

response = requests.get(url, headers=headers)

# Pretty print the JSON response
if response.status_code == 200:
    data = response.json()  # Convert to dictionary
    print(json.dumps(data, indent=4))  # Format nicely
else:
    print(f"Error: {response.status_code}, {response.text}")