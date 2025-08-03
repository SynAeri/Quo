import requests

USER_LIST_URL = "https://au-api.basiq.io/users"

def get_sandbox_users():
    headers = {
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXJ0bmVyaWQiOiI4NjVmYjdhMC01NThhLTRlMDMtYmZhNy05NDIxNTNiZWQxMTAiLCJhcHBsaWNhdGlvbmlkIjoiOGZmYTY5YWYtODhlMy00YTU3LThmMzMtYTVlMGE3YzA5OGY3Iiwic2NvcGUiOiJTRVJWRVJfQUNDRVNTIiwic2FuZGJveF9hY2NvdW50Ijp0cnVlLCJjb25uZWN0X3N0YXRlbWVudHMiOmZhbHNlLCJlbnJpY2giOiJkaXNhYmxlZCIsImVucmljaF9hcGlfa2V5IjoiQWJXUGdxQUd4dzFYazZPYW1FZ2d6NVZrU0ZoSUwxNXY2dGhtUlQ3dyIsImVucmljaF9lbnRpdHkiOmZhbHNlLCJlbnJpY2hfbG9jYXRpb24iOmZhbHNlLCJlbnJpY2hfY2F0ZWdvcnkiOmZhbHNlLCJhZmZvcmRhYmlsaXR5Ijoic2FuZGJveCIsImluY29tZSI6InNhbmRib3giLCJleHBlbnNlcyI6InNhbmRib3giLCJleHAiOjE3NDQyMDgxMDIsImlhdCI6MTc0NDIwNDUwMiwidmVyc2lvbiI6IjMuMCIsImRlbmllZF9wZXJtaXNzaW9ucyI6W119.wPjplw9VUAglfFFwqy-poGTVQZUxhiaw66k92Mvs0uI",
        "basiq-version": "3.0",
    }
    response = requests.get(USER_LIST_URL, headers=headers)
    if response.status_code == 200:
        print(response)
        return response.json()["data"]  # Returns a list of users
    else:
        print("Error:", response.text)
        return None

sandbox_users = get_sandbox_users()

print(sandbox_users)
