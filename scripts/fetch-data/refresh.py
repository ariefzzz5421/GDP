from pathlib import Path

import requests, openpyxl, io, json, concurrent.futures, datetime, subprocess, sys, hashlib

ROOT=Path(__file__).resolve().parents[2]; RAW=ROOT/'data/raw'; RAW.mkdir(parents=True,exist_ok=True)

URLS={'wb-countries.json':'https://api.worldbank.org/v2/country?format=json&per_page=400','maddison.xlsx':'https://dataverse.nl/api/access/datafile/421302'}

URLS['imf-weo.xlsx']='https://data.imf.org/-/media/iData/External-Storage/Documents/0FA3DC49A04D446E9D69DBEB29979E1C/en/WEOOct2026all.xlsx'

for name,indicator in [('gdp','NY.GDP.MKTP.CD'),('pc','NY.GDP.PCAP.CD'),('growth','NY.GDP.MKTP.KD.ZG')]: URLS[f'wb-{name}.json']=f'https://api.worldbank.org/v2/country/all/indicator/{indicator}?format=json&per_page=30000&date=1960:2026'

def fetch(item):

 name,url=item; path=RAW/name

 try:

  response=requests.get(url,timeout=180);response.raise_for_status()

  if name.endswith('.json'):

   data=response.json()

   if name.startswith('wb-') and (not isinstance(data,list) or len(data)<2 or not data[1]): raise ValueError('Invalid World Bank response')



  if name.endswith('.xlsx'):

   workbook=openpyxl.load_workbook(io.BytesIO(response.content),read_only=True)

   required='Countries' if name=='imf-weo.xlsx' else 'Full data'

   if required not in workbook.sheetnames:raise ValueError('Invalid workbook sheets')

   workbook.close()

  temp=path.with_suffix('.tmp');temp.write_bytes(response.content);temp.replace(path)

  meta={'url':url,'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sha256':hashlib.sha256(response.content).hexdigest()}

  path.with_suffix(path.suffix+'.meta.json').write_text(json.dumps(meta));print(f'Fetched {name}',flush=True)

 except Exception as exc:

  if path.exists(): print(f'WARNING: retaining prior snapshot {name}: {exc}',flush=True)

  else: raise

if __name__=='__main__':

 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:list(pool.map(fetch,URLS.items()))

 subprocess.run([sys.executable,str(ROOT/'scripts/normalize-data/normalize.py')],check=True)
