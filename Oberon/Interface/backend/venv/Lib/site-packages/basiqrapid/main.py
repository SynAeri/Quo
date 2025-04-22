import json
import requests

try:
	from .APIError import APIError
	from .util import *
	from .Income import Income
	from .Expense import Expense
	from .Job import Job
except:
	from APIError import APIError
	from util import *
	from Income import Income
	from Expense import Expense
	from Job import Job

class Session:

	API_URL = "https://au-api.basiq.io"

	def __init__(self, API_KEY):

		self.__Auth_header = {}
		self.__Auth_header['Authorization'] = "Basic " + API_KEY
		self.__Auth_header['Content-Type'] = 'application/x-www-form-urlencoded'
		self.__Auth_header['basiq-version'] = '2.0'

		self.__Auth_req = {'scope':'CLIENT_ACCESS'}

		self.__r_auth = requests.post(self.API_URL + "/token", headers=self.__Auth_header, json=self.__Auth_req)
		self.__r_auth = self.__r_auth.json()

		self.__HEADER = {}
		self.__HEADER['Authorization'] = self.__r_auth['token_type'] + " " + self.__r_auth['access_token']

	def createUser(self,email="",mobile=""):

		"""
		Creates User.

		Creates user and returns User object.

		Parameters
		----------
		email : str
			User's email. Optional if mobile entered.
		mobile : str
			User's mobile number. Optional if email entered.

		Returns
		-------
		User (obj)
			Returns the created User class object.

		"""

		user_req = {}
		if email != "":
			user_req['email'] = email
		if mobile != "":
			user_req['mobile'] = mobile

		user_json = requests.post(self.API_URL + "/users", headers=self.__HEADER, json=user_req)
		
		checkStatus(user_json)

		return(User(user_json.json(),self.__HEADER))

	def getUser(self,userID):

		"""
		Fetches user

		Fetches user and returns User object.

		Parameters
		----------
		userID : str
			User's ID. 

		Returns
		-------
		User (obj)
			Returns the created User class object.

		"""

		user_json = requests.get(self.API_URL + "/users/" + userID, headers=self.__HEADER)
		checkStatus(user_json)
		return(User(user_json.json(),self.__HEADER))

	def getInstitutions(self):

		"""
		Fetches institutions

		Fetches user and returns dict of institutions.

		Parameters
		----------
		None

		Returns
		-------
		dict
			Returns dict of institutions.

		"""
		institutions_json = requests.get(self.API_URL + "/institutions", headers=self.__HEADER)
		checkStatus(institutions_json)
		institutions = { inst['name']:inst['id'] for inst in institutions_json.json()['data'] }
		return(institutions)

	def getInstitutionsJSON(self):

		"""
		Fetches institutions JSON

		Fetches user and returns raw json of institutions.

		Parameters
		----------
		None

		Returns
		-------
		json
			Returns raw json of institutions.

		"""
		institutions_json = requests.get(self.API_URL + "/institutions", headers=self.__HEADER)
		checkStatus(institutions_json)
		return(institutions_json.json())

	def searchInstitutions(self,searchTerm):
		
		"""
		Finds institutions based on search

		Parameters
		----------
		searchTerm : str
			Search term of bank (eg. 'Westpac')

		Returns
		-------
		dict
			Returns dict of search results.

		"""
		searchResults = {}

		institutions = self.getInstitutions()

		for inst in instutions['data']:

			if searchTerm in inst['shortName'] or searchTerm in inst['name']:

				searchResults[inst['name']] = inst['id']

		return(searchResults)

	def deleteUser(self,userID):
		"""
		Delete user.

		Parameters
		----------
		userID : str
			User's ID. 

		Returns
		-------
		True
			Indicates success

		"""
		delete = requests.delete(self.links['self'],headers=self.__HEADER)

		checkStatus(delete)

		return(True)

