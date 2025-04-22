import json

class Expense:

	def __init__(self,expense_json,header):

		self.__HEADER = header

		self.__dict__.update(json.loads(json.dumps(expense_json)))

		self.payments = {}
		self.totalMonthly = 0.0

		for payment in expense_json['payments']:

			self.payments[payment['division']] = payment['avgMonthly']
			self.totalMonthly = self.totalMonthly + float(payment['avgMonthly'])

