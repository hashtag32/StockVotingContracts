import csv
import requests
import subprocess
from datetime import date, timedelta

from pyfmpcloud import stock_time_series as sts

# Get yesterday's date because it is updated one day after
date_yesterday = yesterday = date.today()-timedelta(days=1)
date_yesterday_format="{}-{}-{}".format(date_yesterday.strftime('%Y'), date_yesterday.strftime('%m'), date_yesterday.strftime('%d'))

# Get list of contract
Contracts_csv_url = 'http://stockvoting.net/openShare/ContractActionKO_creation.csv'

with requests.Session() as s:
    download = s.get(Contracts_csv_url)
    decoded_content = download.content.decode('utf-8')

    split_content = csv.reader(decoded_content.splitlines(), delimiter=',')
    ContractsList = list(split_content)
    for contract_array in ContractsList:
        contract_address=contract_array[0]
        underlying=contract_array[1]

        # date
        eod_array=sts.batch_request_eod_prices([underlying], date=date_yesterday_format)
        closing_price=eod_array['close'].values[0]
        low_price=eod_array['low'].values[0]

        call_script_cmd="geth --rpcapi='db,eth,net,web3,personal' --rpc --exec \"loadScript('geth_script.js'); main('{}',{},{})\" attach http://127.0.0.1:8545".format(contract_address, low_price,closing_price)
        print(call_script_cmd)
        subprocess.call(call_script_cmd, shell=True)