class User:

	def __init__(self, user_json, header):

		self.__HEADER = header
		self.id = user_json['id']
		self.email = user_json['email']
		self.mobile = user_json['mobile']

		self.links = user_json['links']

	def __del__(self):
		"""
		Delete from Basiq when object is deleted.

		"""
		requests.delete(self.links['self'],headers=self.__HEADER)

	def update(self,email="",mobile=""):
		"""
		Updates user's details.

		Parameters
		----------
		email : str
			Email to be updated. Optional if mobile entered.
		mobile: str
			Mobile to be updated. Optional if email entered.

		Returns
		-------
		True
			Indicates success.

		"""
		toSend = {}
		if email != "":
			toSend['email'] = email
		if mobile != "":
			toSend['mobile'] = mobile

		update_json = requests.post(self.links['self'],headers=self.__HEADER,json=toSend)

		checkStatus(update_json)

		if email != "":
			self.email = update_json.json()['email']
		if mobile != "":
			self.mobile = update_json.json()['mobile']

		return(True)

	def getTransactions(self,input_filter=None):
		"""
		Fetches transactions.

		Fetches transactions and returns list of Transaction objects.

		Parameters
		----------
		None

		Returns
		-------
		list
			Returns list of Transaction objects. (max: 500)

		"""
		if input_filter != None:

			trans_json = requests.get(addFilter(self.links['self'] + "/transactions",input_filter),headers=self.__HEADER)

		else:

			trans_json = requests.get(self.links['self'] + "/transactions",headers=self.__HEADER)

		checkStatus(trans_json)

		return_transactions = []

		for trans in trans_json.json()['data']:

			return_transactions.append(Transaction(trans,self.__HEADER))

		return(return_transactions)

	def getTransaction(self, transactionID):
		"""
		Fetches transaction.

		Fetches transactions and returns list of Transaction objects.

		Parameters
		----------
		transactionID
			transactionID string

		Returns
		-------
		list
			Returns list of Transaction objects. (max: 500)

		"""
		trans_json = requests.get(self.links['self'] + "/transactions/" + transactionID,headers=self.__HEADER)

		checkStatus(trans_json)

		return(Transaction(trans_json.json(),self.__HEADER))

	def getIncome(self):
		"""
		Fetches user's income summary.

		Fetches user's income summary and returns an Income object.

		Parameters
		----------
		None

		Returns
		-------
		Income (obj)
			Returns the user's income in form of Income class object.

		"""
		income_json = requests.post(self.links['self'] + "/income",headers=self.__HEADER)
		
		checkStatus(income_json)

		return(Income(income_json.json(),self.__HEADER))

	def getExpenses(self):
		"""
		Fetches user's expenses summary.

		Fetches user's expenses summary and returns an Expense object.

		Parameters
		----------
		None

		Returns
		-------
		Expense (obj)
			Returns the user's expenses in form of Expense class object.

		"""
		expenses_json = requests.post(self.links['self'] + "/expenses",headers=self.__HEADER)
		
		checkStatus(expenses_json)

		return(Expense(expenses_json.json(),self.__HEADER))

	def addConnection(self,loginID="",password="",institutionID=""):
		"""
		Add's bank account connection to user.

		Returns a job object that monitor's API progress.

		Parameters
		----------
		loginID : str
			User's login username for banking account
		password: str
			User's password for banking account
		institutionID: str
			Bank's ID.

		Returns
		-------
		Job (obj)
			Returns Job object that monitor's connection progress

		"""
		connection_request = {}
		connection_request['loginID'] = loginID
		connection_request['password'] = password
		connection_request['institution'] = {}
		connection_request['institution']['id'] = institutionID

		job_json = requests.post(self.links['self'] + "/connections",headers=self.__HEADER, json=connection_request)

		checkStatus(job_json)

		return(Job(job_json.json(),self.__HEADER))

	def refreshAllConnections(self):
		"""
		Refreshes all of user's connections.

		Ensure's most up-to-date information.

		Parameters
		----------
		None

		Returns
		-------
		list
			returns list of Job objects that monitor connections' update

		"""
		job_list = []

		job_json = requests.post(self.links['self'] + "/connections/refresh",headers=self.__HEADER)

		checkStatus(job_json)

		for job in job_json.json()['data']:

			job_list.append(Job(job,self.__HEADER))

		return(job_list)

	def refreshConnection(self,connectionID):
		"""
		Refreshes specific connection, ensuring most up-to-date information.

		Parameters
		----------
		connectionID : str
			ID of connection to be refreshed.

		Returns
		-------
		Job (obj)
			Returns Job object to monitor progress

		"""
		job_json = requests.post(self.links['self'] + "/connections/" + connectionID + "/refresh",headers=self.__HEADER)

		checkStatus(job_json)

		return(Job(job_json.json(),self.__HEADER))

	def getConnections(self, input_filter=None):
		"""
		Fetches list of user's connections.

		Parameters
		----------
		None

		Returns
		-------
		list
			Returns list of Connection objects

		"""
		if input_filter != None:
			
			connections_json = requests.get(addFilter(self.links['self'] + "/connections",input_filter),headers=self.__HEADER)

		else:

			connections_json = requests.get(self.links['self'] + "/connections",headers=self.__HEADER)

		checkStatus(connections_json)

		self.connections = []

		try:
			
			for connect in connections_json.json()['data']:

				self.connections.append(Connection(connect,self.__HEADER))
		
		except:
			
			self.connections = []

		return(self.connections)

	def getConnection(self,connectionID):

		conn_json = requests.get(self.links['self'] + "/connections/" + connectionID,headers=self.__HEADER)

		checkStatus(conn_json)

		return(Connection(conn_json.json(),self.__HEADER))

	def getAccounts(self, input_filter=None):
		
		"""
		Fetches all user accounts

		Parameters
		----------
		None

		Returns
		-------
		list
			Returns list of Account objects linked with user.

		"""
		if input_filter != None:

			accounts_json = requests.get(addFilter(self.links['self'] + "/accounts",input_filter),headers=self.__HEADER)

		else:

			accounts_json = requests.get(self.links['self'] + "/accounts",headers=self.__HEADER)

		checkStatus(accounts_json)

		self.accounts = []

		try:
			
			for acc in accounts_json.json()['data']:

				self.accounts.append(Account(acc,self.__HEADER))
		
		except:
			
			self.accounts = []

		return(self.accounts)

	def getAccount(self, accountID):

		acc_json = requests.get(self.links['self'] + "/accounts/" + accountID,headers=self.__HEADER)

		checkStatus(acc_json)

		return(Account(acc_json.json(),self.__HEADER))

	def to_dict(self):

		"""
		Convert object details to dict.

		Hidden method for converting object to pandas dataframe.

		Parameters
		----------
		None

		Returns
		-------
		dict
			Returns dict of object.

		"""
		return({

			'id':self.id,
			'email': self.email,
			'mobile': self.mobile

			})

