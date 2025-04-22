import json

class Income:

	def __init__(self,income_json,header):

		self.__HEADER = header

		self.__dict__.update(json.loads(json.dumps(income_json)))

		self.regularIncomeAvg = income_json['summary']['regularIncomeAvg']
		self.regularIncomeYTD = income_json['summary']['regularIncomeYTD']
		self.regularIncomeYear = income_json['summary']['regularIncomeYear']
		self.irregularIncomeAvg = income_json['summary']['irregularIncomeAvg']
