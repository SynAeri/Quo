import requests

url = "https://au-api.basiq.io/users"

payload = {
    "businessAddress": {
        "addressLine1": "21 Sydney Rd",
        "suburb": "Manly",
        "state": "NSW",
        "postcode": "2095",
        "countryCode": "AUS"
    },
    "email": "gavin@hooli.com",
    "businessIdNo": "16 7645 892",
    "businessIdNoType": "ACN",
    "businessName": "Manly Accounting",
    "lastName": "Belson",
    "firstName": "Gavin",
    "mobile": "+61481759923",
    "verificationStatus": True,
    "verificationDate": "12/01/2024"
}
headers = {
    "accept": "application/json",
    "content-type": "application/json",
    "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXJ0bmVyaWQiOiI4NjVmYjdhMC01NThhLTRlMDMtYmZhNy05NDIxNTNiZWQxMTAiLCJhcHBsaWNhdGlvbmlkIjoiOGZmYTY5YWYtODhlMy00YTU3LThmMzMtYTVlMGE3YzA5OGY3Iiwic2NvcGUiOiJTRVJWRVJfQUNDRVNTIiwic2FuZGJveF9hY2NvdW50Ijp0cnVlLCJjb25uZWN0X3N0YXRlbWVudHMiOmZhbHNlLCJlbnJpY2giOiJkaXNhYmxlZCIsImVucmljaF9hcGlfa2V5IjoiQWJXUGdxQUd4dzFYazZPYW1FZ2d6NVZrU0ZoSUwxNXY2dGhtUlQ3dyIsImVucmljaF9lbnRpdHkiOmZhbHNlLCJlbnJpY2hfbG9jYXRpb24iOmZhbHNlLCJlbnJpY2hfY2F0ZWdvcnkiOmZhbHNlLCJhZmZvcmRhYmlsaXR5Ijoic2FuZGJveCIsImluY29tZSI6InNhbmRib3giLCJleHBlbnNlcyI6InNhbmRib3giLCJleHAiOjE3NDM1MTU4NzUsImlhdCI6MTc0MzUxMjI3NSwidmVyc2lvbiI6IjMuMCIsImRlbmllZF9wZXJtaXNzaW9ucyI6W119._b4zbNo0xaJTvP1NnY1sH-Djj0ao5B_2Li9wxgv8PaM"
}

response = requests.post(url, json=payload, headers=headers)

print(response.text)