class Connection:

	def __init__(self, connect_json, header):

		self.institution_id = connect_json['institution']['id']

		connect_json.pop('institution',None)

		self.__HEADER = header

		self.__dict__.update(json.loads(json.dumps(connect_json)))

	def refresh(self):

		"""
		Refreshes specific connection, ensuring most up-to-date information.

		Parameters
		----------
		connectionID : str
			ID of connection to be refreshed.

		Returns
		-------
		Job (obj)
			Returns Job object to monitor progress

		"""

		refreshURL = str(self.links['accounts']).split("acounts")[0] + "connections/" + self.id + "/refresh"

		job_json = requests.get(refreshURL,headers=self.__HEADER)

		checkStatus(job_json)

		return(Job(job_json.json(),headers=__HEADER))

	def getAccounts(self, input_filter=None):

		"""
		Fetches accounts linked with connection.

		Returns a list of Account objects.

		Parameters
		----------
		None

		Returns
		-------
		list
			Returns a list of Account objects linked with the connection.

		"""
		account_list = []

		if input_filter != None:

			accounts_json = requests.get(addFilter(self.links['accounts'],input_filter),headers=self.__HEADER)

		else:

			accounts_json = requests.get(self.links['accounts'],headers=self.__HEADER)

		checkStatus(accounts_json)

		for account_json in accounts_json.json()['data']:
			account_list.append(Account(account_json,self.__HEADER))

		return(account_list)

	def getTransactions(self, input_filter=None):

		"""
		Fetches all transactions linked with connection.

		Parameters
		----------
		None

		Returns
		-------
		list
			Returns a list of Transaction objects linked with connection.

		"""
		transaction_list = []

		if input_filter != None:

			transactions_json = requests.get(addFilter(self.links['transactions'],filter_list),headers=self.__HEADER)

		else:

			transactions_json = requests.get(self.links['transactions'],headers=self.__HEADER)

		checkStatus(transactions_json)

		for transaction_json in transations_json.json()['data']:
			transaction_list.append(Transaction(transaction_json,self.__HEADER))

		return(transaction_list)

	def to_dict(self):

		"""
		Convert object details to dict.

		Hidden method for converting object to pandas dataframe.

		Parameters
		----------
		None

		Returns
		-------
		dict
			Returns dict of object.

		"""

		return_dict = self.__dict__.copy()

		return_dict.pop('links',None)
		return_dict.pop('_Connection__HEADER',None)
		
		try:
			return_dict['link'] = self.links['self']
		except:
			return_dict['link'] = None

		return(return_dict)

