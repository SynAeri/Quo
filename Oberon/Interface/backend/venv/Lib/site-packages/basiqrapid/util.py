import json
import requests
import pandas as pd

try:
	from .APIError import APIError
except:
	from APIError import APIError

def checkStatus(request):

	if request.status_code > 299:
		raise APIError(request.json())

def to_df(inputList):
	"""
		Turns input list to df.

		Returns Pandas dataframe comprised of objects in input list.
		Can take dictionary or list.
		List may contain Users, Connections, Accounts, or Transactions.

		Parameters
		----------
		inputList:
			List comprised of User, Connection, Account, or Transaction objects.

		Returns
		-------
		DataFrame
			Returns dataframe comprised of information in list.

		"""
	if type(inputList) is list:

		return(pd.DataFrame.from_records([x.to_dict() for x in inputList]))

	elif type(inputList) is dict:
		
		return(pd.DataFrame.from_dict(inputList, orient='index', columns=["Value"]))
		
	else:
		raise TypeError("Input must be list or dict")


def addFilter(url,inputFilter):

	filter_list = inputFilter.getList()

	if len(filter_list) > 0:

		url = url + "?filter=" + ",".join(filter_list)

	else:

		return(url)