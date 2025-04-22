class APIError(Exception):
   
	def __init__(self, error_json):
		
		self.correlationId = error_json['correlationId']
		
		errors_list = []

		for error in error_json['data']:
			
			errors_list.append(error['code'] + ": " + error['detail'])

		self.errors = ", ".join(errors_list)

	def __str__(self):
		return(self.errors)
