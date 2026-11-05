from pathlib import Path

import json,datetime,math,openpyxl

ROOT=Path(__file__).resolve().parents[2];RAW=ROOT/'data/raw';OUT=ROOT/'public/data';OUT.mkdir(parents=True,exist_ok=True)

def read(name):return json.loads((RAW/name).read_text())

def number(v):

 try:

  n=float(v);return n if math.isfinite(n) else None

 except (ValueError,TypeError):return None

def meta(file):

 p=RAW/(file+'.meta.json')

 return json.loads(p.read_text())['retrievedAt'] if p.exists() else datetime.datetime.fromtimestamp((RAW/file).stat().st_mtime,datetime.timezone.utc).isoformat()

def write(path,data):

 tmp=path.with_suffix('.tmp');tmp.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf-8');tmp.replace(path)

# Explicitly distinguish national economies from territories in World Bank coverage.

territories={'ABW','ASM','BMU','CHI','CUW','CYM','FRO','GIB','GRL','GUM','HKG','IMN','MAC','MAF','MNP','NCL','PRI','PYF','SXM','TCA','VGB','VIR'}

countries=[{'code':r['id'],'iso2':r['iso2Code'],'name':r['name'],'region':r['region']['value'],'national':r['id'] not in territories} for r in read('wb-countries.json')[1] if r['region']['id']!='NA']

alias={'KOR':'South Korea','RUS':'Russia','EGY':'Egypt','IRN':'Iran','TUR':'Türkiye','VEN':'Venezuela','LAO':'Laos','VNM':'Vietnam','SVK':'Slovakia','YEM':'Yemen','COD':'DR Congo'}

for c in countries:c['name']=alias.get(c['code'],c['name'])

countries.append({'code':'TWN','iso2':'TW','name':'Taiwan','region':'East Asia & Pacific','national':True})

valid={c['code'] for c in countries}; national={c['code'] for c in countries if c['national']}

modern={}

for metric in ['gdp','pc','growth']:

 for r in read(f'wb-{metric}.json')[1]:

  code=r['countryiso3code'];v=number(r['value']);y=int(r['date'])

  if code not in valid or v is None:continue

  key=(code,y);modern.setdefault(key,{'code':code,'year':y,'gdp':None,'pc':None,'growth':None,'status':'actual'})[metric]=v

wb=read('wb-gdp.json')[0]

def dataset(mode,rows,source,version,unit,file,url,license):

 rows=sorted([r for r in rows if r['gdp'] is not None or r['pc'] is not None],key=lambda r:(r['year'],r['code']))

 assert len(rows)>100 and all(r['gdp'] is None or r['gdp']>=0 for r in rows)

 return dict(mode=mode,source=source,version=version,unit=unit,retrievedAt=meta(file),sourceUrl=url,license=license,minYear=min(r['year'] for r in rows),maxYear=max(r['year'] for r in rows),rows=rows)

modern=dataset('modern',modern.values(),'World Bank · World Development Indicators','WDI updated '+wb['lastupdated'],'current US dollars','wb-gdp.json','https://data.worldbank.org/indicator/NY.GDP.MKTP.CD','CC BY 4.0')

w=openpyxl.load_workbook(RAW/'maddison.xlsx',read_only=True,data_only=True)

history=[]

for code,name,region,year,pc,pop in list(w['Full data'].values)[1:]:

 # Former USSR, Yugoslavia, Czechoslovakia and former Sudan are not mapped onto successor states.

 if code not in valid or code=='SDN' or not isinstance(year,int) or year<1900:continue

 pc=number(pc);pop=number(pop)

 if pc is None:continue

 history.append(dict(code=code,year=year,pc=pc,gdp=round(pc*pop*1000,2) if pop is not None else None,growth=None,status='historical estimate'))

historical=dataset('historical',history,'Maddison Project Database','MPD 2023 · Bolt & van Zanden (2024)','2011 international dollars (PPP)','maddison.xlsx','https://doi.org/10.34894/INZBF2','CC BY 4.0')

sources={};current=None

for row in list(w['Sources'].values)[4:]:

 code,name,source=row[:3]

 if code:current=code

 if current in valid and source:sources.setdefault(current,[]).append(str(source))

write(OUT/'historical-sources.json',sources)

w=openpyxl.load_workbook(RAW/'imf-weo.xlsx',read_only=True,data_only=True);it=w['Countries'].iter_rows(values_only=True);header=next(it);outlook={}

for raw in it:

 r=dict(zip(header,raw));code=r['COUNTRY.ID'];ind=r['INDICATOR.ID']

 if code not in valid or ind not in ['NGDPD','NGDPDPC','NGDP_RPCH']:continue

 metric={'NGDPD':'gdp','NGDPDPC':'pc','NGDP_RPCH':'growth'}[ind];last=number(r['LATEST_ACTUAL_ANNUAL_DATA']) or 0

 for year in range(1980,2032):

  v=number(r.get(year))

  if v is None:continue

  if metric=='gdp':v*=1e9

  status='actual' if year<=last else ('projection' if year>2026 else 'estimate')

  row=outlook.setdefault((code,year),dict(code=code,year=year,gdp=None,pc=None,growth=None,status='estimate'))

  row[metric]=v;row[{'gdp':'status','pc':'pcStatus','growth':'growthStatus'}[metric]]=status

outlook=dataset('outlook',outlook.values(),'International Monetary Fund · WEO','October 2026 WEO','current US dollars','imf-weo.xlsx','https://data.imf.org/datasets/WEO','IMF terms of use')

# The latest sufficiently covered common year avoids a few early reporters defining a global ranking.

years=sorted({r['year'] for r in modern['rows']},reverse=True)

latest=next(y for y in years if sum(r['year']==y and r['code'] in national and r['gdp'] is not None for r in modern['rows'])>=150)

cohort100=[r['code'] for r in sorted([r for r in modern['rows'] if r['year']==latest and r['code'] in national and r['gdp'] is not None],key=lambda r:r['gdp'],reverse=True)[:100]]
cohort=cohort100[:30]

if 'IDN' not in cohort:cohort[-1]='IDN'

manifest={'countries':sorted(countries,key=lambda c:c['name']),'cohort':cohort,'cohort100':cohort100,'cohortYear':latest,'datasets':{d['mode']:{k:v for k,v in d.items() if k!='rows'} for d in [modern,historical,outlook]}}

for d in [modern,historical,outlook]:write(OUT/(d['mode']+'.json'),d);print(d['mode'],len(d['rows']),d['minYear'],d['maxYear'])

write(ROOT/'data/processed/manifest.json',manifest);write(OUT/'manifest.json',manifest)

print('Cohort',latest,cohort)



write(OUT/'provenance.json',{p.name:json.loads(p.read_text()) for p in RAW.glob('*.meta.json')})
