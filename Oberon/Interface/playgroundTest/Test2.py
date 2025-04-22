import requests
import json
url = "https://au-api.basiq.io/users"


data = {
  "email": "gavin@hooli.com",
  "mobile": "+61410888999",
  "firstName": "Gavin",
  "lastName": "Belson",
  "verificationStatus": True,
  "verificationDate": "12/01/2024"
}

headers = {

    "accept": "application/json",
    "content-type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXJ0bmVyaWQiOiI4NjVmYjdhMC01NThhLTRlMDMtYmZhNy05NDIxNTNiZWQxMTAiLCJhcHBsaWNhdGlvbmlkIjoiOGZmYTY5YWYtODhlMy00YTU3LThmMzMtYTVlMGE3YzA5OGY3Iiwic2NvcGUiOiJTRVJWRVJfQUNDRVNTIiwic2FuZGJveF9hY2NvdW50Ijp0cnVlLCJjb25uZWN0X3N0YXRlbWVudHMiOmZhbHNlLCJlbnJpY2giOiJkaXNhYmxlZCIsImVucmljaF9hcGlfa2V5IjoiQWJXUGdxQUd4dzFYazZPYW1FZ2d6NVZrU0ZoSUwxNXY2dGhtUlQ3dyIsImVucmljaF9lbnRpdHkiOmZhbHNlLCJlbnJpY2hfbG9jYXRpb24iOmZhbHNlLCJlbnJpY2hfY2F0ZWdvcnkiOmZhbHNlLCJhZmZvcmRhYmlsaXR5Ijoic2FuZGJveCIsImluY29tZSI6InNhbmRib3giLCJleHBlbnNlcyI6InNhbmRib3giLCJleHAiOjE3NDM0OTk2NzgsImlhdCI6MTc0MzQ5NjA3OCwidmVyc2lvbiI6IjMuMCIsImRlbmllZF9wZXJtaXNzaW9ucyI6W119.PqtZ2xlLaEotDOk39tE5j2Hy2bY1C0EsytoRSGqLoNI",
    "basiq-version": "3,0"
}

response = requests.post(url, headers=headers, data=json.dumps(data))

print(response.text)