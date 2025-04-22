import json
import requests

try:
	from .util import *
except:
	from util import *

class Job:

	def __init__(self,job_json,header):

		self.__HEADER = header

		self.__dict__.update(json.loads(json.dumps(job_json)))

		self.refresh()

	def refresh(self):

		"""
		Refreshes job status

		Parameters
		----------
		None

		Returns
		-------
		True
			Indicate success.

		"""
		new_job_json = requests.get(self.links['self'],headers=self.__HEADER)

		checkStatus(new_job_json)

		self.verify_credentials_status = new_job_json.json()['steps'][0]['status']
		self.retrieve_account_status = new_job_json.json()['steps'][1]['status']
		self.retrieve_transaction_status = new_job_json.json()['steps'][2]['status']

		return(True)

	def getStatus(self):

		"""
		Gets status of job

		Parameters
		----------
		None

		Returns
		-------
		dict
			Returns dict of job status

		"""
		self.refresh()

		status = {}
		status['Verify Credentials'] = self.verify_credentials_status
		status['Retireve Accounts'] = self.retrieve_account_status
		status['Retrieve Transaction'] = self.retrieve_transaction_status

		return(status)

	def isComplete(self):

		"""
		Checks if job is fully complete.

		Parameters
		----------
		None

		Returns
		-------
		bool
			Returns if job is complete.

		"""
		self.refresh()

		status_list = [self.verify_credentials_status, self.retrieve_account_status, self.retrieve_transaction_status]

		if list(set(status_list)) == ['success']:
			return True
		else:
			return False
	
	def __to_dict(self):

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

			'verify_credentials_status':self.verify_credentials_status,

			'retrieve_account_status':self.retrieve_account_status,

			'retrieve_transaction_status':self.retrieve_transaction_status

			})