class Account:

	def __init__(self, account_json, header):

		self.type = account_json['class']['type']
		self.product = account_json['class']['product']

		account_json.pop('class',None)

		self.__dict__.update(json.loads(json.dumps(account_json)))

		self.__HEADER = header

	def getTransactions(self, input_filter=None):

		"""
		Fetches transactions linked with account.

		Parameters
		----------
		None

		Returns
		-------
		list
			Returns list of Transaction objects linked with account.

		"""
		transactions_to_return = []

		if input_filter != None:

			transaction_list = requests.get(addFilter(self.links['transactions'],input_filter), headers=self.__HEADER)

		else:

			transaction_list = requests.get(self.links['transactions'], headers=self.__HEADER)

		checkStatus(transaction_list)

		for acc in transaction_list.json()['data']:

			transactions_to_return.append(Transaction(acc,self.__HEADER))

		return(transactions_to_return)

	def to_dict(self):

		"""
		Convert object details to dict.

		Hidden method for converting object to pandas dataframe.

		Parameters
		----------
		None

		Returns
		-------
		dict
			Returns dict of object.

		"""

		return_dict = self.__dict__.copy()

		return_dict.pop('links',None)
		return_dict.pop('type',None)
		return_dict.pop('_Account__HEADER',None)

		return_dict['link'] = self.links['self']

		return(return_dict)

class Transaction:

	def __init__(self, transact_json, header):

		try:

			self.ANZSIC_code = transact_json['subClass']['code']
			self.ANZSIC_title = transact_json['subClass']['title']

		except:

			self.ANZSIC_code = None
			self.ANZSIC_title = None

		transact_json.pop('subClass',None)
		transact_json.pop('class',None)

		self.__HEADER = header

		self.__dict__.update(json.loads(json.dumps(transact_json)))

	def to_dict(self):

		"""
		Convert object details to dict.

		Hidden method for converting object to pandas dataframe.

		Parameters
		----------
		None

		Returns
		-------
		dict
			Returns dict of object.

		"""

		return_dict = self.__dict__.copy()

		return_dict.pop('links',None)
		return_dict.pop('type',None)
		return_dict.pop('_Transaction__HEADER',None)

		# Rename keys
		return_dict['account_id'] = return_dict.pop('account',None)
		return_dict['connection_id'] = return_dict.pop('connection',None)

		return_dict['link'] = self.links['self']

		return(return_dict)

class newFilter:

		def __init__(self):

			self.filter_list = []

		def eq(self,propertydotcondition,value):

			filter_list.append(str(propertydotcondition) + ".eq('" + str(value) + "')")

		def bt(self,propertydotcondition,value1,value2):

			filter_list.append(str(propertydotcondition) + ".bt('" + str(value1) + "','" + str(value2) + "')")

		def gt(self,propertydotcondition,value):

			filter_list.append(str(propertydotcondition) + ".gt('" + str(value) + "')")

		def gteq(self,propertydotcondition,value):

			filter_list.append(str(propertydotcondition) + ".gteq('" + str(value) + "')")

		def lt(self,propertydotcondition,value):

			filter_list.append(str(propertydotcondition) + ".lt('" + str(value) + "')")

		def lteq(self,propertydotcondition,value):

			filter_list.append(str(propertydotcondition) + ".lteq('" + str(value) + "')")

		def getList(self):

			return(self.filter_list)

		def __str__(self):

			return(self.filter_list)

